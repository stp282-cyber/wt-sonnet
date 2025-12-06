import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// POST /api/tests/start - 시험 시작
export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const body = await request.json();
        const { student_id, curriculum_item_id, test_type } = body;

        if (!student_id || !curriculum_item_id) {
            return NextResponse.json(
                { error: 'student_id and curriculum_item_id are required' },
                { status: 400 }
            );
        }

        // 커리큘럼 항목 조회
        const { data: curriculumItem, error: itemError } = await supabase
            .from('curriculum_items')
            .select('*')
            .eq('id', curriculum_item_id)
            .single();

        if (itemError || !curriculumItem) {
            return NextResponse.json({ error: 'Curriculum item not found' }, { status: 404 });
        }

        // 단어장 또는 듣기 시험 데이터 조회
        let testData: any = {};

        if (curriculumItem.item_type === 'wordbook') {
            const { data: wordbook, error: wordbookError } = await supabase
                .from('wordbooks')
                .select(`
                    *,
                    sections:wordbook_sections(*)
                `)
                .eq('id', curriculumItem.item_id)
                .single();

            if (wordbookError || !wordbook) {
                return NextResponse.json({ error: 'Wordbook not found' }, { status: 404 });
            }

            // 단어 평탄화
            const allWords: any[] = [];
            (wordbook.sections || []).forEach((section: any) => {
                const sectionWords = section.words || [];
                sectionWords.forEach((word: any) => {
                    allWords.push({
                        ...word,
                        major_unit: section.major_unit,
                        minor_unit: section.minor_unit,
                    });
                });
            });

            testData = {
                type: 'wordbook',
                wordbook,
                words: allWords,
                test_type: test_type || curriculumItem.test_type,
                time_limit_seconds: curriculumItem.time_limit_seconds,
                passing_score: curriculumItem.passing_score,
            };
        } else if (curriculumItem.item_type === 'listening') {
            const { data: listeningTest, error: listeningError } = await supabase
                .from('listening_tests')
                .select(`
                    *,
                    questions:listening_questions(*)
                `)
                .eq('id', curriculumItem.item_id)
                .single();

            if (listeningError || !listeningTest) {
                return NextResponse.json({ error: 'Listening test not found' }, { status: 404 });
            }

            testData = {
                type: 'listening',
                listeningTest,
                questions: listeningTest.questions || [],
            };
        }

        // 학습 기록 생성 (시험 시작)
        const { data: studyLog, error: logError } = await supabase
            .from('study_logs')
            .insert({
                student_id,
                curriculum_id: curriculumItem.curriculum_id,
                curriculum_item_id,
                scheduled_date: new Date().toISOString().split('T')[0],
                status: 'in_progress',
                test_phase: 'initial',
                test_data: testData,
            })
            .select()
            .single();

        if (logError) {
            console.error('Study log creation error:', logError);
            return NextResponse.json({ error: logError.message }, { status: 500 });
        }

        return NextResponse.json({
            studyLog,
            testData,
        }, { status: 201 });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
