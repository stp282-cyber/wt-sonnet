import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// GET - 듣기 시험 목록 조회
export async function GET(request: NextRequest) {
    try {
        const { data: listeningTests, error } = await supabase
            .from('listening_tests')
            .select(`
                id,
                title,
                created_at,
                updated_at
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch listening tests' },
                { status: 500 }
            );
        }

        // 각 듣기 시험의 문제 수 조회
        const testsWithCount = await Promise.all(
            (listeningTests || []).map(async (test) => {
                const { count } = await supabase
                    .from('listening_questions')
                    .select('*', { count: 'exact', head: true })
                    .eq('listening_test_id', test.id);

                return {
                    ...test,
                    question_count: count || 0,
                };
            })
        );

        return NextResponse.json({ listeningTests: testsWithCount });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - 듣기 시험 생성
export async function POST(request: NextRequest) {
    try {
        const { title, questions, academy_id } = await request.json();

        if (!title || !questions) {
            return NextResponse.json(
                { error: 'Title and questions are required' },
                { status: 400 }
            );
        }

        // 듣기 시험 메타데이터 생성
        const { data: listeningTest, error: testError } = await supabase
            .from('listening_tests')
            .insert({
                title,
                academy_id: academy_id || '00000000-0000-0000-0000-000000000000',
            })
            .select()
            .single();

        if (testError) {
            console.error('Listening test creation error:', testError);
            return NextResponse.json(
                { error: 'Failed to create listening test' },
                { status: 500 }
            );
        }

        // 듣기 문제 생성
        const questionsToInsert = questions.map((q: any) => ({
            listening_test_id: listeningTest.id,
            question_no: q.question_no,
            question_text: q.question_text,
            choices: q.choices,
            correct_answer: q.correct_answer,
            script: q.script,
            audio_source: 'tts',
            major_unit: q.major_unit,
            minor_unit: q.minor_unit,
        }));

        const { error: questionsError } = await supabase
            .from('listening_questions')
            .insert(questionsToInsert);

        if (questionsError) {
            console.error('Questions creation error:', questionsError);
            // 롤백: 생성된 듣기 시험 삭제
            await supabase.from('listening_tests').delete().eq('id', listeningTest.id);
            return NextResponse.json(
                { error: 'Failed to create listening questions' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                listeningTest: {
                    ...listeningTest,
                    question_count: questions.length,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
