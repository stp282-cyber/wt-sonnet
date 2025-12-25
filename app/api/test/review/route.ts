import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { getScheduleForDate } from '@/lib/curriculumUtils';
import { StudentCurriculum } from '@/types/curriculum';

export async function POST(req: NextRequest) {
    try {
        const supabase = createClient();
        const body = await req.json();
        const { studentId, curriculumId, curriculumItemId, currentEnd } = body;

        if (!studentId || !curriculumId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch Curriculum
        const { data: curriculum, error: currError } = await supabase
            .from('student_curriculums')
            .select(`
                *,
                curriculum_items (
                    *,
                    item_details:curriculum_item_details(*),
                    sections (*)
                )
            `)
            .eq('id', curriculumId)
            .eq('student_id', studentId)
            .single();

        if (currError || !curriculum) {
            return NextResponse.json({ error: 'Curriculum not found' }, { status: 404 });
        }

        // 2. Identify Target Item & Daily Amount
        let targetItem: any = null;
        if (curriculumItemId) {
            targetItem = curriculum.curriculum_items.find((item: any) => item.id === curriculumItemId);
        } else {
            // Fallback: Try to find the current active item
            targetItem = curriculum.curriculum_items.find((item: any) => item.id === curriculum.current_item_id);
        }

        if (!targetItem) {
            return NextResponse.json({ reviewWords: [], count: 0, message: 'Target item not found' });
        }

        let dailyAmount = 30; // Default
        if (curriculum.setting_overrides?.daily_amount) {
            dailyAmount = Number(curriculum.setting_overrides.daily_amount);
        } else if (targetItem.daily_amount) {
            dailyAmount = Number(targetItem.daily_amount);
        }

        // 3. Calculate Review Range (Volume Based)
        // Logic: Review the *previous 2 days* relative to the *current progress*.
        // Current Window: [currentEnd - dailyAmount + 1, currentEnd]
        // Review End: currentEnd - dailyAmount
        // Review Start: Review End - (2 * dailyAmount) + 1

        if (!currentEnd || currentEnd <= 0) {
            // If no progress info, we can't determine "previous".
            return NextResponse.json({ reviewWords: [], count: 0, message: 'No progress info provided' });
        }

        const reviewEnd = currentEnd - dailyAmount;
        const reviewStart = Math.max(1, reviewEnd - (2 * dailyAmount) + 1);

        // If reviewEnd is less than 1, it means we are on Day 1. No review.
        if (reviewEnd < 1) {
            // Day 1
            return NextResponse.json({ reviewWords: [], count: 0, message: 'Day 1: No previous words to review' });
        }

        // 4. Fetch Words from Wordbook
        const targetBookId = targetItem.item_id;
        const { data: wordbook, error: wbError } = await supabase
            .from('wordbooks')
            .select('words')
            .eq('id', targetBookId)
            .single();

        if (wbError || !wordbook?.words) {
            return NextResponse.json({ reviewWords: [], count: 0, message: 'Wordbook not found' });
        }

        const allWords = wordbook.words as any[];

        // 5. Slice Words
        // reviewStart is 1-based index
        // Array index = reviewStart - 1
        // slice(start, end) -> end is exclusive. So we want slice(start - 1, reviewEnd)

        const startIndex = Math.max(0, reviewStart - 1);
        const endIndex = Math.min(allWords.length, reviewEnd);

        if (startIndex >= endIndex) {
            return NextResponse.json({ reviewWords: [], count: 0, message: 'Invalid range' });
        }

        const reviewWords = allWords.slice(startIndex, endIndex);

        // 6. Return Unique Words
        const uniqueWords = Array.from(new Set(reviewWords.map(w => w.english)))
            .map(eng => reviewWords.find(w => w.english === eng));

        return NextResponse.json({
            reviewWords: uniqueWords,
            count: uniqueWords.length,
            debug: { reviewStart, reviewEnd, dailyAmount, currentEnd }
        });

    } catch (error: any) {
        console.error('Error fetching review words:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
