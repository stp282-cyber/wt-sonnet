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
    Table,
    Box,
    Loader,
    Center,
    Divider,
    ActionIcon,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconBook, IconHeadphones, IconTrash, IconSettings, IconRefresh } from '@tabler/icons-react';

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
    student_id?: string; // API에서 student_id 필드가 있을 수 있음
    classes: {
        id: string;
        name: string;
    } | null;
}

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
    const [searchStartDate, setSearchStartDate] = useState<Date>(new Date());

    useEffect(() => {
        // params가 Promise일 수 있는 Next.js 15+ 환경 대응
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

        // 검색 시작일이 속한 주의 월요일 찾기
        // getDay(): 일(0) ~ 토(6)
        const day = currentDate.getDay();
        const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // 월요일로 조정

        const monday = new Date(currentDate.setDate(diff));

        // 주차 오프셋 적용
        monday.setDate(monday.getDate() + (weekOffset * 7));

        // 월~금 생성
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

    // 특정 날짜에 특정 커리큘럼의 학습 항목 찾기
    const getItemForDate = (curriculum: StudentCurriculum, dateObj: Date): { item: CurriculumItem | null, status: string } => {
        const targetDate = new Date(dateObj);
        targetDate.setHours(0, 0, 0, 0);

        const startDate = new Date(curriculum.start_date);
        startDate.setHours(0, 0, 0, 0);

        if (targetDate < startDate) return { item: null, status: 'none' };

        // 학습 요일 확인
        const dayOfWeek = targetDate.getDay(); // 0(일)~6(토)
        // DAY_MAP: mon:1, tue:2 ...
        // 만약 curriculum.study_days=['mon', 'wed', 'fri']

        // 현재 요일의 영어 코드 찾기
        let currentDayCode = '';
        Object.entries(DAY_MAP).forEach(([code, num]) => {
            if (num === dayOfWeek) currentDayCode = code;
        });

        if (!currentDayCode || !curriculum.study_days.includes(currentDayCode)) {
            return { item: null, status: 'none' };
        }

        // 시작일부터 해당 날짜까지의 학습일 수 계산 (순서 결정을 위해)
        let studyDayCount = 0;
        const checkDate = new Date(startDate);
        checkDate.setHours(0, 0, 0, 0);

        // 날짜 차이가 너무 크면 성능 문제 생길 수 있으므로 최적화 가능하지만 일단 루프
        // 시작일이 미래인 경우 루프 안돔

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

        // 해당 날짜에 학습할 항목 찾기 (1-based index -> 0-based index)
        if (studyDayCount > 0 && studyDayCount <= curriculum.curriculum_items.length) {
            const item = curriculum.curriculum_items[studyDayCount - 1];

            // 상태 결정 (Mock Logic)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let status = 'upcoming'; // 예정
            if (targetDate < today) status = 'completed'; // 완료 (가정)
            else if (targetDate.getTime() === today.getTime()) status = 'today'; // 진행중/오늘

            return { item, status };
        }

        return { item: null, status: 'none' };
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

    const weeksToRender = [0, 1, 2, 3]; // 이번주 ~ 3주뒤

    return (
        <Container size="xl" py={40}>
            {/* 상단 헤더 영역 */}
            <Group justify="space-between" mb="xs">
                <Title order={2} style={{ fontWeight: 900 }}>수업일지 (화면)</Title>
                <Button
                    variant="subtle"
                    color="dark"
                    leftSection={<IconArrowLeft size={16} />}
                    onClick={() => router.back()}
                >
                    뒤로가기
                </Button>
            </Group>

            {/* 학생 정보 및 검색일 설정 */}
            <Group mb="xl" align="flex-end">
                <Text size="xl" fw={900}>{student.username}</Text>
                <Text size="xl" fw={900}>{student.full_name}</Text>
                <Badge
                    size="lg"
                    color="yellow"
                    variant="filled"
                    radius="xs"
                    style={{ border: '2px solid black', color: 'black' }}
                >
                    {student.classes?.name || '반 없음'}
                </Badge>

                <Group gap="xs" ml="xl">
                    <Text fw={900} size="lg">검색시작일</Text>
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
            </Group>

            {/* 주차별 테이블 렌더링 */}
            <Stack gap={40}>
                {weeksToRender.map((weekOffset) => {
                    const weekDays = getWeekDays(searchStartDate, weekOffset);
                    const weekLabel = weekOffset === 0 ? "이번주" : weekOffset === 1 ? "다음주" : `${weekOffset}주 후`;

                    return (
                        <div key={weekOffset} style={{ display: 'flex' }}>
                            {/* 좌측 주차 라벨 (세로 텍스트) */}
                            <Box
                                style={{
                                    width: '40px',
                                    border: '2px solid black',
                                    borderRight: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: '#f1f3f5',
                                    fontWeight: 900
                                }}
                            >
                                <Text style={{ writingMode: 'vertical-rl', textOrientation: 'upright', letterSpacing: '5px' }}>
                                    {weekLabel}
                                </Text>
                            </Box>

                            {/* 우측 테이블 */}
                            <Paper style={{ flex: 1, border: '2px solid black', borderRadius: '0px', overflow: 'hidden' }}>
                                <Table layout="fixed" withTableBorder withColumnBorders>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th style={{ width: '200px', background: 'white', borderBottom: '2px solid black' }}>커리큘럼</Table.Th>
                                            {weekDays.map((day, idx) => (
                                                <Table.Th key={idx} style={{ background: 'white', borderBottom: '2px solid black' }}>
                                                    <Group justify="space-between">
                                                        <Text fw={700}>{day.dayOfWeek}</Text>
                                                        <Text size="xs" c="dimmed">{day.date}</Text>
                                                    </Group>
                                                </Table.Th>
                                            ))}
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {curriculums.length === 0 ? (
                                            <Table.Tr>
                                                <Table.Td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>
                                                    등록된 커리큘럼이 없습니다.
                                                </Table.Td>
                                            </Table.Tr>
                                        ) : (
                                            curriculums.map((curr) => (
                                                <Table.Tr key={curr.id}>
                                                    {/* 커리큘럼 정보 셀 */}
                                                    <Table.Td style={{ verticalAlign: 'top', background: '#fff' }}>
                                                        <Stack gap="xs">
                                                            <Group justify="space-between" align="start">
                                                                <Text fw={800} size="sm" style={{ lineHeight: 1.2 }}>
                                                                    {curr.curriculums.name}
                                                                </Text>
                                                                <Badge variant="outline" color="dark" size="xs" radius="xs">
                                                                    출력
                                                                </Badge>
                                                            </Group>

                                                            <Text size="xs" c="dimmed">
                                                                월,수,금
                                                            </Text>

                                                            <Group gap={4}>
                                                                <Button
                                                                    size="compact-xs"
                                                                    variant="white"
                                                                    color="blue"
                                                                    radius="xs"
                                                                    style={{ border: '1px solid black', flex: 1 }}
                                                                >
                                                                    학습설정
                                                                </Button>
                                                                <Button
                                                                    size="compact-xs"
                                                                    variant="white"
                                                                    color="green"
                                                                    radius="xs"
                                                                    style={{ border: '1px solid black', flex: 1 }}
                                                                >
                                                                    진도변경
                                                                </Button>
                                                                <Button
                                                                    size="compact-xs"
                                                                    variant="filled"
                                                                    color="red"
                                                                    radius="xs"
                                                                    style={{ border: '1px solid black', flex: 1 }}
                                                                >
                                                                    삭제
                                                                </Button>
                                                            </Group>
                                                        </Stack>
                                                    </Table.Td>

                                                    {/* 날짜별 학습 내용 셀 */}
                                                    {weekDays.map((day, dayIdx) => {
                                                        const result = getItemForDate(curr, day.dateObj);
                                                        const { item, status } = result;

                                                        if (!item) {
                                                            return <Table.Td key={dayIdx} style={{ background: 'white' }}></Table.Td>;
                                                        }

                                                        // 아이템 상세 정보
                                                        const title = item.item_details?.title || '제목 없음';
                                                        const subTitle = item.item_type === 'wordbook' ? '단어학습' : '듣기평가';

                                                        return (
                                                            <Table.Td key={dayIdx} style={{ verticalAlign: 'top', background: 'white' }}>
                                                                <Stack gap={4}>
                                                                    <Text fw={700} size="xs" lineClamp={2}>
                                                                        {title}
                                                                    </Text>

                                                                    <Group gap={4} wrap="nowrap">
                                                                        <Text size="xs" c="dimmed" style={{ fontSize: '0.7rem' }}>
                                                                            {item.item_type === 'wordbook' ? `단어 ${item.word_count || 0}개` : '듣기평가'}
                                                                        </Text>
                                                                        <ActionIcon
                                                                            size="xs"
                                                                            variant="subtle"
                                                                            color="gray"
                                                                            title="삭제"
                                                                        >
                                                                            <IconTrash size={10} />
                                                                        </ActionIcon>
                                                                    </Group>

                                                                    <Divider my={2} />

                                                                    <Text size="xs" fw={700} c={status === 'completed' ? 'blue' : status === 'today' ? 'green' : 'gray'}>
                                                                        {status === 'completed' ? '학습완료' : status === 'today' ? '진행중' : '미완료'}
                                                                    </Text>
                                                                </Stack>
                                                            </Table.Td>
                                                        );
                                                    })}
                                                </Table.Tr>
                                            ))
                                        )}
                                    </Table.Tbody>
                                </Table>
                            </Paper>
                        </div>
                    );
                })}
            </Stack>
        </Container>
    );
}
