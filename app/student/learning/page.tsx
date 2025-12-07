'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Container,
    Title,
    Paper,
    Text,
    Group,
    Stack,
    Badge,
    Button,
    Box,
    Loader,
    Center,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconCalendar } from '@tabler/icons-react';

// 소단원 정보 인터페이스
interface Section {
    id: string;
    major_unit: string;
    minor_unit: string;
    unit_name: string;
    sequence: number;
    word_count: number;
}

// 커리큘럼 항목 인터페이스
interface CurriculumItem {
    id: string;
    sequence: number;
    item_type: 'wordbook' | 'listening';
    item_id: string;
    daily_amount_type?: 'section' | 'count';
    daily_amount?: number;
    daily_word_count?: number;
    daily_section_amount?: number;
    item_details: {
        id: string;
        title: string;
        word_count?: number;
    } | null;
    sections: Section[];
}

interface StudentCurriculum {
    id: string;
    student_id: string;
    curriculum_id: string;
    start_date: string;
    study_days: string[] | string;
    current_item_id: string | null;
    current_progress: number;
    curriculums: {
        id: string;
        name: string;
        description: string;
    };
    curriculum_items: CurriculumItem[];
}

interface Student {
    id: string;
    full_name: string;
    username: string;
    classes?: {
        id: string;
        name: string;
    } | null;
}

interface ScheduleItem {
    dayIndex: number;
    itemTitle: string;
    majorUnit: string;
    minorUnit: string;
    unitName: string;
    itemType: 'wordbook' | 'listening';
    wordCount: number;
    progressRange: string;
    status: 'completed' | 'today' | 'upcoming';
    // Add missing props for test navigation
    item: CurriculumItem;
    progressStart: number;
    progressEnd: number;
}

const DAY_MAP: { [key: string]: number } = {
    'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
};

// 날짜 유틸리티: 로컬 시간 기준 (월~금만 표시)
const getWeekDays = (startDate: Date, weekOffset: number) => {
    const days = [];
    // 이번주 월요일 찾기 (오늘이 일요일이면 전주 월요일)
    const current = new Date(startDate);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    current.setDate(diff + (weekOffset * 7));

    // 월요일부터 금요일까지 (5일)
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

// 커리큘럼의 모든 소단원을 평탄화하여 학습 순서 생성
const getAllSectionsForCurriculum = (curriculum: StudentCurriculum): {
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
    let globalWordProgress = 1;

    (curriculum.curriculum_items || []).forEach((item) => {
        if (item.item_type === 'wordbook' && item.sections && item.sections.length > 0) {
            const amountType = item.daily_amount_type || 'count'; // default to count

            if (amountType === 'section') {
                // 1. 섹션들을 Unit 단위(대단원-소단원)로 먼저 그룹화
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
                // 마지막 그룹 추가
                if (currentUnitSections.length > 0) {
                    unitGroups.push({
                        key: currentUnitKey,
                        sections: currentUnitSections,
                        wordCount: currentUnitSections.reduce((sum, s) => sum + (s.word_count || 0), 0)
                    });
                }

                // 2. 일일 학습량(daily_amount)만큼 Unit Group을 묶어서 배분
                const dailyUnitAmount = item.daily_amount || 1; // 기본 1개 유닛(예: 1-1)

                let currentDailyChunk: typeof unitGroups = [];
                for (let i = 0; i < unitGroups.length; i++) {
                    currentDailyChunk.push(unitGroups[i]);

                    if (currentDailyChunk.length >= dailyUnitAmount || i === unitGroups.length - 1) {
                        // 할당된 Unit Group들을 하나의 스케줄 아이템으로 병합
                        const startGroup = currentDailyChunk[0];
                        const endGroup = currentDailyChunk[currentDailyChunk.length - 1];

                        // 실제 포함된 모든 섹션들
                        const allSectionsInChunk = currentDailyChunk.flatMap(g => g.sections);
                        const chunkWordCount = currentDailyChunk.reduce((sum, g) => sum + g.wordCount, 0);

                        const startSection = allSectionsInChunk[0];
                        const endSection = allSectionsInChunk[allSectionsInChunk.length - 1];

                        // 타이틀 포맷팅 (단원명이 같으면 하나만, 다르면 범위 표시)
                        let unitTitle = startSection.unit_name;
                        if (startGroup.key !== endGroup.key) {
                            unitTitle = `${startSection.unit_name} ~ ${endSection.unit_name}`;
                        } else {
                            // 같은 챕터 내라면, unit_name이 "1. 제목" 형태일 수 있으므로 그대로 사용
                            unitTitle = startSection.unit_name;
                        }

                        scheduleItems.push({
                            section: endSection,
                            item,
                            progressStart: globalWordProgress,
                            progressEnd: globalWordProgress + chunkWordCount - 1,
                            title: unitTitle,
                            major: startSection.major_unit,
                            minor: currentDailyChunk.length > 1
                                ? `${startSection.minor_unit}~${endSection.minor_unit}`
                                : startSection.minor_unit,
                            isMultiSection: allSectionsInChunk.length > 1,
                            wordCount: chunkWordCount
                        });

                        globalWordProgress += chunkWordCount;
                        currentDailyChunk = [];
                    }
                }
            } else {
                // 단어 수(count) 단위로 진도 나감
                const dailyCount = item.daily_word_count || item.daily_amount || 20;

                let currentChunk: Section[] = [];
                let currentChunkWords = 0;

                for (let i = 0; i < item.sections.length; i++) {
                    const section = item.sections[i];
                    const sWordCount = section.word_count || 0;

                    if (currentChunkWords + sWordCount <= dailyCount * 1.3) {
                        // 오차범위 30% 허용
                        currentChunk.push(section);
                        currentChunkWords += sWordCount;
                    } else {
                        // 현재까지 묶인게 있으면 배정
                        if (currentChunk.length > 0) {
                            const startSection = currentChunk[0];
                            const endSection = currentChunk[currentChunk.length - 1];

                            // 유효한 제목 생성 (unit_name이 없으면 대단원-소단원 조합 사용)
                            const startTitle = startSection.unit_name || `${startSection.major_unit}-${startSection.minor_unit}`;
                            const endTitle = endSection.unit_name || `${endSection.major_unit}-${endSection.minor_unit}`;

                            scheduleItems.push({
                                section: endSection,
                                item,
                                progressStart: globalWordProgress,
                                progressEnd: globalWordProgress + currentChunkWords - 1,
                                title: startTitle === endTitle
                                    ? startTitle
                                    : `${startTitle} ~ ${endTitle}`,
                                major: startSection.major_unit,
                                minor: currentChunk.length > 1
                                    ? `${startSection.minor_unit}~${endSection.minor_unit}`
                                    : startSection.minor_unit,
                                isMultiSection: currentChunk.length > 1,
                                wordCount: currentChunkWords
                            });

                            globalWordProgress += currentChunkWords;
                            currentChunk = [];
                            currentChunkWords = 0;
                        }

                        currentChunk.push(section);
                        currentChunkWords += sWordCount;
                    }

                    // 마지막 처리
                    if (i === item.sections.length - 1 && currentChunk.length > 0) {
                        const startSection = currentChunk[0];
                        const endSection = currentChunk[currentChunk.length - 1];

                        const startTitle = startSection.unit_name || `${startSection.major_unit}-${startSection.minor_unit}`;
                        const endTitle = endSection.unit_name || `${endSection.major_unit}-${endSection.minor_unit}`;

                        scheduleItems.push({
                            section: endSection,
                            item,
                            progressStart: globalWordProgress,
                            progressEnd: globalWordProgress + currentChunkWords - 1,
                            title: startTitle === endTitle
                                ? startTitle
                                : `${startTitle} ~ ${endTitle}`,
                            major: startSection.major_unit,
                            minor: currentChunk.length > 1
                                ? `${startSection.minor_unit}~${endSection.minor_unit}`
                                : startSection.minor_unit,
                            isMultiSection: currentChunk.length > 1,
                            wordCount: currentChunkWords
                        });
                        globalWordProgress += currentChunkWords;
                    }
                }
            }
        }
    });

    return scheduleItems;
};

// 특정 날짜에 특정 커리큘럼의 학습 내용 계산
const getScheduleForDate = (curriculum: StudentCurriculum, dateStr: string): ScheduleItem | null => {
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

    let studyDayCount = 0;
    const checkDate = new Date(startDate);
    checkDate.setHours(0, 0, 0, 0);

    // 시작일부터 targetDate까지 학습일 수 계산
    while (checkDate <= targetDate) {
        const checkDayOfWeek = checkDate.getDay();
        let checkDayCode = '';
        Object.entries(DAY_MAP).forEach(([code, num]) => {
            if (num === checkDayOfWeek) checkDayCode = code;
        });

        if (checkDayCode && normalizedStudyDays.includes(checkDayCode.toLowerCase())) {
            studyDayCount++;
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
            progressEnd
        };
    }

    return null;
};

export default function StudentLearningPage() {
    const router = useRouter();
    const [student, setStudent] = useState<Student | null>(null);
    const [curriculums, setCurriculums] = useState<StudentCurriculum[]>([]);
    const [loading, setLoading] = useState(true);

    // 초기 날짜 설정: 토/일이면 다음주 월요일로 설정
    const [searchStartDate, setSearchStartDate] = useState<Date>(() => {
        // 기본값을 2025-12-06으로 고정 (요청사항 반영)
        // const d = new Date();
        const d = new Date('2025-12-06');
        const day = d.getDay();
        if (day === 0) d.setDate(d.getDate() + 1); // 일 -> 월
        if (day === 6) d.setDate(d.getDate() + 2); // 토 -> 월
        return d;
    });

    useEffect(() => {
        const fetchStudentData = async () => {
            if (typeof window === 'undefined') return;

            const userStr = localStorage.getItem('user');
            if (!userStr) {
                notifications.show({
                    title: '인증 오류',
                    message: '로그인이 필요합니다.',
                    color: 'red',
                });
                router.push('/');
                return;
            }

            const user = JSON.parse(userStr);
            if (user.role !== 'student') {
                notifications.show({
                    title: '권한 오류',
                    message: '학생만 접근 가능합니다.',
                    color: 'red',
                });
                return;
            }

            try {
                // 변경된 API 엔드포인트 사용
                const response = await fetch(`/api/student-curriculums/student/${user.id}`);
                if (!response.ok) throw new Error('Failed to fetch data');

                const data = await response.json();

                // API는 { student: ..., curriculums: ... } 형태로 반환
                console.log('Fetched Data:', data);
                setStudent(data.student);
                setCurriculums(data.curriculums || []);
            } catch (error) {
                console.error(error);
                notifications.show({
                    title: '오류',
                    message: '데이터를 불러오는데 실패했습니다.',
                    color: 'red'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStudentData();
    }, [router]);

    const weeksToRender = [0, 1, 2]; // 3주 표시

    if (loading) {
        return (
            <Container size="xl" py={40}>
                <Center style={{ minHeight: '60vh' }}>
                    <Loader size="xl" color="yellow" type="dots" />
                </Center>
            </Container>
        );
    }

    return (
        <Container size="xl" py={40}>
            {/* 페이지 헤더 */}
            <Box mb={30}>
                <Group justify="space-between" align="flex-end">
                    <div>
                        <Title order={1} style={{ fontWeight: 900, marginBottom: '0.5rem' }}>
                            나의 학습
                        </Title>
                        <Text size="lg" c="dimmed">
                            주간 학습 일정을 확인하세요
                        </Text>
                    </div>
                </Group>
            </Box>

            {/* 검색 시작일 선택 */}
            <Group justify="flex-end" mb={30}>
                <DateInput
                    value={searchStartDate}
                    onChange={(value) => setSearchStartDate(value as Date)}
                    label="검색 시작일"
                    placeholder="날짜를 선택하세요"
                    valueFormat="YYYY-MM-DD"
                    leftSection={<IconCalendar size={18} />}
                    popoverProps={{
                        width: 300,
                        shadow: 'md',
                        styles: {
                            dropdown: {
                                border: '3px solid black',
                                borderRadius: '0px',
                                boxShadow: '6px 6px 0px black',
                            }
                        }
                    }}
                    styles={{
                        input: {
                            border: '3px solid black',
                            borderRadius: '0px',
                            background: '#FFD93D',
                            fontWeight: 900,
                            fontSize: '1rem',
                        },
                        label: {
                            fontWeight: 900,
                            marginBottom: '0.5rem',
                        }
                    }}
                    style={{ width: 250 }}
                />
            </Group>

            {/* 주차별 테이블 */}
            <Stack gap={40}>
                {curriculums.length === 0 ? (
                    <Paper
                        p="xl"
                        style={{
                            border: '4px solid black',
                            borderRadius: '0px',
                            background: 'white',
                            boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                        }}
                    >
                        <Text ta="center" c="dimmed" size="lg">
                            등록된 커리큘럼이 없습니다.
                        </Text>
                    </Paper>
                ) : (
                    weeksToRender.map((weekOffset) => {
                        const weekDays = getWeekDays(searchStartDate, weekOffset);
                        const weekLabel = weekOffset === 0 ? "이번주" : weekOffset === 1 ? "다음주" : `${weekOffset}주 후`;

                        return (
                            <Box key={weekOffset}>
                                <Title order={3} mb="md" style={{ fontWeight: 800 }}>
                                    {weekLabel} 일정
                                </Title>

                                <Paper
                                    p="xl"
                                    style={{
                                        border: '4px solid black',
                                        borderRadius: '0px',
                                        background: 'white',
                                        boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                                    }}
                                >
                                    <Box
                                        style={{
                                            border: '3px solid black',
                                            borderRadius: '0px',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <div style={{ display: 'flex' }}>
                                            {/* 왼쪽: 커리큘럼 헤더 */}
                                            <Box style={{
                                                width: '180px',
                                                minWidth: '180px',
                                                background: 'black',
                                                color: 'white',
                                                display: 'flex',
                                                fontWeight: 900,
                                                fontStyle: 'italic',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '1rem',
                                                borderRight: '2px solid black'
                                            }}>
                                                CURRICULUM
                                            </Box>

                                            {/* 오른쪽: 요일 헤더 */}
                                            <Box style={{ flex: 1, display: 'flex', background: '#FFD93D' }}>
                                                {weekDays.map((day, idx) => (
                                                    <Box
                                                        key={idx}
                                                        style={{
                                                            flex: 1,
                                                            padding: '1rem',
                                                            borderRight: idx < 4 ? '2px solid black' : 'none',
                                                            textAlign: 'center',
                                                            color: 'black',
                                                            fontWeight: 900
                                                        }}
                                                    >
                                                        <div>{day.dayOfWeek}</div>
                                                        <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                                            {day.date}
                                                        </div>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </div>

                                        {curriculums.map((curr, cIdx) => (
                                            <div key={curr.id} style={{
                                                display: 'flex',
                                                borderTop: '3px solid black'
                                            }}>
                                                {/* 왼쪽: 커리큘럼 명 */}
                                                <Box style={{
                                                    width: '180px',
                                                    minWidth: '180px',
                                                    background: 'black',
                                                    color: 'white',
                                                    padding: '1rem',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                    textAlign: 'center',
                                                    borderRight: '2px solid black'
                                                }}>
                                                    <Text fw={900} size="lg" style={{ fontStyle: 'italic' }}>{curr.curriculums.name}</Text>
                                                    <Text size="xs" c="dimmed" mt={4}>
                                                        시작일: {curr.start_date}
                                                    </Text>
                                                </Box>

                                                {/* 오른쪽: 일정 셀 (Entrance Animation 적용) */}
                                                <Box style={{ flex: 1, display: 'flex' }}>
                                                    {weekDays.map((day, idx) => {
                                                        const schedule = getScheduleForDate(curr, day.date);
                                                        const isToday = schedule?.status === 'today';
                                                        const isCompleted = schedule?.status === 'completed';

                                                        // 애니메이션 딜레이: (커리큘럼 인덱스 * 5 + 날짜 인덱스) * 0.1s
                                                        const animationDelay = `${(cIdx * 5 + idx) * 0.05}s`;

                                                        return (
                                                            <Box
                                                                key={idx}
                                                                className="animate-fade-in-up"
                                                                style={{
                                                                    flex: 1,
                                                                    borderRight: idx < 4 ? '3px solid black' : 'none', // 굵은 구분선
                                                                    background: isCompleted ? '#E0E7FF' : (isToday ? '#FFFFFF' : '#FFFFFF'), // 완료된 항목은 아주 연한 파랑 or 흰색
                                                                    position: 'relative',
                                                                    margin: 0,
                                                                    padding: '1rem',
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    justifyContent: 'center',
                                                                    minHeight: '220px',
                                                                    animationDelay: animationDelay,
                                                                    opacity: 0, // 초기 투명도 (애니메이션으로 1됨)
                                                                    transition: 'background-color 0.2s ease'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (!isCompleted && schedule) {
                                                                        e.currentTarget.style.backgroundColor = '#FFFBE6'; // 호버 시 연한 노랑
                                                                    }
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    if (!isCompleted && schedule) {
                                                                        e.currentTarget.style.backgroundColor = isToday ? '#FFFFFF' : '#FFFFFF';
                                                                    }
                                                                }}
                                                            >
                                                                {/* 오늘 표시 테두리 (Overlay) */}
                                                                {isToday && (
                                                                    <div style={{
                                                                        position: 'absolute',
                                                                        top: 0, left: 0, right: 0, bottom: 0,
                                                                        border: '4px solid #FFD93D', // 오늘 날짜 강조 테두리
                                                                        zIndex: 10,
                                                                        pointerEvents: 'none'
                                                                    }} />
                                                                )}

                                                                {schedule ? (
                                                                    <Stack gap="md" style={{ position: 'relative', zIndex: 11 }}>
                                                                        <Box>
                                                                            <Badge
                                                                                color="black"
                                                                                radius="xs"
                                                                                size="md"
                                                                                variant="filled"
                                                                                style={{
                                                                                    marginBottom: '8px',
                                                                                    boxShadow: '2px 2px 0px black',
                                                                                    border: '1px solid black'
                                                                                }}
                                                                            >
                                                                                소단원 {schedule.minorUnit}
                                                                            </Badge>
                                                                            <Text fw={800} size="md" style={{ lineHeight: 1.3 }}>
                                                                                {schedule.unitName}
                                                                            </Text>
                                                                        </Box>

                                                                        <Paper
                                                                            p="xs"
                                                                            style={{
                                                                                background: '#FEF3C7',
                                                                                border: '2px solid black',
                                                                                borderRadius: '0px',
                                                                                boxShadow: '3px 3px 0px #E5E7EB'
                                                                            }}
                                                                        >
                                                                            <Text size="sm" fw={800} ta="center">진도: {schedule.progressRange}</Text>
                                                                        </Paper>

                                                                        {/* 시험 보기 버튼 - Neo-brutalism & Animation */}
                                                                        {schedule.status !== 'completed' && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    const itemId = schedule.item.item_details?.id || schedule.item.item_id;
                                                                                    // 1-based index to query string
                                                                                    router.push(`/test/flashcard?itemId=${itemId}&start=${schedule.progressStart}&end=${schedule.progressEnd}`);
                                                                                }}
                                                                                style={{
                                                                                    width: '100%',
                                                                                    padding: '0.6rem',
                                                                                    backgroundColor: '#FFD93D',
                                                                                    color: 'black',
                                                                                    fontWeight: 900,
                                                                                    fontSize: '0.9rem',
                                                                                    border: '3px solid black',
                                                                                    boxShadow: '4px 4px 0px 0px black',
                                                                                    cursor: 'pointer',
                                                                                    transition: 'all 0.1s ease',
                                                                                    marginTop: '0.5rem',
                                                                                    position: 'relative',
                                                                                }}
                                                                                onMouseEnter={(e) => {
                                                                                    e.currentTarget.style.transform = 'translate(-2px, -2px)';
                                                                                    e.currentTarget.style.boxShadow = '6px 6px 0px 0px black';
                                                                                }}
                                                                                onMouseLeave={(e) => {
                                                                                    e.currentTarget.style.transform = 'translate(0, 0)';
                                                                                    e.currentTarget.style.boxShadow = '4px 4px 0px 0px black';
                                                                                }}
                                                                                onMouseDown={(e) => {
                                                                                    e.currentTarget.style.transform = 'translate(2px, 2px)';
                                                                                    e.currentTarget.style.boxShadow = '0px 0px 0px 0px black';
                                                                                }}
                                                                                onMouseUp={(e) => {
                                                                                    e.currentTarget.style.transform = 'translate(-2px, -2px)';
                                                                                    e.currentTarget.style.boxShadow = '6px 6px 0px 0px black';
                                                                                }}
                                                                            >
                                                                                시험 보기
                                                                            </button>
                                                                        )}
                                                                    </Stack>
                                                                ) : (
                                                                    <Text c="dimmed" size="sm" ta="center">
                                                                        -
                                                                    </Text>
                                                                )}
                                                            </Box>
                                                        );
                                                    })}
                                                </Box>
                                            </div>
                                        ))}
                                    </Box>
                                </Paper>
                            </Box>
                        );
                    })
                )}
            </Stack>
        </Container>
    );
}
