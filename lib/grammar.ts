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

        // 1. Try to use the optimized RPC function first
        // Note: We couldn't create the RPC due to permission issues in the previous step,
        // but if it existed/gets created, this would be the best path.
        // For now, we will use the same logic as the API route but executed directly on the server.

        /* 
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_grammar_titles');
        if (!rpcError && rpcData) {
            return rpcData;
        } 
        */

        // 2. Fallback: Fetch JSON and parse (Server-side)
        // Since this runs on the server (Next.js), it avoids the network round-trip of an internal API call.
        const { data, error } = await supabase
            .from('grammar_lectures')
            .select('content')
            .limit(1)
            .single();

        if (error) {
            console.error('Error fetching grammar lectures:', error);
            return [];
        }

        const content = data?.content || {};
        // Handle potentially different JSON structures
        const books = Array.isArray(content) ? content : (content.books || []);

        // Map to essential fields
        return books.map((book: any) => ({
            id: book.id,
            title: book.title,
            description: book.description || ''
        }));

    } catch (error) {
        console.error('Unexpected error in getGrammarTitles:', error);
        return [];
    }
}
