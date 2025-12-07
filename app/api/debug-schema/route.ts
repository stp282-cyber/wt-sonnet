
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = createClient();

    // Check study_records
    const { count: recordsCount, error: recordsError } = await supabase
        .from('study_records')
        .select('*', { count: 'exact', head: true });

    // Check study_logs
    const { count: logsCount, error: logsError } = await supabase
        .from('study_logs')
        .select('*', { count: 'exact', head: true });

    return NextResponse.json({
        recordsCount,
        recordsError,
        logsCount,
        logsError
    });
}
