import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client (Server-side usage)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Define the shape of the book data we need
export interface GrammarBookSummary {
    id: string;
    title: string;
    description: string;
}

export async function getGrammarTitles(): Promise<GrammarBookSummary[]> {
    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        const { data, error } = await supabase
            .from('lecture_books')
            .select('id, title')
            .eq('is_visible', true)
            .order('sequence', { ascending: true });

        if (error) {
            console.error('Error fetching grammar lectures:', error);
            return [];
        }

        if (!data) return [];

        return data.map((book: any) => ({
            id: book.id,
            title: book.title,
            description: '' // Description is not currently in the table, defaulting to empty
        }));

    } catch (error) {
        console.error('Unexpected error in getGrammarTitles:', error);
        return [];
    }
}
