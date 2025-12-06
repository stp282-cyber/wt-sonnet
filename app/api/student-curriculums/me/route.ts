import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    try {
        // 쿠키에서 사용자 정보 가져오기
        const cookieStore = await cookies();
        const userCookie = cookieStore.get('user');

        if (!userCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = JSON.parse(userCookie.value);

        // 학생 권한 확인
        if (user.role !== 'student') {
            return NextResponse.json({ error: 'Forbidden - Students only' }, { status: 403 });
        }

        const studentId = user.id;

        // 학생의 커리큘럼 조회
        const { data, error } = await supabase
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
                curriculums:curriculum_id (
                    id,
                    name,
                    description
                )
            `)
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // study_days를 한글로 변환
        const dayMap: { [key: string]: string } = {
            'mon': '월',
            'tue': '화',
            'wed': '수',
            'thu': '목',
            'fri': '금',
        };

        const studentCurriculums = data?.map((sc: any) => ({
            ...sc,
            class_days: sc.study_days?.map((day: string) => dayMap[day] || day) || [],
        })) || [];

        return NextResponse.json({
            studentCurriculums,
            count: studentCurriculums.length,
        });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

