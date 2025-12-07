import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createClient();
        const { id } = await params;
        const body = await request.json();
        const { study_days, breaks } = body;

        const updateData: any = { updated_at: new Date().toISOString() };
        if (study_days !== undefined) updateData.study_days = study_days;
        if (breaks !== undefined) updateData.breaks = breaks;

        const { data, error } = await supabase
            .from('student_curriculums')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating schedule:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
