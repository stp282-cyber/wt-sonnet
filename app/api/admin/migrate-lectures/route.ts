import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Use Service Role Key for Admin access (bypass RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
    if (!supabaseServiceKey) {
        return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // 1. Fetch old data
        const { data: oldData, error: fetchError } = await supabase
            .from('grammar_lectures')
            .select('*')
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            return NextResponse.json({ error: `Failed to fetch old data: ${fetchError.message}` }, { status: 500 });
        }

        if (!oldData || !oldData.content) {
            return NextResponse.json({ message: 'No existing data to migrate.' });
        }

        // Normalize content (books array)
        let books = [];
        if (Array.isArray(oldData.content)) {
            books = oldData.content;
        } else if (oldData.content.books) {
            books = oldData.content.books;
        }

        if (books.length === 0) {
            return NextResponse.json({ message: 'No structure (books) found in content.' });
        }

        // 2. Prepare new data
        let successCount = 0;
        let failCount = 0;
        let errors = [];

        for (let i = 0; i < books.length; i++) {
            const book = books[i];

            // Extract Book Metadata
            const bookId = book.id || uuidv4();
            const bookTitle = book.title || 'Untitled Book';
            const isVisible = book.isVisible !== undefined ? book.isVisible : true;
            const sequence = i;

            // Extract Content (Chapters/Sections) related to this book
            // We store the 'internal structure' (chapters) into the 'content' column of the new table
            // But we must remove the 'books' wrapper. The 'content' of a row in lecture_books 
            // should probably match the structure expected by the frontend for a single book.
            // Based on current frontend, a book has `chapters`.
            // So we store { chapters: book.chapters } or just book.chapters?
            // To be consistent with the "Row-per-Book" plan:
            // "content" column will store the detailed JSON. 
            // Let's store the whole book object minus the extracted fields to be safe,
            // OR specifically { chapters: ... }.
            // Let's store { chapters: book.chapters } to keep it clean.
            const bookContent = {
                chapters: book.chapters || []
            };

            // 3. Insert into new table
            const { error: insertError } = await supabase
                .from('lecture_books')
                .upsert({
                    id: bookId,
                    title: bookTitle,
                    content: bookContent,
                    is_visible: isVisible,
                    sequence: sequence
                });

            if (insertError) {
                console.error(`Failed to migrate book ${bookTitle}:`, insertError);
                failCount++;
                errors.push({ book: bookTitle, error: insertError.message });
            } else {
                successCount++;
            }
        }

        return NextResponse.json({
            success: true,
            migrated: successCount,
            failed: failCount,
            errors: errors,
            total_found: books.length
        });

    } catch (error: any) {
        return NextResponse.json({ error: `Internal Error: ${error.message}` }, { status: 500 });
    }
}
