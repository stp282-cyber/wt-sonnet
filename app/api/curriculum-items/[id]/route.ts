import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// PUT /api/curriculum-items/[id] - 학습 항목 수정
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();
        const body = await request.json();
        const {
            type,
            title,
            daily_amount_type,
            daily_word_count,
            daily_section_amount,
            section_start,
            time_limit_seconds,
            passing_score,
        } = body;

        const { data: item, error } = await supabase
            .from('curriculum_items')
            .update({
                type,
                title,
                daily_amount_type,
                daily_word_count,
                daily_section_amount,
                section_start,
                time_limit_seconds,
                passing_score,
            })
            .eq('id', params.id)
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
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();

        const { error } = await supabase
            .from('curriculum_items')
            .delete()
            .eq('id', params.id);

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
