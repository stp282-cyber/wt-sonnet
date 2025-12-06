'use client';

import { useState, useEffect, useMemo } from 'react';
import { Container, Title, Paper, Text, Box, Group, Stack, Button, Table, Badge } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconCalendar } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

interface DailyStudy {
    date: string;
    day: string;
    status: 'completed' | 'today' | 'upcoming' | 'none';
    section?: string;
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

            if (typeof window === 'undefined') {
                setLoading(false);
                return;
            }

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
                total_items: 50,
            }));

            setStudentCurriculums(curriculums);
        } catch (error: any) {
            console.error(error);
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

    // 레슨 번호 계산 함수 (시작일부터 해당 날짜까지 수업일 수 계산)
    const calculateLessonNumber = (startDateStr: string, classDays: string[], targetDateStr: string) => {
        const start = new Date(startDateStr);
        const target = new Date(targetDateStr);

        // 시작일보다 이전이면 0 반환
        if (target < start) return 0;

        let count = 0;
        const current = new Date(start);

        while (current <= target) {
            const dayMap = ['일', '월', '화', '수', '목', '금', '토'];
            const dayName = dayMap[current.getDay()];

            if (classDays.includes(dayName)) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }

        return count;
    };

    // 주간 일정 생성 함수
    const getCurriculumDetails = useMemo((): { schedules: { title: string, dates: (DailyStudy & { lessonNumber: number })[], period: string }[], curriculum: any }[] => {
        if (!searchStartDate || studentCurriculums.length === 0) return [];

        return studentCurriculums.map((curriculum) => {
            const weeksConfig = [
                { offset: 0, title: '이번주' },
                { offset: 7, title: '다음주' },
                { offset: 14, title: '2주후' },
            ];

            const weeklySchedules = weeksConfig.map((week) => {
                const dates: (DailyStudy & { lessonNumber: number })[] = [];
                const days = ['월', '화', '수', '목', '금'];
                const baseDate = new Date(searchStartDate);
                baseDate.setDate(baseDate.getDate() + week.offset); // offset 만큼 이동

                for (let i = 0; i < 5; i++) {
                    const currentDate = new Date(baseDate);
                    currentDate.setDate(baseDate.getDate() + i);
                    const dateStr = currentDate.toISOString().split('T')[0];
                    const dayName = days[i];

                    let status: 'completed' | 'today' | 'upcoming' | 'none' = 'none';
                    let lessonNumber = 0;

                    if (curriculum.class_days.includes(dayName)) {
                        if (dateStr === '2025-12-06') {
                            status = 'today';
                        } else if (new Date(dateStr) < new Date('2025-12-06')) {
                            status = 'completed';
                        } else {
                            status = 'upcoming';
                        }

                        // 레슨 번호 계산
                        lessonNumber = calculateLessonNumber(curriculum.start_date, curriculum.class_days, dateStr);
                    }

                    dates.push({
                        date: dateStr,
                        day: dayName,
                        status,
                        lessonNumber,
                    });
                }

                const startDateStr = baseDate.toISOString().split('T')[0];
                const endDate = new Date(baseDate);
                endDate.setDate(baseDate.getDate() + 4);
                const endDateStr = endDate.toISOString().split('T')[0];

                return {
                    title: week.title,
                    dates: dates,
                    period: `(${startDateStr} - ${endDateStr})`,
                };
            });

            return {
                curriculum: curriculum,
                schedules: weeklySchedules,
            };
        });
    }, [searchStartDate, studentCurriculums, today]);

    const getDayColor = (status: string) => {
        switch (status) {
            case 'completed': return '#90EE90'; // 연한 초록 (완료)
            case 'today': return '#FFFFFF'; // 흰색 (오늘) - 다른 예정일과 동일하게 변경
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
                <Group justify="flex-end" mb={30}>
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

                {/* 주차별 테이블 통합 표시 (이번주 -> 다음주 -> 2주후 순서) */}
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
                        // 3주 (이번주, 다음주, 2주후) 순회
                        [0, 1, 2].map((weekIndex) => (
                            <Box key={weekIndex}>
                                <Title order={3} mb="md" style={{ fontWeight: 800 }}>
                                    {weekIndex === 0 ? '이번주' : weekIndex === 1 ? '다음주' : '2주후'} 일정
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
                                        <Table withTableBorder withColumnBorders>
                                            <Table.Thead>
                                                <Table.Tr style={{ background: 'black' }}>
                                                    <Table.Th style={{ color: 'white', textAlign: 'center', padding: '1rem', fontWeight: 900, fontStyle: 'italic', width: '150px' }}>
                                                        CURRICULUM
                                                    </Table.Th>
                                                    {/* 해당 주차의 날짜 헤더 생성 (첫 번째 커리큘럼 기준) */}
                                                    {getCurriculumDetails[0].schedules[weekIndex].dates.map((day) => (
                                                        <Table.Th
                                                            key={day.date}
                                                            style={{
                                                                background: '#FFD93D',
                                                                color: 'black',
                                                                textAlign: 'center',
                                                                padding: '1rem',
                                                                fontWeight: 900,
                                                                border: '2px solid black',
                                                                width: '20%',
                                                            }}
                                                        >
                                                            <div>{day.day}</div>
                                                            <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                                                {day.date}
                                                            </div>
                                                        </Table.Th>
                                                    ))}
                                                </Table.Tr>
                                            </Table.Thead>
                                            <Table.Tbody>
                                                {getCurriculumDetails.map((curriculumData) => {
                                                    const schedule = curriculumData.schedules[weekIndex];
                                                    return (
                                                        <Table.Tr key={curriculumData.curriculum.id}>
                                                            <Table.Td
                                                                style={{
                                                                    background: 'black',
                                                                    color: 'white',
                                                                    textAlign: 'center',
                                                                    padding: '1rem',
                                                                    fontWeight: 900,
                                                                    fontStyle: 'italic',
                                                                }}
                                                            >
                                                                <Stack gap="xs">
                                                                    <Text>{curriculumData.curriculum.curriculum_name}</Text>
                                                                    <Text size="xs" c="dimmed">{schedule.period}</Text>
                                                                </Stack>
                                                            </Table.Td>
                                                            {schedule.dates.map((day, index) => (
                                                                <Table.Td
                                                                    key={day.date}
                                                                    style={{
                                                                        background: getDayColor(day.status),
                                                                        border: day.status === 'today' ? '4px solid black' : '2px solid black',
                                                                        textAlign: 'center',
                                                                        padding: '1rem',
                                                                        verticalAlign: 'top',
                                                                        minHeight: '180px',
                                                                        height: '180px',
                                                                    }}
                                                                >
                                                                    {day.status === 'none' ? (
                                                                        <Text c="dimmed" size="sm" ta="center" mt="2rem">
                                                                            -
                                                                        </Text>
                                                                    ) : (
                                                                        <Stack gap="sm">
                                                                            <Box>
                                                                                <Badge color="black" radius="sm" size="sm" variant="filled">
                                                                                    소단원 {day.lessonNumber}
                                                                                </Badge>
                                                                                <Text fw={700} size="sm" mt={4} lineClamp={1}>
                                                                                    {day.lessonNumber % 5 === 1 && '왜 잘지기 않는 거야'}
                                                                                    {day.lessonNumber % 5 === 2 && '작은 상자엔의 비밀'}
                                                                                    {day.lessonNumber % 5 === 3 && '이 단추의 용도가 뭐야?'}
                                                                                    {day.lessonNumber % 5 === 4 && '왜 잘지기 않는 거야'}
                                                                                    {day.lessonNumber % 5 === 0 && '이 단추의 용도가 뭐야?'}
                                                                                </Text>
                                                                            </Box>

                                                                            <Paper
                                                                                p={4}
                                                                                style={{
                                                                                    background: '#FEF3C7',
                                                                                    border: '1px solid black',
                                                                                    borderRadius: '0px',
                                                                                }}
                                                                            >
                                                                                <Text size="xs" fw={700} ta="center">진도: 1~19</Text>
                                                                            </Paper>

                                                                            <Button
                                                                                size="xs"
                                                                                color="yellow"
                                                                                c="black"
                                                                                fullWidth
                                                                                styles={{
                                                                                    root: {
                                                                                        border: '2px solid black',
                                                                                        boxShadow: '2px 2px 0px 0px black',
                                                                                    }
                                                                                }}
                                                                                onClick={() => router.push('/test/flashcard')}
                                                                            >
                                                                                시험 보기
                                                                            </Button>
                                                                        </Stack>
                                                                    )}
                                                                </Table.Td>
                                                            ))}
                                                        </Table.Tr>
                                                    );
                                                })}
                                            </Table.Tbody>
                                        </Table>
                                    </Box>
                                </Paper>
                            </Box>
                        ))
                    )}
                </Stack>
            </div>
        </Container>
    );
}
