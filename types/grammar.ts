export interface GrammarSection {
    id: string;
    title: string;
    youtubeUrl: string; // Supports both YouTube URLs and direct MP3 links
}

export interface GrammarChapter {
    id: string;
    title: string;
    sections: GrammarSection[];
}

export interface GrammarBook {
    id: string;
    title: string;
    chapters: GrammarChapter[];
    isVisible?: boolean;
    isExpanded?: boolean;
    isLoaded?: boolean; // Tracks if detailed content (chapters) has been fetched
}

export interface GrammarLectureData {
    books: GrammarBook[];
}
