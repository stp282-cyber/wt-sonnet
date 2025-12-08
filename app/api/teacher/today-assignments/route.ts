
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

        const resultsPromises = [];
        const debugLogs: string[] = [];

        // 2. Fetch assignments for each student
        for (const student of (students || [])) {
            resultsPromises.push((async () => {
                let hasAssignment = false;
                const className = student.classes?.name || '미배정';
                const localResults = [];

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
                                section_start,
                                item_details
                            )
                        )
                    `)
                    .eq('student_id', student.id)
                    .eq('status', 'active');

                if (studentCurriculums && studentCurriculums.length > 0) {

                    if (student.username === 'test2' || student.full_name === '테스트2') {
                        debugLogs.push(`[Student: ${student.username}] Active Curriculums: ${studentCurriculums.length}`);
                    }

                    for (const sc of studentCurriculums) {
                        if (!sc.curriculums) continue;

                        const curriculum = sc.curriculums;
                        const items = curriculum.curriculum_items || [];
                        items.sort((a: any, b: any) => a.sequence - b.sequence);

                        const fullCurriculum: any = {
                            ...sc,
                            curriculums: { ...sc.curriculums, items: items },
                            items: items
                        };

                        const schedule = getScheduleForDate(fullCurriculum, dateStr);

                        if (schedule && schedule.item) {
                            hasAssignment = true;

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
                                status = record.status || 'completed';
                                score = record.score;
                            }

                            const itemName = schedule.itemTitle || schedule.unitName || '제목 없음';

                            localResults.push({
                                id: `${student.id}-${curriculum.id}-${schedule.item.id}`,
                                student_id: student.id,
                                curriculum_item_id: schedule.item.id,
                                student_name: student.full_name || student.username,
                                class_name: className,
                                curriculum_name: curriculum.name,
                                item_name: itemName,
                                scheduled_time: '00:00',
                                status,
                                score
                            });
                        }
                    }
                }

                if (!hasAssignment) {
                    localResults.push({
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

                return localResults;
            })());
        }

        const resolvedResults = await Promise.all(resultsPromises);
        const results = resolvedResults.flat();

        return NextResponse.json({
            assignments: results,
            _debug_logs: debugLogs
        });

    } catch (error: any) {
        console.error('Teacher today API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const body = await request.json();
        const { student_id, curriculum_item_id } = body;

        if (!student_id || !curriculum_item_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const today = dayjs().tz('Asia/Seoul').format('YYYY-MM-DD');

        const { data, error } = await supabase
            .from('study_logs')
            .upsert({
                student_id,
                curriculum_item_id,
                status: 'completed',
                score: 100,
                completed_at: new Date().toISOString(),
                study_date: today,
            })
            .select()
            .single();

        if (error) {
            console.error('Force complete error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('Force complete handler error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
