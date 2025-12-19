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
                .maybeSingle(); // Use maybeSingle to avoid 500 if class deleted
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
                setting_overrides,
                breaks,
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
                        daily_amount_type,
                        daily_word_count,
                        daily_section_amount,
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
                            // 단어장 기본 정보
                            const { data: wordbook } = await supabase
                                .from('wordbooks')
                                .select('id, title, word_count')
                                .eq('id', item.item_id)
                                .maybeSingle(); // maybeSingle

                            if (!wordbook) {
                                return {
                                    ...item,
                                    item_details: null,
                                    sections: [],
                                };
                            }

                            // 단어장의 소단원(sections) 정보 가져오기
                            const { data: sections } = await supabase
                                .from('wordbook_sections')
                                .select('id, major_unit, minor_unit, unit_name, words')
                                .eq('wordbook_id', item.item_id);

                            // 소단원을 대단원-소단원 숫자 기준으로 정렬 (1, 2, ... 10 순서 보장)
                            const sortedSectionsList = (sections || []).sort((a, b) => {
                                try {
                                    const majorCompare = (a.major_unit || '').localeCompare(b.major_unit || '', undefined, { numeric: true });
                                    if (majorCompare !== 0) return majorCompare;
                                    return (a.minor_unit || '').localeCompare(b.minor_unit || '', undefined, { numeric: true });
                                } catch (e) {
                                    console.error('Error sorting sections:', e);
                                    return 0;
                                }
                            });

                            // 소단원을 대단원-소단원 순서로 정렬하여 학습 순서 결정
                            const sortedSections = sortedSectionsList.map((section: any, index: number) => {
                                const wordCount = section.words?.length || 0;
                                // [OPTIMIZATION] Do NOT send the full word list to client to save bandwidth.
                                // We record the count above, then delete the words array.
                                const optimizedSection = { ...section };
                                delete optimizedSection.words;

                                return {
                                    ...optimizedSection,
                                    sequence: index + 1,
                                    word_count: wordCount,
                                };
                            });

                            return {
                                ...item,
                                item_details: wordbook,
                                sections: sortedSections,
                            };
                        } else if (item.item_type === 'listening') {
                            const { data: listening } = await supabase
                                .from('listening_tests')
                                .select('id, title')
                                .eq('id', item.item_id)
                                .maybeSingle(); // maybeSingle

                            return {
                                ...item,
                                item_details: listening || null,
                                sections: [],
                            };
                        }
                        return { ...item, sections: [] };
                    })
                );

                return {
                    ...sc,
                    curriculum_items: itemsWithDetails,
                };
            })
        );

        const responseData = {
            student: studentWithClass,
            curriculums: curriculumsWithItems,
        };
        // Removed potential heavy logging
        // console.log('DEBUG_CURRICULUM_DATA:', JSON.stringify(responseData.curriculums, null, 2));

        return NextResponse.json(responseData);
    } catch (error: any) {
        console.error('Unexpected error in student-curriculum route:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
