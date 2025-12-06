import { createClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/wordbooks - 전체 단어장 목록 조회
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();

        const { data: wordbooks, error } = await supabase
            .from('wordbooks')
            .select(`
        id,
        title,
        word_count,
        is_shared,
        created_at,
        updated_at
      `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Wordbooks fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ wordbooks });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/wordbooks - 새 단어장 생성
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, words } = body;

        if (!title || !words || !Array.isArray(words)) {
            return NextResponse.json(
                { error: 'Title and words array are required' },
                { status: 400 }
            );
        }

        const supabase = createClient();

        // 1. 단어장 메타데이터 생성
        const { data: wordbook, error: wordbookError } = await supabase
            .from('wordbooks')
            .insert({
                title,
                word_count: words.length,
                is_shared: false,
            })
            .select()
            .single();

        if (wordbookError) {
            console.error('Wordbook creation error:', wordbookError);
            return NextResponse.json({ error: wordbookError.message }, { status: 500 });
        }

        // 2. 소단원별로 단어 그룹화
        const sectionMap = new Map<string, any[]>();

        words.forEach((word: any) => {
            const minorUnit = word.minor_unit || '기타';
            if (!sectionMap.has(minorUnit)) {
                sectionMap.set(minorUnit, []);
            }
            sectionMap.get(minorUnit)!.push({
                no: word.no,
                english: word.english,
                korean: word.korean,
            });
        });

        // 3. 각 소단원을 wordbook_sections에 저장
        const sections = Array.from(sectionMap.entries()).map(([minorUnit, sectionWords]) => {
            const representativeWord = words.find((w: any) => w.minor_unit === minorUnit);
            return {
                wordbook_id: wordbook.id,
                major_unit: representativeWord?.major_unit || null,
                minor_unit: minorUnit,
                unit_name: representativeWord?.unit_name || minorUnit,
                words: sectionWords,
            };
        });

        const { error: sectionsError } = await supabase
            .from('wordbook_sections')
            .insert(sections);

        if (sectionsError) {
            console.error('Sections creation error:', sectionsError);
            // 롤백: 생성한 단어장 삭제
            await supabase.from('wordbooks').delete().eq('id', wordbook.id);
            return NextResponse.json({ error: sectionsError.message }, { status: 500 });
        }

        return NextResponse.json({ wordbook }, { status: 201 });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
