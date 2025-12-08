import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// GET /api/notices - 공지사항 목록 조회
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const { searchParams } = new URL(request.url);
        const academyId = searchParams.get('academy_id');
        const classId = searchParams.get('class_id');

        let query = supabase
            .from('notices')
            .select('*')
            .order('created_at', { ascending: false });

        if (academyId) {
            query = query.eq('academy_id', academyId);
        }

        // 반별 필터링
        if (classId) {
            query = query.or(`target_class_id.eq.${classId},target_type.eq.all`);
        }

        // 유효 기간 필터링 (active_only=true 인 경우)
        if (searchParams.get('active_only') === 'true') {
            const today = new Date().toISOString().split('T')[0];
            // start_date is null or <= today AND (end_date is null or >= today)
            // supabase doesn't have complex grouping in JS client easily without rpc or raw string building sometimes, 
            // but we can try generic filtering.
            // Actually, for simplicity with "or" logic mixing (is_permanent), it's easiest to filter in memory if list is small, 
            // OR use precise query.
            // Let's assume is_permanent means end_date is ignored.

            // Logic: (is_permanent = true) OR (end_date >= today OR end_date is null)
            // AND (start_date <= today OR start_date is null)

            // Allow start_date <= today (or null)
            query = query.or(`start_date.lte.${today},start_date.is.null`);

            // Allow is_permanent=true OR end_date >= today OR end_date is null
            query = query.or(`is_permanent.eq.true,end_date.gte.${today},end_date.is.null`);
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
