import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const body = await request.json();
        const { username, password, full_name, academy_id } = body;

        if (!username || !password || !full_name) {
            return NextResponse.json({ error: '아이디, 비밀번호, 이름은 필수입니다.' }, { status: 400 });
        }

        // 중복 아이디 체크
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .single();

        if (existing) {
            return NextResponse.json({ error: '이미 존재하는 아이디입니다.' }, { status: 409 });
        }

        // 선생님 계정 생성
        // academy_id가 제공되면 해당 학원 소속으로, 아니면 (슈퍼관리자가 아니면 보통 필수) null
        const { data, error } = await supabase
            .from('users')
            .insert({
                username,
                password_hash: password, // TODO: bcrypt 해싱 권장
                full_name,
                role: 'teacher',
                academy_id: academy_id || null,
                status: 'active'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ user: data }, { status: 201 });

    } catch (error: any) {
        console.error('Create teacher error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
