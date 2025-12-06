import { createClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const { searchParams } = new URL(request.url);
        const wordbookId = searchParams.get('wordbook_id');

        if (!wordbookId) {
            return NextResponse.json({ error: 'wordbook_id required' }, { status: 400 });
        }

        // 단어장 정보
        const { data: wordbook } = await supabase
            .from('wordbooks')
            .select('*')
            .eq('id', wordbookId)
            .single();

        // sections 조회
        const { data: sections, error: sectionsError } = await supabase
            .from('wordbook_sections')
            .select('*')
            .eq('wordbook_id', wordbookId);

        return NextResponse.json({
            wordbook,
            sections,
            sectionsCount: sections?.length || 0,
            sectionsError,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
