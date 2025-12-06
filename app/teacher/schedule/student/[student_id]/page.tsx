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
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconSettings, IconRefresh, IconCalendar, IconTrash } from '@tabler/icons-react';

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
    item_details: {
        id: string;
        title: string;
        word_count?: number;
    } | null;
    sections: Section[];
}

// 학생 커리큘럼 인터페이스
interface StudentCurriculum {
    id: string;
    student_id: string;
    curriculum_id: string;
    start_date: string;
    study_days: string[];
    current_item_id: string | null;
    current_progress: number;
    curriculums: {
        id: string;
        name: string;
        description: string | null;
    };
    curriculum_items: CurriculumItem[];
}

// 학생 정보 인터페이스
interface Student {
    id: string;
    full_name: string;
    username: string;
    classes: {
        id: string;
        name: string;
    } | null;
}

// 학습 스케줄 항목 인터페이스
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

// 주간 날짜 인터페이스
interface WeekDay {
    date: string;
    dateObj: Date;
    dayOfWeek: string;
}

const DAYS_OF_WEEK = ['월', '화', '수', '목', '금'];
const DAY_MAP: { [key: string]: number } = {
    'mon': 1,
    'tue': 2,
    'wed': 3,
    'thu': 4,
    'fri': 5,
};

export default function StudentSchedulePage() {
    const params = useParams();
    const router = useRouter();
    const [studentIdParam, setStudentIdParam] = useState<string>('');

    const [student, setStudent] = useState<Student | null>(null);
    const [curriculums, setCurriculums] = useState<StudentCurriculum[]>([]);
    const [loading, setLoading] = useState(true);

    // 오늘이 토요일(6) 또는 일요일(0)이면 다음주 월요일로 설정
    const getInitialDate = () => {
        const today = new Date();
        const dayOfWeek = today.getDay();

        // 토요일(6) 또는 일요일(0)인 경우
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            const daysUntilMonday = dayOfWeek === 0 ? 1 : 2; // 일요일이면 1일, 토요일이면 2일 후
            const nextMonday = new Date(today);
            nextMonday.setDate(today.getDate() + daysUntilMonday);
            return nextMonday;
        }

        return today;
    };

    const [searchStartDate, setSearchStartDate] = useState<Date>(getInitialDate());

    useEffect(() => {
        const resolveParams = async () => {
            const resolvedParams = await params;
            if (resolvedParams && resolvedParams.student_id) {
                setStudentIdParam(resolvedParams.student_id as string);
            }
        };
        resolveParams();
    }, [params]);

    useEffect(() => {
        if (studentIdParam) {
            fetchStudentSchedule(studentIdParam);
        }
    }, [studentIdParam]);

    const fetchStudentSchedule = async (id: string) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/student-curriculums/student/${id}`);

            if (!response.ok) {
                throw new Error('Failed to fetch student schedule');
            }

            const data = await response.json();
            console.log('=== DEBUG: API Response ===');
            console.log('Student:', data.student);
            console.log('Curriculums:', data.curriculums);
            if (data.curriculums && data.curriculums.length > 0) {
                console.log('First curriculum items:', data.curriculums[0].curriculum_items);
                if (data.curriculums[0].curriculum_items && data.curriculums[0].curriculum_items.length > 0) {
                    console.log('First item sections:', data.curriculums[0].curriculum_items[0].sections);
                }
            }
            setStudent(data.student);
            setCurriculums(data.curriculums || []);
        } catch (error: any) {
            notifications.show({
                title: '오류',
                message: error.message || '학생 일정을 불러오는데 실패했습니다.',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    // 특정 주의 월~금 날짜 생성
    const getWeekDays = (startDate: Date, weekOffset: number): WeekDay[] => {
        const days: WeekDay[] = [];
        const currentDate = new Date(startDate);

        const day = currentDate.getDay();
        const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(currentDate.setDate(diff));
        monday.setDate(monday.getDate() + (weekOffset * 7));

        for (let i = 0; i < 5; i++) {
            const date = new Date(monday);
            date.setDate(date.getDate() + i);

            days.push({
                date: date.toISOString().split('T')[0],
                dateObj: date,
                dayOfWeek: DAYS_OF_WEEK[i],
            });
        }

        return days;
    };

    // 커리큘럼의 모든 소단원을 평탄화하여 학습 순서 생성
    const getAllSectionsForCurriculum = (curriculum: StudentCurriculum): { section: Section; item: CurriculumItem; progressStart: number }[] => {
        const allSections: { section: Section; item: CurriculumItem; progressStart: number }[] = [];
        let progressCounter = 1;

        curriculum.curriculum_items.forEach((item) => {
            if (item.sections && item.sections.length > 0) {
                item.sections.forEach((section) => {
                    const wordCount = section.word_count || 20;
                    allSections.push({
                        section,
                        item,
                        progressStart: progressCounter
                    });
                    progressCounter += wordCount;
                });
            }
        });

        return allSections;
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

        if (!currentDayCode || !curriculum.study_days.includes(currentDayCode)) {
            return null;
        }

        let studyDayCount = 0;
        const checkDate = new Date(startDate);
        checkDate.setHours(0, 0, 0, 0);

        while (checkDate <= targetDate) {
            const checkDayOfWeek = checkDate.getDay();
            let checkDayCode = '';
            Object.entries(DAY_MAP).forEach(([code, num]) => {
                if (num === checkDayOfWeek) checkDayCode = code;
            });

            if (checkDayCode && curriculum.study_days.includes(checkDayCode)) {
                studyDayCount++;
            }

            checkDate.setDate(checkDate.getDate() + 1);
        }

        const allSections = getAllSectionsForCurriculum(curriculum);

        if (studyDayCount > 0 && studyDayCount <= allSections.length) {
            const { section, item, progressStart } = allSections[studyDayCount - 1];
            const wordCount = section.word_count || 20;
            const progressEnd = progressStart + wordCount - 1;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let status: 'completed' | 'today' | 'upcoming' = 'upcoming';
            if (targetDate < today) status = 'completed';
            else if (targetDate.getTime() === today.getTime()) status = 'today';

            return {
                dayIndex: studyDayCount,
                itemTitle: item.item_details?.title || '제목 없음',
                majorUnit: section.major_unit || '대단원 미지정',
                minorUnit: section.minor_unit || String(studyDayCount),
                unitName: section.unit_name || `${studyDayCount}일차`,
                itemType: item.item_type,
                wordCount: wordCount,
                progressRange: `${progressStart}~${progressEnd}`,
                status,
            };
        }

        return null;
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
                            {/* 주차 라벨 */}
                            <Text fw={900} size="lg" mb="xs">{weekLabel}</Text>

                            {curriculums.map((curr) => (
                                <Paper key={curr.id} mb="md" style={{ border: '3px solid black', borderRadius: '0px', overflow: 'hidden' }}>
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
                                                >
                                                    학습 요일 변경
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    variant="filled"
                                                    color="red"
                                                    fullWidth
                                                    leftSection={<IconTrash size={14} />}
                                                    style={{ border: '2px solid black', borderRadius: '0px' }}
                                                >
                                                    커리큘럼 삭제
                                                </Button>
                                            </Stack>
                                        </Box>

                                        {/* 우측 달력 영역 */}
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
                                                        {/* 요일 헤더 */}
                                                        <Box style={{
                                                            background: '#FFD93D',
                                                            padding: '8px',
                                                            borderBottom: '2px solid black',
                                                            textAlign: 'center'
                                                        }}>
                                                            <Text fw={900} size="lg">{day.dayOfWeek}</Text>
                                                            <Text size="xs" fw={700}>{day.date}</Text>
                                                        </Box>

                                                        {/* 학습 내용 */}
                                                        <Box style={{
                                                            padding: '10px',
                                                            flex: 1,
                                                            background: schedule?.status === 'today' ? '#fff9db' : 'white'
                                                        }}>
                                                            {schedule ? (
                                                                <Stack gap={4}>
                                                                    {/* 교재명 */}
                                                                    <Text fw={700} size="sm" lineClamp={2}>
                                                                        {schedule.itemTitle}
                                                                    </Text>

                                                                    {/* 대단원 */}
                                                                    <Group gap={4}>
                                                                        <Text size="xs" c="dimmed">대단원:</Text>
                                                                        <Text size="xs" fw={600}>{schedule.majorUnit}</Text>
                                                                    </Group>

                                                                    {/* 소단원 */}
                                                                    <Group gap={4}>
                                                                        <Text size="xs" c="dimmed">소단원:</Text>
                                                                        <Text size="xs" fw={600}>{schedule.minorUnit}</Text>
                                                                    </Group>

                                                                    {/* 단원명 */}
                                                                    <Group gap={4}>
                                                                        <Text size="xs" c="dimmed">단원명:</Text>
                                                                        <Text size="xs" fw={600}>{schedule.dayIndex}일차</Text>
                                                                    </Group>

                                                                    {/* 진도 범위 */}
                                                                    <Box style={{
                                                                        background: '#e3f2fd',
                                                                        padding: '6px',
                                                                        marginTop: '4px',
                                                                        border: '1px solid #90caf9',
                                                                        borderRadius: '4px'
                                                                    }}>
                                                                        <Text size="xs" fw={700} ta="center">진도 범위</Text>
                                                                        <Text size="xs" ta="center">{schedule.progressRange}</Text>
                                                                    </Box>

                                                                    {/* 날짜 및 단어 수 */}
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
        </Container>
    );
}
