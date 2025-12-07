
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// POST: Save Session
export async function POST(req: NextRequest) {
    try {
        const supabase = createClient();
        const body = await req.json();
        const { studentId, sessionData } = body;

        if (!studentId || !sessionData) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('test_sessions')
            .upsert({
                student_id: studentId,
                session_data: sessionData,
                updated_at: new Date().toISOString()
            }, { onConflict: 'student_id' })
            .select()
            .single();

        if (error) {
            console.error('Error saving session:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, session: data });
    } catch (error) {
        console.error('Error saving session:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// GET: Load Session
export async function GET(req: NextRequest) {
    try {
        const supabase = createClient();
        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('test_sessions')
            .select('*')
            .eq('student_id', studentId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is 'Row not found' which is fine
            console.error('Error loading session:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ session: data || null });
    } catch (error) {
        console.error('Error loading session:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Clear Session
export async function DELETE(req: NextRequest) {
    try {
        const supabase = createClient();
        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });
        }

        const { error } = await supabase
            .from('test_sessions')
            .delete()
            .eq('student_id', studentId);

        if (error) {
            console.error('Error deleting session:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting session:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
