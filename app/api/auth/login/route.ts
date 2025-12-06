import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username and password are required' },
                { status: 400 }
            );
        }

        // Supabase에서 사용자 조회
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .limit(1);

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                {
                    error: 'Database error',
                    details: error.message,
                    code: error.code,
                    hint: error.hint
                },
                { status: 500 }
            );
        }

        if (!users || users.length === 0) {
            return NextResponse.json(
                { error: 'Invalid username or password' },
                { status: 401 }
            );
        }

        const user = users[0];

        // 비밀번호 검증 (현재는 평문 비교, 나중에 bcrypt로 변경 필요)
        if (user.password_hash !== password) {
            return NextResponse.json(
                { error: 'Invalid username or password' },
                { status: 401 }
            );
        }

        // 사용자 정보 반환 (비밀번호 제외)
        const { password_hash, ...userWithoutPassword } = user;

        // 쿠키에 사용자 정보 저장
        const response = NextResponse.json({
            user: userWithoutPassword,
            message: 'Login successful',
        });

        // 쿠키 설정 (7일 유효)
        response.cookies.set('user', JSON.stringify(userWithoutPassword), {
            httpOnly: false, // 클라이언트에서도 접근 가능하도록
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7일
            path: '/',
        });

        return response;
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error.message || JSON.stringify(error)
            },
            { status: 500 }
        );
    }
}
