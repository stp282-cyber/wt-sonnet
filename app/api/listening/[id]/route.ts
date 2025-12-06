import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// GET - 듣기 시험 상세 조회 (문제 포함)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 듣기 시험 메타데이터 조회
        const { data: listeningTest, error: testError } = await supabase
            .from('listening_tests')
            .select('*')
            .eq('id', id)
            .single();

        if (testError || !listeningTest) {
            return NextResponse.json(
                { error: 'Listening test not found' },
                { status: 404 }
            );
        }

        // 듣기 문제 조회
        const { data: questions, error: questionsError } = await supabase
            .from('listening_questions')
            .select('*')
            .eq('listening_test_id', id)
            .order('question_no', { ascending: true });

        if (questionsError) {
            console.error('Questions fetch error:', questionsError);
            return NextResponse.json(
                { error: 'Failed to fetch questions' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            listeningTest: {
                ...listeningTest,
                questions: questions || [],
                question_count: questions?.length || 0,
            },
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE - 듣기 시험 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // CASCADE 설정으로 인해 듣기 문제도 자동 삭제됨
        const { error } = await supabase
            .from('listening_tests')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Delete error:', error);
            return NextResponse.json(
                { error: 'Failed to delete listening test' },
                { status: 500 }
            );
        }

        return NextResponse.json({ message: 'Listening test deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

