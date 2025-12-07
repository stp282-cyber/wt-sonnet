import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const academyId = searchParams.get('academy_id');

        let query = supabase
            .from('users')
            .select('id, username, full_name, role');

        if (role) {
            query = query.eq('role', role);
        }

        if (academyId) {
            query = query.eq('academy_id', academyId);
        }

        const { data: users, error } = await query.order('full_name');

        if (error) {
            console.error('Users fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ users: users || [] });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
