-- student_curriculums 테이블에 누락된 컬럼 추가
-- status: 커리큘럼 상태 (active, paused, completed 등)
-- class_days: 수업 요일 (예: "월,수,금")

-- status 컬럼 추가
ALTER TABLE student_curriculums
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed'));

-- class_days 컬럼 추가 (study_days의 대안으로 문자열 형태)
ALTER TABLE student_curriculums
ADD COLUMN IF NOT EXISTS class_days TEXT;

-- 확인을 위한 테이블 구조 조회
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'student_curriculums';
