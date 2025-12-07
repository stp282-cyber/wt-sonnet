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
    Card,
    ThemeIcon,
    SimpleGrid
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconCalendar, IconRotate, IconPlayerPlay } from '@tabler/icons-react';
import { StudentCurriculum, CurriculumItem, Section, ScheduleItem, DAY_MAP } from '@/types/curriculum';
import { getWeekDays, getAllSectionsForCurriculum, getScheduleForDate } from '@/lib/curriculumUtils';

interface Student {
    id: string;
    full_name: string;
    username: string;
    classes?: {
        id: string;
        name: string;
    } | null;
}

export default function StudentLearningPage() {
    const router = useRouter();
    const [student, setStudent] = useState<Student | null>(null);
    const [curriculums, setCurriculums] = useState<StudentCurriculum[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSession, setActiveSession] = useState<any>(null);

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
                // 1. Fetch Curriculum
                const response = await fetch(`/api/student-curriculums/student/${user.id}`);
                if (!response.ok) throw new Error('Failed to fetch data');
                const data = await response.json();
                setStudent(data.student);
                setCurriculums(data.curriculums || []);

                // 2. Fetch Active Session
                const sessionRes = await fetch(`/api/test/session?studentId=${user.id}`);
                if (sessionRes.ok) {
                    const sessionData = await sessionRes.json();
                    if (sessionData.session) {
                        setActiveSession(sessionData.session);
                    }
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

        fetchStudentData();
    }, [router]);

    const handleResume = () => {
        if (!activeSession) return;
        const type = activeSession.session_data.type;
        const sData = activeSession.session_data;

        if (type === 'typing_test') {
            router.push(`/test/typing?itemId=${sData.itemId}&start=${sData.start}&end=${sData.end}&resume=true`);
        } else if (type === 'wrong_retry') {
            router.push(`/test/wrong-retry?resume=true&nextAction=${sData.nextAction || ''}`);
        } else if (type === 'review_test') {
            router.push(`/test/multiple-choice?resume=true&nextAction=${sData.nextAction || ''}`);
        } else if (type === 'wrong_flashcard') {
            router.push(`/test/wrong-flashcard?resume=true&nextAction=${sData.nextAction || ''}`);
        } else {
            notifications.show({ title: 'Error', message: 'Unknown session type', color: 'red' });
        }
    };

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

            {/* Resume Banner */}
            {activeSession && (
                <Paper
                    p="lg"
                    mb={30}
                    style={{
                        border: '3px solid black',
                        background: '#FFF9DB', // Light yellow
                        boxShadow: '6px 6px 0px black',
                    }}
                    className="animate-pulse-slow"
                >
                    <Group justify="space-between">
                        <Group>
                            <ThemeIcon size={40} color="black" variant="filled" radius="md">
                                <IconRotate size={24} />
                            </ThemeIcon>
                            <div>
                                <Text fw={900} size="lg">학습 중단된 시험이 있습니다!</Text>
                                <Text size="sm" c="dimmed">마지막 저장: {new Date(activeSession.updated_at).toLocaleString()}</Text>
                            </div>
                        </Group>
                        <Button
                            onClick={handleResume}
                            size="md"
                            color="dark"
                            leftSection={<IconPlayerPlay size={20} />}
                            style={{
                                border: '2px solid black',
                                boxShadow: '4px 4px 0px rgba(0,0,0,0.5)',
                            }}
                        >
                            이어서 풀기
                        </Button>
                    </Group>
                </Paper>
            )}

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
                                                                                    const itemId = schedule.item?.item_details?.id || schedule.item?.item_id;
                                                                                    // 1-based index to query string
                                                                                    if (itemId) {
                                                                                        router.push(`/test/flashcard?itemId=${itemId}&start=${schedule.progressStart}&end=${schedule.progressEnd}`);
                                                                                    }
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
