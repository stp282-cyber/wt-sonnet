import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// GET /api/students - 학생 목록 조회
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const { searchParams } = new URL(request.url);
        const classId = searchParams.get('class_id');
        const status = searchParams.get('status');

        let query = supabase
            .from('users')
            .select(`
                id,
                username,
                email,
                full_name,
                role,
                status,
                class_id,
                dollars,
                created_at,
                updated_at,
                classes:class_id (
                    id,
                    name
                )
            `)
            .eq('role', 'student')
            .order('created_at', { ascending: false });

        // 필터링
        if (classId) {
            query = query.eq('class_id', classId);
        }
        if (status) {
            query = query.eq('status', status);
        }

        const { data: students, error } = await query;

        if (error) {
            console.error('Students fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 데이터 변환 (class_name 추가)
        const transformedStudents = students?.map(student => ({
            ...student,
            class_name: (student.classes as any)?.name || null,
        })) || [];

        return NextResponse.json({ students: transformedStudents });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/students - 학생 등록
export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const body = await request.json();
        const { username, password, full_name, email, class_id, status = 'active' } = body;

        // 필수 필드 검증
        if (!username || !password || !full_name) {
            return NextResponse.json(
                { error: 'Username, password, and full_name are required' },
                { status: 400 }
            );
        }

        // 중복 username 체크
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .single();

        if (existingUser) {
            return NextResponse.json(
                { error: 'Username already exists' },
                { status: 409 }
            );
        }

        // 학생 생성
        const { data: student, error } = await supabase
            .from('users')
            .insert({
                username,
                password_hash: password, // TODO: bcrypt로 해싱 필요
                full_name,
                email,
                role: 'student',
                status,
                class_id,
                dollars: 0,
            })
            .select()
            .single();

        if (error) {
            console.error('Student creation error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ student }, { status: 201 });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
