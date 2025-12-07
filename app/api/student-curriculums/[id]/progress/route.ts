import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { current_item_id, current_progress, start_date } = body;

        // update 객체 동적 생성
        const updateData: any = {
            current_item_id,
            current_progress,
            updated_at: new Date().toISOString()
        };
        if (start_date) updateData.start_date = start_date;

        // 관리자 권한으로 업데이트 (RLS 우회)
        const { data, error } = await supabaseAdmin
            .from('student_curriculums')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating progress:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
