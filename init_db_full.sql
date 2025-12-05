-- ==========================================
-- [WordTest Academy] 전체 데이터베이스 초기화 스크립트
-- ==========================================
-- 이 스크립트는 테이블 생성과 테스트 데이터를 한 번에 처리합니다.
-- Supabase SQL Editor에 복사 -> 붙여넣기 -> 실행(Run) 하세요.

-- 1. 학원 테이블
CREATE TABLE IF NOT EXISTS academies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  footer_content TEXT,
  dollar_per_completion INTEGER DEFAULT 10,
  dollar_per_game INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 반 테이블
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 사용자 테이블 (선생님, 학생)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'teacher', 'student')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_break')),
  class_id UUID REFERENCES classes(id),
  dollars INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 단어장 메타데이터
CREATE TABLE IF NOT EXISTS wordbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_shared BOOLEAN DEFAULT FALSE,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 단어장 섹션
CREATE TABLE IF NOT EXISTS wordbook_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wordbook_id UUID REFERENCES wordbooks(id) ON DELETE CASCADE,
  major_unit TEXT,
  minor_unit TEXT,
  unit_name TEXT,
  words JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 듣기 시험 메타데이터
CREATE TABLE IF NOT EXISTS listening_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 듣기 문제
CREATE TABLE IF NOT EXISTS listening_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listening_test_id UUID REFERENCES listening_tests(id) ON DELETE CASCADE,
  major_unit TEXT,
  minor_unit TEXT,
  question_no INTEGER,
  question_text TEXT,
  audio_source TEXT CHECK (audio_source IN ('online', 'tts', 'storage')),
  audio_url TEXT,
  choices JSONB NOT NULL,
  correct_answer INTEGER,
  script TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 커리큘럼 템플릿
CREATE TABLE IF NOT EXISTS curriculums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. 커리큘럼 항목
CREATE TABLE IF NOT EXISTS curriculum_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_id UUID REFERENCES curriculums(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('wordbook', 'listening')),
  item_id UUID NOT NULL,
  test_type TEXT CHECK (test_type IN ('typing', 'scramble', 'multiple_choice')),
  daily_amount NUMERIC(3,1),
  word_count INTEGER,
  time_limit_seconds INTEGER DEFAULT 20,
  passing_score INTEGER DEFAULT 80,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. 학생별 커리큘럼 할당
CREATE TABLE IF NOT EXISTS student_curriculums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  curriculum_id UUID REFERENCES curriculums(id) ON DELETE CASCADE,
  current_item_id UUID REFERENCES curriculum_items(id),
  current_progress INTEGER DEFAULT 0,
  study_days JSONB DEFAULT '["mon","tue","wed","thu","fri"]',
  breaks JSONB DEFAULT '[]',
  start_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. 학습 기록
CREATE TABLE IF NOT EXISTS study_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  curriculum_id UUID REFERENCES curriculums(id),
  curriculum_item_id UUID REFERENCES curriculum_items(id),
  scheduled_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'deleted')),
  test_phase TEXT,
  score INTEGER,
  wrong_answers JSONB,
  test_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. 공지사항
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_type TEXT CHECK (target_type IN ('all', 'class')),
  target_class_id UUID REFERENCES classes(id),
  start_date DATE,
  end_date DATE,
  is_permanent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. 쪽지
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. 달러 거래 내역
CREATE TABLE IF NOT EXISTS dollar_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('study_completion', 'game_reward', 'manual_add', 'manual_subtract')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화 및 정책 (생략 - 필요 시 추가)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE academies ENABLE ROW LEVEL SECURITY;

-- 정책이 없으면 조회가 안될 수 있으므로 임시로 모두 허용 정책 추가 (개발용)
CREATE POLICY "Allow All" ON users FOR ALL USING (true);
CREATE POLICY "Allow All Academies" ON academies FOR ALL USING (true);

-- ==========================================
-- [데이터 삽입]
-- ==========================================

-- 1. 테스트용 학원 생성 (UUID 고정)
INSERT INTO academies (id, name)
VALUES ('00000000-0000-0000-0000-000000000000', 'Eastern Academy')
ON CONFLICT (id) DO NOTHING;

-- 2. 테스트용 사용자 생성
-- 선생님 (teacher1 / password123)
INSERT INTO users (academy_id, username, password_hash, full_name, role, status)
VALUES (
  '00000000-0000-0000-0000-000000000000', 
  'teacher1', 
  'password123', 
  'Supreme Teacher', 
  'teacher', 
  'active'
)
ON CONFLICT (username) DO NOTHING;

-- 학생 (student1 / password123)
INSERT INTO users (academy_id, username, password_hash, full_name, role, status)
VALUES (
  '00000000-0000-0000-0000-000000000000', 
  'student1', 
  'password123', 
  'Newbie Student', 
  'student', 
  'active'
)
ON CONFLICT (username) DO NOTHING;

-- 확인용 Select
SELECT username, role, full_name FROM users;
