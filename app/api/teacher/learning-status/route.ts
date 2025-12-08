
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

export const dynamic = 'force-dynamic';

function normalizeStudyDays(studyDays: any): string[] {
    if (!studyDays) return [];
    if (Array.isArray(studyDays)) {
        return studyDays.map(s => String(s).toLowerCase().trim());
    }
    if (typeof studyDays === 'string') {
        return studyDays.toLowerCase().split(',').map(s => s.trim());
    }
    return [];
}

function isStudyDay(date: dayjs.Dayjs, studyDays: any): boolean {
    const dayName = date.format('ddd').toLowerCase();
    const studies = normalizeStudyDays(studyDays);
    return studies.some(s => s.startsWith(dayName));
}

function calculateSchedule(curriculum: any, targetDateStr: string) {
    const start = dayjs(curriculum.start_date).tz('Asia/Seoul').startOf('day');
    const target = dayjs(targetDateStr).tz('Asia/Seoul').startOf('day');

    if (target.isBefore(start)) return null;

    if (!curriculum.study_days || !isStudyDay(target, curriculum.study_days)) {
        return null; // Not a study day
    }

    // Calculate how many study days have passed including today
    let studyDayCount = 0;
    let current = start.clone();
    const studies = normalizeStudyDays(curriculum.study_days);

    while (current.isBefore(target) || current.isSame(target, 'day')) {
        const dName = current.format('ddd').toLowerCase();

        if (studies.some(s => s.startsWith(dName))) {
            studyDayCount++;
        }
        current = current.add(1, 'day');
    }

    const items = curriculum.curriculums?.curriculum_items || [];
    // Sort items by sequence (assuming sequence is reliable, otherwise id or created_at)
    items.sort((a: any, b: any) => (a.sequence || 0) - (b.sequence || 0));

    // Get the item for this study day (1-based index turned to 0-based)
    if (studyDayCount > 0 && studyDayCount <= items.length) {
        return items[studyDayCount - 1];
    }

    return null;
}

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const { searchParams } = new URL(request.url);

        // Date handling
        const queryDate = searchParams.get('date');
        const today = queryDate ? dayjs(queryDate) : dayjs().tz('Asia/Seoul');
        const dateStr = today.format('YYYY-MM-DD');

        // 1. Fetch Students
        const { data: students, error: studentError } = await supabase
            .from('users')
            .select('*, classes(name)')
            .eq('role', 'student');

        if (studentError) throw studentError;

        const resultsPromises = [];

        // 2. Process each student
        for (const student of (students || [])) {
            resultsPromises.push((async () => {
                const studentResults = {
                    student_id: student.id,
                    student_name: student.full_name || student.username,
                    class_name: student.classes?.name || '미배정',
                    assignments: [] as any[]
                };

                // Fetch Curriculums
                // We need to be careful about what fields we select.
                // Assuming `study_days` exists on `student_curriculums`
                const { data: currics } = await supabase
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
                                sequence
                            )
                        )
                    `)
                    .eq('student_id', student.id)
                    .eq('status', 'active');

                if (currics) {
                    for (const sc of currics) {
                        if (!sc.curriculums) continue;

                        // Calculate Schedule
                        const item = calculateSchedule(sc, dateStr);

                        if (item) {
                            // Check Status
                            const { data: log } = await supabase
                                .from('study_logs')
                                .select('status, score')
                                .eq('student_id', student.id)
                                .eq('curriculum_item_id', item.id)
                                .gte('created_at', today.startOf('day').toISOString())
                                .lte('created_at', today.endOf('day').toISOString())
                                .maybeSingle();

                            studentResults.assignments.push({
                                id: `${student.id}-${sc.curriculum_id}-${item.id}`, // Unique key for list
                                curriculum_name: sc.curriculums.name,
                                item_id: item.id,
                                item_title: item.title,
                                status: log ? (log.status || 'completed') : 'pending',
                                score: log?.score,
                                curriculum_item_id: item.id // Needed for force complete
                            });
                        }
                    }
                }

                return studentResults;
            })());
        }

        const resolved = await Promise.all(resultsPromises);

        return NextResponse.json({
            date: dateStr,
            data: resolved
        });

    } catch (error: any) {
        console.error('Learning Status API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
