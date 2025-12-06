import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// Force dynamic to ensure it runs on database
export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = createClient();

    // 1. Find the Wordbook 'Reading Tutor Junior 2'
    const { data: wordbooks, error: searchError } = await supabase
        .from('wordbooks')
        .select('id, title')
        .ilike('title', '%Reading Tutor%') // Trying English match first based on debugging logs
        .order('created_at', { ascending: false });

    if (!wordbooks || wordbooks.length === 0) {
        // Try Korean search if empty
        const { data: wordbooksKR } = await supabase
            .from('wordbooks')
            .select('id, title')
            .ilike('title', '%리딩튜터%')
            .order('created_at', { ascending: false });

        if (wordbooksKR && wordbooksKR.length > 0) {
            // Found in KR
            const targetWordbook = wordbooksKR[0];

            // 2. Update the corrupted curriculum_item
            const brokenItemId = '98ea2ef6-b54a-41ec-9a32-2a264763de8d';
            const { data: updateData, error: updateError } = await supabase
                .from('curriculum_items')
                .update({
                    item_type: 'wordbook',
                    item_id: targetWordbook.id
                })
                .eq('id', brokenItemId)
                .select();

            return NextResponse.json({
                status: 'Repaired with Korean title match',
                found_wordbook: targetWordbook,
                update_result: updateData,
                update_error: updateError
            });
        }

        return NextResponse.json({ status: 'Wordbook not found' });
    }

    // Found in English
    const targetWordbook = wordbooks[0];

    // 2. Update the corrupted curriculum_item
    const brokenItemId = '98ea2ef6-b54a-41ec-9a32-2a264763de8d';
    const { data: updateData, error: updateError } = await supabase
        .from('curriculum_items')
        .update({
            item_type: 'wordbook',
            item_id: targetWordbook.id
        })
        .eq('id', brokenItemId)
        .select();

    return NextResponse.json({
        status: 'Repaired with English title match',
        found_wordbook: targetWordbook,
        update_result: updateData,
        update_error: updateError
    });
}
