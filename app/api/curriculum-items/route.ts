import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// GET /api/curriculum-items - 특정 커리큘럼의 항목 조회
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const { searchParams } = new URL(request.url);
        const curriculumId = searchParams.get('curriculum_id');

        if (!curriculumId) {
            return NextResponse.json(
                { error: 'curriculum_id is required' },
                { status: 400 }
            );
        }

        const { data: items, error } = await supabase
            .from('curriculum_items')
            .select('*')
            .eq('curriculum_id', curriculumId)
            .order('sequence', { ascending: true });

        if (error) {
            console.error('Curriculum items fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ items });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/curriculum-items - 학습 항목 생성
export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const body = await request.json();
        const {
            curriculum_id,
            type,
            title,
            daily_amount_type,
            daily_word_count,
            daily_section_amount,
            section_start,
            time_limit_seconds,
            passing_score,
            item_id,
            order_index,
        } = body;

        if (!curriculum_id || !type || !title) {
            return NextResponse.json(
                { error: 'curriculum_id, type, and title are required' },
                { status: 400 }
            );
        }

        const { data: item, error } = await supabase
            .from('curriculum_items')
            .insert({
                curriculum_id,
                item_type: type,
                title,
                item_id,
                daily_amount_type,
                daily_word_count,
                daily_section_amount,
                section_start,
                time_limit_seconds,
                passing_score,
                sequence: order_index || 0,
            })
            .select()
            .single();

        if (error) {
            console.error('Curriculum item creation error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ item }, { status: 201 });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
