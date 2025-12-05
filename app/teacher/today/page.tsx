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
    Button,
    ActionIcon,
    Select,
} from '@mantine/core';
import { IconCheck, IconX, IconTrash, IconClock } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface TodayLearning {
    id: string;
    student_name: string;
    class_name: string;
    curriculum_name: string;
    item_name: string;
    scheduled_time: string;
    status: 'pending' | 'in_progress' | 'completed' | 'delayed';
    score?: number;
}

export default function TodayManagementPage() {
    const [selectedClass, setSelectedClass] = useState<string>('all');

    const [todayLearnings, setTodayLearnings] = useState<TodayLearning[]>([
        {
            id: '1',
            student_name: '김철수',
            class_name: 'A반',
            curriculum_name: '중학 영단어 1000',
            item_name: '1-3 소단원',
            scheduled_time: '14:00',
            status: 'completed',
            score: 95,
        },
        {
            id: '2',
            student_name: '이영희',
            class_name: 'A반',
            curriculum_name: '중학 영단어 1000',
            item_name: '1-4 소단원',
            scheduled_time: '14:30',
            status: 'in_progress',
        },
        {
            id: '3',
            student_name: '박민수',
            class_name: 'B반',
            curriculum_name: 'CHAPTER 5: TRAVEL',
            item_name: '5-2 소단원',
            scheduled_time: '13:00',
            status: 'delayed',
        },
        {
            id: '4',
            student_name: '최지우',
            class_name: 'A반',
            curriculum_name: '중학 영단어 1000',
            item_name: '2-1 소단원',
            scheduled_time: '15:00',
            status: 'pending',
        },
    ]);

    const filteredData = selectedClass === 'all'
        ? todayLearnings
        : todayLearnings.filter(l => l.class_name === selectedClass);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'green';
            case 'in_progress': return 'yellow';
            case 'delayed': return 'red';
            case 'pending': return 'gray';
            default: return 'gray';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed': return '완료';
            case 'in_progress': return '진행중';
            case 'delayed': return '지연';
            case 'pending': return '대기';
            default: return '대기';
        }
    };

    const handleMarkAsCompleted = (id: string) => {
        setTodayLearnings(
            todayLearnings.map(l =>
                l.id === id ? { ...l, status: 'completed' as const, score: 0 } : l
            )
        );
        notifications.show({
            title: '완료 처리',
            message: '학습이 완료 처리되었습니다.',
            color: 'green',
        });
    };

    const handleDelete = (id: string) => {
        setTodayLearnings(todayLearnings.filter(l => l.id !== id));
        notifications.show({
            title: '삭제 완료',
            message: '학습이 삭제되었습니다.',
            color: 'red',
        });
    };

    const completedCount = filteredData.filter(l => l.status === 'completed').length;
    const delayedCount = filteredData.filter(l => l.status === 'delayed').length;
    const pendingCount = filteredData.filter(l => l.status === 'pending').length;

    return (
        <Container size="xl" py={40}>
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={1} style={{ fontWeight: 900 }}>
                        📅 당일 학습 관리
                    </Title>
                    <Text c="dimmed" mt="xs">
                        오늘의 학습 현황을 확인하고 관리하세요
                    </Text>
                </div>
            </Group>

            {/* 통계 카드 */}
            <Group mb={20} grow>
                <Paper
                    p="lg"
                    style={{
                        border: '4px solid black',
                        background: '#d3f9d8',
                        boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                    }}
                >
                    <Group gap="xs">
                        <IconCheck size={32} color="green" />
                        <div>
                            <Text size="sm" c="dimmed">완료</Text>
                            <Text size="2rem" fw={900}>{completedCount}</Text>
                        </div>
                    </Group>
                </Paper>

                <Paper
                    p="lg"
                    style={{
                        border: '4px solid black',
                        background: '#ffe3e3',
                        boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                    }}
                >
                    <Group gap="xs">
                        <IconClock size={32} color="red" />
                        <div>
                            <Text size="sm" c="dimmed">지연</Text>
                            <Text size="2rem" fw={900}>{delayedCount}</Text>
                        </div>
                    </Group>
                </Paper>

                <Paper
                    p="lg"
                    style={{
                        border: '4px solid black',
                        background: '#f1f3f5',
                        boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                    }}
                >
                    <Group gap="xs">
                        <IconX size={32} color="gray" />
                        <div>
                            <Text size="sm" c="dimmed">대기</Text>
                            <Text size="2rem" fw={900}>{pendingCount}</Text>
                        </div>
                    </Group>
                </Paper>
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
            </Paper>

            {/* 학습 목록 */}
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
                            <Table.Th>시간</Table.Th>
                            <Table.Th>학생</Table.Th>
                            <Table.Th>반</Table.Th>
                            <Table.Th>커리큘럼</Table.Th>
                            <Table.Th>학습 항목</Table.Th>
                            <Table.Th>상태</Table.Th>
                            <Table.Th>점수</Table.Th>
                            <Table.Th>액션</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filteredData.map((learning) => (
                            <Table.Tr key={learning.id}>
                                <Table.Td>
                                    <Text fw={700}>{learning.scheduled_time}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text fw={700}>{learning.student_name}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge variant="light">{learning.class_name}</Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{learning.curriculum_name}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{learning.item_name}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge color={getStatusColor(learning.status)} variant="filled">
                                        {getStatusText(learning.status)}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    {learning.score !== undefined ? (
                                        <Text fw={900} c={learning.score >= 80 ? 'green' : 'red'}>
                                            {learning.score}점
                                        </Text>
                                    ) : (
                                        <Text c="dimmed">-</Text>
                                    )}
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="xs">
                                        {learning.status !== 'completed' && (
                                            <Button
                                                size="xs"
                                                color="green"
                                                onClick={() => handleMarkAsCompleted(learning.id)}
                                            >
                                                완료 처리
                                            </Button>
                                        )}
                                        <ActionIcon
                                            variant="light"
                                            color="red"
                                            onClick={() => handleDelete(learning.id)}
                                        >
                                            <IconTrash size={18} />
                                        </ActionIcon>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Paper>
        </Container>
    );
}
