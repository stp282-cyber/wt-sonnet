import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { startOfWeek, endOfWeek, format } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
        }

        const today = new Date().toISOString().split('T')[0];

        // 1. Fetch Today's Learning (Scheduled for today or pending from past)
        // Note: Ideally we want pending items from past too, but let's stick to today + pending for now
        // Complex Join: study_logs -> curriculum_items -> (wordbook/listening)
        // Since Supabase join syntax can be tricky with dynamic polymorphic relations, 
        // we might need to fetch logs first then fetch details.

        const { data: logs, error: logsError } = await supabase
            .from('study_logs')
            .select(`
                id,
                scheduled_date,
                status,
                score,
                curriculum_item:curriculum_item_id (
                    id,
                    item_type,
                    item_id,
                    sequence
                ),
                curriculum:curriculum_id ( name )
            `)
            .eq('student_id', userId)
            // .eq('scheduled_date', today) // For now, let's just show ALL pending or completed Today.
            // Actually, "Today's Learning" usually means what I need to do NOW.
            .or(`scheduled_date.eq.${today},status.eq.pending`)
            .order('scheduled_date', { ascending: true });

        if (logsError) throw logsError;

        // Filter: If it's pending and in future, don't show yet? 
        // Or just show everything pending (catch-up) + today's.
        // Let's filter in code for better control.
        const todayObj = new Date(today);
        const filteredLogs = (logs || []).filter((log: any) => {
            const logDate = new Date(log.scheduled_date);
            // Show if (Status is Pending AND Date <= Today) OR (Date == Today)
            // This effectively shows "Overdue" and "Today".
            const isOverdue = log.status === 'pending' && logDate <= todayObj;
            const isToday = log.scheduled_date === today;
            return isOverdue || isToday;
        });

        // Resolve Item Titles (Wordbook/Listening)
        // We need to fetch titles for these items.
        // Group by type to batch fetch
        const wordbookIds = filteredLogs
            .filter((l: any) => l.curriculum_item?.item_type === 'wordbook')
            .map((l: any) => l.curriculum_item.item_id);

        const listeningIds = filteredLogs
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

        // Merge Data
        const learningData = filteredLogs.map((log: any) => {
            let title = 'Unknown Item';
            let subInfo = '';

            if (log.curriculum_item?.item_type === 'wordbook') {
                const wh = wordbooks.find(w => w.id === log.curriculum_item.item_id);
                title = wh?.title || 'Unknown Wordbook';
                subInfo = `${wh?.word_count || 0} words`;
            } else if (log.curriculum_item?.item_type === 'listening') {
                const lh = listenings.find(l => l.id === log.curriculum_item.item_id);
                title = lh?.title || 'Unknown Listening';
                subInfo = 'Listening Test';
            }

            return {
                id: log.id,
                curriculum_name: log.curriculum?.name,
                type: log.curriculum_item?.item_type,
                title: title,
                subInfo: subInfo,
                status: log.status,
                date: log.scheduled_date
            };
        });

        // 2. Fetch Weekly Stats
        // Get start/end of week
        const now = new Date();
        // Adjust for timezone if needed, but assuming UTC/System basic match for week calculation
        // Using simple JS dates for 7 day lookback might be safer or strict week.
        // Let's do "Current Week" (Mon-Sun).
        // Since we don't have date-fns here, let's do simple 7 day range.
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(now.getDate() - 7);
        const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];

        const { data: statsLogs, error: statsError } = await supabase
            .from('study_logs')
            .select('status, score, completed_at')
            .eq('student_id', userId)
            .gte('completed_at', oneWeekAgoStr); // Completed in last 7 days

        if (statsError) throw statsError;

        const completedCount = statsLogs?.filter((l: any) => l.status === 'completed').length || 0;
        const completedLogs = statsLogs?.filter((l: any) => l.status === 'completed' && l.score !== null) || [];
        const totalScore = completedLogs.reduce((sum: number, l: any) => sum + (l.score || 0), 0);
        const averageScore = completedLogs.length > 0 ? Math.round(totalScore / completedLogs.length) : 0;

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
