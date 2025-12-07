-- Add setting_overrides column to student_curriculums table
ALTER TABLE student_curriculums 
ADD COLUMN IF NOT EXISTS setting_overrides JSONB;

-- Comment on column
COMMENT ON COLUMN student_curriculums.setting_overrides IS 'Stores student-specific learning setting overrides (passing_score, time_limit_seconds, etc.)';
