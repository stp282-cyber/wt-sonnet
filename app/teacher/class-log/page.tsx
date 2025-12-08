'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Container,
    Title,
    Paper,
    Table,
    Text,
    Group,
    Badge,
    Select,
    Button,
    Modal,
    Stack,
    Progress,
    Box,
    Grid,
    MultiSelect,
    Chip,
    Loader,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconCalendar, IconBook, IconTrendingUp, IconSettings, IconPlus } from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { getScheduleForDate } from '@/lib/curriculumUtils';

// Dayjs setup
dayjs.locale('ko');

interface DailyStudy {
    date: string;
    day: string;
    status: 'completed' | 'today' | 'upcoming' | 'none';
    itemTitle?: string; // Add item title to display what is scheduled
}

interface CurriculumDetail {
    id: string;
    name: string;
    period: string;
    weeklySchedule: DailyStudy[];
}

interface StudentCurriculum {
    id: string;
    student_id: string;
    student_name: string;
    class_name: string;
    curriculum_name: string;
    start_date: string;
    current_progress: number;
    total_items: number;
    status: 'active' | 'completed' | 'paused';
    this_week_completed: number;
    this_week_total: number;
}

interface StudentDetail {
    student_name: string;
    curriculums: CurriculumDetail[];
}

export default function ClassLogPage() {
    const router = useRouter();
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const [selectedWeek, setSelectedWeek] = useState<string>(''); // Not used for now, defaulting to modal date
    const [detailModalOpened, setDetailModalOpened] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentCurriculum | null>(null);
    const [searchStartDate, setSearchStartDate] = useState<Date | null>(new Date());
    const [studentCurriculums, setStudentCurriculums] = useState<StudentCurriculum[]>([]);
    const [loading, setLoading] = useState(true);

    // Detailed Data State
    const [detailLoading, setDetailLoading] = useState(false);
    const [studentDetailData, setStudentDetailData] = useState<StudentDetail | null>(null);

    // 커리큘럼 등록 모달 상태
    const [assignModalOpened, setAssignModalOpened] = useState(false);
    const [availableStudents, setAvailableStudents] = useState<any[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
    const [availableCurriculums, setAvailableCurriculums] = useState<any[]>([]);
    const [availableClasses, setAvailableClasses] = useState<any[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [selectedCurriculumId, setSelectedCurriculumId] = useState<string | null>(null);
    const [assignStartDate, setAssignStartDate] = useState<Date | null>(new Date());
    const [selectedDays, setSelectedDays] = useState<string[]>(['월', '수', '금']);
    const [selectedFilterClass, setSelectedFilterClass] = useState<string | null>(null);

    // Fetch Main List
    const fetchStudents = async () => {
        try {
            setLoading(true);

            // 1. All Students
            const studentsResponse = await fetch('/api/students');
            if (!studentsResponse.ok) throw new Error('Failed to fetch students');
            const studentsData = await studentsResponse.json();
            const allStudents = studentsData.students || [];

            // 2. Student Curriculums (Summary)
            const curriculumsResponse = await fetch('/api/student-curriculums');
            if (!curriculumsResponse.ok) throw new Error('Failed to fetch student curriculums');
            const curriculumsData = await curriculumsResponse.json();
            const studentCurriculumsData = curriculumsData.studentCurriculums || [];

            // Map Summary
            const studentCurriculumMap = new Map();
            studentCurriculumsData.forEach((sc: any) => {
                if (!studentCurriculumMap.has(sc.student_id)) {
                    studentCurriculumMap.set(sc.student_id, []);
                }
                studentCurriculumMap.get(sc.student_id).push(sc);
            });

            // Combine
            const curriculums: StudentCurriculum[] = [];

            allStudents.forEach((student: any) => {
                const studentCurricula = studentCurriculumMap.get(student.id) || [];

                if (studentCurricula.length > 0) {
                    studentCurricula.forEach((sc: any) => {
                        curriculums.push({
                            id: sc.id,
                            student_id: student.id,
                            student_name: student.full_name || student.username || '이름 없음',
                            class_name: student.class_name || '-',
                            curriculum_name: sc.curriculums?.name || '커리큘럼 없음',
                            start_date: sc.start_date || '-',
                            current_progress: sc.current_progress || 0,
                            total_items: 50, // Placeholder
                            status: 'active',
                            this_week_completed: 0, // Placeholder
                            this_week_total: 5, // Placeholder
                        });
                    });
                } else {
                    curriculums.push({
                        id: `no-curriculum-${student.id}`,
                        student_id: student.id,
                        student_name: student.full_name || student.username || '이름 없음',
                        class_name: student.class_name || '-',
                        curriculum_name: '미등록',
                        start_date: '-',
                        current_progress: 0, // Placeholder
                        total_items: 0,
                        status: 'paused',
                        this_week_completed: 0,
                        this_week_total: 0,
                    });
                }
            });

            setStudentCurriculums(curriculums);
        } catch (error: any) {
            notifications.show({
                title: '오류',
                message: error.message || '학생 목록을 불러오는데 실패했습니다.',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    // Fetch Detail for Modal
    const fetchStudentDetail = async (studentId: string, startDate: Date) => {
        try {
            setDetailLoading(true);
            const dateStr = dayjs(startDate).format('YYYY-MM-DD');

            // 1. Get Full Curriculum Data
            const curRes = await fetch(`/api/student-curriculums/student/${studentId}`);
            if (!curRes.ok) throw new Error('Failed to fetch curriculum details');
            const curData = await curRes.json();
            const fullCurriculums = curData.curriculums || [];

            // 2. Get Study Logs (Simple fetch all for now, optimize later if needed)
            const logsRes = await fetch(`/api/study-logs?student_id=${studentId}`);
            const logsData = await logsRes.json();
            const logs = logsData.logs || [];

            // 3. Generate Schedule
            const weekDates: string[] = [];
            for (let i = 0; i < 5; i++) {
                weekDates.push(dayjs(startDate).add(i, 'day').format('YYYY-MM-DD'));
            }
            const days = ['월', '화', '수', '목', '금']; // Assuming start date is Monday or we just label 5 days

            const curriculumDetails: CurriculumDetail[] = fullCurriculums.map((sc: any) => {
                const weeklySchedule: DailyStudy[] = weekDates.map((date, index) => {
                    // Check Schedule
                    // Need to construct full config for getScheduleForDate
                    const fullConfig = {
                        ...sc,
                        curriculums: {
                            ...sc.curriculums,
                            items: sc.curriculum_items || []
                        },
                        items: sc.curriculum_items || []
                    };

                    const schedule = getScheduleForDate(fullConfig, date);

                    let status: 'completed' | 'today' | 'upcoming' | 'none' = 'none';
                    let itemTitle = '-';

                    if (schedule) {
                        itemTitle = schedule.itemTitle || schedule.unitName || '학습';
                        status = 'upcoming'; // Default

                        // Check Log
                        const isCompleted = logs.some((l: any) =>
                            l.curriculum_item_id === schedule.item?.id &&
                            /* Check if log is valid (completed) */
                            (l.status === 'completed')
                        );

                        if (isCompleted) {
                            status = 'completed';
                        } else if (date === dayjs().format('YYYY-MM-DD')) {
                            status = 'today';
                        }
                    }

                    return {
                        date: date,
                        day: dayjs(date).format('ddd'), // Use real day name
                        status,
                        itemTitle
                    };
                });

                return {
                    id: sc.id,
                    name: sc.curriculums?.name || 'Unknown',
                    period: `(${weekDates[0]} - ${weekDates[4]})`,
                    weeklySchedule
                };
            });

            setStudentDetailData({
                student_name: curData.student?.full_name || 'Student',
                curriculums: curriculumDetails
            });

        } catch (error: any) {
            console.error(error);
            notifications.show({
                title: '오류',
                message: '상세 정보를 불러오는데 실패했습니다.',
                color: 'red'
            });
        } finally {
            setDetailLoading(false);
        }
    };

    // UseEffect for Detail Modal
    useEffect(() => {
        if (detailModalOpened && selectedStudent && searchStartDate) {
            fetchStudentDetail(selectedStudent.student_id, searchStartDate);
        }
    }, [detailModalOpened, selectedStudent, searchStartDate]);

    // 반 목록 로드
    const fetchClasses = async () => {
        try {
            const response = await fetch('/api/classes');
            if (!response.ok) throw new Error('Failed to fetch classes');
            const data = await response.json();
            setAvailableClasses(data.classes?.map((c: any) => ({
                value: c.id,
                label: c.name,
            })) || []);
        } catch (error) {
            console.error('Failed to fetch classes:', error);
        }
    };

    // 학생 목록 로드 (드롭다운용)
    const fetchAvailableStudents = async () => {
        try {
            const response = await fetch('/api/students');
            if (!response.ok) throw new Error('Failed to fetch students');
            const data = await response.json();
            const studentsData = data.students?.map((s: any) => ({
                value: s.id,
                label: s.full_name || s.username || '이름 없음',
                classId: s.class_id,
                className: s.class_name,
            })) || [];
            setAvailableStudents(studentsData);
            setFilteredStudents(studentsData);
        } catch (error) {
            console.error('Failed to fetch students:', error);
        }
    };

    // 커리큘럼 목록 로드 (드롭다운용)
    const fetchAvailableCurriculums = async () => {
        try {
            const response = await fetch('/api/curriculums');
            if (!response.ok) throw new Error('Failed to fetch curriculums');
            const data = await response.json();
            setAvailableCurriculums(data.curriculums?.map((c: any) => ({
                value: c.id,
                label: c.name,
            })) || []);
        } catch (error) {
            console.error('Failed to fetch curriculums:', error);
        }
    };

    // 커리큘럼 등록 핸들러
    const handleAssignCurriculum = async () => {
        if (!selectedStudentIds.length || !selectedCurriculumId || !assignStartDate || !selectedDays.length) {
            notifications.show({
                title: '입력 오류',
                message: '모든 필드를 입력해주세요.',
                color: 'red',
            });
            return;
        }

        try {
            const response = await fetch('/api/student-curriculums', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_ids: selectedStudentIds,
                    curriculum_id: selectedCurriculumId,
                    start_date: dayjs(assignStartDate).format('YYYY-MM-DD'),
                    class_days: selectedDays,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '등록 실패');
            }

            notifications.show({
                title: '등록 완료',
                message: `${selectedStudentIds.length}명의 학생에게 커리큘럼이 등록되었습니다.`,
                color: 'green',
            });

            setAssignModalOpened(false);
            setSelectedStudentIds([]);
            setSelectedCurriculumId(null);
            setSelectedDays(['월', '수', '금']);
            fetchStudents(); // 목록 새로고침
        } catch (error: any) {
            notifications.show({
                title: '등록 실패',
                message: error.message,
                color: 'red',
            });
        }
    };

    useEffect(() => {
        fetchStudents();
        fetchAvailableStudents();
        fetchAvailableCurriculums();
        fetchClasses();
    }, []);

    // 반 필터링 시 학생 목록 업데이트
    useEffect(() => {
        if (selectedFilterClass) {
            const filtered = availableStudents.filter(s => s.classId === selectedFilterClass);
            setFilteredStudents(filtered);
            setSelectedStudentIds(prev => prev.filter(id => filtered.some(s => s.value === id)));
        } else {
            setFilteredStudents(availableStudents);
        }
    }, [selectedFilterClass, availableStudents]);

    const filteredData = selectedClass === 'all'
        ? studentCurriculums
        : studentCurriculums.filter(s => s.class_name === selectedClass);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'blue';
            case 'completed': return 'green';
            case 'paused': return 'gray';
            default: return 'blue';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active': return '진행중';
            case 'completed': return '완료';
            case 'paused': return '일시정지';
            default: return '진행중';
        }
    };

    const getWeekProgress = (completed: number, total: number) => {
        return total > 0 ? (completed / total) * 100 : 0;
    };

    const getDayColor = (status: string) => {
        switch (status) {
            case 'completed': return '#90EE90'; // 연한 초록 (완료)
            case 'today': return '#FFD93D'; // 노란색 (오늘)
            case 'upcoming': return '#FFFFFF'; // 흰색 (예정)
            case 'none': return '#F0F0F0'; // 회색 (없음)
            default: return '#FFFFFF';
        }
    };

    const handleOpenDetail = (student: StudentCurriculum) => {
        router.push(`/teacher/schedule/student/${student.student_id}`);
    };

    return (
        <Container size="xl" py={40}>
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={1} style={{ fontWeight: 900, color: 'white' }}>
                        수업 일지
                    </Title>
                    <Text c="gray.3" mt="xs">
                        학생별 커리큘럼 진도 및 학습 현황을 확인하세요
                    </Text>
                </div>
                <button
                    onClick={() => setAssignModalOpened(true)}
                    style={{
                        background: '#FFD93D',
                        color: 'black',
                        border: '2px solid black',
                        borderRadius: '0px',
                        boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                        fontSize: '1rem',
                        fontWeight: 900,
                        padding: '1rem 1.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}
                >
                    <IconPlus size={20} />
                    커리큘럼 등록
                </button>
            </Group>

            {/* 필터 */}
            <Paper
                p="lg"
                mb={20}
                style={{
                    border: '4px solid black',
                    background: 'white',
                    boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                    borderRadius: '0px',
                }}
            >
                <Group>
                    <Select
                        label="반 선택"
                        value={selectedClass}
                        onChange={(value) => setSelectedClass(value || 'all')}
                        data={[
                            { value: 'all', label: '전체' },
                            ...availableClasses.map((c: any) => ({ value: c.label, label: c.label }))
                        ]}
                        style={{ width: 200 }}
                        styles={{ input: { border: '2px solid black', borderRadius: '0px' } }}
                    />
                </Group>
            </Paper>

            {/* 학생별 현황 테이블 */}
            <Paper
                p="xl"
                style={{
                    border: '4px solid black',
                    background: 'white',
                    boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                    borderRadius: '0px',
                }}
            >
                <Table>
                    <Table.Thead>
                        <Table.Tr style={{ borderBottom: '3px solid black' }}>
                            <Table.Th>학생</Table.Th>
                            <Table.Th>반</Table.Th>
                            <Table.Th>커리큘럼</Table.Th>
                            {/* Removed Progress bars for now as API summary data is pending real calculation */}
                            <Table.Th>상태</Table.Th>
                            <Table.Th>액션</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filteredData.length > 0 ? filteredData.map((student) => (
                            <Table.Tr key={student.id}>
                                <Table.Td>
                                    <Text fw={700}>{student.student_name}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge variant="filled" color="yellow" radius={0} style={{ border: '2px solid black', color: 'black' }}>{student.class_name}</Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{student.curriculum_name}</Text>
                                    {student.start_date !== '-' && (
                                        <Text size="xs" c="dimmed">
                                            시작일: {student.start_date}
                                        </Text>
                                    )}
                                </Table.Td>
                                <Table.Td>
                                    <Badge color={getStatusColor(student.status)} variant="filled" radius={0} style={{ border: '2px solid black', color: 'black' }}>
                                        {getStatusText(student.status)}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Button
                                        size="xs"
                                        variant="filled"
                                        color="dark"
                                        onClick={() => handleOpenDetail(student)}
                                        style={{ border: '2px solid black', borderRadius: '0px' }}
                                    >
                                        학습일정
                                    </Button>
                                </Table.Td>
                            </Table.Tr>
                        )) : (
                            <Table.Tr>
                                <Table.Td colSpan={5} align="center">
                                    <Text c="dimmed">데이터가 없습니다.</Text>
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>
            </Paper>

            {/* 상세 정보 모달 */}
            <Modal
                opened={detailModalOpened}
                onClose={() => setDetailModalOpened(false)}
                title={
                    <Box>
                        <Text size="xl" fw={900} style={{ fontFamily: 'Pretendard' }}>
                            {selectedStudent?.student_name}의 학습 일정
                        </Text>
                        <Group gap="xs" mt="xs">
                            <Badge color="yellow" variant="filled" radius={0} style={{ border: '2px solid black', color: 'black' }}>
                                {selectedStudent?.class_name}
                            </Badge>
                            <Text size="sm" c="dimmed">
                                주간 학습 계획을 확인하세요
                            </Text>
                        </Group>
                    </Box>
                }
                size="90%"
                radius={0}
                styles={{
                    content: {
                        border: '4px solid black',
                        borderRadius: '0px',
                        boxShadow: '8px 8px 0px black',
                    },
                    header: {
                        borderBottom: '3px solid black',
                        padding: '1.5rem',
                    },
                    body: {
                        padding: '2rem',
                    }
                }}
            >
                <Stack gap="xl">
                    {/* 검색 시작일 선택 */}
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

                    {detailLoading ? (
                        <Group justify="center" py={50}>
                            <Loader size="xl" color="yellow" />
                        </Group>
                    ) : studentDetailData ? (
                        studentDetailData.curriculums.length > 0 ? (
                            studentDetailData.curriculums.map((curriculum) => (
                                <Paper
                                    key={curriculum.id}
                                    p="xl"
                                    style={{
                                        border: '4px solid black',
                                        borderRadius: '0px',
                                        background: 'white',
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
                                        <Table>
                                            <Table.Thead>
                                                <Table.Tr style={{ background: 'black' }}>
                                                    <Table.Th style={{ color: 'white', textAlign: 'center', padding: '1rem', fontWeight: 900, fontStyle: 'italic' }}>
                                                        CURRICULUM
                                                    </Table.Th>
                                                    {curriculum.weeklySchedule.map((day) => (
                                                        <Table.Th
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
                                                        {curriculum.name}
                                                    </Table.Td>
                                                    {curriculum.weeklySchedule.map((day) => (
                                                        <Table.Td
                                                            key={day.date}
                                                            style={{
                                                                background: getDayColor(day.status),
                                                                border: day.status === 'today' ? '4px solid black' : '2px solid black',
                                                                textAlign: 'center',
                                                                padding: '1rem',
                                                                position: 'relative',
                                                                verticalAlign: 'middle'
                                                            }}
                                                        >
                                                            {day.status === 'none' && !day.itemTitle ? (
                                                                <Text c="dimmed" size="sm">
                                                                    -
                                                                </Text>
                                                            ) : (
                                                                <Stack gap={5} align="center">
                                                                    <Text fw={700} size="sm">{day.itemTitle}</Text>
                                                                    {day.status === 'completed' && (
                                                                        <Badge color="green" size="xs">완료</Badge>
                                                                    )}
                                                                </Stack>
                                                            )}
                                                        </Table.Td>
                                                    ))}
                                                </Table.Tr>
                                            </Table.Tbody>
                                        </Table>
                                    </Box>
                                </Paper>
                            ))
                        ) : (
                            <Text ta="center" c="dimmed" py="xl">등록된 커리큘럼이 없습니다.</Text>
                        )
                    ) : (
                        <Text ta="center" c="dimmed" py="xl">정보를 불러올 수 없습니다.</Text>
                    )}
                </Stack>
            </Modal>

            {/* 커리큘럼 등록 모달 */}
            <Modal
                opened={assignModalOpened}
                onClose={() => setAssignModalOpened(false)}
                title="학생 커리큘럼 등록"
                size="lg"
                radius={0}
                styles={{
                    content: {
                        border: '2px solid black',
                        borderRadius: '0px',
                        boxShadow: '8px 8px 0px black',
                    },
                    header: {
                        backgroundColor: '#FFD93D',
                        borderBottom: '2px solid black',
                    }
                }}
            >
                <Stack gap="md">
                    {/* 반 필터 */}
                    <Select
                        label="반 선택 (필터)"
                        placeholder="반을 선택하면 해당 반 학생만 표시됩니다"
                        data={availableClasses}
                        value={selectedFilterClass}
                        onChange={setSelectedFilterClass}
                        clearable
                        styles={{
                            input: {
                                border: '2px solid black',
                                borderRadius: '0px',
                                background: selectedFilterClass ? '#E8F5E9' : 'white',
                            }
                        }}
                    />

                    {/* 필터된 학생 수 표시 */}
                    {selectedFilterClass && (
                        <Text size="sm" c="dimmed">
                            {availableClasses.find(c => c.value === selectedFilterClass)?.label}에 {filteredStudents.length}명의 학생이 있습니다.
                        </Text>
                    )}

                    {/* 전체 선택 버튼 */}
                    <Group gap="xs">
                        <Button
                            size="xs"
                            variant="outline"
                            color="dark"
                            onClick={() => setSelectedStudentIds(filteredStudents.map(s => s.value))}
                            disabled={filteredStudents.length === 0}
                            style={{ border: '2px solid black', borderRadius: '0px' }}
                        >
                            전체 선택 ({filteredStudents.length}명)
                        </Button>
                        <Button
                            size="xs"
                            variant="outline"
                            color="red"
                            onClick={() => setSelectedStudentIds([])}
                            disabled={selectedStudentIds.length === 0}
                            style={{ border: '2px solid black', borderRadius: '0px' }}
                        >
                            선택 해제
                        </Button>
                    </Group>

                    <MultiSelect
                        label={`학생 선택 (${selectedStudentIds.length}명 선택됨)`}
                        placeholder="학생을 선택하세요 (여러 명 선택 가능)"
                        data={filteredStudents}
                        value={selectedStudentIds}
                        onChange={setSelectedStudentIds}
                        searchable
                        clearable
                        styles={{ input: { border: '2px solid black', borderRadius: '0px' } }}
                    />

                    <Select
                        label="커리큘럼 선택"
                        placeholder="커리큘럼을 선택하세요"
                        data={availableCurriculums}
                        value={selectedCurriculumId}
                        onChange={setSelectedCurriculumId}
                        searchable
                        clearable
                        styles={{ input: { border: '2px solid black', borderRadius: '0px' } }}
                    />

                    <DateInput
                        label="시작일"
                        placeholder="시작일을 선택하세요"
                        value={assignStartDate}
                        onChange={setAssignStartDate}
                        styles={{ input: { border: '2px solid black', borderRadius: '0px' } }}
                    />

                    <Text size="sm" fw={700}>수업 요일 선택</Text>
                    <Chip.Group multiple value={selectedDays} onChange={setSelectedDays}>
                        <Group justify="center">
                            {['월', '화', '수', '목', '금'].map((day) => (
                                <Chip key={day} value={day} color="yellow" variant="filled">
                                    {day}
                                </Chip>
                            ))}
                        </Group>
                    </Chip.Group>

                    <Button
                        fullWidth
                        onClick={handleAssignCurriculum}
                        color="yellow"
                        size="md"
                        style={{ border: '2px solid black', color: 'black', marginTop: '1rem' }}
                    >
                        등록하기
                    </Button>
                </Stack>
            </Modal>
        </Container>
    );
}
