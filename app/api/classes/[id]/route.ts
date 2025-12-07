import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// GET /api/classes/[id] - 특정 반 조회
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createClient();
        const { id } = await params;

        const { data: classInfo, error } = await supabase
            .from('classes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }

        return NextResponse.json({ class: classInfo });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/classes/[id] - 반 수정
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createClient();
        const { id } = await params;
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Class name is required' },
                { status: 400 }
            );
        }

        const { data: updatedClass, error } = await supabase
            .from('classes')
            .update({ name })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ class: updatedClass });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/classes/[id] - 반 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createClient();
        const { id } = await params;

        // 해당 반에 학생이 있는지 확인
        const { data: students } = await supabase
            .from('users')
            .select('id')
            .eq('class_id', id)
            .eq('role', 'student');

        if (students && students.length > 0) {
            return NextResponse.json(
                { error: `Cannot delete class with ${students.length} students assigned` },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('classes')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'Class deleted successfully' });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
