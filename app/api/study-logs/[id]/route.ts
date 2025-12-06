import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// PUT /api/study-logs/[id] - 학습 기록 수정
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createClient();
        const { id } = await params;
        const body = await request.json();

        const { error } = await supabase
            .from('study_logs')
            .update({
                ...body,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) {
            console.error('Study log update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const { data: log } = await supabase
            .from('study_logs')
            .select('*')
            .eq('id', id)
            .single();

        return NextResponse.json({ log });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
