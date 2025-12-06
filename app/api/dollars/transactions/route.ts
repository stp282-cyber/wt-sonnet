import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// GET /api/dollars/transactions - 달러 거래 내역 조회
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('student_id');

        let query = supabase
            .from('dollar_transactions')
            .select('*')
            .order('created_at', { ascending: false });

        if (studentId) {
            query = query.eq('student_id', studentId);
        }

        const { data: transactions, error } = await query;

        if (error) {
            console.error('Transactions fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ transactions: transactions || [] });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/dollars/transactions - 달러 거래 생성
export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();
        const body = await request.json();
        const { student_id, amount, transaction_type, description } = body;

        if (!student_id || !amount || !transaction_type) {
            return NextResponse.json(
                { error: 'student_id, amount, and transaction_type are required' },
                { status: 400 }
            );
        }

        // 트랜잭션 생성
        const { data: transaction, error: transactionError } = await supabase
            .from('dollar_transactions')
            .insert({
                student_id,
                amount,
                transaction_type,
                description,
            })
            .select()
            .single();

        if (transactionError) {
            console.error('Transaction creation error:', transactionError);
            return NextResponse.json({ error: transactionError.message }, { status: 500 });
        }

        // 학생의 달러 업데이트
        const { data: student } = await supabase
            .from('users')
            .select('dollars')
            .eq('id', student_id)
            .single();

        const newDollars = (student?.dollars || 0) + amount;

        const { error: updateError } = await supabase
            .from('users')
            .update({ dollars: newDollars })
            .eq('id', student_id);

        if (updateError) {
            console.error('Student dollars update error:', updateError);
            // 트랜잭션 롤백
            await supabase.from('dollar_transactions').delete().eq('id', transaction.id);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ transaction }, { status: 201 });
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
