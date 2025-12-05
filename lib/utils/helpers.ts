/**
 * 타이핑 시험 채점을 위한 답안 정규화 함수
 * - 소문자로 변환
 * - 특수문자 제거
 * - 띄어쓰기 제거
 * - 괄호 제거
 */
export function normalizeAnswer(answer: string): string {
    return answer
        .toLowerCase()
        .replace(/[^\w\s가-힣]/g, '') // 특수문자 제거 (한글 유지)
        .replace(/\s+/g, '') // 띄어쓰기 제거
        .replace(/[()]/g, ''); // 괄호 제거
}

/**
 * 사용자 답안과 정답을 비교하여 채점
 */
export function gradeAnswer(userAnswer: string, correctAnswer: string): boolean {
    return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
}

/**
 * 배열을 무작위로 섞기 (Fisher-Yates shuffle)
 */
export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * 한글 이름을 내부 이메일 형식으로 변환
 * 예: "홍길동" -> "홍길동@academy.local"
 */
export function nameToEmail(name: string): string {
    return `${name}@academy.local`;
}

/**
 * 내부 이메일에서 이름 추출
 * 예: "홍길동@academy.local" -> "홍길동"
 */
export function emailToName(email: string): string {
    return email.split('@')[0];
}

/**
 * 날짜를 한국 시간대로 포맷팅
 */
export function formatKoreanDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Seoul',
    }).format(d);
}

/**
 * 날짜를 한국 시간대로 포맷팅 (시간 포함)
 */
export function formatKoreanDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Seoul',
    }).format(d);
}

/**
 * 요일 문자열을 한글로 변환
 */
export function getDayName(day: string): string {
    const dayMap: Record<string, string> = {
        mon: '월',
        tue: '화',
        wed: '수',
        thu: '목',
        fri: '금',
        sat: '토',
        sun: '일',
    };
    return dayMap[day] || day;
}

/**
 * 복사/붙여넣기 방지 이벤트 핸들러
 */
export function preventCopyPaste(e: ClipboardEvent) {
    e.preventDefault();
    return false;
}

/**
 * 우클릭 방지 이벤트 핸들러
 */
export function preventContextMenu(e: MouseEvent) {
    e.preventDefault();
    return false;
}
