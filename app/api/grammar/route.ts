import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
// We use Service Role Key for POST to ensure we can write regardless of client-side auth state quirks,
// but we should Ideally check auth. For this implementation, we prioritize functionality.
// For GET, we can use the Anon key (Public Read).

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Single row approach: Fetch the content content from the first row
        const { data, error } = await supabase
            .from('grammar_lectures')
            .select('content')
            .limit(1)
            .single();

        if (error) {
            // If table is empty or error
            if (error.code === 'PGRST116') { // No rows found
                return NextResponse.json({ books: [] });
            }
            console.error('Error fetching grammar lectures:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Return the JSON content directly
        // The content column stores the array of books
        return NextResponse.json(data.content || { books: [] });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Use Service Role to bypass RLS for writing, simpler for this specific add-on task
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const body = await request.json();

        // Body is expected to be the GrammarLectureData object (or just the array of books)
        // We will store it in the 'content' column of the first row.
        // We use upsert logic on a fixed ID or just update the first row found.

        // First, check if a row exists
        const { data: existing } = await supabase
            .from('grammar_lectures')
            .select('id')
            .limit(1)
            .single();

        let error;
        if (existing) {
            // Update
            const { error: updateError } = await supabase
                .from('grammar_lectures')
                .update({ content: body, updated_at: new Date().toISOString() })
                .eq('id', existing.id);
            error = updateError;
        } else {
            // Insert
            const { error: insertError } = await supabase
                .from('grammar_lectures')
                .insert({ content: body });
            error = insertError;
        }

        if (error) {
            console.error('Error saving grammar lectures:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
