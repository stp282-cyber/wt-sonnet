-- ==========================================
-- [긴급 수정] RLS 무한 루프 정책 해결 및 데이터 복구 스크립트
-- ==========================================
-- 로그인 시 "Database error" (코드: 42P17) 해결을 위해 실행해주세요.
-- Supabase SQL Editor에서 실행하세요.

-- 1. 문제되는 재귀 정책 삭제
DROP POLICY IF EXISTS "Users can view their academy's users" ON users;
DROP POLICY IF EXISTS "Users can view their academy" ON academies;
DROP POLICY IF EXISTS "Users can view their academy's classes" ON classes;

-- 2. 개발용 단순 정책 적용 (모두 허용)
-- users 테이블
DROP POLICY IF EXISTS "Allow All" ON users; 
CREATE POLICY "Allow All Users" ON users FOR ALL USING (true);

-- academies 테이블
DROP POLICY IF EXISTS "Allow All Academies" ON academies;
CREATE POLICY "Allow All Academies" ON academies FOR ALL USING (true);

-- classes 테이블
DROP POLICY IF EXISTS "Allow All Classes" ON classes;
CREATE POLICY "Allow All Classes" ON classes FOR ALL USING (true);

-- 3. 데이터가 없을 경우를 대비해 다시 삽입 (중복 시 무시)

-- 학원 생성
INSERT INTO academies (id, name)
VALUES ('00000000-0000-0000-0000-000000000000', 'Eastern Academy')
ON CONFLICT (id) DO NOTHING;

-- 테스트 사용자 생성
INSERT INTO users (academy_id, username, password_hash, full_name, role, status)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'teacher1', 'password123', 'Supreme Teacher', 'teacher', 'active'),
  ('00000000-0000-0000-0000-000000000000', 'student1', 'password123', 'Newbie Student', 'student', 'active')
ON CONFLICT (username) DO NOTHING;

-- 4. 결과 확인
SELECT username, role, full_name FROM users;
