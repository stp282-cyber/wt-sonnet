-- 영어 단어 시험 사이트 데이터베이스 스키마
-- Supabase PostgreSQL

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

-- 5. 단어장 섹션 (JSONB로 단어 저장 - 최적화)
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

-- words JSONB 구조 예시:
-- [
--   {"no": 1, "english": "apple", "korean": "사과"},
--   {"no": 2, "english": "banana", "korean": "바나나"}
-- ]

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

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_academy ON users(academy_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_wordbooks_academy ON wordbooks(academy_id);
CREATE INDEX IF NOT EXISTS idx_wordbook_sections_wordbook ON wordbook_sections(wordbook_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_items_curriculum ON curriculum_items(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_student_curriculums_student ON student_curriculums(student_id);
CREATE INDEX IF NOT EXISTS idx_study_logs_student ON study_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_study_logs_date ON study_logs(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_notices_academy ON notices(academy_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);

-- Row Level Security (RLS) 활성화
ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wordbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE wordbook_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE listening_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE listening_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculums ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_curriculums ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dollar_transactions ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (기본 정책 - 나중에 세부 조정 필요)
-- 사용자는 자신의 학원 데이터만 볼 수 있음

CREATE POLICY "Users can view their academy" ON academies
  FOR SELECT USING (
    id IN (SELECT academy_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can view their academy's classes" ON classes
  FOR SELECT USING (
    academy_id IN (SELECT academy_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can view their academy's users" ON users
  FOR SELECT USING (
    academy_id IN (SELECT academy_id FROM users WHERE id = auth.uid())
  );

-- 업데이트 트리거 (updated_at 자동 갱신)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_academies_updated_at BEFORE UPDATE ON academies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wordbooks_updated_at BEFORE UPDATE ON wordbooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_curriculums_updated_at BEFORE UPDATE ON curriculums
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_curriculums_updated_at BEFORE UPDATE ON student_curriculums
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_logs_updated_at BEFORE UPDATE ON study_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notices_updated_at BEFORE UPDATE ON notices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
