// 단어 수 자동 계산 유틸리티

export interface WordbookSection {
    id: string;
    minor_unit: string;
    words: Array<{ no: number; english: string; korean: string }>;
}

export interface DailyAmountConfig {
    type: 'section' | 'word_count';
    sectionAmount?: 0.5 | 1 | 2;
    sectionStart?: string;
    sectionEnd?: string;
    wordCount?: number;
}

/**
 * 소단원 기준으로 단어 수 자동 계산
 */
export function calculateWordCountBySection(
    sections: WordbookSection[],
    sectionStart: string,
    sectionAmount: number
): number {
    // 시작 소단원 찾기
    const startIndex = sections.findIndex(s => s.minor_unit === sectionStart);

    if (startIndex === -1) {
        throw new Error(`소단원 ${sectionStart}을(를) 찾을 수 없습니다.`);
    }

    let totalWords = 0;

    if (sectionAmount === 0.5) {
        // 0.5 소단원 = 현재 소단원의 절반
        const currentSection = sections[startIndex];
        totalWords = Math.ceil(currentSection.words.length / 2);
    } else if (sectionAmount === 1) {
        // 1 소단원 = 현재 소단원 전체
        const currentSection = sections[startIndex];
        totalWords = currentSection.words.length;
    } else if (sectionAmount === 2) {
        // 2 소단원 = 현재 + 다음 소단원
        const currentSection = sections[startIndex];
        const nextSection = sections[startIndex + 1];

        totalWords = currentSection.words.length;
        if (nextSection) {
            totalWords += nextSection.words.length;
        }
    }

    return totalWords;
}

/**
 * 소단원 목록 가져오기 (단어장 ID로)
 * 실제로는 단어장 관리 페이지의 데이터를 참조
 */
export function getAvailableSections(wordbookId: string): WordbookSection[] {
    // localStorage에서 단어장 데이터 가져오기
    // 실제 프로젝트에서는 Supabase에서 조회
    try {
        const wordbooksData = localStorage.getItem('wordbooks');
        if (wordbooksData) {
            const wordbooks = JSON.parse(wordbooksData);
            const selectedWordbook = wordbooks.find((wb: any) => wb.id === wordbookId);

            if (selectedWordbook && selectedWordbook.words) {
                // 소단원별로 단어 그룹화
                const sectionMap = new Map<string, any[]>();

                selectedWordbook.words.forEach((word: any) => {
                    const minorUnit = word.minor_unit || '기타';
                    if (!sectionMap.has(minorUnit)) {
                        sectionMap.set(minorUnit, []);
                    }
                    sectionMap.get(minorUnit)!.push(word);
                });

                // WordbookSection 형식으로 변환
                const sections: WordbookSection[] = [];
                let sectionId = 1;

                sectionMap.forEach((words, minorUnit) => {
                    sections.push({
                        id: sectionId.toString(),
                        minor_unit: minorUnit,
                        words: words.map(w => ({
                            no: w.no,
                            english: w.english,
                            korean: w.korean,
                        })),
                    });
                    sectionId++;
                });

                return sections;
            }
        }
    } catch (error) {
        console.error('단어장 데이터 로드 실패:', error);
    }

    // localStorage에 데이터가 없으면 샘플 데이터 반환
    const wordbookSections: Record<string, WordbookSection[]> = {
        '1': [ // 중학 영단어 1000 (각 소단원 20개씩)
            {
                id: '1',
                minor_unit: '1-1',
                words: Array(20).fill(null).map((_, i) => ({
                    no: i + 1,
                    english: `word${i + 1}`,
                    korean: `단어${i + 1}`,
                })),
            },
            {
                id: '2',
                minor_unit: '1-2',
                words: Array(20).fill(null).map((_, i) => ({
                    no: i + 21,
                    english: `word${i + 21}`,
                    korean: `단어${i + 21}`,
                })),
            },
        ],
        '2': [ // CHAPTER 5: TRAVEL ESSENTIALS
            {
                id: '3',
                minor_unit: '5-1',
                words: Array(20).fill(null).map((_, i) => ({
                    no: i + 1,
                    english: `travel${i + 1}`,
                    korean: `여행${i + 1}`,
                })),
            },
        ],
        '3': [ // CHAPTER 3: FAMILY MEMBERS
            {
                id: '4',
                minor_unit: '3-1',
                words: Array(20).fill(null).map((_, i) => ({
                    no: i + 1,
                    english: `family${i + 1}`,
                    korean: `가족${i + 1}`,
                })),
            },
        ],
    };

    return wordbookSections[wordbookId] || [];
}

/**
 * 커리큘럼 백업 (JSON 다운로드)
 */
export function exportCurriculumToJSON(curriculum: any): void {
    const backupData = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        curriculum: {
            name: curriculum.name,
            description: curriculum.description,
            items: curriculum.items,
        },
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `curriculum_${curriculum.name}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * 커리큘럼 복원 (JSON 업로드)
 */
export function importCurriculumFromJSON(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                if (data.version !== '1.0') {
                    throw new Error('지원하지 않는 백업 파일 버전입니다.');
                }
                resolve(data.curriculum);
            } catch (error) {
                reject(new Error('잘못된 백업 파일 형식입니다.'));
            }
        };
        reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
        reader.readAsText(file);
    });
}
