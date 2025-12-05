// 데이터베이스 타입 정의

export type UserRole = 'super_admin' | 'teacher' | 'student';
export type UserStatus = 'active' | 'on_break';
export type TestType = 'typing' | 'scramble' | 'multiple_choice';
export type ItemType = 'wordbook' | 'listening';
export type AudioSource = 'online' | 'tts' | 'storage';
export type StudyLogStatus = 'pending' | 'in_progress' | 'completed' | 'deleted';
export type TestPhase =
    | 'learning'
    | 'main_test'
    | 'wrong_learning'
    | 'wrong_test'
    | 'review_test'
    | 'review_wrong_learning'
    | 'review_wrong_test';
export type TargetType = 'all' | 'class';
export type TransactionType = 'study_completion' | 'game_reward' | 'manual_add' | 'manual_subtract';

// 학원
export interface Academy {
    id: string;
    name: string;
    logo_url?: string;
    footer_content?: string;
    dollar_per_completion: number;
    dollar_per_game: number;
    created_at: string;
    updated_at: string;
}

// 반
export interface Class {
    id: string;
    academy_id: string;
    name: string;
    created_at: string;
}

// 사용자
export interface User {
    id: string;
    academy_id: string;
    username: string;
    email?: string;
    password_hash: string;
    full_name: string;
    role: UserRole;
    status: UserStatus;
    class_id?: string;
    dollars: number;
    created_at: string;
    updated_at: string;
}

// 단어 (JSONB 내부 구조)
export interface Word {
    no: number;
    english: string;
    korean: string;
}

// 단어장
export interface Wordbook {
    id: string;
    academy_id: string;
    title: string;
    is_shared: boolean;
    word_count: number;
    created_at: string;
    updated_at: string;
}

// 단어장 섹션
export interface WordbookSection {
    id: string;
    wordbook_id: string;
    major_unit?: string;
    minor_unit?: string;
    unit_name?: string;
    words: Word[];
    created_at: string;
    updated_at: string;
}

// 듣기 시험
export interface ListeningTest {
    id: string;
    academy_id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

// 듣기 문제
export interface ListeningQuestion {
    id: string;
    listening_test_id: string;
    major_unit?: string;
    minor_unit?: string;
    question_no: number;
    question_text: string;
    audio_source: AudioSource;
    audio_url?: string;
    choices: string[];
    correct_answer: number;
    script: string;
    created_at: string;
}

// 커리큘럼
export interface Curriculum {
    id: string;
    academy_id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

// 커리큘럼 항목
export interface CurriculumItem {
    id: string;
    curriculum_id: string;
    sequence: number;
    item_type: ItemType;
    item_id: string;
    test_type?: TestType;
    daily_amount?: number;
    word_count?: number;
    time_limit_seconds: number;
    passing_score: number;
    created_at: string;
}

// 학생 커리큘럼
export interface StudentCurriculum {
    id: string;
    student_id: string;
    curriculum_id: string;
    current_item_id?: string;
    current_progress: number;
    study_days: string[];
    breaks: { start: string; end: string }[];
    start_date?: string;
    created_at: string;
    updated_at: string;
}

// 학습 기록
export interface StudyLog {
    id: string;
    student_id: string;
    curriculum_id?: string;
    curriculum_item_id?: string;
    scheduled_date: string;
    completed_at?: string;
    status: StudyLogStatus;
    test_phase?: TestPhase;
    score?: number;
    wrong_answers?: any;
    test_data?: any;
    created_at: string;
    updated_at: string;
}

// 공지사항
export interface Notice {
    id: string;
    academy_id: string;
    title: string;
    content: string;
    target_type: TargetType;
    target_class_id?: string;
    start_date?: string;
    end_date?: string;
    is_permanent: boolean;
    created_at: string;
    updated_at: string;
}

// 쪽지
export interface Message {
    id: string;
    sender_id: string;
    recipient_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
}

// 달러 거래
export interface DollarTransaction {
    id: string;
    student_id: string;
    amount: number;
    transaction_type: TransactionType;
    description?: string;
    created_at: string;
}

// API 응답 타입
export interface ApiResponse<T> {
    data?: T;
    error?: string;
}

// 로그인 요청
export interface LoginRequest {
    username: string;
    password: string;
}

// 로그인 응답
export interface LoginResponse {
    user: User;
    token: string;
}
