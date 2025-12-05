import { createClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/wordbooks/[id] - 단어장 상세 조회 (단어 포함)
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();
        const { id } = params;

        // 1. 단어장 메타데이터 조회
        const { data: wordbook, error: wordbookError } = await supabase
            .from('wordbooks')
            .select('*')
            .eq('id', id)
            .single();

        if (wordbookError) {
            console.error('Wordbook fetch error:', wordbookError);
            return NextResponse.json({ error: wordbookError.message }, { status: 500 });
        }

        if (!wordbook) {
            return NextResponse.json({ error: 'Wordbook not found' }, { status: 404 });
        }

        // 2. 섹션 및 단어 조회
        const { data: sections, error: sectionsError } = await supabase
            .from('wordbook_sections')
            .select('*')
            .eq('wordbook_id', id)
            .order('minor_unit');

        if (sectionsError) {
            console.error('Sections fetch error:', sectionsError);
            return NextResponse.json({ error: sectionsError.message }, { status: 500 });
        }

        // 3. 모든 단어를 평탄화
        const allWords: any[] = [];
        sections?.forEach((section: any) => {
            const sectionWords = section.words || [];
            sectionWords.forEach((word: any) => {
                allWords.push({
                    ...word,
                    major_unit: section.major_unit,
                    minor_unit: section.minor_unit,
                });
            });
        });

        return NextResponse.json({
            wordbook: {
                ...wordbook,
                words: allWords,
                sections,
            },
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/wordbooks/[id] - 단어장 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();
        const { id } = params;

        const { error } = await supabase
            .from('wordbooks')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Wordbook deletion error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
