// 달러 관리 유틸리티 함수
export interface DollarTransaction {
    id: string;
    student_id: string;
    amount: number;
    reason: string;
    transaction_type: 'study_completion' | 'bonus' | 'manual';
    created_at: string;
}

// 달러 지급 규칙
export const DOLLAR_REWARDS = {
    FLASHCARD_COMPLETE: 5,
    TYPING_TEST_PASS: 10,
    PERFECT_SCORE: 20, // 오답 0개
    REVIEW_TEST_PASS: 10,
};

// 달러 지급 함수
export function awardDollars(
    studentId: string,
    amount: number,
    reason: string,
    type: 'study_completion' | 'bonus' | 'manual' = 'study_completion'
): DollarTransaction {
    const transaction: DollarTransaction = {
        id: Date.now().toString(),
        student_id: studentId,
        amount,
        reason,
        transaction_type: type,
        created_at: new Date().toISOString(),
    };

    // localStorage에 저장
    const transactions = getDollarTransactions(studentId);
    transactions.push(transaction);
    localStorage.setItem(`dollars_${studentId}`, JSON.stringify(transactions));

    // 총 달러 업데이트
    const totalDollars = getTotalDollars(studentId);
    localStorage.setItem(`total_dollars_${studentId}`, totalDollars.toString());

    return transaction;
}

// 학생별 달러 거래 내역 조회
export function getDollarTransactions(studentId: string): DollarTransaction[] {
    const data = localStorage.getItem(`dollars_${studentId}`);
    return data ? JSON.parse(data) : [];
}

// 학생별 총 달러 조회
export function getTotalDollars(studentId: string): number {
    const transactions = getDollarTransactions(studentId);
    return transactions.reduce((total, t) => total + t.amount, 0);
}

// 최근 달러 내역 조회 (최대 N개)
export function getRecentDollarTransactions(
    studentId: string,
    limit: number = 5
): DollarTransaction[] {
    const transactions = getDollarTransactions(studentId);
    return transactions
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
}

// 이번 주 획득 달러 조회
export function getWeeklyDollars(studentId: string): number {
    const transactions = getDollarTransactions(studentId);
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    weekStart.setHours(0, 0, 0, 0);

    return transactions
        .filter((t) => new Date(t.created_at) >= weekStart)
        .reduce((total, t) => total + t.amount, 0);
}
