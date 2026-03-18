import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabase = createClient(
  'https://ebbysxvyyphtfkwvqgfx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViYnlzeHZ5eXBodGZrd3ZxZ2Z4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDk1NjE0MiwiZXhwIjoyMDgwNTMyMTQyfQ.RIcaOnBPzJ7z7zTZ-vnGK72m7OOlhXuGI29LWJgEo4g'
);

async function main() {
  const { data: sessions } = await supabase
    .from('test_sessions')
    .select('student_id, updated_at, session_data')
    .order('updated_at', { ascending: false });

  const summary = (sessions || []).map(s => {
    const sd = s.session_data || {};
    return {
      type: sd.type,
      step: sd.step,
      wrongWords_exists: 'wrongWords' in sd,
      wrongWords_val: sd.wrongWords,
      studentInfo_exists: 'studentInfo' in sd,
      words_count: Array.isArray(sd.words) ? sd.words.length : null,
      keys: Object.keys(sd).join(', ')
    };
  });

  writeFileSync('C:\\Users\\최경진2\\Desktop\\wt-sonnet\\session_details.json', JSON.stringify(summary, null, 2));
}

main().catch(console.error);
