
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getScheduleForDate } from '@/lib/curriculumUtils';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

export const dynamic = 'force-dynamic';

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

                // Fetch Curriculums - 단순화된 쿼리
                const { data: currics, error: curricError } = await supabase
                    .from('student_curriculums')
                    .select(`
                        *,
                        curriculums (
                            id,
                            name
                        )
                    `)
                    .eq('student_id', student.id);

                if (curricError) {
                    console.error(`[DEBUG] Error fetching curriculums for ${student.full_name}:`, curricError);
                }

                console.log(`[DEBUG] Student: ${student.full_name}, Curriculums:`, currics?.length);

                // curriculum_items를 별도로 조회
                if (currics && currics.length > 0) {
                    for (const curric of currics) {
                        const { data: items } = await supabase
                            .from('curriculum_items')
                            .select('*')
                            .eq('curriculum_id', curric.curriculum_id)
                            .order('sequence');

                        if (items && items.length > 0) {
                            // 각 item의 wordbook 데이터를 가져오기
                            for (const item of items) {
                                if (item.item_type === 'wordbook' && item.item_id) {
                                    const { data: wordbook } = await supabase
                                        .from('wordbooks')
                                        .select(`
                                            *,
                                            wordbook_sections (*)
                                        `)
                                        .eq('id', item.item_id)
                                        .single();

                                    if (wordbook) {
                                        (item as any).item_details = wordbook;
                                        (item as any).sections = wordbook.wordbook_sections || [];
                                    }
                                } else if (item.item_type === 'listening' && item.item_id) {
                                    const { data: listening } = await supabase
                                        .from('listening_tests')
                                        .select('*')
                                        .eq('id', item.item_id)
                                        .single();

                                    if (listening) {
                                        (item as any).item_details = listening;
                                    }
                                }
                            }
                        }

                        if (curric.curriculums) {
                            (curric.curriculums as any).curriculum_items = items || [];
                        }
                    }
                    console.log(`[DEBUG] First curriculum with items:`, JSON.stringify(currics[0], null, 2));
                }

                if (currics) {
                    // Fetch study logs for this student
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
                                const key = `${log.curriculum_id}-${log.curriculum_item_id}-${d}`;
                                logMap.set(key, log);
                            }
                        });
                    }

                    for (const sc of currics) {
                        if (!sc.curriculums) continue;

                        // Transform curriculum data to match StudentCurriculum type
                        const curriculum: any = {
                            ...sc,
                            curriculum_items: sc.curriculums.curriculum_items || []
                        };

                        // Get schedule for today using curriculumUtils
                        const todaySchedule = getScheduleForDate(curriculum, dateStr);

                        if (todaySchedule) {
                            const logKey = `${sc.curriculum_id}-${todaySchedule.item.item_id}-${dateStr}`;
                            const log = logMap.get(logKey);
                            const isCompleted = log && log.status === 'completed';

                            studentResults.assignments.push({
                                id: `${student.id}-${sc.id}-${todaySchedule.item.id}-${dateStr}`,
                                curriculum_name: sc.curriculums.name,
                                item_id: todaySchedule.item.item_id, // Content ID (for display/linking)
                                item_title: todaySchedule.itemTitle,
                                status: isCompleted ? 'completed' : 'pending',
                                score: log?.score,
                                curriculum_item_id: todaySchedule.item.id, // Row ID (for FK) - FIXED
                                scheduled_date: dateStr,
                                is_past_due: false // Today's assignment
                            });
                        }

                        // Get past incomplete assignments
                        const start = dayjs(sc.start_date).tz('Asia/Seoul');
                        const target = dayjs(dateStr).tz('Asia/Seoul');

                        let current = start.clone();
                        while (current.isBefore(target, 'day')) {
                            const currentStr = current.format('YYYY-MM-DD');
                            const pastSchedule = getScheduleForDate(curriculum, currentStr);

                            if (pastSchedule) {
                                const logKey = `${sc.curriculum_id}-${pastSchedule.item.item_id}-${currentStr}`;
                                const log = logMap.get(logKey);
                                const isCompleted = log && log.status === 'completed';

                                if (!isCompleted) {
                                    studentResults.assignments.push({
                                        id: `${student.id}-${sc.id}-${pastSchedule.item.id}-${currentStr}`,
                                        curriculum_name: sc.curriculums.name,
                                        item_id: pastSchedule.item.item_id,
                                        item_title: pastSchedule.itemTitle,
                                        status: 'pending',
                                        score: log?.score,
                                        curriculum_item_id: pastSchedule.item.id, // Row ID (for FK) - FIXED
                                        scheduled_date: currentStr,
                                        is_past_due: true
                                    });
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
