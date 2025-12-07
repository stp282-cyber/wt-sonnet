
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getScheduleForDate } from '@/lib/curriculumUtils';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { studentId, curriculumId } = body;

        if (!studentId || !curriculumId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch Curriculum
        const curriculumRes = await query(
            `SELECT * FROM student_curriculums WHERE id = $1 AND student_id = $2`,
            [curriculumId, studentId]
        );

        if (curriculumRes.rows.length === 0) {
            return NextResponse.json({ error: 'Curriculum not found' }, { status: 404 });
        }

        const curriculum = curriculumRes.rows[0];

        // 2. Calculate Dates (Today - 1, Today - 2)
        // Note: usage of 'Today' depends on server time. 
        // Ideally, client should send 'today' date, but for now we use server time or assume KST if configured.
        const today = new Date();
        const reviewDates = [];

        // Review Day 1 (Yesterday)
        const day1 = new Date(today);
        day1.setDate(today.getDate() - 1);
        reviewDates.push(day1);

        // Review Day 2 (Day before Yesterday)
        const day2 = new Date(today);
        day2.setDate(today.getDate() - 2);
        reviewDates.push(day2);

        let reviewWords: any[] = [];

        // 3. Fetch Schedule & Words for each date
        // We use getScheduleForDate to respect holidays/study_days.
        // If yesterday was a holiday, maybe we should skip? 
        // The requirement is "Previous 2 days words". Literal previous days or "Previous 2 Study Days"?
        // Usually review is for "Recently learned". If yesterday was holiday, we might want the day before that.
        // But simpler logic "Check calendar date -1 and -2" is often used for rigid review.
        // Given the requirement "Previous 2 days words", I will check the exact calendar dates first.
        // If those dates had NO scheduled items (holiday or non-study day), then there is nothing to review from that specific date.

        for (const date of reviewDates) {
            const dateStr = date.toISOString().split('T')[0];
            const schedule = getScheduleForDate(curriculum, dateStr);

            if (schedule && schedule.itemType === 'wordbook') {
                // Fetch words for this schedule
                // We need to fetch the words from the wordbook table based on item.id (book id) and progress range
                const bookId = schedule.item.id; // item.id is the wordbook ID (or item_id in `student_curriculum_items`?)
                // Wait, item is `CurriculumItem` which has `id` (the DB id of the item config) and `item_id` (the actual wordbook ID) ??
                // Let's check `CurriculumItem` type definition in `lib/curriculumUtils.ts` or inferred from `getAllSections...`
                // Actually `item` in `schedule` comes from `curriculum.curriculum_items`.
                // In `student_curriculum_items` table: `item_id` is the reference to `wordbooks.id`.

                // Let's query wordbook words
                // We assume `schedule.item.item_id` is the wordbook ID.

                // We need to know the actual wordbook ID.
                // In `init_db_full.sql`: `student_curriculum_items` has `item_id` (UUID) -> `wordbooks.id`.

                const targetBookId = schedule.item.item_id;

                // Fetch words from wordbook
                const wordbookRes = await query(
                    `SELECT words FROM wordbooks WHERE id = $1`,
                    [targetBookId]
                );

                if (wordbookRes.rows.length > 0) {
                    const allWords = wordbookRes.rows[0].words || [];
                    // Filter by progress range (start~end)
                    // schedule.progressStart and End are 1-based indices.
                    const start = schedule.progressStart;
                    const end = schedule.progressEnd;

                    const dailyWords = allWords.slice(start - 1, end);
                    reviewWords = [...reviewWords, ...dailyWords];
                }
            }
        }

        // Remove duplicates and limit if necessary? 
        // For now, just return all.

        // Return unique words just in case
        const uniqueWords = Array.from(new Set(reviewWords.map(w => w.no)))
            .map(no => reviewWords.find(w => w.no === no));

        return NextResponse.json({
            reviewWords: uniqueWords,
            count: uniqueWords.length
        });

    } catch (error) {
        console.error('Error fetching review words:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
