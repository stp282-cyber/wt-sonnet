import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// GET /api/tests/[id]/result - 시험 결과 조회
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createClient();
        const { id } = await params;

        const { data: studyLog, error } = await supabase
            .from('study_logs')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !studyLog) {
            return NextResponse.json({ error: 'Study log not found' }, { status: 404 });
        }

        return NextResponse.json({ result: studyLog });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
