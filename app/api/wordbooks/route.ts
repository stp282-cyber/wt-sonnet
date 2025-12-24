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
                word_count: words.length, // [Safety Fix] 단어 수 명시적 저장
                is_shared: false,
            })
            .select()
            .single();

        if (wordbookError) {
            console.error('Wordbook creation error:', wordbookError);
            return NextResponse.json({ error: wordbookError.message }, { status: 500 });
        }

        // 2. 소단원별로 단어 그룹화 (대단원-소단원 조합)
        const sectionMap = new Map<string, any[]>();

        words.forEach((word: any) => {
            // 숫자일 수 있으므로 문자열로 변환
            const majorUnit = word.major_unit != null ? String(word.major_unit) : '1';
            const minorUnit = word.minor_unit != null ? String(word.minor_unit) : '1';

            // 대단원-소단원을 조합하여 고유 키 생성 (예: "1-1", "1-2")
            const key = `${majorUnit}-${minorUnit}`;

            if (!sectionMap.has(key)) {
                sectionMap.set(key, []);
            }
            sectionMap.get(key)!.push({
                no: word.no,
                english: word.english,
                korean: word.korean,
                major_unit: majorUnit,
                minor_unit: minorUnit, // 저장 시에도 사용하기 위해 저장
                unit_name: word.unit_name,
            });
        });

        // 3. 각 소단원을 wordbook_sections에 저장
        const sections = Array.from(sectionMap.values()).map((sectionWords) => {
            // 첫 번째 단어에서 정보 가져오기 (같은 그룹이므로 동일함)
            const firstWord = sectionWords[0];
            return {
                wordbook_id: wordbook.id,
                major_unit: firstWord.major_unit,
                minor_unit: firstWord.minor_unit,
                unit_name: firstWord.unit_name || `${firstWord.major_unit}-${firstWord.minor_unit}`,
                word_count: sectionWords.length, // [Safety Fix] 섹션별 단어 수 저장
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
