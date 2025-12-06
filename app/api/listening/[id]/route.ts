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

// PUT - 듣기 시험 수정
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { title, questions } = await request.json();

        if (!title && !questions) {
            return NextResponse.json(
                { error: 'At least title or questions must be provided' },
                { status: 400 }
            );
        }

        // 1. 듣기 시험 메타데이터 수정
        if (title) {
            const { error: updateError } = await supabase
                .from('listening_tests')
                .update({
                    title,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id);

            if (updateError) {
                console.error('Listening test update error:', updateError);
                return NextResponse.json(
                    { error: 'Failed to update listening test' },
                    { status: 500 }
                );
            }
        }

        // 2. 듣기 문제 수정
        if (questions && Array.isArray(questions)) {
            // 기존 문제 삭제
            await supabase
                .from('listening_questions')
                .delete()
                .eq('listening_test_id', id);

            // 새 문제 생성
            const questionsToInsert = questions.map((q: any) => ({
                listening_test_id: id,
                question_no: q.question_no,
                question_text: q.question_text,
                choices: q.choices,
                correct_answer: q.correct_answer,
                script: q.script,
                audio_source: q.audio_source || 'tts',
                audio_url: q.audio_url,
                major_unit: q.major_unit,
                minor_unit: q.minor_unit,
            }));

            const { error: questionsError } = await supabase
                .from('listening_questions')
                .insert(questionsToInsert);

            if (questionsError) {
                console.error('Questions update error:', questionsError);
                return NextResponse.json(
                    { error: 'Failed to update listening questions' },
                    { status: 500 }
                );
            }
        }

        // 수정된 듣기 시험 조회
        const { data: listeningTest, error: fetchError } = await supabase
            .from('listening_tests')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !listeningTest) {
            return NextResponse.json(
                { error: 'Listening test not found' },
                { status: 404 }
            );
        }

        // 문제 수 조회
        const { count } = await supabase
            .from('listening_questions')
            .select('*', { count: 'exact', head: true })
            .eq('listening_test_id', id);

        return NextResponse.json({
            listeningTest: {
                ...listeningTest,
                question_count: count || 0,
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

