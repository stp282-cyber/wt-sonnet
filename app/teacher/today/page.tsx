'use client';

import { useState, useEffect } from 'react';
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
    Loader,
    Box
} from '@mantine/core';
import { IconCheck, IconX, IconTrash, IconClock } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface TodayLearning {
    id: string;
    student_id: string; // [NEW] Needed for API
    curriculum_item_id: string; // [NEW] Needed for API
    student_name: string;
    class_name: string;
    curriculum_name: string;
    item_name: string;
    scheduled_time: string;
    status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'no_schedule';
    score?: number;
}

export default function TodayManagementPage() {
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const [todayLearnings, setTodayLearnings] = useState<TodayLearning[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTodayLearnings = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/teacher/today-assignments');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setTodayLearnings(data.assignments || []);
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

    useEffect(() => {
        fetchTodayLearnings();
    }, []);

    const filteredData = selectedClass === 'all'
        ? todayLearnings
        : todayLearnings.filter(l => l.class_name === selectedClass);

    // Filter logic for summary cards (exclude no_schedule usually, or include? usually exclude)
    const completedCount = filteredData.filter(l => l.status === 'completed').length;
    const delayedCount = filteredData.filter(l => l.status === 'delayed').length;
    const pendingCount = filteredData.filter(l => l.status === 'pending').length;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'green';
            case 'in_progress': return 'yellow';
            case 'delayed': return 'red';
            case 'pending': return 'gray';
            case 'no_schedule': return 'gray';
            default: return 'gray';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed': return '완료';
            case 'in_progress': return '진행중';
            case 'delayed': return '지연';
            case 'pending': return '대기';
            case 'no_schedule': return '일정 없음';
            default: return '대기';
        }
    };

    const handleMarkAsCompleted = async (id: string, studentId: string, itemId: string) => {
        if (!confirm('정말로 이 학습을 완료 처리하시겠습니까? 점수는 100점으로 기록됩니다.')) return;

        try {
            const res = await fetch('/api/teacher/today-assignments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    student_id: studentId,
                    curriculum_item_id: itemId
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to complete assignment');
            }

            notifications.show({
                title: '성공',
                message: '학습이 완료 처리되었습니다.',
                color: 'green',
            });

            // Refresh list
            fetchTodayLearnings();

        } catch (error: any) {
            console.error('Force complete error:', error);
            notifications.show({
                title: '오류',
                message: error.message || '완료 처리에 실패했습니다.',
                color: 'red',
            });
        }
    };

    const handleDelete = (id: string) => {
        // Cannot really delete a schedule easily without API
        notifications.show({
            title: '알림',
            message: '스케줄 삭제 기능은 준비중입니다.',
            color: 'blue',
        });
    };

    if (loading) {
        return (
            <Container size="xl" py={40} style={{ display: 'flex', justifyContent: 'center' }}>
                <Loader color="yellow" size="xl" />
            </Container>
        );
    }

    // Extract unique class names for filter
    const uniqueClasses = Array.from(new Set(todayLearnings.map(l => l.class_name))).filter(c => c && c !== '미배정');
    const classOptions = [
        { value: 'all', label: '전체' },
        ...uniqueClasses.map(c => ({ value: c, label: c })),
        { value: '미배정', label: '미배정' }
    ];

    return (
        <Container size="xl" py={40}>
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={1} style={{ fontWeight: 900 }}>
                        당일 학습 관리
                    </Title>
                    <Text c="dimmed" mt="xs">
                        오늘의 학습 현황을 확인하고 관리하세요
                    </Text>
                </div>
                <Button
                    variant="outline"
                    color="black"
                    onClick={() => fetchTodayLearnings()}
                    style={{ border: '2px solid black', borderRadius: '0px', color: 'black' }}
                >
                    새로고침
                </Button>
            </Group>

            {/* 통계 카드 */}
            <Group mb={20} grow>
                <Paper
                    p="lg"
                    style={{
                        border: '4px solid black',
                        background: '#d3f9d8',
                        boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                        borderRadius: '0px',
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
                        borderRadius: '0px',
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
                        borderRadius: '0px',
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
                    borderRadius: '0px',
                }}
            >
                <Select
                    label="반 선택"
                    value={selectedClass}
                    onChange={(value) => setSelectedClass(value || 'all')}
                    data={classOptions}
                    style={{ width: 200 }}
                    styles={{ input: { border: '2px solid black', borderRadius: '0px' } }}
                />
            </Paper>

            {/* 학습 목록 */}
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
                        {filteredData.length > 0 ? filteredData.map((learning) => (
                            <Table.Tr key={learning.id}>
                                <Table.Td>
                                    <Text fw={700}>{learning.scheduled_time}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text fw={700}>{learning.student_name}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge variant="filled" color="yellow" radius={0} style={{ border: '2px solid black', color: 'black' }}>{learning.class_name}</Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{learning.curriculum_name}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{learning.item_name}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge color={getStatusColor(learning.status)} variant="filled" radius={0} style={{ border: '2px solid black', color: 'black' }}>
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
                                        {learning.status !== 'no_schedule' && learning.status !== 'completed' && (
                                            <Button
                                                size="xs"
                                                color="green"
                                                onClick={() => handleMarkAsCompleted(learning.id, learning.student_id, learning.curriculum_item_id)}
                                                style={{ border: '2px solid black', borderRadius: '0px' }}
                                            >
                                                완료 처리
                                            </Button>
                                        )}
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        )) : (
                            <Table.Tr>
                                <Table.Td colSpan={8} align="center">
                                    <Text c="dimmed">데이터가 없습니다.</Text>
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>
            </Paper>
        </Container>
    );
}
