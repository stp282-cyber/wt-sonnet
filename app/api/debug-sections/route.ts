
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const wordbookId = searchParams.get('wordbook_id');

        let query = supabase
            .from('wordbook_sections')
            .select('*');

        if (wordbookId) {
            query = query.eq('wordbook_id', wordbookId);
        } else {
            query = query.limit(5);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Return summary of sections and first 5 words of the first section to check structure
        const summary = data?.map(s => ({
            id: s.id,
            major: s.major_unit,
            minor: s.minor_unit,
            name: s.unit_name,
            word_count: s.words?.length,
            first_word_sample: s.words ? s.words.slice(0, 3) : []
        }));

        return NextResponse.json({
            count: data?.length,
            sections: summary
        });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
