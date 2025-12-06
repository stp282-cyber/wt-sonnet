import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET() {
    const supabase = createClient();

    // 1. Get all wordbooks
    const { data: wordbooks, error: wbError } = await supabase
        .from('wordbooks')
        .select('id, title');

    if (wbError) return NextResponse.json({ error: wbError }, { status: 500 });

    // 2. Get section counts for each wordbook
    const result = await Promise.all(wordbooks.map(async (wb) => {
        const { count, error } = await supabase
            .from('wordbook_sections')
            .select('*', { count: 'exact', head: true })
            .eq('wordbook_id', wb.id);

        return {
            wordbookIds: wb.id,
            title: wb.title,
            sectionCount: count,
            error: error?.message
        };
    }));

    // 3. Check curriculum items
    const { data: items } = await supabase.from('curriculum_items').select('*');

    return NextResponse.json({
        wordbooks: result,
        totalItems: items?.length,
        sampleItem: items?.[0]
    });
}
