import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// GET /api/students/[id] - 학생 상세 조회
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createClient();
        const { id } = await params;

        const { data: student, error } = await supabase
            .from('users')
            .select(`
                *,
                classes:class_id (
                    id,
                    name
                )
            `)
            .eq('id', id)
            .eq('role', 'student')
            .single();

        if (error || !student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        return NextResponse.json({ student });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/students/[id] - 학생 정보 수정
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createClient();
        const { id } = await params;
        const body = await request.json();
        const { username, full_name, email, class_id, status, password } = body;

        // 업데이트할 데이터 준비
        const updateData: any = {};
        if (username) updateData.username = username;
        if (full_name) updateData.full_name = full_name;
        if (email !== undefined) updateData.email = email;
        if (class_id !== undefined) updateData.class_id = class_id;
        if (status) updateData.status = status;
        if (password) updateData.password_hash = password; // TODO: bcrypt로 해싱 필요

        updateData.updated_at = new Date().toISOString();

        const { data: student, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', id)
            .eq('role', 'student')
            .select()
            .single();

        if (error) {
            console.error('Student update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        return NextResponse.json({ student });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/students/[id] - 학생 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createClient();
        const { id } = await params;

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id)
            .eq('role', 'student');

        if (error) {
            console.error('Student deletion error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'Student deleted successfully' });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
