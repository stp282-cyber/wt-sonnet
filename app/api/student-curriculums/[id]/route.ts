import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// GET /api/student-curriculums/[id] - 특정 학생-커리큘럼 상세 조회 (커리큘럼 항목 포함)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createClient();
        const { id } = await params;

        // student_curriculum 조회 (학생, 커리큘럼 정보 포함)
        const { data: studentCurriculum, error: scError } = await supabase
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
                setting_overrides,
                breaks,
                users:student_id (
                    id,
                    full_name,
                    username,
                    classes:class_id (
                        id,
                        name
                    )
                ),
                curriculums:curriculum_id (
                    id,
                    name,
                    description
                )
            `)
            .eq('id', id)
            .single();

        if (scError || !studentCurriculum) {
            return NextResponse.json(
                { error: 'Student curriculum not found' },
                { status: 404 }
            );
        }

        // 커리큘럼 항목들 조회 (단어장, 듣기 정보 포함)
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
            .eq('curriculum_id', studentCurriculum.curriculum_id)
            .order('sequence', { ascending: true });

        if (itemsError) {
            console.error('Curriculum items fetch error:', itemsError);
            return NextResponse.json(
                { error: itemsError.message },
                { status: 500 }
            );
        }

        // 각 항목의 상세 정보 가져오기 (단어장 또는 듣기)
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

        return NextResponse.json({
            studentCurriculum: {
                ...studentCurriculum,
                curriculum_items: itemsWithDetails,
            },
        });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/student-curriculums/[id] - 특정 학생-커리큘럼 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createClient();
        const { id } = await params;

        const { error } = await supabase
            .from('student_curriculums')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Student curriculum delete error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

