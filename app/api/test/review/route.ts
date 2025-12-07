import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { getScheduleForDate } from '@/lib/curriculumUtils';
import { StudentCurriculum } from '@/types/curriculum';

export async function POST(req: NextRequest) {
    try {
        const supabase = createClient();
        const body = await req.json();
        const { studentId, curriculumId } = body;

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

        // Sort items and sections for correct schedule calculation
        if (curriculum.curriculum_items) {
            curriculum.curriculum_items.sort((a: any, b: any) => a.sequence - b.sequence);
            curriculum.curriculum_items.forEach((item: any) => {
                if (item.sections) {
                    item.sections.sort((s1: any, s2: any) => (s1.sequence || s1.id) - (s2.sequence || s2.id));
                }
            });
        }

        // 2. Calculate Dates (Today - 1, Today - 2)
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
        for (const date of reviewDates) {
            const dateStr = date.toISOString().split('T')[0];
            const schedule = getScheduleForDate(curriculum as StudentCurriculum, dateStr);

            if (schedule && schedule.itemType === 'wordbook') {
                const targetBookId = schedule.item.item_id;

                // Fetch words from wordbook
                // Note: 'words' column in 'wordbooks' table is JSONB
                const { data: wordbook, error: wbError } = await supabase
                    .from('wordbooks')
                    .select('words')
                    .eq('id', targetBookId)
                    .single();

                if (!wbError && wordbook?.words) {
                    // Filter by progress range
                    // schedule.progressStart and End are 1-based indices.
                    const start = schedule.progressStart;
                    const end = schedule.progressEnd;

                    // JSON array slice? simpler to do in JS
                    const allWords = wordbook.words as any[];
                    // 1-based index to 0-based slice
                    // slice(start, end) extracts up to but not including end.
                    // If start=1, end=20 (20 words). slice(0, 20).
                    const dailyWords = allWords.slice(start - 1, end);
                    reviewWords = [...reviewWords, ...dailyWords];
                }
            }
        }

        const uniqueWords = Array.from(new Set(reviewWords.map(w => w.english)))
            .map(eng => reviewWords.find(w => w.english === eng));

        return NextResponse.json({
            reviewWords: uniqueWords,
            count: uniqueWords.length
        });

    } catch (error: any) {
        console.error('Error fetching review words:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
