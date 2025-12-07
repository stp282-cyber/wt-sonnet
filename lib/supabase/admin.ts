import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn('Supabase service role credentials not found. Please set SUPABASE_SERVICE_ROLE_KEY in .env.local');
}

// Service Role 클라이언트 (관리자 권한, 모든 RLS 우회)
// 주의: 서버 사이드 코드에서만 사용해야 합니다.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
