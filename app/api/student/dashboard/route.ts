import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

// --- Helpers from Teacher API ---

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
    // Sort items by sequence
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
        const userId = searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
        }

        // Use dayjs for consistency with calculation logic
        const now = dayjs().tz('Asia/Seoul');
        const todayStr = now.format('YYYY-MM-DD');

        // 1. Fetch Today's Completed Logs (to show "Done" items)
        const { data: completedLogs, error: logError } = await supabase
            .from('study_logs')
            .select(`
                id,
                scheduled_date,
                completed_at,
                status,
                score,
                curriculum_id,
                curriculum:curriculum_id ( name ),
                curriculum_item:curriculum_item_id (
                    id,
                    item_type,
                    item_id,
                    sequence
                )
            `)
            .eq('student_id', userId)
            .eq('status', 'completed')
            .gte('completed_at', `${todayStr}T00:00:00`)
            .lte('completed_at', `${todayStr}T23:59:59`);

        if (logError) throw logError;

        // 2. Fetch Student Curriculums (Active)
        const { data: curriculumsData, error: currError } = await supabase
            .from('student_curriculums')
            .select(`
                *,
                curriculums ( 
                    name,
                    curriculum_items (
                        id,
                        title,
                        item_type,
                        sequence
                    )
                )
            `)
            .eq('student_id', userId)
            .eq('status', 'active');

        if (currError) throw currError;

        // 3. Generate "Pending" (To Do) Items using Teacher's Logic
        const pendingItems: any[] = [];

        for (const curr of (curriculumsData || [])) {
            // Calculate schedule for TODAY using the Teacher Logic
            const scheduledItem = calculateSchedule(curr, todayStr);

            if (scheduledItem) {
                // Check if there is a completed log for this specific curriculum item
                const isCompleted = completedLogs?.some(
                    (log: any) => log.curriculum_item?.id === scheduledItem.id
                );

                if (!isCompleted) {
                    pendingItems.push({
                        id: curr.id,
                        curriculum_name: curr.curriculums?.name || 'Unknown Curriculum',
                        type: scheduledItem.item_type || 'wordbook',
                        title: scheduledItem.title || 'Untitled Mission',
                        subInfo: `${scheduledItem.item_type === 'wordbook' ? 'Voca' : 'Listening'} Mission`,
                        status: 'pending',
                        date: todayStr,
                        curriculum_id: curr.id
                    });
                }
            }
        }

        // 4. Process Completed Logs into LearningItems
        let completedItems: any[] = [];
        if (completedLogs && completedLogs.length > 0) {
            const wordbookIds = completedLogs
                .filter((l: any) => l.curriculum_item?.item_type === 'wordbook')
                .map((l: any) => l.curriculum_item.item_id);

            const listeningIds = completedLogs
                .filter((l: any) => l.curriculum_item?.item_type === 'listening')
                .map((l: any) => l.curriculum_item.item_id);

            let wordbooks: any[] = [];
            let listenings: any[] = [];

            if (wordbookIds.length > 0) {
                const { data } = await supabase.from('wordbooks').select('id, title, word_count').in('id', wordbookIds);
                wordbooks = data || [];
            }
            if (listeningIds.length > 0) {
                const { data } = await supabase.from('listening_tests').select('id, title').in('id', listeningIds);
                listenings = data || [];
            }

            completedItems = completedLogs.map((log: any) => {
                let title = 'Unknown Item';
                let subInfo = 'Completed';

                if (log.curriculum_item?.item_type === 'wordbook') {
                    const wh = wordbooks.find(w => w.id === log.curriculum_item.item_id);
                    title = wh?.title || 'Unknown Wordbook';
                    subInfo = `${wh?.word_count || 0} words - Score: ${log.score || 0}`;
                } else if (log.curriculum_item?.item_type === 'listening') {
                    const lh = listenings.find(l => l.id === log.curriculum_item.item_id);
                    title = lh?.title || 'Unknown Listening';
                    subInfo = `Listening - Score: ${log.score || 0}`;
                }

                return {
                    id: log.id,
                    curriculum_name: log.curriculum?.name,
                    type: log.curriculum_item?.item_type,
                    title: title,
                    subInfo: subInfo,
                    status: 'completed',
                    date: log.completed_at?.split('T')[0] || todayStr
                };
            });
        }

        const learningData = [...pendingItems, ...completedItems];

        // 5. Weekly Stats
        const oneWeekAgo = now.subtract(7, 'day').format('YYYY-MM-DD');
        const { data: statsLogs, error: statsError } = await supabase
            .from('study_logs')
            .select('status, score, completed_at')
            .eq('student_id', userId)
            .gte('completed_at', oneWeekAgo);

        if (statsError) throw statsError;

        const completedCount = statsLogs?.filter((l: any) => l.status === 'completed').length || 0;
        const validScoreLogs = statsLogs?.filter((l: any) => l.status === 'completed' && l.score !== null) || [];
        const totalScore = validScoreLogs.reduce((sum: number, l: any) => sum + (l.score || 0), 0);
        const averageScore = validScoreLogs.length > 0 ? Math.round(totalScore / validScoreLogs.length) : 0;

        return NextResponse.json({
            learning: learningData,
            stats: {
                completedThisWeek: completedCount,
                averageScore: averageScore
            }
        });

    } catch (error: any) {
        console.error('Dashboard API Error:', error);
        return NextResponse.json({ error: error.message, stack: error.stack, details: JSON.stringify(error) }, { status: 500 });
    }
}
