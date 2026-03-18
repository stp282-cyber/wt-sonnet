import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabase = createClient(
  'https://ebbysxvyyphtfkwvqgfx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViYnlzeHZ5eXBodGZrd3ZxZ2Z4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDk1NjE0MiwiZXhwIjoyMDgwNTMyMTQyfQ.RIcaOnBPzJ7z7zTZ-vnGK72m7OOlhXuGI29LWJgEo4g'
);

async function main() {
  const out = {};

  // 실제 세션들의 session_data 크기와 내용 확인
  const { data: sessions } = await supabase
    .from('test_sessions')
    .select('student_id, updated_at, session_data')
    .order('updated_at', { ascending: false });

  out.sessions = (sessions || []).map(s => {
    const sd = s.session_data;
    const jsonStr = JSON.stringify(sd);
    return {
      student_prefix: s.student_id?.slice(0, 8),
      updated_at: s.updated_at,
      type: sd?.type,
      step: sd?.step,
      keys: sd ? Object.keys(sd) : [],
      wrongWords_exists: sd ? ('wrongWords' in sd) : false,
      wrongWords_val: sd?.wrongWords,
      session_data_bytes: jsonStr.length,
      // words 배열 크기 확인 (type=typing_test인 경우)
      words_count: Array.isArray(sd?.words) ? sd.words.length : 'N/A',
      studentInfo_exists: sd ? ('studentInfo' in sd) : false,
    };
  });

  // 최근 study_logs 조회
  const { data: logs } = await supabase
    .from('study_logs')
    .select('id, student_id, status, test_phase, score, wrong_answers, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  out.recent_logs = (logs || []).map(l => ({
    id_prefix: l.id?.slice(0, 8),
    status: l.status,
    test_phase: l.test_phase,
    score: l.score,
    wrong_answers_len: Array.isArray(l.wrong_answers) ? l.wrong_answers.length : l.wrong_answers,
    created_at: l.created_at,
  }));

  writeFileSync('/tmp/db4.json', JSON.stringify(out, null, 2));
  // Print compact
  const compact = {
    sessions_summary: out.sessions.map(s => ({
      type: s.type, step: s.step, wrongWords_exists: s.wrongWords_exists, bytes: s.session_data_bytes, words_count: s.words_count, studentInfo_exists: s.studentInfo_exists
    })),
    recent_logs_summary: out.recent_logs.slice(0, 5)
  };
  console.log(JSON.stringify(compact, null, 2));
}

main().catch(e => { console.log('FATAL', e.message); });
