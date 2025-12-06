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
    Grid,
    Box,
    Loader,
    Center,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconBook, IconHeadphones, IconCalendar } from '@tabler/icons-react';

interface CurriculumItem {
    id: string;
    sequence: number;
    item_type: 'wordbook' | 'listening';
    item_id: string;
    test_type: string | null;
    daily_amount: number | null;
    word_count: number | null;
    item_details: {
        id: string;
        title: string;
        word_count?: number;
    } | null;
}

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

interface Student {
    id: string;
    full_name: string;
    username: string;
    classes: {
        id: string;
        name: string;
    } | null;
}

interface DaySchedule {
    date: string;
    dayOfWeek: string;
    items: {
        curriculum_name: string;
        item_title: string;
        item_type: 'wordbook' | 'listening';
        status: 'completed' | 'today' | 'upcoming';
    }[];
}

const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const DAY_MAP: { [key: string]: number } = {
    'sun': 0,
    'mon': 1,
    'tue': 2,
    'wed': 3,
    'thu': 4,
    'fri': 5,
    'sat': 6,
};

export default function StudentSchedulePage() {
    const params = useParams();
    const router = useRouter();
    const student_id = params.student_id as string;

    const [student, setStudent] = useState<Student | null>(null);
    const [curriculums, setCurriculums] = useState<StudentCurriculum[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        fetchStudentSchedule();
    }, [student_id]);

    const fetchStudentSchedule = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/student-curriculums/student/${student_id}`);

            if (!response.ok) {
                throw new Error('Failed to fetch student schedule');
            }

            const data = await response.json();
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

    // 캘린더 생성
    const generateCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const endDate = new Date(lastDay);
        endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

        const calendar: Date[] = [];
        const current = new Date(startDate);

        while (current <= endDate) {
            calendar.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        return calendar;
    };

    // 특정 날짜의 일정 계산
    const getScheduleForDate = (date: Date): DaySchedule['items'] => {
        const items: DaySchedule['items'] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        curriculums.forEach((curriculum) => {
            const startDate = new Date(curriculum.start_date);
            startDate.setHours(0, 0, 0, 0);

            if (targetDate < startDate) return;

            const dayOfWeek = targetDate.getDay();
            const dayName = Object.keys(DAY_MAP).find(key => DAY_MAP[key] === dayOfWeek);

            if (!dayName || !curriculum.study_days.includes(dayName)) return;

            // 시작일부터 해당 날짜까지의 학습일 수 계산
            let studyDayCount = 0;
            const checkDate = new Date(startDate);

            while (checkDate <= targetDate) {
                const checkDayOfWeek = checkDate.getDay();
                const checkDayName = Object.keys(DAY_MAP).find(key => DAY_MAP[key] === checkDayOfWeek);

                if (checkDayName && curriculum.study_days.includes(checkDayName)) {
                    studyDayCount++;
                }

                checkDate.setDate(checkDate.getDate() + 1);
            }

            // 해당 날짜에 학습할 항목 찾기
            if (studyDayCount > 0 && studyDayCount <= curriculum.curriculum_items.length) {
                const item = curriculum.curriculum_items[studyDayCount - 1];

                let status: 'completed' | 'today' | 'upcoming' = 'upcoming';
                if (targetDate < today) {
                    status = 'completed';
                } else if (targetDate.getTime() === today.getTime()) {
                    status = 'today';
                }

                items.push({
                    curriculum_name: curriculum.curriculums.name,
                    item_title: item.item_details?.title || '제목 없음',
                    item_type: item.item_type,
                    status,
                });
            }
        });

        return items;
    };

    const calendar = generateCalendar();
    const weeks: Date[][] = [];
    for (let i = 0; i < calendar.length; i += 7) {
        weeks.push(calendar.slice(i, i + 7));
    }

    const goToPreviousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    if (loading) {
        return (
            <Container size="xl" py={40}>
                <Center style={{ minHeight: '60vh' }}>
                    <Loader size="xl" />
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

    return (
        <Container size="xl" py={40}>
            {/* Header */}
            <Group justify="space-between" mb="xl">
                <div>
                    <Group gap="sm">
                        <Button
                            variant="outline"
                            color="dark"
                            leftSection={<IconArrowLeft size={18} />}
                            onClick={() => router.back()}
                            style={{ border: '2px solid black', borderRadius: '0px' }}
                        >
                            돌아가기
                        </Button>
                        <Title order={1} style={{ fontWeight: 900 }}>
                            {student.full_name}의 학습 일정
                        </Title>
                    </Group>
                    <Group gap="xs" mt="xs">
                        {student.classes && (
                            <Badge variant="filled" color="yellow" radius={0} style={{ border: '2px solid black', color: 'black' }}>
                                {student.classes.name}
                            </Badge>
                        )}
                        <Text c="dimmed" size="sm">
                            등록된 커리큘럼: {curriculums.length}개
                        </Text>
                    </Group>
                </div>
            </Group>

            <Grid gutter="xl">
                {/* 좌측: 커리큘럼 목록 */}
                <Grid.Col span={3}>
                    <Paper p="lg" style={{ border: '4px solid black', borderRadius: '0px', background: 'white' }}>
                        <Text fw={900} size="lg" mb="md">CURRICULUM</Text>
                        <Stack gap="md">
                            {curriculums.map((curriculum) => (
                                <Paper
                                    key={curriculum.id}
                                    p="md"
                                    style={{
                                        border: '3px solid black',
                                        borderRadius: '0px',
                                        background: '#FFD93D',
                                    }}
                                >
                                    <Text fw={900} size="sm" mb="xs">
                                        {curriculum.curriculums.name}
                                    </Text>
                                    <Text size="xs" c="dimmed" mb="xs">
                                        시작일: {curriculum.start_date}
                                    </Text>
                                    <Group gap={4} mb="xs">
                                        {curriculum.study_days.map((day) => (
                                            <Badge
                                                key={day}
                                                size="xs"
                                                variant="filled"
                                                color="dark"
                                                radius={0}
                                                style={{ border: '1px solid black' }}
                                            >
                                                {day.toUpperCase()}
                                            </Badge>
                                        ))}
                                    </Group>
                                    <Text size="xs" fw={700}>
                                        항목 수: {curriculum.curriculum_items.length}개
                                    </Text>
                                </Paper>
                            ))}
                        </Stack>
                    </Paper>
                </Grid.Col>

                {/* 우측: 캘린더 */}
                <Grid.Col span={9}>
                    <Paper p="xl" style={{ border: '4px solid black', borderRadius: '0px', background: 'white' }}>
                        {/* 월 네비게이션 */}
                        <Group justify="space-between" mb="xl">
                            <Button
                                variant="outline"
                                color="dark"
                                onClick={goToPreviousMonth}
                                style={{ border: '2px solid black', borderRadius: '0px' }}
                            >
                                이전 달
                            </Button>
                            <Group gap="xs">
                                <IconCalendar size={24} />
                                <Text fw={900} size="xl">
                                    {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                                </Text>
                            </Group>
                            <Button
                                variant="outline"
                                color="dark"
                                onClick={goToNextMonth}
                                style={{ border: '2px solid black', borderRadius: '0px' }}
                            >
                                다음 달
                            </Button>
                        </Group>

                        {/* 캘린더 */}
                        <Box>
                            {/* 요일 헤더 */}
                            <Grid gutter={0} mb="xs">
                                {DAYS_OF_WEEK.map((day, idx) => (
                                    <Grid.Col key={idx} span={12 / 7}>
                                        <Box
                                            p="sm"
                                            style={{
                                                background: idx === 0 ? '#FFB3B3' : idx === 6 ? '#B3D9FF' : '#FFD93D',
                                                border: '2px solid black',
                                                textAlign: 'center',
                                                fontWeight: 900,
                                            }}
                                        >
                                            {day}
                                        </Box>
                                    </Grid.Col>
                                ))}
                            </Grid>

                            {/* 주별 행 */}
                            {weeks.map((week, weekIdx) => (
                                <Grid key={weekIdx} gutter={0} mb="xs">
                                    {week.map((date, dayIdx) => {
                                        const items = getScheduleForDate(date);
                                        const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                                        const isToday = date.toDateString() === new Date().toDateString();

                                        return (
                                            <Grid.Col key={dayIdx} span={12 / 7}>
                                                <Box
                                                    p="xs"
                                                    style={{
                                                        border: isToday ? '4px solid black' : '2px solid black',
                                                        minHeight: 120,
                                                        background: isCurrentMonth ? 'white' : '#F5F5F5',
                                                        opacity: isCurrentMonth ? 1 : 0.5,
                                                    }}
                                                >
                                                    <Text
                                                        size="sm"
                                                        fw={isToday ? 900 : 700}
                                                        mb="xs"
                                                        style={{ color: dayIdx === 0 ? 'red' : dayIdx === 6 ? 'blue' : 'black' }}
                                                    >
                                                        {date.getDate()}
                                                    </Text>
                                                    <Stack gap={4}>
                                                        {items.map((item, itemIdx) => (
                                                            <Paper
                                                                key={itemIdx}
                                                                p={4}
                                                                style={{
                                                                    border: '2px solid black',
                                                                    borderRadius: '0px',
                                                                    background: item.status === 'completed' ? '#FFB3B3' : item.status === 'today' ? '#FFD93D' : 'white',
                                                                }}
                                                            >
                                                                <Group gap={4} wrap="nowrap">
                                                                    {item.item_type === 'wordbook' ? (
                                                                        <IconBook size={12} />
                                                                    ) : (
                                                                        <IconHeadphones size={12} />
                                                                    )}
                                                                    <Text size="xs" fw={700} lineClamp={1}>
                                                                        {item.item_title}
                                                                    </Text>
                                                                </Group>
                                                                <Text size="xs" c="dimmed" lineClamp={1}>
                                                                    {item.curriculum_name}
                                                                </Text>
                                                            </Paper>
                                                        ))}
                                                    </Stack>
                                                </Box>
                                            </Grid.Col>
                                        );
                                    })}
                                </Grid>
                            ))}
                        </Box>
                    </Paper>
                </Grid.Col>
            </Grid>
        </Container>
    );
}
