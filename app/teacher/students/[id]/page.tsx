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
    Box,
    Loader,
    Center,
    Button,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconCalendar, IconArrowLeft } from '@tabler/icons-react';
import { StudentCurriculum, DAY_MAP } from '@/types/curriculum';
import { getWeekDays, getScheduleForDate } from '@/lib/curriculumUtils';

interface Student {
    id: string;
    full_name: string;
    username: string;
    classes?: {
        id: string;
        name: string;
    } | null;
}

export default function TeacherStudentDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [student, setStudent] = useState<Student | null>(null);
    const [curriculums, setCurriculums] = useState<StudentCurriculum[]>([]);
    const [loading, setLoading] = useState(true);
    const [studyLogs, setStudyLogs] = useState<any[]>([]);

    // 초기 날짜 설정: 토/일이면 다음주 월요일로 설정
    const [searchStartDate, setSearchStartDate] = useState<Date>(() => {
        const d = new Date('2025-12-06');
        const day = d.getDay();
        if (day === 0) d.setDate(d.getDate() + 1); // 일 -> 월
        if (day === 6) d.setDate(d.getDate() + 2); // 토 -> 월
        return d;
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Student & Curriculum
                const response = await fetch(`/api/student-curriculums/student/${params.id}`);
                if (!response.ok) throw new Error('Failed to fetch data');
                const data = await response.json();
                setStudent(data.student);
                setCurriculums(data.curriculums || []);

                // 2. Fetch Study Logs
                const logsRes = await fetch(`/api/study-logs?student_id=${params.id}`);
                if (logsRes.ok) {
                    const logsData = await logsRes.json();
                    setStudyLogs(logsData.logs || []);
                }
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

        if (params.id) {
            fetchData();
        }
    }, [params.id]);

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
                <Button
                    variant="subtle"
                    color="dark"
                    leftSection={<IconArrowLeft size={20} />}
                    onClick={() => router.back()}
                    mb="sm"
                >
                    돌아가기
                </Button>
                <Group justify="space-between" align="flex-end">
                    <div>
                        <Title order={1} style={{ fontWeight: 900, marginBottom: '0.5rem' }}>
                            {student?.full_name} 학습 현황
                        </Title>
                        <Text size="lg" c="dimmed">
                            {student?.username} | {student?.classes?.name || '반 미지정'}
                        </Text>
                    </div>

                    {/* 검색 시작일 선택 */}
                    <DateInput
                        value={searchStartDate}
                        onChange={(value) => setSearchStartDate(value as Date)}
                        valueFormat="YYYY-MM-DD"
                        leftSection={<IconCalendar size={18} />}
                        placeholder="시작일 선택"
                        styles={{
                            input: {
                                border: '3px solid black',
                                borderRadius: '0px',
                                background: '#FFD93D',
                                fontWeight: 900,
                                fontSize: '1rem',
                                width: '180px'
                            }
                        }}
                    />
                </Group>
            </Box>

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

                                                {/* 오른쪽: 일정 셀 */}
                                                <Box style={{ flex: 1, display: 'flex' }}>
                                                    {weekDays.map((day, idx) => {
                                                        const schedule = getScheduleForDate(curr, day.date);

                                                        // Check completion against logs
                                                        const isLogCompleted = studyLogs.some(log =>
                                                            log.curriculum_id === curr.curriculums.id &&
                                                            log.curriculum_item_id === schedule?.item?.id &&
                                                            log.scheduled_date === day.date &&
                                                            log.status === 'completed'
                                                        );

                                                        const isToday = schedule?.status === 'today';
                                                        const isCompleted = isLogCompleted;
                                                        const isMissed = !isCompleted && new Date(day.date) < new Date(new Date().setHours(0, 0, 0, 0)) && schedule;

                                                        return (
                                                            <Box
                                                                key={idx}
                                                                style={{
                                                                    flex: 1,
                                                                    borderRight: idx < 4 ? '3px solid black' : 'none',
                                                                    background: isCompleted ? '#D3F9D8' : (isMissed ? '#FFE3E3' : '#FFFFFF'),
                                                                    position: 'relative',
                                                                    margin: 0,
                                                                    padding: '1rem',
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    justifyContent: 'center',
                                                                    minHeight: '220px',
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

                                                                        {/* Status Indicators */}
                                                                        {isCompleted ? (
                                                                            <Badge color="green" variant="filled" size="lg" radius="xs" style={{ border: '2px solid black', width: '100%' }}>COMPLETED</Badge>
                                                                        ) : isMissed ? (
                                                                            <Badge color="red" variant="filled" size="lg" radius="xs" style={{ border: '2px solid black', width: '100%' }}>MISSED</Badge>
                                                                        ) : (
                                                                            <Badge color="gray" variant="outline" size="lg" radius="xs" style={{ border: '2px solid black', width: '100%', color: 'black' }}>SCHEDULED</Badge>
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
