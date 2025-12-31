import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Fetch just the metadata for the list
        const { data, error } = await supabase
            .from('lecture_books')
            .select('id, title, is_visible, sequence')
            .order('sequence', { ascending: true });

        if (error) {
            console.error('Error fetching books:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const body = await request.json();

        // Expects { id, title, is_visible, content, sequence }
        // For a new book
        const { id, title, content, is_visible, sequence } = body;

        const { error } = await supabase
            .from('lecture_books')
            .insert({
                id,
                title,
                content: content || { chapters: [] },
                is_visible: is_visible ?? true,
                sequence: sequence ?? 0
            });

        if (error) {
            console.error('Error creating book:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
