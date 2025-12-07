
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = createClient();

    // Just list the specific user we found
    const { data: curriculums } = await supabase
        .from('student_curriculums')
        .select('*, curriculums(name)')
        .eq('student_id', '4ea05736-a6ec-49e9-8d43-6e09bd4f6c3c'); // Hardcoded ID of test2

    return NextResponse.json({ curriculums });
}

export async function POST() {
    const supabase = createClient();
    // Fix item with NULL item_type
    // We target items where item_type is NULL. 
    // And ideally we check if they are "Listening" type by title or structure, but for now assuming "items with null type" are likely the broken listening ones or broken ones.
    // The broken item had title "듣기" (Curriculum name) ? No, item title was likely "Test 1" or something.
    // Let's just update ALL null item_types to 'listening' if title contains 'listening' or just simply update the specific ID found earlier: 1a34fd3d-b837-40a1-8723-09ee8a2bf6c1

    const { data: items, error } = await supabase
        .from('curriculum_items')
        .update({ item_type: 'listening' })
        .eq('id', '1a34fd3d-b837-40a1-8723-09ee8a2bf6c1')
        .select();

    return NextResponse.json({ updated: items, error });
}
