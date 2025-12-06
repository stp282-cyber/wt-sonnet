import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// GET /api/classes - 반 목록 조회
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const { searchParams } = new URL(request.url);
        const academyId = searchParams.get('academy_id');

        let query = supabase
            .from('classes')
            .select(`
                id,
                name,
                academy_id,
                created_at
            `)
            .order('name', { ascending: true });

        if (academyId) {
            query = query.eq('academy_id', academyId);
        }

        const { data: classes, error } = await query;

        if (error) {
            console.error('Classes fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ classes: classes || [] });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/classes - 반 생성
export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const body = await request.json();
        const { name, academy_id } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Class name is required' },
                { status: 400 }
            );
        }

        const { data: newClass, error } = await supabase
            .from('classes')
            .insert({
                name,
                academy_id,
            })
            .select()
            .single();

        if (error) {
            console.error('Class creation error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ class: newClass }, { status: 201 });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
