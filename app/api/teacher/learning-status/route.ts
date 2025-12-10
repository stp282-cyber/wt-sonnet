
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
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

export async function GET(request: NextRequest) {
    try {
        console.log('[Learning Status API] Request received');
        console.log('[Learning Status API] Environment check:', {
            hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        });

        const supabase = supabaseAdmin;

        if (!supabase) {
            console.error('[Learning Status API] Supabase admin client is null');
            return NextResponse.json({
                error: 'Server misconfiguration: Missing Supabase credentials',
                details: 'SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL not set'
            }, { status: 500 });
        }

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

        if (studentError) {
            console.error('[Learning Status API] Student fetch error:', studentError);
            throw studentError;
        }

        console.log(`[Learning Status API] Found ${students?.length || 0} students`);

        const resultsPromises = [];

        // 2. Process each student
        for (const student of (students || [])) {
            resultsPromises.push((async () => {
                const studentResults = {
                    student_id: student.id,
                    student_name: student.full_name || student.username,
                    class_name: student.classes?.name || '미배정',
                    assignments: [] as any[],
                };

                // Fetch Curriculums
                // We need to be careful about what fields we select.
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
                    .eq('student_id', student.id);
                // .eq('status', 'active'); 

                if (currics) {
                    // Fetch all relevant study logs for this student involved in these curriculums
                    const curriculumIds = currics.map(c => c.curriculum_id);
                    const { data: allLogs } = await supabase
                        .from('study_logs')
                        .select('curriculum_item_id, status, score, scheduled_date, curriculum_id')
                        .eq('student_id', student.id)
                        .in('curriculum_id', curriculumIds);

                    const logMap = new Map();
                    if (allLogs) {
                        allLogs.forEach(log => {
                            if (log.scheduled_date) {
                                const d = dayjs(log.scheduled_date).tz('Asia/Seoul').format('YYYY-MM-DD');
                                const key = `${log.curriculum_item_id}-${d}`;
                                logMap.set(key, log);
                            }
                        });
                    }

                    for (const sc of currics) {
                        if (!sc.curriculums) continue;

                        const start = dayjs(sc.start_date).tz('Asia/Seoul').startOf('day');
                        const target = dayjs(dateStr).tz('Asia/Seoul').startOf('day');



                        // If start date is after target, nothing to show
                        if (target.isBefore(start)) {
                            continue;
                        }

                        const items = sc.curriculums.curriculum_items || [];
                        // Sort items by sequence
                        items.sort((a: any, b: any) => (a.sequence || 0) - (b.sequence || 0));

                        const studies = normalizeStudyDays(sc.study_days);

                        let current = start.clone();
                        let itemIndex = 0;

                        // Iterate from start date to target date
                        while (current.isBefore(target) || current.isSame(target, 'day')) {
                            const currentStr = current.format('YYYY-MM-DD');
                            const dName = current.format('ddd').toLowerCase();

                            // Check if this date is a study day
                            if (studies.some(s => s.startsWith(dName))) {
                                if (itemIndex < items.length) {
                                    const item = items[itemIndex];
                                    const isTargetDate = current.isSame(target, 'day');

                                    // Check if log exists for this specific schedule
                                    const logKey = `${item.id}-${currentStr}`;
                                    const log = logMap.get(logKey);
                                    const isCompleted = log && log.status === 'completed';



                                    // Add to assignments if:
                                    // 1. It is the target date (show status regardless)
                                    // 2. It is a past date AND not completed (Past Uncompleted)
                                    if (isTargetDate || !isCompleted) {
                                        studentResults.assignments.push({
                                            id: `${student.id}-${sc.curriculum_id}-${item.id}-${currentStr}`,
                                            curriculum_name: sc.curriculums.name,
                                            item_id: item.id,
                                            item_title: item.title,
                                            status: isCompleted ? 'completed' : 'pending',
                                            score: log?.score,
                                            curriculum_item_id: item.id,
                                            scheduled_date: currentStr,
                                            is_past_due: !isTargetDate && !isCompleted
                                        });
                                    }

                                    itemIndex++;
                                }
                            }
                            current = current.add(1, 'day');
                        }
                    }
                }

                return studentResults;
            })());
        }

        const resolved = await Promise.all(resultsPromises);

        console.log(`[Learning Status API] Returning ${resolved.length} student records`);
        console.log(`[Learning Status API] Total assignments: ${resolved.reduce((sum, r) => sum + r.assignments.length, 0)}`);

        return NextResponse.json({
            date: dateStr,
            data: resolved
        });

    } catch (error: any) {
        console.error('Learning Status API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
