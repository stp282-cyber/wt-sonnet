import { createClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/wordbooks/[id] - 단어장 상세 조회 (단어 포함)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createClient();
        const { id } = await params;

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
                    unit_name: section.unit_name,
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

// PUT /api/wordbooks/[id] - 단어장 수정
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createClient();
        const { id } = await params;
        const body = await request.json();
        const { title, words } = body;

        if (!title && !words) {
            return NextResponse.json(
                { error: 'At least title or words must be provided' },
                { status: 400 }
            );
        }

        // 1. 단어장 메타데이터 수정
        if (title) {
            const { error: updateError } = await supabase
                .from('wordbooks')
                .update({
                    title,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id);

            if (updateError) {
                console.error('Wordbook update error:', updateError);
                return NextResponse.json({ error: updateError.message }, { status: 500 });
            }
        }

        // 2. 단어 데이터 수정
        if (words && Array.isArray(words)) {
            // 기존 섹션 삭제
            await supabase
                .from('wordbook_sections')
                .delete()
                .eq('wordbook_id', id);

            // 소단원별로 단어 그룹화
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

            // 새 섹션 생성
            const sections = Array.from(sectionMap.entries()).map(([minorUnit, sectionWords]) => {
                const representativeWord = words.find((w: any) => w.minor_unit === minorUnit);
                return {
                    wordbook_id: id,
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
                console.error('Sections update error:', sectionsError);
                return NextResponse.json({ error: sectionsError.message }, { status: 500 });
            }

            // 단어 개수 업데이트
            await supabase
                .from('wordbooks')
                .update({ word_count: words.length })
                .eq('id', id);
        }

        // 수정된 단어장 조회
        const { data: wordbook, error: fetchError } = await supabase
            .from('wordbooks')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) {
            console.error('Wordbook fetch error:', fetchError);
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        return NextResponse.json({ wordbook });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/wordbooks/[id] - 단어장 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createClient();
        const { id } = await params;

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

