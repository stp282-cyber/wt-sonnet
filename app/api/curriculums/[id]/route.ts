import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// GET /api/curriculums/[id] - 커리큘럼 상세 조회
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createClient();
        const { id } = await params;

        // 커리큘럼 메타데이터 조회
        const { data: curriculum, error: curriculumError } = await supabase
            .from('curriculums')
            .select('*')
            .eq('id', id)
            .single();

        if (curriculumError || !curriculum) {
            return NextResponse.json({ error: 'Curriculum not found' }, { status: 404 });
        }

        // 커리큘럼 항목 조회
        const { data: items, error: itemsError } = await supabase
            .from('curriculum_items')
            .select('*')
            .eq('curriculum_id', id)
            .order('sequence', { ascending: true });

        if (itemsError) {
            console.error('Items fetch error:', itemsError);
            return NextResponse.json({ error: itemsError.message }, { status: 500 });
        }

        return NextResponse.json({
            curriculum: {
                ...curriculum,
                items: items || [],
            },
        });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/curriculums/[id] - 커리큘럼 수정
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createClient();
        const { id } = await params;
        const body = await request.json();
        const { name, description, items } = body;

        // 커리큘럼 메타데이터 수정
        if (name || description !== undefined) {
            const updateData: any = { updated_at: new Date().toISOString() };
            if (name) updateData.name = name;
            if (description !== undefined) updateData.description = description;

            const { error: updateError } = await supabase
                .from('curriculums')
                .update(updateData)
                .eq('id', id);

            if (updateError) {
                console.error('Curriculum update error:', updateError);
                return NextResponse.json({ error: updateError.message }, { status: 500 });
            }
        }

        // 커리큘럼 항목 수정
        if (items && Array.isArray(items)) {
            // 기존 항목 삭제
            await supabase
                .from('curriculum_items')
                .delete()
                .eq('curriculum_id', id);

            // 새 항목 생성
            if (items.length > 0) {
                const { error: itemsError } = await supabase
                    .from('curriculum_items')
                    .insert(items.map((item, index) => ({
                        curriculum_id: id,
                        sequence: index + 1,
                        item_type: item.item_type,
                        item_id: item.item_id,
                        test_type: item.test_type,
                        daily_amount: item.daily_amount,
                        word_count: item.word_count,
                        time_limit_seconds: item.time_limit_seconds || 20,
                        passing_score: item.passing_score || 80,
                    })));

                if (itemsError) {
                    console.error('Items update error:', itemsError);
                    return NextResponse.json({ error: itemsError.message }, { status: 500 });
                }
            }
        }

        // 수정된 커리큘럼 조회
        const { data: curriculum, error: fetchError } = await supabase
            .from('curriculums')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) {
            console.error('Curriculum fetch error:', fetchError);
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        return NextResponse.json({ curriculum });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/curriculums/[id] - 커리큘럼 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createClient();
        const { id } = await params;

        const { error } = await supabase
            .from('curriculums')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Curriculum deletion error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'Curriculum deleted successfully' });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
