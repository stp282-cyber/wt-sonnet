-- ==========================================
-- [긴급 수정] Wordbooks RLS 정책 추가
-- ==========================================
-- 단어장 업로드 시 "new row violates row-level security policy" 오류 해결
-- Supabase SQL Editor에서 실행하세요.

-- 1. wordbooks 테이블 RLS 정책 추가
ALTER TABLE wordbooks ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "Allow All Wordbooks" ON wordbooks;

-- 모든 작업 허용 정책 (개발용)
CREATE POLICY "Allow All Wordbooks" ON wordbooks FOR ALL USING (true);

-- 2. wordbook_sections 테이블 RLS 정책 추가
ALTER TABLE wordbook_sections ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "Allow All Wordbook Sections" ON wordbook_sections;

-- 모든 작업 허용 정책 (개발용)
CREATE POLICY "Allow All Wordbook Sections" ON wordbook_sections FOR ALL USING (true);

-- 3. 기타 테이블들도 RLS 정책 추가 (누락된 테이블들)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Classes" ON classes;
CREATE POLICY "Allow All Classes" ON classes FOR ALL USING (true);

ALTER TABLE curriculums ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Curriculums" ON curriculums;
CREATE POLICY "Allow All Curriculums" ON curriculums FOR ALL USING (true);

ALTER TABLE curriculum_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Curriculum Items" ON curriculum_items;
CREATE POLICY "Allow All Curriculum Items" ON curriculum_items FOR ALL USING (true);

ALTER TABLE student_curriculums ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Student Curriculums" ON student_curriculums;
CREATE POLICY "Allow All Student Curriculums" ON student_curriculums FOR ALL USING (true);

ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Study Logs" ON study_logs;
CREATE POLICY "Allow All Study Logs" ON study_logs FOR ALL USING (true);

ALTER TABLE listening_tests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Listening Tests" ON listening_tests;
CREATE POLICY "Allow All Listening Tests" ON listening_tests FOR ALL USING (true);

ALTER TABLE listening_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Listening Questions" ON listening_questions;
CREATE POLICY "Allow All Listening Questions" ON listening_questions FOR ALL USING (true);

ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Notices" ON notices;
CREATE POLICY "Allow All Notices" ON notices FOR ALL USING (true);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Messages" ON messages;
CREATE POLICY "Allow All Messages" ON messages FOR ALL USING (true);

ALTER TABLE dollar_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Dollar Transactions" ON dollar_transactions;
CREATE POLICY "Allow All Dollar Transactions" ON dollar_transactions FOR ALL USING (true);

-- 4. 결과 확인
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
