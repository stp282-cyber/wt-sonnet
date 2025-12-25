import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// 빌드 시 환경 변수가 없을 경우를 대비한 placeholder 값 (실제 런타임에는 환경 변수 필요)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not found. Using placeholders for build. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
}

// 싱글톤 클라이언트 (기존 사용처용)
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
});

// createClient 함수 (API 라우트용)
export function createClient() {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}
