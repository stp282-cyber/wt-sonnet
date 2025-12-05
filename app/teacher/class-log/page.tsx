'use client';

import { useState } from 'react';
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
} from '@mantine/core';
import { IconCalendar, IconBook, IconTrendingUp, IconSettings } from '@tabler/icons-react';

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

export default function ClassLogPage() {
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const [selectedWeek, setSelectedWeek] = useState<string>('2024-W03');
    const [detailModalOpened, setDetailModalOpened] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentCurriculum | null>(null);

    // 샘플 데이터
    const [studentCurriculums] = useState<StudentCurriculum[]>([
        {
            id: '1',
            student_name: '김철수',
            class_name: 'A반',
            curriculum_name: '중학 영단어 1000',
            start_date: '2024-01-08',
            current_progress: 15,
            total_items: 50,
            status: 'active',
            this_week_completed: 4,
            this_week_total: 5,
        },
        {
            id: '2',
            student_name: '이영희',
            class_name: 'A반',
            curriculum_name: '중학 영단어 1000',
            start_date: '2024-01-08',
            current_progress: 20,
            total_items: 50,
            status: 'active',
            this_week_completed: 5,
            this_week_total: 5,
        },
        {
            id: '3',
            student_name: '박민수',
            class_name: 'B반',
            curriculum_name: 'CHAPTER 5: TRAVEL',
            start_date: '2024-01-10',
            current_progress: 8,
            total_items: 30,
            status: 'active',
            this_week_completed: 2,
            this_week_total: 5,
        },
    ]);

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

    return (
        <Container size="xl" py={40}>
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={1} style={{ fontWeight: 900 }}>
                        📊 수업 일지
                    </Title>
                    <Text c="dimmed" mt="xs">
                        학생별 커리큘럼 진도 및 학습 현황을 확인하세요
                    </Text>
                </div>
            </Group>

            {/* 필터 */}
            <Paper
                p="lg"
                mb={20}
                style={{
                    border: '4px solid black',
                    background: 'white',
                    boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
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
                }}
            >
                <Table>
                    <Table.Thead>
                        <Table.Tr>
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
                                    <Badge variant="light">{student.class_name}</Badge>
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
                                            radius="xl"
                                            style={{ flex: 1, minWidth: 100 }}
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
                                            radius="xl"
                                            color={student.this_week_completed === student.this_week_total ? 'green' : 'yellow'}
                                            style={{ flex: 1, minWidth: 80 }}
                                        />
                                        <Text size="sm" fw={700}>
                                            {student.this_week_completed}/{student.this_week_total}
                                        </Text>
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Badge color={getStatusColor(student.status)} variant="filled">
                                        {getStatusText(student.status)}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Button
                                        size="xs"
                                        variant="light"
                                        onClick={() => {
                                            setSelectedStudent(student);
                                            setDetailModalOpened(true);
                                        }}
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
                    <Text size="xl" fw={900}>
                        {selectedStudent?.student_name} - 학습 상세
                    </Text>
                }
                size="lg"
            >
                {selectedStudent && (
                    <Stack gap="lg">
                        <Paper
                            p="lg"
                            style={{
                                border: '3px solid black',
                                background: '#f8f9fa',
                            }}
                        >
                            <Group justify="space-between" mb="md">
                                <Group gap="xs">
                                    <IconBook size={24} color="#7950f2" />
                                    <Text fw={700}>커리큘럼 정보</Text>
                                </Group>
                            </Group>
                            <Text size="lg" fw={900} mb="xs">
                                {selectedStudent.curriculum_name}
                            </Text>
                            <Text size="sm" c="dimmed">
                                시작일: {selectedStudent.start_date}
                            </Text>
                        </Paper>

                        <Paper
                            p="lg"
                            style={{
                                border: '3px solid black',
                                background: '#f8f9fa',
                            }}
                        >
                            <Group gap="xs" mb="md">
                                <IconTrendingUp size={24} color="#4ECDC4" />
                                <Text fw={700}>전체 진도</Text>
                            </Group>
                            <Progress
                                value={(selectedStudent.current_progress / selectedStudent.total_items) * 100}
                                size="xl"
                                radius="xl"
                                mb="xs"
                            />
                            <Text ta="center" fw={900} size="xl">
                                {selectedStudent.current_progress} / {selectedStudent.total_items} 완료
                            </Text>
                        </Paper>

                        <Paper
                            p="lg"
                            style={{
                                border: '3px solid black',
                                background: '#f8f9fa',
                            }}
                        >
                            <Group gap="xs" mb="md">
                                <IconCalendar size={24} color="#FFD93D" />
                                <Text fw={700}>이번 주 진도</Text>
                            </Group>
                            <Progress
                                value={getWeekProgress(selectedStudent.this_week_completed, selectedStudent.this_week_total)}
                                size="xl"
                                radius="xl"
                                color={selectedStudent.this_week_completed === selectedStudent.this_week_total ? 'green' : 'yellow'}
                                mb="xs"
                            />
                            <Text ta="center" fw={900} size="xl">
                                {selectedStudent.this_week_completed} / {selectedStudent.this_week_total} 완료
                            </Text>
                        </Paper>

                        <Group justify="flex-end">
                            <Button
                                leftSection={<IconSettings size={18} />}
                                style={{
                                    background: '#7950f2',
                                    border: '3px solid black',
                                    boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                                }}
                            >
                                학습 설정 변경
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Container>
    );
}
