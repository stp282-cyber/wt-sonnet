import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// GET /api/notices - 공지사항 목록 조회
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const { searchParams } = new URL(request.url);
        const classId = searchParams.get('class_id');

        let query = supabase
            .from('notices')
            .select('*')
            .order('created_at', { ascending: false });

        // 반별 필터링
        if (classId) {
            query = query.or(`target_class_id.eq.${classId},target_type.eq.all`);
        }

        const { data: notices, error } = await query;

        if (error) {
            console.error('Notices fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ notices: notices || [] });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/notices - 공지사항 생성
export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const body = await request.json();
        const { title, content, target_type, target_class_id, start_date, end_date, is_permanent, academy_id } = body;

        if (!title || !content) {
            return NextResponse.json(
                { error: 'Title and content are required' },
                { status: 400 }
            );
        }

        const { data: notice, error } = await supabase
            .from('notices')
            .insert({
                title,
                content,
                target_type: target_type || 'all',
                target_class_id,
                start_date,
                end_date,
                is_permanent: is_permanent || false,
                academy_id: academy_id || '00000000-0000-0000-0000-000000000000',
            })
            .select()
            .single();

        if (error) {
            console.error('Notice creation error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ notice }, { status: 201 });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
