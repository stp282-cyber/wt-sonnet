-- 1. wordbook_sections 테이블에 word_count 컬럼 추가
-- 기존에 컬럼이 없을 때만 추가합니다.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wordbook_sections' AND column_name = 'word_count') THEN
        ALTER TABLE wordbook_sections ADD COLUMN word_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. 기존 데이터 Backfill (단어 수 채우기)
-- words 컬럼이 JSONB 배열이라고 가정하고 길이를 잰 후 업데이트합니다.
-- 만약 words가 NULL이면 0으로 설정됩니다.
UPDATE wordbook_sections
SET word_count = COALESCE(jsonb_array_length(words), 0)
WHERE word_count = 0 OR word_count IS NULL;

-- 3. 검증용 쿼리 (결과 확인)
-- word_count가 잘 들어갔는지 상위 10개만 확인
SELECT id, unit_name, word_count, jsonb_array_length(words) as actual_length
FROM wordbook_sections
LIMIT 10;
