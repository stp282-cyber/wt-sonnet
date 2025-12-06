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

        // 2. 소단원별로 단어 그룹화 (숫자를 문자열로 변환)
        const sectionMap = new Map<string, any[]>();

        words.forEach((word: any) => {
            // minor_unit을 문자열로 변환 (숫자일 수 있음)
            const minorUnit = word.minor_unit != null ? String(word.minor_unit) : '기타';
            const majorUnit = word.major_unit != null ? String(word.major_unit) : null;

            if (!sectionMap.has(minorUnit)) {
                sectionMap.set(minorUnit, []);
            }
            sectionMap.get(minorUnit)!.push({
                no: word.no,
                english: word.english,
                korean: word.korean,
                major_unit: majorUnit,
                unit_name: word.unit_name,
            });
        });

        // 3. 각 소단원을 wordbook_sections에 저장
        const sections = Array.from(sectionMap.entries()).map(([minorUnit, sectionWords]) => {
            // 첫 번째 단어에서 major_unit과 unit_name 가져오기
            const firstWord = sectionWords[0];
            return {
                wordbook_id: wordbook.id,
                major_unit: firstWord?.major_unit || null,
                minor_unit: minorUnit,
                unit_name: firstWord?.unit_name || minorUnit,
                words: sectionWords.map(w => ({
                    no: w.no,
                    english: w.english,
                    korean: w.korean,
                })),
            };
        });

        console.log('Creating sections:', sections.length);
        console.log('First section:', sections[0]);

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
