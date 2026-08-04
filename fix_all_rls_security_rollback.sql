-- ====================================================================
-- [비상 롤백 스크립트] Public 테이블 RLS 비활성화 및 이전 상태 원복
-- ====================================================================
-- 목적: fix_all_rls_security.sql 적용 후 비상 상황 발생 시 1초 만에 100% 원래 상태로 원복
-- 실행 방법: Supabase Dashboard -> SQL Editor에서 실행(Run)

ALTER TABLE academies DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE wordbooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE wordbook_sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE listening_tests DISABLE ROW LEVEL SECURITY;
ALTER TABLE listening_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE curriculums DISABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_curriculums DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE notices DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE dollar_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS test_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS grammar_lectures DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lecture_books DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow All Academies" ON academies;
DROP POLICY IF EXISTS "Allow All Classes" ON classes;
DROP POLICY IF EXISTS "Allow All Users" ON users;
DROP POLICY IF EXISTS "Allow All Wordbooks" ON wordbooks;
DROP POLICY IF EXISTS "Allow All Wordbook Sections" ON wordbook_sections;
DROP POLICY IF EXISTS "Allow All Listening Tests" ON listening_tests;
DROP POLICY IF EXISTS "Allow All Listening Questions" ON listening_questions;
DROP POLICY IF EXISTS "Allow All Curriculums" ON curriculums;
DROP POLICY IF EXISTS "Allow All Curriculum Items" ON curriculum_items;
DROP POLICY IF EXISTS "Allow All Student Curriculums" ON student_curriculums;
DROP POLICY IF EXISTS "Allow All Study Logs" ON study_logs;
DROP POLICY IF EXISTS "Allow All Notices" ON notices;
DROP POLICY IF EXISTS "Allow All Messages" ON messages;
DROP POLICY IF EXISTS "Allow All Dollar Transactions" ON dollar_transactions;
DROP POLICY IF EXISTS "Allow All Test Sessions" ON test_sessions;
DROP POLICY IF EXISTS "Allow All Grammar Lectures" ON grammar_lectures;
DROP POLICY IF EXISTS "Allow All Lecture Books" ON lecture_books;

SELECT 
    tablename, 
    rowsecurity AS rls_enabled 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
