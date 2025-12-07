import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { getScheduleForDate } from '@/lib/curriculumUtils';
import { StudentCurriculum } from '@/types/curriculum';

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
        }

        const today = new Date().toISOString().split('T')[0];

        // 1. Fetch Today's Completed Logs (to show "Done" items and prevent duplicate "To Do")
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
            .gte('completed_at', `${today}T00:00:00`) // Completed Today
            .lte('completed_at', `${today}T23:59:59`);

        if (logError) throw logError;

        // 2. Fetch Student Curriculums (Active)
        const { data: curriculumsData, error: currError } = await supabase
            .from('student_curriculums')
            .select(`
                *,
                curriculums ( name ),
                curriculum_items (
                    *,
                    item_details:curriculum_item_details(*),
                    sections (*)
                )
            `)
            .eq('student_id', userId)
            .eq('status', 'active');

        if (currError) throw currError;

        // Sort sub-arrays for consistent scheduling
        const curriculums = (curriculumsData || []).map((curr: any) => {
            if (curr.curriculum_items) {
                curr.curriculum_items.sort((a: any, b: any) => a.sequence - b.sequence);
                curr.curriculum_items.forEach((item: any) => {
                    if (item.sections) {
                        // Sort sections by major/minor unit or id if needed. 
                        // Usually sections are inserted in order. 
                        // Let's assume ID order or sequence if available. 
                        // Our logic mainly iterates array order.
                        item.sections.sort((s1: any, s2: any) => (s1.sequence || s1.id) - (s2.sequence || s2.id));
                    }
                });
            }
            return curr;
        });

        // 3. Generate "Pending" (To Do) Items using Dynamic Schedule
        const pendingItems: any[] = [];
        const completedCurriculumIds = new Set(completedLogs?.map((l: any) => l.curriculum_id));

        curriculums.forEach((curr: StudentCurriculum) => {
            // If already completed today, skip generating a "To Do" item (One chunk per day policy)
            if (completedCurriculumIds.has(curr.id)) return;

            // Calculate schedule for TODAY
            // Note: getScheduleForDate uses 'today' as the check date.
            // If current_progress matches today's slot, it returns it.
            const todaySchedule = getScheduleForDate(curr, today);

            if (todaySchedule && todaySchedule.status !== 'completed') { // status 'completed' from utils means "date is in past". But here we pass today.
                // Construct LearningItem
                pendingItems.push({
                    id: curr.id, // Use curriculum ID as key for pending tasks
                    curriculum_name: curr.curriculums?.name || 'Unknown Curriculum',
                    type: todaySchedule.itemType,
                    title: todaySchedule.itemTitle,
                    subInfo: `${todaySchedule.unitName} (${todaySchedule.wordCount} words)`,
                    status: 'pending', // It shows in dashboard as "To Do"
                    date: today,
                    // Extra data for navigation if needed
                    curriculum_id: curr.id
                });
            }
        });

        // 4. Process Completed Logs into LearningItems
        // We need titles. Study Logs join curriculum_item, but we need the REAL title (Wordbook Title or Listening Title)
        // Similar to previous code, fetch titles.

        let completedItems: any[] = [];
        if (completedLogs && completedLogs.length > 0) {
            // Collect IDs
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
                    date: log.completed_at?.split('T')[0] || today
                };
            });
        }

        // 5. Combine Learning Data
        // Show Pending First, then Completed
        const learningData = [...pendingItems, ...completedItems];


        // 6. Fetch Weekly Stats
        // (Keep existing logic)
        const now = new Date();
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(now.getDate() - 7);
        const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];

        const { data: statsLogs, error: statsError } = await supabase
            .from('study_logs')
            .select('status, score, completed_at')
            .eq('student_id', userId)
            .gte('completed_at', oneWeekAgoStr);

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
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
