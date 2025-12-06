import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// GET /api/messages - 쪽지 목록 조회
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json(
                { error: 'user_id is required' },
                { status: 400 }
            );
        }

        const { data: messages, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:sender_id (
                    id,
                    username,
                    full_name
                ),
                recipient:recipient_id (
                    id,
                    username,
                    full_name
                )
            `)
            .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Messages fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ messages: messages || [] });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/messages - 쪽지 전송
export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const body = await request.json();
        const { sender_id, recipient_id, content } = body;

        if (!sender_id || !recipient_id || !content) {
            return NextResponse.json(
                { error: 'sender_id, recipient_id, and content are required' },
                { status: 400 }
            );
        }

        const { data: message, error } = await supabase
            .from('messages')
            .insert({
                sender_id,
                recipient_id,
                content,
                is_read: false,
            })
            .select()
            .single();

        if (error) {
            console.error('Message creation error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message }, { status: 201 });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
