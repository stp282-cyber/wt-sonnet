// API 호출 함수들
import { Wordbook, Word } from '@/lib/types/database';

const API_BASE = '/api';

export async function fetchWordbooks(): Promise<Wordbook[]> {
    const response = await fetch(`${API_BASE}/wordbooks`);
    if (!response.ok) {
        throw new Error('Failed to fetch wordbooks');
    }
    const data = await response.json();
    return data.wordbooks;
}

export async function fetchWordbookById(id: string): Promise<Wordbook> {
    const response = await fetch(`${API_BASE}/wordbooks/${id}`);
    if (!response.ok) {
        throw new Error('Failed to fetch wordbook');
    }
    const data = await response.json();
    return data.wordbook;
}

export async function createWordbook(title: string, words: Word[]): Promise<Wordbook> {
    const response = await fetch(`${API_BASE}/wordbooks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, words }),
    });

    if (!response.ok) {
        throw new Error('Failed to create wordbook');
    }

    const data = await response.json();
    return data.wordbook;
}

export async function deleteWordbook(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/wordbooks/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Failed to delete wordbook');
    }
}
