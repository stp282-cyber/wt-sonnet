import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
    try {
        const { username, currentPassword, newPassword } = await request.json();

        if (!username || !currentPassword || !newPassword) {
            return NextResponse.json(
                { error: '모든 필드를 입력해주세요.' },
                { status: 400 }
            );
        }

        // 1. Verify current password
        const { data: users, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .limit(1);

        if (fetchError || !users || users.length === 0) {
            return NextResponse.json(
                { error: '사용자를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        const user = users[0];

        // Check if current password matches (plaintext comparison as per current login logic)
        if (user.password_hash !== currentPassword) {
            return NextResponse.json(
                { error: '현재 비밀번호가 일치하지 않습니다.' },
                { status: 401 }
            );
        }

        // 2. Update to new password
        const { error: updateError } = await supabase
            .from('users')
            .update({ password_hash: newPassword })
            .eq('username', username);

        if (updateError) {
            console.error('Password update error:', updateError);
            return NextResponse.json(
                { error: '비밀번호 변경 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, message: '비밀번호가 변경되었습니다.' });

    } catch (error: any) {
        console.error('Password change error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
