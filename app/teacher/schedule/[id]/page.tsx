'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Container,
    Title,
    Paper,
    Table,
    Text,
    Group,
    Badge,
    Box,
    Loader,
    Button,
    Stack,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconCalendar, IconArrowLeft, IconBook, IconHeadphones } from '@tabler/icons-react';

interface CurriculumItem {
    id: string;
    sequence: number;
    item_type: 'wordbook' | 'listening';
    item_id: string;
    test_type: string;
    daily_amount: number;
    word_count: number;
    time_limit_seconds: number;
    passing_score: number;
    item_details?: {
        id: string;
        title: string;
        word_count?: number;
    };
}

interface StudentCurriculum {
    id: string;
    student_id: string;
    curriculum_id: string;
    start_date: string;
    study_days: string[]; // JSONB array: ["mon", "tue", "wed", "thu", "fri"]
    current_item_id: string;
    current_progress: number;
    users: {
        id: string;
        full_name: string;
        username: string;
        classes?: {
            id: string;
            name: string;
        };
    };
    curriculums: {
        id: string;
        name: string;
        description: string;
    };
    curriculum_items: CurriculumItem[];
}

interface DaySchedule {
    date: string;
    dayOfWeek: string;
    status: 'completed' | 'today' | 'upcoming' | 'none';
    itemTitle?: string;
    itemType?: 'wordbook' | 'listening';
}

interface WeekSchedule {
    weekLabel: string;
    weekPeriod: string;
    days: DaySchedule[];
    curriculumItemTitle: string;
    itemType: 'wordbook' | 'listening';
}

export default function StudentSchedulePage() {
    const params = useParams();
    const router = useRouter();
    const studentCurriculumId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [studentCurriculum, setStudentCurriculum] = useState<StudentCurriculum | null>(null);
    const [searchStartDate, setSearchStartDate] = useState<Date>(new Date());
    const [weekSchedules, setWeekSchedules] = useState<WeekSchedule[]>([]);

    // 요일 매핑
    const dayMap: { [key: string]: string } = {
        mon: '월',
        tue: '화',
        wed: '수',
        thu: '목',
        fri: '금',
        sat: '토',
        sun: '일',
    };

    // 학생 커리큘럼 데이터 로드
    const fetchStudentCurriculum = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/student-curriculums/${studentCurriculumId}`);
            if (!response.ok) throw new Error('Failed to fetch student curriculum');

            const data = await response.json();
            setStudentCurriculum(data.studentCurriculum);

            // 시작일 설정
            if (data.studentCurriculum.start_date) {
                setSearchStartDate(new Date(data.studentCurriculum.start_date));
            }
        } catch (error: any) {
            notifications.show({
                title: '오류',
                message: error.message || '학생 커리큘럼을 불러오는데 실패했습니다.',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudentCurriculum();
    }, [studentCurriculumId]);

    // 주간 일정 계산
    useEffect(() => {
        if (!studentCurriculum) return;

        const schedules = calculateWeekSchedules(
            studentCurriculum,
            searchStartDate
        );
        setWeekSchedules(schedules);
    }, [studentCurriculum, searchStartDate]);

    // 주간 일정 계산 함수
    const calculateWeekSchedules = (
        sc: StudentCurriculum,
        startDate: Date
    ): WeekSchedule[] => {
        const schedules: WeekSchedule[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // study_days를 요일 인덱스로 변환 (0=일요일, 1=월요일, ...)
        const studyDayIndexes = (sc.study_days || []).map((day) => {
            const dayKey = typeof day === 'string' ? day.toLowerCase() : '';
            const dayKorean = dayMap[dayKey];
            const dayIndex = ['일', '월', '화', '수', '목', '금', '토'].indexOf(dayKorean);
            return dayIndex;
        }).filter(idx => idx !== -1);

        if (studyDayIndexes.length === 0) {
            return [];
        }

        let currentDate = new Date(startDate);
        currentDate.setHours(0, 0, 0, 0);

        // 커리큘럼 항목들을 순서대로 배치
        const items = sc.curriculum_items || [];
        let itemIndex = 0;

        // 최대 12주 표시
        for (let weekNum = 0; weekNum < 12 && itemIndex < items.length; weekNum++) {
            const weekDays: DaySchedule[] = [];
            const weekStartDate = new Date(currentDate);

            // 이번 주의 학습 요일만 찾기
            let daysInWeek = 0;
            let checkDate = new Date(currentDate);

            while (daysInWeek < studyDayIndexes.length && daysInWeek < 7) {
                const dayOfWeek = checkDate.getDay();

                if (studyDayIndexes.includes(dayOfWeek)) {
                    const dateStr = checkDate.toISOString().split('T')[0];
                    const dayKorean = ['일', '월', '화', '수', '목', '금', '토'][dayOfWeek];

                    let status: 'completed' | 'today' | 'upcoming' | 'none' = 'upcoming';

                    if (checkDate < today) {
                        status = 'completed';
                    } else if (checkDate.getTime() === today.getTime()) {
                        status = 'today';
                    }

                    const currentItem = items[itemIndex];

                    weekDays.push({
                        date: dateStr,
                        dayOfWeek: dayKorean,
                        status,
                        itemTitle: currentItem?.item_details?.title,
                        itemType: currentItem?.item_type,
                    });

                    daysInWeek++;
                }

                checkDate.setDate(checkDate.getDate() + 1);
            }

            if (weekDays.length > 0 && itemIndex < items.length) {
                const weekEndDate = new Date(weekDays[weekDays.length - 1].date);
                const currentItem = items[itemIndex];

                schedules.push({
                    weekLabel: `${weekNum + 1}주차`,
                    weekPeriod: `(${weekStartDate.toLocaleDateString('ko-KR')} - ${weekEndDate.toLocaleDateString('ko-KR')})`,
                    days: weekDays,
                    curriculumItemTitle: currentItem?.item_details?.title || '항목 없음',
                    itemType: currentItem?.item_type || 'wordbook',
                });

                itemIndex++;
                currentDate = new Date(checkDate);
            } else {
                break;
            }
        }

        return schedules;
    };

    const getDayColor = (status: string) => {
        switch (status) {
            case 'completed': return '#90EE90'; // 연한 초록
            case 'today': return '#FFD93D'; // 노란색
            case 'upcoming': return '#FFFFFF'; // 흰색
            case 'none': return '#F0F0F0'; // 회색
            default: return '#FFFFFF';
        }
    };

    if (loading) {
        return (
            <Container size="xl" py={40}>
                <Group justify="center" style={{ minHeight: '50vh' }}>
                    <Loader size="xl" />
                </Group>
            </Container>
        );
    }

    if (!studentCurriculum) {
        return (
            <Container size="xl" py={40}>
                <Text>학생 커리큘럼을 찾을 수 없습니다.</Text>
            </Container>
        );
    }

    return (
        <Container size="xl" py={40}>
            {/* 헤더 */}
            <Group justify="space-between" mb="xl">
                <Box>
                    <Group gap="xs" mb="xs">
                        <Button
                            variant="subtle"
                            leftSection={<IconArrowLeft size={20} />}
                            onClick={() => router.back()}
                            style={{ padding: '0.5rem' }}
                        >
                            돌아가기
                        </Button>
                    </Group>
                    <Title order={1} style={{ fontWeight: 900 }}>
                        {studentCurriculum.users.full_name}의 학습 일정
                    </Title>
                    <Group gap="xs" mt="xs">
                        <Badge
                            size="lg"
                            variant="filled"
                            color="blue"
                            style={{ border: '2px solid black', borderRadius: '0px' }}
                        >
                            {studentCurriculum.users.classes?.name || '반 없음'}
                        </Badge>
                        <Badge
                            size="lg"
                            variant="filled"
                            color="yellow"
                            style={{ border: '2px solid black', borderRadius: '0px', color: 'black' }}
                        >
                            {studentCurriculum.curriculums.name}
                        </Badge>
                        <Text size="sm" c="dimmed">
                            시작일: {new Date(studentCurriculum.start_date).toLocaleDateString('ko-KR')}
                        </Text>
                    </Group>
                </Box>

                {/* 검색 시작일 */}
                <DateInput
                    value={searchStartDate}
                    onChange={(value) => setSearchStartDate(value as Date)}
                    label="검색 시작일"
                    placeholder="날짜를 선택하세요"
                    valueFormat="YYYY-MM-DD"
                    leftSection={<IconCalendar size={18} />}
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
                        },
                    }}
                    style={{ width: 250 }}
                />
            </Group>

            {/* 주차별 일정 */}
            <Stack gap="xl">
                {weekSchedules.map((week, weekIdx) => (
                    <Paper
                        key={weekIdx}
                        p="xl"
                        style={{
                            border: '4px solid black',
                            borderRadius: '0px',
                            background: 'white',
                        }}
                    >
                        {/* 주차 헤더 */}
                        <Paper
                            p="md"
                            mb="lg"
                            style={{
                                border: '3px solid black',
                                background: '#FFD93D',
                                borderRadius: '0px',
                            }}
                        >
                            <Group justify="space-between">
                                <Text fw={900} size="lg">
                                    {week.weekLabel} {week.weekPeriod}
                                </Text>
                                <Group gap="xs">
                                    {week.itemType === 'wordbook' ? (
                                        <IconBook size={20} />
                                    ) : (
                                        <IconHeadphones size={20} />
                                    )}
                                    <Text fw={700}>{week.curriculumItemTitle}</Text>
                                </Group>
                            </Group>
                        </Paper>

                        {/* 주간 일정 테이블 */}
                        <Box
                            style={{
                                border: '3px solid black',
                                borderRadius: '0px',
                                overflow: 'hidden',
                            }}
                        >
                            <Table>
                                <Table.Thead>
                                    <Table.Tr style={{ background: 'black' }}>
                                        <Table.Th
                                            style={{
                                                color: 'white',
                                                textAlign: 'center',
                                                padding: '1rem',
                                                fontWeight: 900,
                                                fontStyle: 'italic',
                                            }}
                                        >
                                            CURRICULUM
                                        </Table.Th>
                                        {week.days.map((day, dayIdx) => (
                                            <Table.Th
                                                key={dayIdx}
                                                style={{
                                                    background: '#FFD93D',
                                                    color: 'black',
                                                    textAlign: 'center',
                                                    padding: '1rem',
                                                    fontWeight: 900,
                                                    border: '2px solid black',
                                                }}
                                            >
                                                <div>{day.dayOfWeek}</div>
                                                <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                                    {day.date}
                                                </div>
                                            </Table.Th>
                                        ))}
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    <Table.Tr>
                                        <Table.Td
                                            style={{
                                                background: 'black',
                                                color: 'white',
                                                textAlign: 'center',
                                                padding: '3rem 1rem',
                                                fontWeight: 900,
                                                fontStyle: 'italic',
                                            }}
                                        >
                                            {week.curriculumItemTitle}
                                        </Table.Td>
                                        {week.days.map((day, dayIdx) => (
                                            <Table.Td
                                                key={dayIdx}
                                                style={{
                                                    background: getDayColor(day.status),
                                                    border:
                                                        day.status === 'today'
                                                            ? '4px solid black'
                                                            : '2px solid black',
                                                    textAlign: 'center',
                                                    padding: '3rem 1rem',
                                                    position: 'relative',
                                                }}
                                            >
                                                {day.status === 'none' && (
                                                    <Text c="dimmed" size="sm">
                                                        등록된 커리큘럼이 없습니다.
                                                    </Text>
                                                )}
                                            </Table.Td>
                                        ))}
                                    </Table.Tr>
                                </Table.Tbody>
                            </Table>
                        </Box>
                    </Paper>
                ))}

                {weekSchedules.length === 0 && (
                    <Paper p="xl" style={{ textAlign: 'center' }}>
                        <Text size="lg" c="dimmed">
                            표시할 학습 일정이 없습니다.
                        </Text>
                    </Paper>
                )}
            </Stack>
        </Container>
    );
}
