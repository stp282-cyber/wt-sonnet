'use client';

import { useState, useMemo, useEffect } from 'react';
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
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconCalendar, IconBook, IconTrendingUp, IconSettings, IconPlus } from '@tabler/icons-react';

interface DailyStudy {
    date: string;
    day: string;
    status: 'completed' | 'today' | 'upcoming' | 'none';
}

interface CurriculumDetail {
    id: string;
    name: string;
    period: string;
    weeklySchedule: DailyStudy[];
}

interface StudentCurriculum {
    id: string;
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
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const [selectedWeek, setSelectedWeek] = useState<string>('2024-W03');
    const [detailModalOpened, setDetailModalOpened] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentCurriculum | null>(null);
    const [searchStartDate, setSearchStartDate] = useState<Date | null>(new Date('2025-12-06'));
    const [studentCurriculums, setStudentCurriculums] = useState<StudentCurriculum[]>([]);
    const [loading, setLoading] = useState(true);

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

    // 오늘 날짜
    const today = new Date().toISOString().split('T')[0];

    // 학생 목록 로드
    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/students');
            if (!response.ok) throw new Error('Failed to fetch students');

            const data = await response.json();
            const students = data.students || [];

            // 학생 데이터를 StudentCurriculum 형식으로 변환
            const curriculums: StudentCurriculum[] = students.map((student: any) => ({
                id: student.id,
                student_name: student.full_name,
                class_name: student.class_name || '-',
                curriculum_name: '중학 영단어 1000', // 임시 데이터
                start_date: new Date(student.created_at).toISOString().split('T')[0],
                current_progress: 15, // 임시 데이터
                total_items: 50, // 임시 데이터
                status: 'active',
                this_week_completed: 4, // 임시 데이터
                this_week_total: 5, // 임시 데이터
            }));

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
                label: s.full_name || s.name || '이름 없음',
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
                    start_date: assignStartDate instanceof Date ? assignStartDate.toISOString().split('T')[0] : String(assignStartDate).split('T')[0],
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
            // 필터 변경 시 선택된 학생 초기화 (선택된 학생이 필터된 목록에 없으면)
            setSelectedStudentIds(prev => prev.filter(id => filtered.some(s => s.value === id)));
        } else {
            setFilteredStudents(availableStudents);
        }
    }, [selectedFilterClass, availableStudents]);

    // 학생 상세 정보 (커리큘럼별 주간 일정)
    const getStudentDetail = (studentName: string): StudentDetail => {
        // 현재 주의 날짜 생성 (월~금)
        const generateWeekDates = () => {
            const dates: DailyStudy[] = [];
            const days = ['월', '화', '수', '목', '금'];
            const baseDate = new Date('2025-12-01'); // 시작 날짜

            for (let i = 0; i < 5; i++) {
                const currentDate = new Date(baseDate);
                currentDate.setDate(baseDate.getDate() + i);
                const dateStr = currentDate.toISOString().split('T')[0];

                let status: 'completed' | 'today' | 'upcoming' | 'none' = 'upcoming';

                // 오늘 날짜 확인 (2025-12-06이 금요일이라고 가정)
                if (dateStr === '2025-12-06') {
                    status = 'today';
                } else if (i < 4) { // 월~목은 완료
                    status = 'completed';
                }

                dates.push({
                    date: dateStr,
                    day: days[i],
                    status,
                });
            }
            return dates;
        };

        return {
            student_name: studentName,
            curriculums: [
                {
                    id: '1',
                    name: '이번주',
                    period: '(2025/12/01 - 2025/12/05)',
                    weeklySchedule: generateWeekDates(),
                },
                {
                    id: '2',
                    name: '1주후',
                    period: '(2025/12/08 - 2025/12/12)',
                    weeklySchedule: generateWeekDates().map(d => ({ ...d, status: 'none' as const })),
                },
            ],
        };
    };

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

    const studentDetail = useMemo(() =>
        selectedStudent ? getStudentDetail(selectedStudent.student_name) : null,
        [selectedStudent]
    );

    return (
        <Container size="xl" py={40}>
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={1} style={{ fontWeight: 900 }}>
                        수업 일지
                    </Title>
                    <Text c="dimmed" mt="xs">
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
                            { value: 'A반', label: 'A반' },
                            { value: 'B반', label: 'B반' },
                            { value: 'C반', label: 'C반' },
                        ]}
                        style={{ width: 200 }}
                        styles={{ input: { border: '2px solid black', borderRadius: '0px' } }}
                    />
                    <Select
                        label="주차 선택"
                        value={selectedWeek}
                        onChange={(value) => setSelectedWeek(value || '2024-W03')}
                        data={[
                            { value: '2024-W01', label: '2024년 1주차' },
                            { value: '2024-W02', label: '2024년 2주차' },
                            { value: '2024-W03', label: '2024년 3주차' },
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
                            <Table.Th>전체 진도</Table.Th>
                            <Table.Th>이번 주 진도</Table.Th>
                            <Table.Th>상태</Table.Th>
                            <Table.Th>액션</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filteredData.map((student) => (
                            <Table.Tr key={student.id}>
                                <Table.Td>
                                    <Text fw={700}>{student.student_name}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge variant="filled" color="yellow" radius={0} style={{ border: '2px solid black', color: 'black' }}>{student.class_name}</Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{student.curriculum_name}</Text>
                                    <Text size="xs" c="dimmed">
                                        시작일: {student.start_date}
                                    </Text>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="xs">
                                        <Progress
                                            value={(student.current_progress / student.total_items) * 100}
                                            size="lg"
                                            radius={0}
                                            style={{ flex: 1, minWidth: 100, border: '1px solid black' }}
                                            color="yellow"
                                        />
                                        <Text size="sm" fw={700}>
                                            {student.current_progress}/{student.total_items}
                                        </Text>
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="xs">
                                        <Progress
                                            value={getWeekProgress(student.this_week_completed, student.this_week_total)}
                                            size="lg"
                                            radius={0}
                                            color={student.this_week_completed === student.this_week_total ? 'green' : 'cyan'}
                                            style={{ flex: 1, minWidth: 80, border: '1px solid black' }}
                                        />
                                        <Text size="sm" fw={700}>
                                            {student.this_week_completed}/{student.this_week_total}
                                        </Text>
                                    </Group>
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
                                        onClick={() => {
                                            setSelectedStudent(student);
                                            setDetailModalOpened(true);
                                        }}
                                        style={{ border: '2px solid black', borderRadius: '0px' }}
                                    >
                                        상세보기
                                    </Button>
                                </Table.Td>
                            </Table.Tr>
                        ))}
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
                {studentDetail && (
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

                        {/* 커리큘럼별 주간 일정 */}
                        {studentDetail.curriculums.map((curriculum) => (
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
                    </Stack>
                )}
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

                    <Box>
                        <Text fw={500} mb="xs">수업 요일</Text>
                        <Group gap="xs">
                            {['월', '화', '수', '목', '금'].map((day) => (
                                <Chip
                                    key={day}
                                    checked={selectedDays.includes(day)}
                                    onChange={() => {
                                        setSelectedDays(prev =>
                                            prev.includes(day)
                                                ? prev.filter(d => d !== day)
                                                : [...prev, day]
                                        );
                                    }}
                                    variant="filled"
                                    color="yellow"
                                    styles={{
                                        label: {
                                            border: '2px solid black',
                                            borderRadius: '0px',
                                            fontWeight: 700,
                                        }
                                    }}
                                >
                                    {day}
                                </Chip>
                            ))}
                        </Group>
                    </Box>

                    <Group justify="flex-end" mt="md">
                        <Button
                            variant="subtle"
                            color="dark"
                            onClick={() => setAssignModalOpened(false)}
                            radius={0}
                        >
                            취소
                        </Button>
                        <button
                            onClick={handleAssignCurriculum}
                            style={{
                                background: '#FFD93D',
                                color: 'black',
                                border: '2px solid black',
                                borderRadius: '0px',
                                boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                                fontSize: '1rem',
                                fontWeight: 700,
                                padding: '0.75rem 1.5rem',
                                cursor: 'pointer',
                            }}
                        >
                            등록하기
                        </button>
                    </Group>
                </Stack>
            </Modal>
        </Container>
    );
}
