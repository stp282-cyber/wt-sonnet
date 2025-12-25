
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const supabase = createClient();
        const { searchParams } = new URL(req.url);
        const curriculumItemId = searchParams.get('curriculumItemId');
        const wordbookId = searchParams.get('wordbookId');
        const currentStartParam = searchParams.get('currentStart');  // Added for actual range
        const currentEndParam = searchParams.get('currentEnd');

        if (!curriculumItemId && !wordbookId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Calculate review range based on ACTUAL learning amount
        let reviewStart = 1;
        let reviewEnd = 0;
        let actualDailyAmount = 30;  // Default fallback

        // Method 1: Use actual range if provided (PREFERRED)
        if (currentStartParam && currentEndParam) {
            const currentStart = parseInt(currentStartParam);
            const currentEnd = parseInt(currentEndParam);

            // Calculate actual daily amount from today's learning
            actualDailyAmount = currentEnd - currentStart + 1;

            // Review range: 2 days worth of actual learning, ending just before today
            reviewEnd = currentStart - 1;
            reviewStart = Math.max(1, reviewEnd - (2 * actualDailyAmount) + 1);

        }
        // Method 2: Fallback to DB daily_amount if actual range not provided
        else if (currentEndParam) {
            // Get daily_amount from DB
            if (curriculumItemId) {
                const { data: itemData } = await supabase
                    .from('curriculum_items')
                    .select('daily_amount')
                    .eq('id', curriculumItemId)
                    .single();

                if (itemData) {
                    actualDailyAmount = Number(itemData.daily_amount) || 30;
                }
            }

            const endLimit = parseInt(currentEndParam);
            reviewEnd = endLimit - actualDailyAmount;
            reviewStart = Math.max(1, reviewEnd - (2 * actualDailyAmount) + 1);
        }

        // First day check - no review words available
        if (reviewEnd < 1) {
            return NextResponse.json({
                questions: [],
                message: '첫 학습일입니다. 복습할 단어가 없습니다.',
                meta: { reviewStart: 0, reviewEnd: 0, total: 0, isFirstDay: true }
            });
        }

        // Second day check - only 1 day worth of review
        if (reviewStart < 1 && reviewEnd >= 1) {
            reviewStart = 1;  // Adjust to start from beginning
            // Will review only what's available (less than 2 days)
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
