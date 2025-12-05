// 듣기 시험 API 호출 함수들
import { ListeningTest, ListeningQuestion } from '@/lib/types/database';

const API_BASE = '/api';

export interface ListeningTestWithQuestions extends ListeningTest {
    questions: ListeningQuestion[];
    question_count: number;
}

export async function fetchListeningTests(): Promise<ListeningTestWithQuestions[]> {
    const response = await fetch(`${API_BASE}/listening`);
    if (!response.ok) {
        throw new Error('Failed to fetch listening tests');
    }
    const data = await response.json();
    return data.listeningTests;
}

export async function fetchListeningTestById(id: string): Promise<ListeningTestWithQuestions> {
    const response = await fetch(`${API_BASE}/listening/${id}`);
    if (!response.ok) {
        throw new Error('Failed to fetch listening test');
    }
    const data = await response.json();
    return data.listeningTest;
}

export async function createListeningTest(
    title: string,
    questions: Omit<ListeningQuestion, 'id' | 'listening_test_id' | 'created_at'>[]
): Promise<ListeningTestWithQuestions> {
    const response = await fetch(`${API_BASE}/listening`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, questions }),
    });

    if (!response.ok) {
        throw new Error('Failed to create listening test');
    }

    const data = await response.json();
    return data.listeningTest;
}

export async function deleteListeningTest(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/listening/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Failed to delete listening test');
    }
}
