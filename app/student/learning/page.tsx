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
    SimpleGrid,
    Skeleton
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
    const [studyLogs, setStudyLogs] = useState<any[]>([]);

    // Default date: Today
    const [searchStartDate, setSearchStartDate] = useState<Date>(new Date());

    useEffect(() => {
        const fetchStudentData = async () => {
            if (typeof window === 'undefined') return;

            const userStr = localStorage.getItem('user');
            if (!userStr) {
                notifications.show({
                    title: 'Authentication Error',
                    message: 'Please login first.',
                    color: 'red',
                });
                router.push('/');
                return;
            }

            const user = JSON.parse(userStr);
            if (user.role !== 'student') {
                notifications.show({
                    title: 'Permission Error',
                    message: 'Student access only.',
                    color: 'red',
                });
                return;
            }

            // Don't set full page loading on date change if we want smoother transitions, 
            // but for now, let's keep it simple and just optimizing the initial mount feel
            // or use specific loading states.
            // For now, we will use a single loading state but render a Skeleton UI instead of a spinner.
            setLoading(true);

            try {
                // Calculate date range for logs (Current week - 1 week to + 4 weeks for buffer)
                const startDate = new Date(searchStartDate);
                startDate.setDate(startDate.getDate() - 7);
                const endDate = new Date(searchStartDate);
                endDate.setDate(endDate.getDate() + 28);

                const formatDate = (d: Date) => d.toISOString().split('T')[0];

                // Parallel Fetching
                const [curriculumRes, sessionRes, logsRes] = await Promise.all([
                    fetch(`/api/student-curriculums/student/${user.id}`),
                    fetch(`/api/test/session?studentId=${user.id}`),
                    fetch(`/api/study-logs?student_id=${user.id}&start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}`)
                ]);

                // 1. Process Curriculum
                if (!curriculumRes.ok) throw new Error('Failed to fetch curriculum data');
                const curriculumData = await curriculumRes.json();
                setStudent(curriculumData.student);
                setCurriculums(curriculumData.curriculums || []);

                // 2. Process Session
                if (sessionRes.ok) {
                    const sessionData = await sessionRes.json();
                    if (sessionData.session) {
                        setActiveSession(sessionData.session);
                    }
                }

                // 3. Process Logs
                if (logsRes.ok) {
                    const logsData = await logsRes.json();
                    setStudyLogs(logsData.logs || []);
                }

            } catch (error) {
                console.error(error);
                notifications.show({
                    title: 'Error',
                    message: 'Failed to load data.',
                    color: 'red'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStudentData();
    }, [router, searchStartDate]);

    const handleResume = () => {
        if (!activeSession) return;
        const sData = activeSession.session_data;
        // Step-based routing
        const step = sData.step;

        switch (step) {
            case 'BASIC_TEST':
            case 'typing_test': // Legacy
                // Resume Basic Test
                router.push(`/test/typing?itemId=${sData.itemId}&start=${sData.start}&end=${sData.end}&resume=true`);
                break;
            case 'BASIC_WRONG_RETRY':
                // Resume Basic Wrong
                router.push(`/test/wrong-retry?mode=basic&resume=true`);
                break;
            case 'WRONG_FLASHCARD':
                // Resume Basic Wrong Flashcard (Review)
                router.push(`/test/wrong-flashcard?mode=basic&resume=true`);
                break;
            case 'REVIEW_TEST':
                // Resume Review Test
                router.push(`/test/multiple-choice?resume=true`);
                break;
            case 'REVIEW_WRONG_RETRY':
                // Resume Review Wrong
                router.push(`/test/wrong-retry?mode=review_wrong&resume=true`);
                break;
            case 'COMPLETED':
                notifications.show({ title: 'Completed', message: 'This test is already completed.', color: 'green' });
                // Maybe delete session?
                break;
            default:
                // Fallback 
                if (sData.type === 'typing_test') {
                    router.push(`/test/typing?itemId=${sData.itemId}&start=${sData.start}&end=${sData.end}&resume=true`);
                } else {
                    notifications.show({ title: 'Error', message: 'Unknown session state', color: 'red' });
                }
        }
    };

    const weeksToRender = [0, 1, 2]; // 3주 표시

    return (
        <Container size="xl" py={20}>
            {/* Custom Animations Styles */}
            <style jsx global>{`
                @keyframes slideUp {
                    from { transform: translateY(10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
                .hover-lift { transition: transform 0.2s, box-shadow 0.2s; }
                .hover-lift:hover { 
                    transform: translate(-4px, -4px); 
                    box-shadow: 8px 8px 0px black !important;
                }
                .neo-box {
                    border: 3px solid black;
                    border-radius: 0px;
                    box-shadow: 5px 5px 0px black;
                }
            `}</style>

            {/* Header Section with Date Picker - Compact Layout */}
            <Group justify="space-between" align="flex-end" mb={20} className="animate-slide-up" style={{ animationDelay: '0ms' }}>
                <Box>
                    <Box
                        style={{
                            display: 'inline-block',
                            background: '#000',
                            padding: '0.5rem 2rem',
                            marginBottom: '0.5rem',
                            transform: 'skew(-10deg)',
                            boxShadow: '8px 8px 0px #FFD43B'
                        }}
                    >
                        <Title order={1} style={{
                            fontWeight: 900,
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: '2.5rem',
                            color: 'white',
                            transform: 'skew(10deg)',
                            lineHeight: 1
                        }}>
                            MY LEARNING
                        </Title>
                    </Box>
                    <Text size="lg" fw={800} style={{ letterSpacing: '-0.5px', color: 'white' }}>
                        주간 학습 일정 및 진도 현황
                    </Text>
                </Box>

                {/* Date Input Moved Here */}
                <DateInput
                    value={searchStartDate}
                    onChange={(value) => setSearchStartDate(value as Date)}
                    label="검색 시작일"
                    placeholder="날짜 선택"
                    valueFormat="YYYY-MM-DD"
                    leftSection={<IconCalendar size={18} />}
                    popoverProps={{
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
                            height: '50px',
                            color: 'black'
                        },
                        label: {
                            fontWeight: 900,
                            marginBottom: '0.2rem',
                            color: 'white' // Updated Label Color
                        }
                    }}
                    style={{ width: 220 }}
                />
            </Group>

            {/* Resume Banner */}
            {loading ? (
                // Skeleton for Resume Banner
                <Paper
                    mb={20}
                    style={{
                        border: '3px solid black',
                        background: 'white',
                        boxShadow: '6px 6px 0px black',
                        height: '100px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Group style={{ width: '100%', padding: '0 2rem' }}>
                        <Skeleton height={40} circle />
                        <Stack gap="xs" style={{ flex: 1 }}>
                            <Skeleton height={20} width="40%" />
                            <Skeleton height={15} width="20%" />
                        </Stack>
                        <Skeleton height={40} width={120} />
                    </Group>
                </Paper>
            ) : activeSession && (
                <Paper
                    p="lg"
                    mb={20}
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

            {/* 주차별 테이블 */}
            <Stack gap={40}>
                {loading ? (
                    // Skeleton for Curriculum Table
                    [0, 1].map((i) => (
                        <Box key={i} className="animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                            <Skeleton height={30} width={150} mb="md" radius={0} />
                            <Paper
                                p="xl"
                                style={{
                                    border: '4px solid black',
                                    borderRadius: '0px',
                                    background: 'white',
                                    boxShadow: '8px 8px 0px 0px #e5e7eb',
                                }}
                            >
                                <Stack gap="md">
                                    <Skeleton height={30} width="100%" radius={0} />
                                    <Group grow>
                                        <Skeleton height={150} radius={0} />
                                        <Skeleton height={150} radius={0} />
                                        <Skeleton height={150} radius={0} />
                                        <Skeleton height={150} radius={0} />
                                        <Skeleton height={150} radius={0} />
                                    </Group>
                                </Stack>
                            </Paper>
                        </Box>
                    ))
                ) : curriculums.length === 0 ? (
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
                                <Title order={3} mb="md" style={{ fontWeight: 800, color: 'white' }}>
                                    {weekLabel} 일정
                                </Title>

                                <Paper
                                    p="xl"
                                    style={{
                                        border: '4px solid black',
                                        borderRadius: '0px',
                                        background: 'white',
                                        boxShadow: '8px 8px 0px 0px #FFD93D', // Yellow Shadow for Pop
                                        overflowX: 'auto', // Enable horizontal scroll
                                    }}
                                >
                                    <Box
                                        style={{
                                            border: '3px solid black',
                                            borderRadius: '0px',
                                            overflow: 'hidden',
                                            minWidth: '900px', // Ensure minimum width to prevent squishing
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
                                                borderRight: '3px solid black'
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
                                                            borderRight: idx < 4 ? '3px solid black' : 'none',
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
                                                    borderRight: '3px solid black'
                                                }}>
                                                    <Text fw={900} size="lg" style={{ fontStyle: 'italic', color: 'white' }}>{curr.curriculums.name}</Text>
                                                    <Text size="xs" c="dimmed" mt={4}>
                                                        시작일: {curr.start_date}
                                                    </Text>
                                                </Box>

                                                {/* 오른쪽: 일정 셀 (Entrance Animation 적용 - Optimized) */}
                                                <Box style={{ flex: 1, display: 'flex' }}>
                                                    {weekDays.map((day, idx) => {
                                                        const schedule = getScheduleForDate(curr, day.date);

                                                        // Check completion against logs
                                                        const isLogCompleted = studyLogs.some(log => {
                                                            const logDate = log.scheduled_date.split('T')[0]; // Handle ISO
                                                            return log.curriculum_id === curr.curriculums.id &&
                                                                log.curriculum_item_id === schedule?.item?.id &&
                                                                logDate === day.date &&
                                                                log.status === 'completed';
                                                        });

                                                        const isToday = schedule?.status === 'today';
                                                        const isCompleted = isLogCompleted; // Override with actual log
                                                        // Safer date comparison for missed status
                                                        const todayDate = new Date();
                                                        todayDate.setHours(0, 0, 0, 0);
                                                        const checkDate = new Date(day.date);
                                                        const isMissed = !isCompleted && checkDate < todayDate && schedule;

                                                        // 애니메이션 최적화: 딜레이 감소 및 제한
                                                        // Reduce stagger time significantly (0.02s instead of 0.05s)
                                                        // Cap the max delay at 0.5s to prevent long waits
                                                        const rawDelay = (cIdx * 3 + idx) * 0.03;
                                                        const cappedDelay = Math.min(rawDelay, 0.4);
                                                        const animationDelay = `${cappedDelay}s`;

                                                        return (
                                                            <Box
                                                                key={idx}
                                                                className="animate-fade-in-up"
                                                                style={{
                                                                    flex: 1,
                                                                    borderRight: idx < 4 ? '3px solid black' : 'none',
                                                                    borderBottom: 'none',
                                                                    // Dynamic Background
                                                                    background: isCompleted
                                                                        ? '#D3F9D8' // Green
                                                                        : isMissed
                                                                            ? '#FFE3E3' // Red
                                                                            : '#FFFFFF', // White default

                                                                    // Dynamic Border (Override for status)
                                                                    boxShadow: isToday && !isCompleted
                                                                        ? 'inset 0 0 0 4px #FFD93D' // Today Highlight
                                                                        : 'none',

                                                                    position: 'relative',
                                                                    margin: 0,
                                                                    padding: '1rem',
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    justifyContent: 'center',
                                                                    minHeight: '220px',
                                                                    animationDelay: animationDelay,
                                                                    opacity: 0,
                                                                    transition: 'all 0.2s ease'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (!isCompleted && schedule) {
                                                                        e.currentTarget.style.backgroundColor = isMissed ? '#FFC9C9' : '#FFFBE6';
                                                                    }
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    if (!isCompleted && schedule) {
                                                                        e.currentTarget.style.backgroundColor = isCompleted ? '#D3F9D8' : (isMissed ? '#FFE3E3' : '#FFFFFF');
                                                                    }
                                                                }}
                                                            >
                                                                {/* Status Labels (Absolute Position) */}
                                                                {isToday && !isCompleted && (
                                                                    <Badge
                                                                        color="yellow"
                                                                        variant="filled"
                                                                        size="md"
                                                                        radius="xs"
                                                                        style={{
                                                                            position: 'absolute',
                                                                            top: 10,
                                                                            right: 10,
                                                                            border: '2px solid black',
                                                                            color: 'black',
                                                                            zIndex: 5
                                                                        }}
                                                                    >
                                                                        TODAY
                                                                    </Badge>
                                                                )}

                                                                {schedule ? (
                                                                    <Stack gap="md" justify="space-between" style={{ position: 'relative', zIndex: 11, height: '100%' }}>
                                                                        <Box>
                                                                            <Badge
                                                                                color={schedule.itemType === 'listening' ? 'grape' : 'black'}
                                                                                radius="xs"
                                                                                size="md"
                                                                                variant="filled"
                                                                                style={{
                                                                                    marginBottom: '8px',
                                                                                    boxShadow: '2px 2px 0px black',
                                                                                    border: '1px solid black'
                                                                                }}
                                                                            >
                                                                                {schedule.itemType === 'listening'
                                                                                    ? `듣기 평가`
                                                                                    : `소단원 ${schedule.minorUnit}`
                                                                                }
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

                                                                        {/* Completion Status */}
                                                                        {isCompleted && (
                                                                            <Badge color="green" variant="filled" size="lg" radius="xs" style={{ border: '2px solid black' }} fullWidth>
                                                                                학습 완료 (PASSED)
                                                                            </Badge>
                                                                        )}
                                                                        {isMissed && (
                                                                            <Badge color="red" variant="filled" size="lg" radius="xs" style={{ border: '2px solid black' }} fullWidth>
                                                                                미완료 (MISSED)
                                                                            </Badge>
                                                                        )}

                                                                        {/* Action Buttons */}
                                                                        {(!isCompleted) && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    if (schedule.itemType === 'listening') {
                                                                                        router.push(`/test/listening?id=${schedule.item?.item_id}&curriculumId=${curr.curriculums.id}&curriculumItemId=${schedule.item?.id}&scheduledDate=${day.date}`);
                                                                                    } else {
                                                                                        const itemId = schedule.item?.item_details?.id || schedule.item?.item_id;
                                                                                        if (itemId) {
                                                                                            router.push(`/test/flashcard?itemId=${itemId}&start=${schedule.progressStart}&end=${schedule.progressEnd}&curriculumId=${curr.curriculums.id}&curriculumItemId=${schedule.item?.id}&scheduledDate=${day.date}`);
                                                                                        }
                                                                                    }
                                                                                }}
                                                                                style={{
                                                                                    width: '100%',
                                                                                    padding: '0.8rem',
                                                                                    backgroundColor: isMissed ? '#FF6B6B' : '#FFD93D', // Red if missed, Yellow default
                                                                                    color: isMissed ? 'white' : 'black',
                                                                                    fontWeight: 900,
                                                                                    fontSize: '1rem',
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
                                                                            >
                                                                                {isMissed ? '미완료 학습하기' : '시험 보기 (START)'}
                                                                            </button>
                                                                        )}
                                                                        {isCompleted && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    if (schedule.itemType === 'listening') {
                                                                                        router.push(`/test/listening?id=${schedule.item?.item_id}&curriculumId=${curr.curriculums.id}&curriculumItemId=${schedule.item?.id}&scheduledDate=${day.date}&start=${schedule.progressStart}&end=${schedule.progressEnd}`);
                                                                                    } else {
                                                                                        const itemId = schedule.item?.item_details?.id || schedule.item?.item_id;
                                                                                        if (itemId) {
                                                                                            router.push(`/test/flashcard?itemId=${itemId}&start=${schedule.progressStart}&end=${schedule.progressEnd}&curriculumId=${curr.curriculums.id}&curriculumItemId=${schedule.item?.id}&scheduledDate=${day.date}`);
                                                                                        }
                                                                                    }
                                                                                }}
                                                                                style={{
                                                                                    width: '100%',
                                                                                    padding: '0.6rem',
                                                                                    backgroundColor: 'transparent',
                                                                                    color: '#495057',
                                                                                    fontWeight: 800,
                                                                                    fontSize: '0.9rem',
                                                                                    border: '2px dashed #868e96',
                                                                                    cursor: 'pointer',
                                                                                    marginTop: '0.5rem',
                                                                                }}
                                                                            >
                                                                                다시 풀기
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
