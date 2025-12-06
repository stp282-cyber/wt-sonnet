import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// GET /api/study-logs - 학습 기록 조회
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('student_id');
        const curriculumId = searchParams.get('curriculum_id');
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');

        let query = supabase
            .from('study_logs')
            .select('*')
            .order('scheduled_date', { ascending: false });

        if (studentId) query = query.eq('student_id', studentId);
        if (curriculumId) query = query.eq('curriculum_id', curriculumId);
        if (startDate) query = query.gte('scheduled_date', startDate);
        if (endDate) query = query.lte('scheduled_date', endDate);

        const { data: logs, error } = await query;

        if (error) {
            console.error('Study logs fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ logs: logs || [] });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/study-logs - 학습 기록 생성
export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const body = await request.json();
        const { student_id, curriculum_id, curriculum_item_id, scheduled_date, status, test_phase, score, wrong_answers, test_data } = body;

        if (!student_id || !scheduled_date) {
            return NextResponse.json(
                { error: 'student_id and scheduled_date are required' },
                { status: 400 }
            );
        }

        const { data: log, error } = await supabase
            .from('study_logs')
            .insert({
                student_id,
                curriculum_id,
                curriculum_item_id,
                scheduled_date,
                status: status || 'pending',
                test_phase,
                score,
                wrong_answers,
                test_data,
            })
            .select()
            .single();

        if (error) {
            console.error('Study log creation error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ log }, { status: 201 });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
