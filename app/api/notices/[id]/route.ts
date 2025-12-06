import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// PUT /api/notices/[id] - 공지사항 수정
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createClient();
        const { id } = await params;
        const body = await request.json();

        const { error } = await supabase
            .from('notices')
            .update({
                ...body,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) {
            console.error('Notice update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const { data: notice } = await supabase
            .from('notices')
            .select('*')
            .eq('id', id)
            .single();

        return NextResponse.json({ notice });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/notices/[id] - 공지사항 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createClient();
        const { id } = await params;

        const { error } = await supabase
            .from('notices')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Notice deletion error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'Notice deleted successfully' });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
