import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// GET /api/student-curriculums/student/[student_id] - 특정 학생의 모든 커리큘럼 조회
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ student_id: string }> }
) {
    try {
        const supabase = createClient();
        const { student_id } = await params;

        // 학생 정보 조회
        const { data: student, error: studentError } = await supabase
            .from('users')
            .select('id, full_name, username, class_id')
            .eq('id', student_id)
            .single();

        if (studentError || !student) {
            console.error('Student fetch error:', studentError);
            return NextResponse.json(
                { error: 'Student not found' },
                { status: 404 }
            );
        }

        // 학생의 반 정보 조회 (있는 경우)
        let studentClass = null;
        if (student.class_id) {
            const { data: classData } = await supabase
                .from('classes')
                .select('id, name')
                .eq('id', student.class_id)
                .single();
            studentClass = classData;
        }

        const studentWithClass = {
            ...student,
            classes: studentClass,
        };

        // 학생의 모든 커리큘럼 조회
        const { data: studentCurriculums, error: scError } = await supabase
            .from('student_curriculums')
            .select(`
                id,
                student_id,
                curriculum_id,
                start_date,
                study_days,
                current_item_id,
                current_progress,
                created_at,
                updated_at,
                curriculums:curriculum_id (
                    id,
                    name,
                    description
                )
            `)
            .eq('student_id', student_id)
            .order('created_at', { ascending: true });

        if (scError) {
            console.error('Student curriculums fetch error:', scError);
            return NextResponse.json(
                { error: scError.message },
                { status: 500 }
            );
        }

        // 각 커리큘럼의 항목들 조회
        const curriculumsWithItems = await Promise.all(
            (studentCurriculums || []).map(async (sc) => {
                const { data: curriculumItems, error: itemsError } = await supabase
                    .from('curriculum_items')
                    .select(`
                        id,
                        sequence,
                        item_type,
                        item_id,
                        test_type,
                        daily_amount,
                        word_count,
                        time_limit_seconds,
                        passing_score,
                        created_at
                    `)
                    .eq('curriculum_id', sc.curriculum_id)
                    .order('sequence', { ascending: true });

                if (itemsError) {
                    console.error('Curriculum items fetch error:', itemsError);
                    return { ...sc, curriculum_items: [] };
                }

                // 각 항목의 상세 정보 가져오기
                const itemsWithDetails = await Promise.all(
                    (curriculumItems || []).map(async (item) => {
                        if (item.item_type === 'wordbook') {
                            const { data: wordbook } = await supabase
                                .from('wordbooks')
                                .select('id, title, word_count')
                                .eq('id', item.item_id)
                                .single();

                            return {
                                ...item,
                                item_details: wordbook,
                            };
                        } else if (item.item_type === 'listening') {
                            const { data: listening } = await supabase
                                .from('listening_tests')
                                .select('id, title')
                                .eq('id', item.item_id)
                                .single();

                            return {
                                ...item,
                                item_details: listening,
                            };
                        }
                        return item;
                    })
                );

                return {
                    ...sc,
                    curriculum_items: itemsWithDetails,
                };
            })
        );

        return NextResponse.json({
            student: studentWithClass,
            curriculums: curriculumsWithItems,
        });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
