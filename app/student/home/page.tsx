import { getGrammarTitles } from '@/lib/grammar';
import HomeDashboard from './HomeDashboard';

// Server Component (Async)
export default async function StudentHomePage() {
    // Fetch books directly on the server
    const books = await getGrammarTitles();

    return <HomeDashboard books={books} />;
}

