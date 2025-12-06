import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// POST /api/tests/submit - 시험 제출
export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const body = await request.json();
        const { study_log_id, answers, score, wrong_answers, test_phase } = body;

        if (!study_log_id || !answers) {
            return NextResponse.json(
                { error: 'study_log_id and answers are required' },
                { status: 400 }
            );
        }

        // 학습 기록 업데이트
        const updateData: any = {
            status: wrong_answers && wrong_answers.length > 0 ? 'in_progress' : 'completed',
            score,
            wrong_answers,
            test_phase: test_phase || 'completed',
            updated_at: new Date().toISOString(),
        };

        if (updateData.status === 'completed') {
            updateData.completed_at = new Date().toISOString();
        }

        const { data: studyLog, error: updateError } = await supabase
            .from('study_logs')
            .update(updateData)
            .eq('id', study_log_id)
            .select()
            .single();

        if (updateError) {
            console.error('Study log update error:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // 시험 완료 시 달러 지급
        if (updateData.status === 'completed' && studyLog) {
            const { data: academy } = await supabase
                .from('academies')
                .select('dollar_per_completion')
                .eq('id', '00000000-0000-0000-0000-000000000000')
                .single();

            const dollarsToAdd = academy?.dollar_per_completion || 10;

            // 달러 거래 생성
            await supabase
                .from('dollar_transactions')
                .insert({
                    student_id: studyLog.student_id,
                    amount: dollarsToAdd,
                    transaction_type: 'study_completion',
                    description: `시험 완료 보상 (점수: ${score})`,
                });

            // 학생 달러 업데이트
            const { data: student } = await supabase
                .from('users')
                .select('dollars')
                .eq('id', studyLog.student_id)
                .single();

            await supabase
                .from('users')
                .update({ dollars: (student?.dollars || 0) + dollarsToAdd })
                .eq('id', studyLog.student_id);
        }

        return NextResponse.json({
            studyLog,
            message: updateData.status === 'completed' ? 'Test completed successfully' : 'Test submitted, retry required',
        });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
