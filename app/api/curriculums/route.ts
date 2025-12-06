import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// GET /api/curriculums - 커리큘럼 목록 조회
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();

        const { data: curriculums, error } = await supabase
            .from('curriculums')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Curriculums fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 각 커리큘럼의 항목 수 조회
        const curriculumsWithCount = await Promise.all(
            (curriculums || []).map(async (curriculum) => {
                const { count } = await supabase
                    .from('curriculum_items')
                    .select('*', { count: 'exact', head: true })
                    .eq('curriculum_id', curriculum.id);

                return {
                    ...curriculum,
                    item_count: count || 0,
                };
            })
        );

        return NextResponse.json({ curriculums: curriculumsWithCount });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/curriculums - 커리큘럼 생성
export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const body = await request.json();
        const { name, description, academy_id } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        const { data: curriculum, error } = await supabase
            .from('curriculums')
            .insert({
                name,
                description,
                academy_id: academy_id || '00000000-0000-0000-0000-000000000000',
            })
            .select()
            .single();

        if (error) {
            console.error('Curriculum creation error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ curriculum }, { status: 201 });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
