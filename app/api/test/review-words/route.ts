
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const supabase = createClient();
        const { searchParams } = new URL(req.url);
        const curriculumItemId = searchParams.get('curriculumItemId');
        const wordbookId = searchParams.get('wordbookId');
        const currentEndParam = searchParams.get('currentEnd'); // To exclude current range if needed, or define "previous" relative to this.

        if (!curriculumItemId && !wordbookId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Strategy: 
        // 1. Get current item's daily_amount and sequence.
        // 2. We want words from "2 days ago" amount.
        // 3. Simple approach: Get daily_amount from DB. 
        // 4. Target Range: (currentEnd - currentDailyAmount - (2 * currentDailyAmount)) to (currentEnd - currentDailyAmount) ??
        // User said: "Review test is set learning amount's 2 days volume".
        // It implies Review = 2 * Daily Amount.
        // Range: From [Current Start - (2 * Daily Amount)] to [Current Start - 1].

        let dailyAmount = 30; // Default
        let currentStart = 1;

        if (curriculumItemId) {
            const { data: itemData, error: itemError } = await supabase
                .from('curriculum_items')
                .select('daily_amount, item_id')
                .eq('id', curriculumItemId)
                .single();

            if (itemData) {
                dailyAmount = Number(itemData.daily_amount) || 30;
                // If we rely on passed 'currentEnd', we can calculate back.
            }
        }

        const endLimit = parseInt(currentEndParam || '0');
        // Assuming currentEnd is the end of the TODAY'S test.
        // So Review should be `endLimit - dailyAmount` (Today's Start - 1) down to `endLimit - dailyAmount - (2 * dailyAmount)`.

        // Actually, simpler logic:
        // Review Range End = endLimit; (If we include today? No, review is usually previous)
        // Let's assume Review = Previous 2 Days PRIOR to today.
        // Today = Day N. Review = Day N-1 and N-2.
        // So Range End = (Today Start - 1).
        // Range Start = (Today Start - 1) - (2 * dailyAmount) + 1.

        // However, if we don't have exact "Today Start", we can use `endLimit` (which is Today End).
        // Today Start = endLimit - dailyAmount + 1.
        // Review End = Today Start - 1 = endLimit - dailyAmount.
        // Review Start = Review End - (2 * dailyAmount) + 1.

        // Wait, what if it's the first day?
        // If Review End < 1, then no review? Or just review existing?
        // User requirement: "Review test... set learning amount's 2 days volume".
        // If not enough words, take all available previous words.

        const reviewEnd = endLimit - dailyAmount;
        const reviewStart = Math.max(1, reviewEnd - (2 * dailyAmount) + 1);

        if (reviewEnd < 1) {
            return NextResponse.json({ words: [], message: 'Not enough previous words for review' });
        }

        const targetWordbookId = wordbookId;

        // 1. Verify Wordbook Exists
        const { data: wbCheck, error: wbCheckError } = await supabase
            .from('wordbooks')
            .select('id')
            .eq('id', targetWordbookId!)
            .single();

        if (wbCheckError || !wbCheck) {
            return NextResponse.json({ error: 'Wordbook not found' }, { status: 404 });
        }

        // 2. Fetch Sections and Words
        const { data: sectionsData, error: sectionsError } = await supabase
            .from('wordbook_sections')
            .select('words')
            .eq('wordbook_id', targetWordbookId!);

        if (sectionsError) {
            console.error("Sections fetch error", sectionsError);
            return NextResponse.json({ error: 'Failed to fetch words' }, { status: 500 });
        }

        // Flatten words from all sections
        let allWords: any[] = [];
        if (sectionsData) {
            sectionsData.forEach((section: any) => {
                if (Array.isArray(section.words)) {
                    allWords = [...allWords, ...section.words];
                }
            });
        }

        if (allWords.length === 0) {
            return NextResponse.json({ words: [], message: 'No words found in wordbook' });
        }

        // Slice Review Words
        // reviewStart is 1-based Index.
        // Array index = reviewStart - 1.

        const startIndex = Math.max(0, reviewStart - 1);
        const endIndex = Math.min(allWords.length, reviewEnd);

        if (startIndex >= endIndex) {
            // Edge case: if reviewEnd is small?
            // Should we return empty or just try to give something?
            // If invalid range, maybe just return empty.
            if (reviewEnd > 0 && startIndex < allWords.length) {
                // overlap exists?
            } else {
                return NextResponse.json({ words: [], message: 'Invalid range or no words in range' });
            }
        }

        const reviewWords = allWords.slice(startIndex, endIndex);

        // Generate Questions
        const questions = reviewWords.map((word) => {
            // Find 3 Random Distractors from allWords (excluding current)
            const distractors: string[] = [];
            while (distractors.length < 3) {
                const randomIdx = Math.floor(Math.random() * allWords.length);
                const randomWord = allWords[randomIdx];
                if (randomWord.english !== word.english && !distractors.includes(randomWord.korean)) {
                    // Answer is Korean usually for "Translate to Korean" or English for "Translate to English"?
                    // User didn't specify direction. Default to "English -> Korean Choices" or "Korean -> English Choices"?
                    // Typing test was Korean -> Type English.
                    // Multiple Choice is usually "Korean Meaning" -> Select English? Or English Word -> Select Korean?
                    // Let's do: Show English, Select Korean. (Easier for review)
                    distractors.push(randomWord.korean);
                }
            }

            // Shuffle choices
            const choices = [...distractors, word.korean].sort(() => Math.random() - 0.5);

            return {
                ...word,
                choices,
                answer: word.korean
            };
        });

        // Shuffle Questions
        const shuffledQuestions = questions.sort(() => Math.random() - 0.5);

        return NextResponse.json({
            questions: shuffledQuestions,
            meta: {
                reviewStart,
                reviewEnd,
                total: shuffledQuestions.length
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
