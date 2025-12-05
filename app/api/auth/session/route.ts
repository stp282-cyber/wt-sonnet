import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
    try {
        // 현재는 간단한 세션 확인만 구현
        // 나중에 JWT 토큰 검증으로 업그레이드 필요
        return NextResponse.json({
            authenticated: false,
            user: null,
        });
    } catch (error) {
        console.error('Session error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
