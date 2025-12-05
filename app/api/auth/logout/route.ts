import { NextResponse } from 'next/server';

export async function POST() {
    try {
        // 로그아웃 처리 (세션 무효화)
        return NextResponse.json({
            message: 'Logout successful',
        });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
