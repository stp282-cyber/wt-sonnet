import { StudentCurriculum, CurriculumItem, Section, ScheduleItem, DAY_MAP } from '@/types/curriculum';

// YYYY-MM-DD 형식을 로컬 자정 시간으로 파싱 (Timezone 이슈 방지)
const parseBreakDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return new Date(dateStr);
};

// 날짜 유틸리티
export const getWeekDays = (startDate: Date, weekOffset: number) => {
    const days = [];
    const current = new Date(startDate);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    current.setDate(diff + (weekOffset * 7));

    for (let i = 0; i < 5; i++) {
        const d = new Date(current);
        d.setDate(current.getDate() + i);

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const date = String(d.getDate()).padStart(2, '0');
        const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];

        days.push({
            date: `${year}-${month}-${date}`,
            dayOfWeek,
            fullDate: d
        });
    }
    return days;
};

// 스케줄 생성 로직
export const getAllSectionsForCurriculum = (curriculum: StudentCurriculum): {
    section: Section;
    item: CurriculumItem;
    progressStart: number;
    progressEnd: number;
    title: string;
    major: string;
    minor: string;
    isMultiSection: boolean;
    wordCount: number;
}[] => {
    const scheduleItems: any[] = [];

    (curriculum.curriculum_items || []).forEach((item) => {
        if (item.item_type === 'wordbook' && item.sections && item.sections.length > 0) {
            // 1. 설정 오버라이드 확인
            const overrideSettings = curriculum.setting_overrides || {};
            const effectiveType = (overrideSettings.daily_amount_type as 'section' | 'count') || item.daily_amount_type || 'count';

            let effectiveAmount = overrideSettings.daily_amount;
            if (!effectiveAmount) {
                if (effectiveType === 'section') {
                    effectiveAmount = item.daily_amount || 1;
                } else {
                    effectiveAmount = item.daily_word_count || item.daily_amount || 20;
                }
            } else {
                // Safety check for legacy data anomalies
                if (effectiveType === 'section' && effectiveAmount > 5) {
                    effectiveAmount = 1;
                }
            }

            // [CRITICAL FIX] Reset progress for each ITEM, because flashcard page fetches by item_id
            let currentItemWordProgress = 1;

            if (effectiveType === 'section') {
                // --- 섹션 단위 로직 (기존 로직 유지) ---
                const unitGroups: { key: string, sections: Section[], wordCount: number }[] = [];
                let currentUnitKey = '';
                let currentUnitSections: Section[] = [];

                item.sections.forEach((section) => {
                    const key = `${section.major_unit}-${section.minor_unit}`;
                    if (key !== currentUnitKey) {
                        if (currentUnitSections.length > 0) {
                            unitGroups.push({
                                key: currentUnitKey,
                                sections: currentUnitSections,
                                wordCount: currentUnitSections.reduce((sum, s) => sum + (s.word_count || 0), 0)
                            });
                        }
                        currentUnitKey = key;
                        currentUnitSections = [section];
                    } else {
                        currentUnitSections.push(section);
                    }
                });
                if (currentUnitSections.length > 0) {
                    unitGroups.push({
                        key: currentUnitKey,
                        sections: currentUnitSections,
                        wordCount: currentUnitSections.reduce((sum, s) => sum + (s.word_count || 0), 0)
                    });
                }

                const dailyUnitAmount = effectiveAmount;
                let currentDailyChunk: typeof unitGroups = [];

                for (let i = 0; i < unitGroups.length; i++) {
                    currentDailyChunk.push(unitGroups[i]);

                    if (currentDailyChunk.length >= dailyUnitAmount || i === unitGroups.length - 1) {
                        const startGroup = currentDailyChunk[0];
                        const endGroup = currentDailyChunk[currentDailyChunk.length - 1];
                        const allSectionsInChunk = currentDailyChunk.flatMap(g => g.sections);
                        const chunkWordCount = currentDailyChunk.reduce((sum, g) => sum + g.wordCount, 0);
                        const startSection = allSectionsInChunk[0];
                        const endSection = allSectionsInChunk[allSectionsInChunk.length - 1];

                        let unitTitle = startSection.unit_name;
                        if (startGroup.key !== endGroup.key) {
                            unitTitle = `${startSection.unit_name} ~ ${endSection.unit_name}`;
                        }

                        scheduleItems.push({
                            section: endSection,
                            item,
                            progressStart: currentItemWordProgress,
                            progressEnd: currentItemWordProgress + chunkWordCount - 1,
                            title: unitTitle,
                            major: startSection.major_unit,
                            minor: currentDailyChunk.length > 1
                                ? `${startSection.minor_unit}~${endSection.minor_unit}`
                                : startSection.minor_unit,
                            isMultiSection: allSectionsInChunk.length > 1,
                            wordCount: chunkWordCount
                        });

                        currentItemWordProgress += chunkWordCount;
                        currentDailyChunk = [];
                    }
                }
            } else {
                // --- 단어 수 단위 로직 (개선됨: 섹션 쪼개기 지원 + Phase Shift) ---
                const dailyCount = effectiveAmount;

                let currentDayChunk: Section[] = [];
                let currentDayWordAccumulator = 0;

                // [Phase Shift]
                // 사용자가 지정한 'current_progress'가 청크의 시작점이 되도록 정렬합니다.
                // 첫 번째 청크의 크기를 조절하여 나머지 청크들의 시작 번호를 밀어줍니다.
                let initialRemainder = 0;
                if (curriculum.current_item_id === item.item_id && curriculum.current_progress > 1) {
                    initialRemainder = (curriculum.current_progress - 1) % dailyCount;
                }
                let isFirstBatch = true; // 첫 번째 배치 여부

                // 내부 함수: 하루 마감 처리
                const flushDay = () => {
                    if (currentDayChunk.length === 0) return;

                    const startSection = currentDayChunk[0];
                    const endSection = currentDayChunk[currentDayChunk.length - 1];
                    const count = currentDayWordAccumulator;

                    // 제목 생성
                    let unitTitle = startSection.unit_name;
                    if (startSection.id !== endSection.id) {
                        // 여러 섹션이 섞임
                        unitTitle = `${startSection.unit_name} ~ ${endSection.unit_name}`;
                    } else {
                        // 한 섹션을 쪼갠 경우 (혹은 한 섹션만 들어간 경우)
                        unitTitle = startSection.unit_name;
                    }

                    scheduleItems.push({
                        section: endSection, // 대표 섹션 (보통 마지막꺼)
                        item,
                        progressStart: currentItemWordProgress,
                        progressEnd: currentItemWordProgress + count - 1,
                        title: unitTitle,
                        major: startSection.major_unit,
                        minor: currentDayChunk.length > 1 || count < (endSection.word_count || 0)
                            ? `${startSection.minor_unit} (부분)`
                            : startSection.minor_unit,
                        isMultiSection: currentDayChunk.length > 1,
                        wordCount: count
                    });

                    currentItemWordProgress += count;
                    currentDayChunk = [];
                    currentDayWordAccumulator = 0;

                    // 첫 배치가 끝났으므로 플래그 해제
                    if (isFirstBatch) isFirstBatch = false;
                };

                // 단어 단위 진행을 위해, 각 섹션을 순회하며 일일 할당량을 채움
                for (let i = 0; i < item.sections.length; i++) {
                    const section = item.sections[i];
                    const sectionWords = section.word_count || 0;

                    let remainingSectionWords = sectionWords;

                    while (remainingSectionWords > 0) {
                        // 이번 배치의 목표량 설정
                        let currentLimit = dailyCount;
                        if (isFirstBatch && initialRemainder > 0) {
                            currentLimit = initialRemainder;
                        }

                        // 오늘 담을 수 있는 남은 공간
                        const spaceInDay = currentLimit - currentDayWordAccumulator;

                        // 이번 섹션에서 가져올 단어 수 (남은 섹션 전체 vs 공간 + 오차범위)
                        // 타협: 섹션 전체를 넣었을 때 currentLimit * 1.3 이하라면 넣는다.
                        // 아니라면(너무 크다면) spaceInDay 만큼만 잘라서 넣는다.

                        let take = 0;
                        // 첫 배치는 오차범위 없이 정확히 맞추는게 좋음 (그래야 진도가 딱 맞으므로)
                        const allowElasticity = !isFirstBatch;

                        const canFitWhole = allowElasticity
                            ? (currentDayWordAccumulator + remainingSectionWords) <= (currentLimit * 1.3)
                            : (currentDayWordAccumulator + remainingSectionWords) <= currentLimit;

                        if (canFitWhole) {
                            take = remainingSectionWords;
                            // 섹션 전체가 들어가므로 큐에 추가
                            if (!currentDayChunk.includes(section)) currentDayChunk.push(section);
                        } else {
                            // 다 안들어감. 꽉 채우기 (칼같이 자름)
                            take = Math.min(remainingSectionWords, spaceInDay);

                            // 만약 spaceInDay가 0 이라면? (즉 하루 할당량 끝남) -> 마감
                            if (take <= 0) {
                                flushDay();
                                continue;
                            }
                            if (!currentDayChunk.includes(section)) currentDayChunk.push(section);
                        }

                        currentDayWordAccumulator += take;
                        remainingSectionWords -= take;

                        // 하루가 꽉 찼으면 (혹은 오버했으면) 마감
                        if (currentDayWordAccumulator >= currentLimit) {
                            flushDay();
                        }
                    }
                }

                // 루프 끝나고 남은 짜투리 마감
                if (currentDayWordAccumulator > 0) {
                    flushDay();
                }
            }
        }
    });

    return scheduleItems;
};

// 특정 날짜 스케줄 조회
export const getScheduleForDate = (curriculum: StudentCurriculum, dateStr: string): ScheduleItem | null => {
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    const startDate = new Date(curriculum.start_date);
    startDate.setHours(0, 0, 0, 0);

    if (targetDate < startDate) return null;

    const dayOfWeek = targetDate.getDay();
    let currentDayCode = '';
    Object.entries(DAY_MAP).forEach(([code, num]) => {
        if (num === dayOfWeek) currentDayCode = code;
    });

    // study_days 파싱
    let studyDays: string[] = [];
    if (Array.isArray(curriculum.study_days)) {
        studyDays = curriculum.study_days;
    } else if (typeof curriculum.study_days === 'string') {
        try {
            const sanitized = (curriculum.study_days as string).replace(/'/g, '"');
            studyDays = JSON.parse(sanitized);
        } catch (e) {
            console.error("Failed to parse study_days:", curriculum.study_days);
            return null;
        }
    }

    const normalizedStudyDays = studyDays.map(d => d.toLowerCase());
    if (!currentDayCode || !normalizedStudyDays.includes(currentDayCode.toLowerCase())) {
        return null;
    }

    // Breaks 체크
    const breaks = (curriculum.breaks || []).map(b => ({
        start: parseBreakDate(b.start_date),
        end: parseBreakDate(b.end_date)
    }));
    for (const brk of breaks) {
        const s = new Date(brk.start); s.setHours(0, 0, 0, 0);
        const e = new Date(brk.end); e.setHours(23, 59, 59, 999);
        if (targetDate >= s && targetDate <= e) return null;
    }

    let studyDayCount = 0;
    const checkDate = new Date(startDate);
    checkDate.setHours(0, 0, 0, 0);

    while (checkDate <= targetDate) {
        // Break 체크
        let isBreak = false;
        for (const brk of breaks) {
            const s = new Date(brk.start); s.setHours(0, 0, 0, 0);
            const e = new Date(brk.end); e.setHours(23, 59, 59, 999);
            if (checkDate >= s && checkDate <= e) {
                isBreak = true;
                break;
            }
        }

        if (!isBreak) {
            const checkDayOfWeek = checkDate.getDay();
            let checkDayCode = '';
            Object.entries(DAY_MAP).forEach(([code, num]) => {
                if (num === checkDayOfWeek) checkDayCode = code;
            });

            if (checkDayCode && normalizedStudyDays.includes(checkDayCode.toLowerCase())) {
                studyDayCount++;
            }
        }
        checkDate.setDate(checkDate.getDate() + 1);
    }

    const allSections = getAllSectionsForCurriculum(curriculum);

    if (studyDayCount > 0 && studyDayCount <= allSections.length) {
        const scheduleData = allSections[studyDayCount - 1];
        const { section, item, progressStart, progressEnd, title, major, minor, wordCount } = scheduleData;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let status: 'completed' | 'today' | 'upcoming' = 'upcoming';
        if (targetDate < today) status = 'completed';
        else if (targetDate.getTime() === today.getTime()) status = 'today';

        return {
            dayIndex: studyDayCount,
            itemTitle: item.item_details?.title || '제목 없음',
            majorUnit: major || '대단원 미지정',
            minorUnit: minor || String(studyDayCount),
            unitName: title || `${studyDayCount}일차`,
            itemType: item.item_type || 'wordbook',
            wordCount: wordCount,
            progressRange: `${progressStart}~${progressEnd}`,
            status,
            item,
            progressStart,
            progressEnd,
            section
        };
    }

    return null;
};

// 특정 진도(단어 번호)에 맞와 시작일 역산
export const calculateStartDateForProgress = (
    curriculum: StudentCurriculum,
    targetProgress: number,
    baseDate: Date = new Date()
): string => {
    const allSections = getAllSectionsForCurriculum(curriculum);
    let targetIndex = -1;
    for (let i = 0; i < allSections.length; i++) {
        const section = allSections[i];
        if (targetProgress >= section.progressStart && targetProgress <= section.progressEnd) {
            targetIndex = i;
            break;
        }
    }

    if (targetIndex === -1) {
        return curriculum.start_date;
    }

    let studyDays: string[] = [];
    if (Array.isArray(curriculum.study_days)) {
        studyDays = curriculum.study_days;
    } else if (typeof curriculum.study_days === 'string') {
        try {
            studyDays = JSON.parse((curriculum.study_days as string).replace(/'/g, '"'));
        } catch (e) { }
    }
    const normalizedStudyDays = studyDays.map(d => d.toLowerCase());

    const adjustedBaseDate = new Date(baseDate);
    for (let i = 0; i < 7; i++) {
        const dayOfWeek = adjustedBaseDate.getDay();
        let dayCode = '';
        Object.entries(DAY_MAP).forEach(([code, num]) => {
            if (num === dayOfWeek) dayCode = code;
        });

        if (dayCode && normalizedStudyDays.includes(dayCode.toLowerCase())) {
            break;
        }
        adjustedBaseDate.setDate(adjustedBaseDate.getDate() + 1);
    }

    const requiredStudyDays = targetIndex + 1;

    const breaks = (curriculum.breaks || []).map(b => ({
        start: parseBreakDate(b.start_date),
        end: parseBreakDate(b.end_date)
    }));

    let foundDays = 0;
    const checkDate = new Date(adjustedBaseDate);
    checkDate.setHours(0, 0, 0, 0);

    while (foundDays < requiredStudyDays) {
        let isBreak = false;
        for (const brk of breaks) {
            const s = new Date(brk.start); s.setHours(0, 0, 0, 0);
            const e = new Date(brk.end); e.setHours(23, 59, 59, 999);
            if (checkDate >= s && checkDate <= e) {
                isBreak = true;
                break;
            }
        }

        if (!isBreak) {
            const dayOfWeek = checkDate.getDay();
            let dayCode = '';
            Object.entries(DAY_MAP).forEach(([code, num]) => {
                if (num === dayOfWeek) dayCode = code;
            });

            if (dayCode && normalizedStudyDays.includes(dayCode.toLowerCase())) {
                foundDays++;
            }
        }

        if (foundDays === requiredStudyDays) {
            const year = checkDate.getFullYear();
            const month = String(checkDate.getMonth() + 1).padStart(2, '0');
            const day = String(checkDate.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        checkDate.setDate(checkDate.getDate() - 1);

        if (Math.abs(checkDate.getTime() - baseDate.getTime()) > 5 * 365 * 24 * 60 * 60 * 1000) {
            return curriculum.start_date;
        }
    }

    return curriculum.start_date;
};
