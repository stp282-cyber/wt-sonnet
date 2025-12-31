import { Suspense } from 'react';
import { Center, Loader } from '@mantine/core';
import { getGrammarTitles } from '@/lib/grammar';
import LecturesClient from './LecturesClient';
import { GrammarBook } from '@/types/grammar';

export const dynamic = 'force-dynamic'; // Force dynamic rendering to ensure fresh data

export default async function StudentGrammarPage() {
    // 1. Fetch data directly on the server (No API call overhead)
    const bookSummaries = await getGrammarTitles();

    // 2. Map to GrammarBook format expected by client
    // Initialize with empty chapters for lazy loading
    const initialBooks: GrammarBook[] = bookSummaries.map(b => ({
        id: b.id,
        title: b.title,
        chapters: [],
        isVisible: true,
        isExpanded: false,
        isLoaded: false
    }));

    return (
        <Suspense fallback={
            <Center style={{ height: '100vh' }}>
                <Loader color="blue" />
            </Center>
        }>
            <LecturesClient initialBooks={initialBooks} />
        </Suspense>
    );
}
