'use client';

import { useState, useEffect, useMemo } from 'react';
import { Container, Title, Paper, Text, Box, Group, Grid, Badge, Modal, Stack, Button } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconChevronLeft, IconChevronRight, IconClock, IconBook, IconTarget, IconPlayerPlay, IconCalendar } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

interface DailyStudy {
    date: string;
    day: string;
    status: 'completed' | 'today' | 'upcoming' | 'none';
    section?: string;
}

interface CurriculumDetail {
    id: string;
    name: string;
    period: string;
    weeklySchedule: DailyStudy[];
}

interface StudentCurriculum {
    id: string;
    curriculum_id: string;
    curriculum_name: string;
    start_date: string;
    class_days: string[];
    current_progress: number;
    total_items: number;
}

export default function StudentLearningPage() {
    const router = useRouter();
    const [searchStartDate, setSearchStartDate] = useState<Date | null>(new Date('2025-12-06'));
    const [studentCurriculums, setStudentCurriculums] = useState<StudentCurriculum[]>([]);
    const [loading, setLoading] = useState(true);

    // 오늘 날짜
    const today = new Date().toISOString().split('T')[0];

    // 학생 커리큘럼 데이터 로드
    const fetchStudentCurriculums = async () => {
        try {
            setLoading(true);

            // 클라이언트 사이드에서만 실행
            if (typeof window === 'undefined') {
                setLoading(false);
                return;
            }

            // localStorage에서 사용자 정보 가져오기
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

            // 학생 권한 확인
            if (user.role !== 'student') {
                notifications.show({
                    title: '권한 오류',
                    message: '학생만 접근 가능합니다.',
                    color: 'red',
                });
                return;
            }

            const response = await fetch(`/api/student-curriculums?student_id=${user.id}`);
            if (!response.ok) throw new Error('Failed to fetch student curriculums');

            const data = await response.json();
            const curriculumsData = data.studentCurriculums || [];

            const curriculums: StudentCurriculum[] = curriculumsData.map((sc: any) => ({
                id: sc.id,
                curriculum_id: sc.curriculum_id,
                curriculum_name: sc.curriculums?.name || '커리큘럼 없음',
                start_date: sc.start_date || new Date().toISOString().split('T')[0],
                class_days: sc.study_days ? sc.study_days.map((day: string) => {
                    const dayMap: { [key: string]: string } = {
                        'mon': '월',
                        'tue': '화',
                        'wed': '수',
                        'thu': '목',
                        'fri': '금',
                    };
                    return dayMap[day] || day;
                }) : [],
                current_progress: sc.current_progress || 0,
                total_items: 50, // TODO: calculate by curriculum_items count
            }));

            setStudentCurriculums(curriculums);
        } catch (error: any) {
            notifications.show({
                title: '오류',
                message: error.message || '커리큘럼을 불러오는데 실패했습니다.',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudentCurriculums();
    }, []);

    // 주간 일정 생성 함수
    const getCurriculumDetails = useMemo((): CurriculumDetail[] => {
        if (!searchStartDate || studentCurriculums.length === 0) return [];

        return studentCurriculums.map((curriculum) => {
            const generateWeekDates = () => {
                const dates: DailyStudy[] = [];
                const days = ['월', '화', '수', '목', '금'];
                const baseDate = new Date(searchStartDate);

                for (let i = 0; i < 5; i++) {
                    const currentDate = new Date(baseDate);
                    currentDate.setDate(baseDate.getDate() + i);
                    const dateStr = currentDate.toISOString().split('T')[0];

                    let status: 'completed' | 'today' | 'upcoming' | 'none' = 'none';

                    // 수업 요일인지 확인
                    if (curriculum.class_days.includes(days[i])) {
                        // 시작일 이후인지 확인
                        const startDate = new Date(curriculum.start_date);
                        const currentDateObj = new Date(dateStr);

                        if (currentDateObj >= startDate) {
                            if (dateStr === today) {
                                status = 'today';
                            } else if (currentDateObj < new Date(today)) {
                                status = 'completed';
                            } else {
                                status = 'upcoming';
                            }
                        }
                    }

                    dates.push({
                        date: dateStr,
                        day: days[i],
                        status,
                        section: status !== 'none' ? `소단원 ${i + 1}` : undefined,
                    });
                }
                return dates;
            };

            const weekDates = generateWeekDates();
            const startDateStr = searchStartDate.toISOString().split('T')[0];
            const endDate = new Date(searchStartDate);
            endDate.setDate(searchStartDate.getDate() + 4);
            const endDateStr = endDate.toISOString().split('T')[0];

            return {
                id: curriculum.id,
                name: curriculum.curriculum_name,
                period: `(${startDateStr} - ${endDateStr})`,
                weeklySchedule: weekDates,
            };
        });
    }, [searchStartDate, studentCurriculums, today]);

    const getDayColor = (status: string) => {
        switch (status) {
            case 'completed': return '#90EE90'; // 연한 초록 (완료)
            case 'today': return '#FFD93D'; // 노란색 (오늘)
            case 'upcoming': return '#FFFFFF'; // 흰색 (예정)
            case 'none': return '#F0F0F0'; // 회색 (없음)
            default: return '#FFFFFF';
        }
    };

    return (
        <Container size="xl" py={40}>
            <div className="animate-fade-in">
                {/* 페이지 헤더 */}
                <Box mb={30}>
                    <Title order={1} style={{ fontWeight: 900, marginBottom: '0.5rem' }}>
                        나의 학습
                    </Title>
                    <Text size="lg" c="dimmed">
                        주간 학습 일정을 확인하세요
                    </Text>
                </Box>

                {/* 검색 시작일 선택 */}
                <Paper
                    p="lg"
                    mb={30}
                    style={{
                        border: '4px solid black',
                        background: 'white',
                        boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                        borderRadius: '0px',
                    }}
                >
                    <Group justify="flex-end">
                        <DateInput
                            value={searchStartDate}
                            onChange={(value) => setSearchStartDate(value as Date | null)}
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
                </Paper>

                {/* 커리큘럼별 주간 일정 */}
                <Stack gap="xl">
                    {loading ? (
                        <Text ta="center" c="dimmed">로딩 중...</Text>
                    ) : getCurriculumDetails.length === 0 ? (
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
                        getCurriculumDetails.map((curriculum) => (
                            <Paper
                                key={curriculum.id}
                                p="xl"
                                style={{
                                    border: '4px solid black',
                                    borderRadius: '0px',
                                    background: 'white',
                                    boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                                }}
                            >
                                {/* 커리큘럼 헤더 */}
                                <Paper
                                    p="md"
                                    mb="lg"
                                    style={{
                                        border: '3px solid black',
                                        background: '#FFD93D',
                                        borderRadius: '0px',
                                    }}
                                >
                                    <Text fw={900} size="lg">
                                        {curriculum.name} {curriculum.period}
                                    </Text>
                                </Paper>

                                {/* 주간 일정 테이블 */}
                                <Box
                                    style={{
                                        border: '3px solid black',
                                        borderRadius: '0px',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: 'black' }}>
                                                <th style={{ color: 'white', textAlign: 'center', padding: '1rem', fontWeight: 900, fontStyle: 'italic' }}>
                                                    CURRICULUM
                                                </th>
                                                {curriculum.weeklySchedule.map((day) => (
                                                    <th
                                                        key={day.date}
                                                        style={{
                                                            background: '#FFD93D',
                                                            color: 'black',
                                                            textAlign: 'center',
                                                            padding: '1rem',
                                                            fontWeight: 900,
                                                            border: '2px solid black',
                                                        }}
                                                    >
                                                        <div>{day.day}</div>
                                                        <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                                            {day.date}
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td
                                                    style={{
                                                        background: 'black',
                                                        color: 'white',
                                                        textAlign: 'center',
                                                        padding: '3rem 1rem',
                                                        fontWeight: 900,
                                                        fontStyle: 'italic',
                                                    }}
                                                >
                                                    {curriculum.name}
                                                </td>
                                                {curriculum.weeklySchedule.map((day) => (
                                                    <td
                                                        key={day.date}
                                                        style={{
                                                            background: getDayColor(day.status),
                                                            border: day.status === 'today' ? '4px solid black' : '2px solid black',
                                                            textAlign: 'center',
                                                            padding: '3rem 1rem',
                                                            position: 'relative',
                                                        }}
                                                    >
                                                        {day.status === 'none' ? (
                                                            <Text c="dimmed" size="sm">
                                                                등록된 커리큘럼이 없습니다.
                                                            </Text>
                                                        ) : (
                                                            <Text fw={700} size="sm">
                                                                {day.section}
                                                            </Text>
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        </tbody>
                                    </table>
                                </Box>
                            </Paper>
                        ))
                    )}
                </Stack>
            </div>
        </Container>
    );
}
