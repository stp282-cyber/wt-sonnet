import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// PUT /api/curriculum-items/[id] - 학습 항목 수정
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createClient();
        const { id } = await params;
        const body = await request.json();

        // 업데이트할 필드만 포함
        const updateData: any = {};

        if (body.type !== undefined) updateData.item_type = body.type;
        if (body.title !== undefined) updateData.title = body.title;
        if (body.daily_amount_type !== undefined) updateData.daily_amount_type = body.daily_amount_type;
        if (body.daily_word_count !== undefined) updateData.daily_word_count = body.daily_word_count;
        if (body.daily_section_amount !== undefined) updateData.daily_section_amount = body.daily_section_amount;
        if (body.section_start !== undefined) updateData.section_start = body.section_start;
        if (body.time_limit_seconds !== undefined) updateData.time_limit_seconds = body.time_limit_seconds;
        if (body.passing_score !== undefined) updateData.passing_score = body.passing_score;
        if (body.order_index !== undefined) updateData.sequence = body.order_index;
        if (body.sequence !== undefined) updateData.sequence = body.sequence;
        if (body.item_id !== undefined) updateData.item_id = body.item_id;

        const { data: item, error } = await supabase
            .from('curriculum_items')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Curriculum item update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ item });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/curriculum-items/[id] - 학습 항목 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createClient();
        const { id } = await params;

        const { error } = await supabase
            .from('curriculum_items')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Curriculum item deletion error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
