-- Create the grammar_lectures table
CREATE TABLE IF NOT EXISTS grammar_lectures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content JSONB DEFAULT '[]'::JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE grammar_lectures ENABLE ROW LEVEL SECURITY;

-- Create policy for reading (Public or Authenticated)
-- Allowing all authenticated users (students and teachers) to read
DROP POLICY IF EXISTS "Enable read access for all users" ON grammar_lectures;
CREATE POLICY "Enable read access for all users" ON grammar_lectures FOR SELECT USING (true);

-- Create policy for inserting/updating (Teachers only ideally, but 'authenticated' for now as per plan)
-- We'll trust the API layer to verify the user role as well.
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON grammar_lectures;
CREATE POLICY "Enable update access for authenticated users" ON grammar_lectures FOR ALL USING (auth.role() = 'authenticated');

-- Insert an initial empty row if it doesn't exist so PUT updates work
INSERT INTO grammar_lectures (content)
SELECT '[]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM grammar_lectures);
