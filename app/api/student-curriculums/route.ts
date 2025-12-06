import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// GET - 학생 커리큘럼 목록 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('student_id');

        let query = supabase
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
            .order('created_at', { ascending: false });

        if (studentId) {
            query = query.eq('student_id', studentId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ studentCurriculums: data });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - 학생에게 커리큘럼 등록
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { student_ids, curriculum_id, start_date, class_days } = body;

        if (!student_ids || !curriculum_id || !start_date || !class_days) {
            return NextResponse.json(
                { error: 'student_ids, curriculum_id, start_date, and class_days are required' },
                { status: 400 }
            );
        }

        // 여러 학생에게 동일한 커리큘럼 등록
        const insertData = student_ids.map((studentId: string) => ({
            student_id: studentId,
            curriculum_id,
            start_date,
            class_days: class_days.join(','), // 예: "월,수,금"
            status: 'active',
        }));

        const { data, error } = await supabase
            .from('student_curriculums')
            .insert(insertData)
            .select();

        if (error) {
            console.error('Insert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            message: `${student_ids.length}명의 학생에게 커리큘럼이 등록되었습니다.`,
            studentCurriculums: data
        }, { status: 201 });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
