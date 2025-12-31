-- Create the lecture_books table
CREATE TABLE IF NOT EXISTS lecture_books (
  id UUID PRIMARY KEY, -- We will provide the ID from the migration
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::JSONB, -- Stores chapters and sections
  is_visible BOOLEAN DEFAULT true,
  sequence INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE lecture_books ENABLE ROW LEVEL SECURITY;

-- Create policy for reading (Public access allowed for now, matching existing pattern)
DROP POLICY IF EXISTS "Enable read access for all users" ON lecture_books;
CREATE POLICY "Enable read access for all users" ON lecture_books FOR SELECT USING (true);

-- Create policy for writing (Authenticated users only)
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON lecture_books;
CREATE POLICY "Enable write access for authenticated users" ON lecture_books FOR ALL USING (auth.role() = 'authenticated');
