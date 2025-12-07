
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { getScheduleForDate } from '@/lib/curriculumUtils';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const { searchParams } = new URL(request.url);

        // Get date from query or use today (KST)
        const queryDate = searchParams.get('date');
        const today = queryDate ? dayjs(queryDate) : dayjs().tz('Asia/Seoul');
        const dateStr = today.format('YYYY-MM-DD');

        // 1. Fetch all students with class info
        const { data: students, error: studentError } = await supabase
            .from('users')
            .select('*, classes(name)')
            .eq('role', 'student');

        if (studentError) throw studentError;

        const results = [];

        // 2. Fetch assignments for each student
        for (const student of (students || [])) {
            let hasAssignment = false;
            // Handle class name safely
            const className = student.classes?.name || '미배정';

            // Get Student Curriculums
            const { data: studentCurriculums } = await supabase
                .from('student_curriculums')
                .select(`
                    *,
                    curriculums (
                        id,
                        name,
                        curriculum_items (
                            id,
                            title,
                            item_type,
                            sequence,
                            daily_amount_type,
                            daily_word_count,
                            daily_section_amount,
                            section_start
                        )
                    )
                `)
                .eq('student_id', student.id)
                .eq('status', 'active');

            if (studentCurriculums && studentCurriculums.length > 0) {
                for (const sc of studentCurriculums) {
                    if (!sc.curriculums) continue;

                    const curriculum = sc.curriculums;
                    const items = curriculum.curriculum_items || [];

                    // Sort items by sequence
                    items.sort((a: any, b: any) => a.sequence - b.sequence);

                    // Merge to create a compatible StudentCurriculum object for getScheduleForDate
                    const fullCurriculum: any = {
                        ...sc, // has start_date, study_days
                        curriculums: {
                            ...sc.curriculums,
                            items: items
                        },
                        items: items
                    };

                    const schedule = getScheduleForDate(fullCurriculum, dateStr);

                    if (schedule) {
                        hasAssignment = true;

                        // Check records in study_logs
                        const { data: record } = await supabase
                            .from('study_logs')
                            .select('status, score')
                            .eq('student_id', student.id)
                            .eq('curriculum_item_id', schedule.item.id)
                            .gte('created_at', today.startOf('day').toISOString())
                            .lte('created_at', today.endOf('day').toISOString())
                            .order('created_at', { ascending: false })
                            .limit(1)
                            .maybeSingle();

                        let status = 'pending';
                        let score = undefined;

                        if (record) {
                            // If status is in record, use it. Usually study_logs has 'completed'.
                            // If record exists, we assume at least attempted.
                            status = record.status || 'completed';
                            score = record.score;
                        }

                        // Determine item name
                        const itemName = schedule.itemTitle || schedule.unitName || '제목 없음';

                        results.push({
                            id: `${student.id}-${curriculum.id}-${schedule.item.id}`,
                            student_name: student.full_name || student.username,
                            class_name: className,
                            curriculum_name: curriculum.name,
                            item_name: itemName,
                            scheduled_time: '00:00', // We don't have time scheduling yet
                            status,
                            score
                        });
                    }
                }
            }

            // If no assignment found for this student 
            // Add placeholder so they appear in the list
            if (!hasAssignment) {
                results.push({
                    id: `${student.id}-no-schedule`,
                    student_name: student.full_name || student.username,
                    class_name: className,
                    curriculum_name: '-',
                    item_name: '-',
                    scheduled_time: '-',
                    status: 'no_schedule',
                    score: undefined
                });
            }
        }

        return NextResponse.json({ assignments: results });

    } catch (error: any) {
        console.error('Teacher today API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
