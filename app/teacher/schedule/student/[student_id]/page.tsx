'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
    Modal,
    NumberInput,
    Select,
    Checkbox,
    Switch,
    ActionIcon,
    SimpleGrid,
} from '@mantine/core';
import { DateInput, DatePickerInput } from '@mantine/dates';
import { IconArrowLeft, IconSettings, IconRefresh, IconCalendar, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

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
    test_type?: string;
    passing_score?: number;
    time_limit_seconds?: number;
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
    setting_overrides?: {
        passing_score?: number;
        time_limit_seconds?: number;
        daily_amount?: number;
        daily_amount_type?: 'section' | 'count';
        test_type?: string;
    };
    breaks?: {
        start_date: string;
        end_date: string;
        reason?: string;
    }[];
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
            // Determine effective settings (Override > Default)
            const overrideSettings = curriculum.setting_overrides || {};

            const effectiveType = (overrideSettings.daily_amount_type as 'section' | 'count') || item.daily_amount_type || 'count';
            // If section type: use override daily_amount (as sections) or item daily_amount (as sections) or default 1
            // If count type: use override daily_amount (as words) or item daily_word_count or item daily_amount (as words) or default 20
            let effectiveAmount = overrideSettings.daily_amount || (effectiveType === 'section' ? item.daily_amount : (item.daily_word_count || item.daily_amount)) || (effectiveType === 'section' ? 1 : 20);

            // Safety check: If type is section but amount is suspiciously large (> 5), assume it's an error and default to 1
            if (effectiveType === 'section' && effectiveAmount > 5) {
                effectiveAmount = 1;
            }

            if (effectiveType === 'section') {
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
                // Override applied here
                const dailyUnitAmount = effectiveAmount;

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
                // Override applied here
                const dailyCount = effectiveAmount;

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

                            scheduleItems.push({
                                section: endSection,
                                item,
                                progressStart: globalWordProgress,
                                progressEnd: globalWordProgress + currentChunkWords - 1,
                                title: startSection.unit_name === endSection.unit_name
                                    ? startSection.unit_name
                                    : `${startSection.unit_name} ~ ${endSection.unit_name}`,
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

                        scheduleItems.push({
                            section: endSection,
                            item,
                            progressStart: globalWordProgress,
                            progressEnd: globalWordProgress + currentChunkWords - 1,
                            title: startSection.unit_name === endSection.unit_name
                                ? startSection.unit_name
                                : `${startSection.unit_name} ~ ${endSection.unit_name}`,
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

    // Check for breaks
    const breaks = (curriculum.breaks || []).map(b => ({
        start: new Date(b.start_date),
        end: new Date(b.end_date)
    }));

    // If target date is within a break, return null (no class)
    for (const brk of breaks) {
        const s = new Date(brk.start); s.setHours(0, 0, 0, 0);
        const e = new Date(brk.end); e.setHours(0, 0, 0, 0);
        if (targetDate >= s && targetDate <= e) return null;
    }

    let studyDayCount = 0;
    const checkDate = new Date(startDate);
    checkDate.setHours(0, 0, 0, 0);

    // 시작일부터 targetDate까지 학습일 수 계산
    while (checkDate <= targetDate) {
        // Check if checkDate is in break
        let isBreak = false;
        for (const brk of breaks) {
            const s = new Date(brk.start); s.setHours(0, 0, 0, 0);
            const e = new Date(brk.end); e.setHours(0, 0, 0, 0);
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
        };
    }

    return null;
};

export default function StudentSchedulePage() {
    const params = useParams();
    const router = useRouter();
    const [student, setStudent] = useState<Student | null>(null);
    const [curriculums, setCurriculums] = useState<StudentCurriculum[]>([]);
    const [loading, setLoading] = useState(true);
    // 초기 날짜 설정: 토/일이면 다음주 월요일로 설정
    const [searchStartDate, setSearchStartDate] = useState<Date>(() => {
        const d = new Date();
        const day = d.getDay();
        if (day === 0) d.setDate(d.getDate() + 1); // 일 -> 월
        if (day === 6) d.setDate(d.getDate() + 2); // 토 -> 월
        return d;
    });

    // Modals State
    const [activeModal, setActiveModal] = useState<'settings' | 'progress' | 'schedule' | 'delete' | null>(null);
    const [selectedCurriculum, setSelectedCurriculum] = useState<StudentCurriculum | null>(null);

    // Settings Form State
    const [settingsForm, setSettingsForm] = useState({
        passing_score: 80,
        time_limit_seconds: 20,
        daily_amount: 20,
        daily_amount_type: 'count',
        test_type: 'multiple_choice'
    });

    // Progress Form State
    const [progressForm, setProgressForm] = useState({
        current_item_id: '',
        current_progress: 1
    });

    // Schedule Form State
    const [scheduleForm, setScheduleForm] = useState({
        study_days: [] as string[],
        breaks: [] as { start_date: string; end_date: string; reason?: string }[],
        newBreak: [null, null] as [Date | null, Date | null]
    });

    const fetchStudentData = async () => {
        if (!params.student_id) return;
        try {
            const response = await fetch(`/api/student-curriculums/student/${params.student_id}`);
            if (!response.ok) throw new Error('Failed to fetch data');

            const data = await response.json();
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

    useEffect(() => {
        fetchStudentData();
    }, [params.student_id]);

    // Handlers
    const openSettingsModal = (curr: StudentCurriculum) => {
        setSelectedCurriculum(curr);
        const item = curr.curriculum_items[0];
        const override = curr.setting_overrides;

        const type = (override?.daily_amount_type as any)
            ?? item?.daily_amount_type
            ?? 'count';

        let amount = override?.daily_amount;
        if (!amount) {
            if (type === 'section') {
                amount = item?.daily_amount ?? 1;
            } else {
                amount = item?.daily_word_count ?? item?.daily_amount ?? 20;
            }
        } else {
            // Safety check for legacy data
            if (type === 'section' && amount > 5) {
                amount = 1;
            }
        }

        setSettingsForm({
            passing_score: override?.passing_score ?? item?.passing_score ?? 80,
            time_limit_seconds: override?.time_limit_seconds ?? item?.time_limit_seconds ?? 20,
            daily_amount: amount,
            daily_amount_type: type,
            test_type: override?.test_type ?? item?.test_type ?? 'multiple_choice'
        });
        setActiveModal('settings');
    };

    const openProgressModal = (curr: StudentCurriculum) => {
        setSelectedCurriculum(curr);
        setProgressForm({
            current_item_id: curr.current_item_id || curr.curriculum_items[0]?.item_id || '',
            current_progress: curr.current_progress || 1
        });
        setActiveModal('progress');
    };

    const openScheduleModal = (curr: StudentCurriculum) => {
        setSelectedCurriculum(curr);
        let days: string[] = [];
        if (typeof curr.study_days === 'string') {
            try { days = JSON.parse(curr.study_days.replace(/'/g, '"')); } catch (e) { }
        } else if (Array.isArray(curr.study_days)) {
            days = curr.study_days;
        }
        setScheduleForm({
            study_days: days,
            breaks: curr.breaks || [],
            newBreak: [null, null]
        });
        setActiveModal('schedule');
    };

    const openDeleteModal = (curr: StudentCurriculum) => {
        setSelectedCurriculum(curr);
        setActiveModal('delete');
    };

    const handleSaveSettings = async () => {
        if (!selectedCurriculum) return;
        try {
            const res = await fetch(`/api/student-curriculums/${selectedCurriculum.id}/settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ setting_overrides: settingsForm })
            });
            if (!res.ok) throw new Error('Failed to update settings');
            notifications.show({ title: '성공', message: '학습 설정이 저장되었습니다.', color: 'green' });
            setActiveModal(null);
            fetchStudentData();
        } catch (error) {
            notifications.show({ title: '오류', message: '설정 저장 실패', color: 'red' });
        }
    };

    const handleSaveProgress = async () => {
        if (!selectedCurriculum) return;
        try {
            const res = await fetch(`/api/student-curriculums/${selectedCurriculum.id}/progress`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(progressForm)
            });
            if (!res.ok) throw new Error('Failed to update progress');
            notifications.show({ title: '성공', message: '수업 진도가 변경되었습니다.', color: 'green' });
            setActiveModal(null);
            fetchStudentData();
        } catch (error) {
            notifications.show({ title: '오류', message: '진도 변경 실패', color: 'red' });
        }
    };

    const handleSaveSchedule = async () => {
        if (!selectedCurriculum) return;
        try {
            const res = await fetch(`/api/student-curriculums/${selectedCurriculum.id}/schedule`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    study_days: scheduleForm.study_days,
                    breaks: scheduleForm.breaks
                })
            });
            if (!res.ok) throw new Error('Failed to update schedule');
            notifications.show({ title: '성공', message: '학습 일정이 변경되었습니다.', color: 'green' });
            setActiveModal(null);
            fetchStudentData();
        } catch (error) {
            notifications.show({ title: '오류', message: '일정 변경 실패', color: 'red' });
        }
    };

    const handleDeleteCurriculum = async () => {
        if (!selectedCurriculum) return;
        try {
            const res = await fetch(`/api/student-curriculums/${selectedCurriculum.id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete');
            notifications.show({ title: '성공', message: '커리큘럼이 삭제되었습니다.', color: 'green' });
            setActiveModal(null);
            fetchStudentData();
        } catch (error) {
            notifications.show({ title: '오류', message: '삭제 실패', color: 'red' });
        }
    };

    if (loading) {
        return (
            <Container size="xl" py={40}>
                <Center style={{ minHeight: '60vh' }}>
                    <Loader size="xl" color="yellow" type="dots" />
                </Center>
            </Container>
        );
    }

    if (!student) {
        return (
            <Container size="xl" py={40}>
                <Center style={{ minHeight: '60vh' }}>
                    <Text>학생 정보를 찾을 수 없습니다.</Text>
                </Center>
            </Container>
        );
    }

    const weeksToRender = [0, 1, 2, 3];

    return (
        <Container size="xl" py={40}>
            {/* 상단 헤더 */}
            <Group justify="space-between" mb="xl">
                <Group>
                    <Title order={2} style={{ fontWeight: 900 }}>수업일지</Title>
                    <Badge size="lg" color="yellow" variant="filled" radius="xs" style={{ border: '2px solid black', color: 'black' }}>
                        {student.full_name}
                    </Badge>
                    <Badge size="lg" color="gray" variant="filled" radius="xs" style={{ border: '2px solid black' }}>
                        {student.classes?.name || '반 없음'}
                    </Badge>
                </Group>
                <Group>
                    <Group gap="xs">
                        <Text fw={700}>검색시작일</Text>
                        <DateInput
                            value={searchStartDate}
                            onChange={(date) => date && setSearchStartDate(date)}
                            valueFormat="YYYY-MM-DD"
                            size="sm"
                            styles={{
                                input: {
                                    fontWeight: 'bold',
                                    border: '2px solid black',
                                    borderRadius: '0px',
                                    width: '140px'
                                }
                            }}
                        />
                    </Group>
                    <Button
                        variant="outline"
                        color="dark"
                        leftSection={<IconArrowLeft size={16} />}
                        onClick={() => router.back()}
                        style={{ border: '2px solid black', borderRadius: '0px' }}
                    >
                        뒤로가기
                    </Button>
                </Group>
            </Group>

            {/* 주차별 테이블 */}
            <Stack gap={30}>
                {weeksToRender.map((weekOffset) => {
                    const weekDays = getWeekDays(searchStartDate, weekOffset);
                    const weekLabel = weekOffset === 0 ? "이번주" : weekOffset === 1 ? "다음주" : `${weekOffset}주 후`;

                    return (
                        <Box key={weekOffset}>
                            <Text fw={900} size="lg" mb="xs">{weekLabel}</Text>

                            {/* 공통 헤더 (요일/날짜) */}
                            <div style={{ display: 'flex', marginBottom: -3 }}> {/* 음수 마진으로 아래 테이블과 연결된 느낌 */}
                                <Box style={{ width: '200px', minWidth: '200px' }} />
                                <Box style={{
                                    flex: 1,
                                    display: 'flex',
                                    border: '3px solid black',
                                    background: '#FFD93D'
                                }}>
                                    {weekDays.map((day, idx) => (
                                        <Box
                                            key={idx}
                                            style={{
                                                flex: 1,
                                                padding: '8px',
                                                borderRight: idx < 4 ? '2px solid black' : 'none',
                                                textAlign: 'center'
                                            }}
                                        >
                                            <Text fw={900} size="lg">{day.dayOfWeek}</Text>
                                            <Text size="xs" fw={700}>{day.date}</Text>
                                        </Box>
                                    ))}
                                </Box>
                            </div>

                            {curriculums.map((curr) => (
                                <Paper key={curr.id} mb="xs" style={{ border: '3px solid black', borderRadius: '0px', overflow: 'hidden' }}>
                                    <div style={{ display: 'flex' }}>
                                        {/* 좌측 커리큘럼 정보 */}
                                        <Box style={{
                                            width: '200px',
                                            minWidth: '200px',
                                            background: 'white',
                                            borderRight: '3px solid black',
                                            padding: '16px'
                                        }}>
                                            <Text fw={900} size="md" mb="xs" style={{ lineHeight: 1.2 }}>
                                                {curr.curriculums.name}
                                            </Text>
                                            <Text size="xs" c="dimmed" mb="md">
                                                시작일: {curr.start_date}
                                            </Text>

                                            <Stack gap={6}>
                                                <Button
                                                    size="xs"
                                                    variant="outline"
                                                    color="dark"
                                                    fullWidth
                                                    leftSection={<IconSettings size={14} />}
                                                    style={{ border: '2px solid black', borderRadius: '0px' }}
                                                    onClick={() => openSettingsModal(curr)}
                                                >
                                                    학습 설정
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    variant="outline"
                                                    color="green"
                                                    fullWidth
                                                    leftSection={<IconRefresh size={14} />}
                                                    style={{ border: '2px solid black', borderRadius: '0px' }}
                                                    onClick={() => openProgressModal(curr)}
                                                >
                                                    수업 진도 변경
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    variant="outline"
                                                    color="blue"
                                                    fullWidth
                                                    leftSection={<IconCalendar size={14} />}
                                                    style={{ border: '2px solid black', borderRadius: '0px' }}
                                                    onClick={() => openScheduleModal(curr)}
                                                >
                                                    학습 일정 변경
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    variant="filled"
                                                    color="red"
                                                    fullWidth
                                                    leftSection={<IconTrash size={14} />}
                                                    style={{ border: '2px solid black', borderRadius: '0px' }}
                                                    onClick={() => openDeleteModal(curr)}
                                                >
                                                    커리큘럼 삭제
                                                </Button>
                                            </Stack>
                                        </Box>

                                        {/* 우측 달력 영역 (헤더 없음) */}
                                        <Box style={{ flex: 1, display: 'flex' }}>
                                            {weekDays.map((day, idx) => {
                                                const schedule = getScheduleForDate(curr, day.date);

                                                return (
                                                    <Box
                                                        key={idx}
                                                        style={{
                                                            flex: 1,
                                                            borderRight: idx < 4 ? '2px solid black' : 'none',
                                                            display: 'flex',
                                                            flexDirection: 'column'
                                                        }}
                                                    >
                                                        {/* 학습 내용 */}
                                                        <Box style={{
                                                            padding: '10px',
                                                            flex: 1,
                                                            background: schedule?.status === 'today' ? '#fff9db' : 'white'
                                                        }}>
                                                            {schedule ? (
                                                                <Stack gap={4}>
                                                                    <Text fw={700} size="sm" lineClamp={2}>
                                                                        {schedule.itemTitle}
                                                                    </Text>

                                                                    <Group gap={4}>
                                                                        <Text size="xs" c="dimmed">대단원:</Text>
                                                                        <Text size="xs" fw={600}>{schedule.majorUnit}</Text>
                                                                    </Group>

                                                                    <Group gap={4}>
                                                                        <Text size="xs" c="dimmed">소단원:</Text>
                                                                        <Text size="xs" fw={600}>{schedule.minorUnit}</Text>
                                                                    </Group>

                                                                    <Group gap={4}>
                                                                        <Text size="xs" c="dimmed">단원명:</Text>
                                                                        <Text size="xs" fw={600}>{schedule.unitName}</Text>
                                                                    </Group>

                                                                    <Box style={{
                                                                        background: '#FFF9DB',
                                                                        padding: '6px',
                                                                        marginTop: '4px',
                                                                        border: '1px solid #FFD93D',
                                                                        borderRadius: '4px'
                                                                    }}>
                                                                        <Text size="xs" fw={700} ta="center">진도 범위</Text>
                                                                        <Text size="xs" ta="center">{schedule.progressRange}</Text>
                                                                    </Box>

                                                                    <Group justify="space-between" mt={4}>
                                                                        <Text size="xs" c="dimmed">{day.date}</Text>
                                                                        <Badge size="sm" color="yellow" variant="filled" radius="xs" style={{ border: '1px solid black', color: 'black' }}>
                                                                            {schedule.wordCount}개 단어
                                                                        </Badge>
                                                                    </Group>
                                                                </Stack>
                                                            ) : (
                                                                <Center style={{ height: '100%', minHeight: '120px' }}>
                                                                    <Text size="xs" c="dimmed">-</Text>
                                                                </Center>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    </div>
                                </Paper>
                            ))}

                            {curriculums.length === 0 && (
                                <Paper p="xl" style={{ border: '2px solid black', borderRadius: '0px', textAlign: 'center' }}>
                                    <Text c="dimmed">등록된 커리큘럼이 없습니다.</Text>
                                </Paper>
                            )}
                        </Box>
                    );
                })}
            </Stack>

            {/* 학습 설정 모달 */}
            <Modal opened={activeModal === 'settings'} onClose={() => setActiveModal(null)} title="학습 설정 변경" centered>
                <Stack>
                    <Select
                        label="시험 방식"
                        data={[
                            { value: 'multiple_choice', label: '객관식' },
                            { value: 'subjective', label: '주관식' },
                            { value: 'scramble', label: '단어 스크램블' } // 실제 지원 타입 확인 필요
                        ]}
                        value={settingsForm.test_type}
                        onChange={(val) => setSettingsForm({ ...settingsForm, test_type: val || 'multiple_choice' })}
                    />
                    <NumberInput
                        label="합격 기준 점수"
                        value={settingsForm.passing_score}
                        onChange={(val) => setSettingsForm({ ...settingsForm, passing_score: Number(val) })}
                        min={0} max={100}
                    />
                    <NumberInput
                        label="시험 제한 시간 (초)"
                        value={settingsForm.time_limit_seconds}
                        onChange={(val) => setSettingsForm({ ...settingsForm, time_limit_seconds: Number(val) })}
                        min={10}
                    />
                    <Select
                        label="일일 학습량 기준"
                        data={[
                            { value: 'count', label: '단어 수 기준' },
                            { value: 'section', label: '소단원 기준' }
                        ]}
                        value={settingsForm.daily_amount_type}
                        onChange={(val: any) => {
                            const newType = val || 'count';
                            // Reset amount to default when type changes
                            const newAmount = newType === 'section' ? 1 : 20;
                            setSettingsForm({
                                ...settingsForm,
                                daily_amount_type: newType,
                                daily_amount: newAmount
                            });
                        }}
                    />
                    <NumberInput
                        label="일일 학습량 (단어/문제 수)"
                        description={settingsForm.daily_amount_type === 'count' ? '하루에 학습할 단어 개수' : '하루에 학습할 소단원 개수'}
                        value={settingsForm.daily_amount}
                        onChange={(val) => setSettingsForm({ ...settingsForm, daily_amount: Number(val) })}
                        min={1}
                    />
                    <Button onClick={handleSaveSettings} color="yellow" variant="filled" fullWidth mt="md">
                        저장하기
                    </Button>
                </Stack>
            </Modal>

            {/* 진도 변경 모달 */}
            <Modal opened={activeModal === 'progress'} onClose={() => setActiveModal(null)} title="수업 진도 변경" centered>
                <Stack>
                    <Select
                        label="현재 단어장/학습항목"
                        data={selectedCurriculum?.curriculum_items.map(item => ({
                            value: item.item_id,
                            label: `${item.sequence}. ${item.item_details?.title || '제목 없음'}`
                        })) || []}
                        value={progressForm.current_item_id}
                        onChange={(val) => setProgressForm({ ...progressForm, current_item_id: val || '' })}
                    />
                    <NumberInput
                        label="현재 진행 단어/문제 번호"
                        description="예: 21번 단어부터 시작하려면 21 입력"
                        value={progressForm.current_progress}
                        onChange={(val) => setProgressForm({ ...progressForm, current_progress: Number(val) })}
                        min={1}
                    />
                    <Button onClick={handleSaveProgress} color="green" variant="filled" fullWidth mt="md">
                        변경 저장
                    </Button>
                </Stack>
            </Modal>

            {/* 일정 변경 모달 */}
            <Modal opened={activeModal === 'schedule'} onClose={() => setActiveModal(null)} title="학습 일정 변경" centered size="lg">
                <Stack>
                    <Box>
                        <Text fw={700} mb="xs">학습 요일 선택</Text>
                        <Group>
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                <Checkbox
                                    key={day}
                                    label={day}
                                    checked={scheduleForm.study_days.includes(day)}
                                    onChange={(event) => {
                                        const checked = event.currentTarget.checked;
                                        setScheduleForm(prev => ({
                                            ...prev,
                                            study_days: checked
                                                ? [...prev.study_days, day]
                                                : prev.study_days.filter(d => d !== day)
                                        }));
                                    }}
                                />
                            ))}
                        </Group>
                    </Box>

                    <Box>
                        <Text fw={700} mb="xs">공강/방학 기간 설정 (기간 내 학습 일정 뒤로 밀림)</Text>
                        <Stack gap="xs">
                            {scheduleForm.breaks.map((brk, idx) => (
                                <Group key={idx} justify="space-between" style={{ border: '1px solid #eee', padding: '8px', borderRadius: '4px' }}>
                                    <Text size="sm">{brk.start_date} ~ {brk.end_date} ({brk.reason || 'Schedules pushed'})</Text>
                                    <ActionIcon color="red" variant="subtle" onClick={() => {
                                        setScheduleForm(prev => ({
                                            ...prev,
                                            breaks: prev.breaks.filter((_, i) => i !== idx)
                                        }));
                                    }}>
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                </Group>
                            ))}
                        </Stack>

                        <Group align="flex-end" mt="sm">
                            <DatePickerInput
                                type="range"
                                label="새로운 공강 기간 추가"
                                placeholder="날짜 선택"
                                value={scheduleForm.newBreak}
                                onChange={(val) => setScheduleForm(prev => ({ ...prev, newBreak: val }))}
                                style={{ flex: 1 }}
                            />
                            <Button variant="outline" onClick={() => {
                                const [start, end] = scheduleForm.newBreak;
                                if (start && end) {
                                    const formatDate = (d: Date) => {
                                        const year = d.getFullYear();
                                        const month = String(d.getMonth() + 1).padStart(2, '0');
                                        const day = String(d.getDate()).padStart(2, '0');
                                        return `${year}-${month}-${day}`;
                                    };
                                    setScheduleForm(prev => ({
                                        ...prev,
                                        breaks: [...prev.breaks, {
                                            start_date: formatDate(start),
                                            end_date: formatDate(end),
                                            reason: 'Holiday'
                                        }],
                                        newBreak: [null, null]
                                    }));
                                }
                            }}>추가</Button>
                        </Group>
                    </Box>

                    <Button onClick={handleSaveSchedule} color="blue" variant="filled" fullWidth mt="md">
                        일정 변경 저장
                    </Button>
                </Stack>
            </Modal>

            {/* 삭제 확인 모달 */}
            <Modal opened={activeModal === 'delete'} onClose={() => setActiveModal(null)} title="커리큘럼 삭제" centered>
                <Text size="sm" mb="lg">
                    정말로 이 학생의 커리큘럼을 삭제하시겠습니까? <br />
                    이 작업은 되돌릴 수 없으며 모든 학습 기록이 삭제될 수 있습니다.
                </Text>
                <Group justify="flex-end">
                    <Button variant="default" onClick={() => setActiveModal(null)}>취소</Button>
                    <Button color="red" onClick={handleDeleteCurriculum}>삭제하기</Button>
                </Group>
            </Modal>
        </Container>
    );
}
