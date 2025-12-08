'use client';

import { useState, useEffect } from 'react';
import { Container, Title, Paper, Table, Badge, Text, Group, LoadingOverlay, Pagination } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBell } from '@tabler/icons-react';

interface Notice {
    id: string;
    title: string;
    content: string;
    priority: 'high' | 'normal' | 'low';
    target_type: 'all' | 'class';
    target_class?: string;
    start_date: string;
    end_date?: string;
    created_at: string;
}

export default function StudentNoticesPage() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const MESSAGES_PER_PAGE = 10;

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const user = JSON.parse(userStr);

            // 학생의 경우, 자신의 academy_id에 해당하는 공지만 가져옴
            const response = await fetch(`/api/notices?academy_id=${user.academy_id}`);
            if (!response.ok) throw new Error('Failed to fetch notices');

            const data = await response.json();
            // 클라이언트 사이드 필터링 (날짜, 타겟 등) - API에서 처리하면 더 좋음
            const now = new Date();
            const validNotices = (data.notices || []).filter((n: Notice) => {
                const startDate = new Date(n.start_date);
                const endDate = n.end_date ? new Date(n.end_date) : null;

                // 아직 시작하지 않은 공지는 제외
                if (startDate > now) return false;
                // 종료된 공지 제외 inside the component logic or allow viewing past notices? 
                // Usually students should see valid notices.
                if (endDate && endDate < now) return false;

                // 타겟 필터링 (예: 내 반이 맞는지) - 현재 user 객체에 class 정보가 있다면 비교 가능
                // 지금은 간단히 academy_id만 일치하면 보여줌 (API가 이미 필터링함)
                return true;
            });

            // 최신순 정렬
            validNotices.sort((a: Notice, b: Notice) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setNotices(validNotices);
        } catch (error: any) {
            console.error('Error fetching notices:', error);
            notifications.show({
                title: '오류',
                message: '공지사항을 불러오지 못했습니다.',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'red';
            case 'normal': return 'blue';
            case 'low': return 'gray';
            default: return 'gray';
        }
    };

    const getPriorityText = (priority: string) => {
        switch (priority) {
            case 'high': return '중요';
            case 'normal': return '일반';
            case 'low': return '참고';
            default: return '일반';
        }
    };

    // Pagination logic
    const totalPages = Math.ceil(notices.length / MESSAGES_PER_PAGE);
    const currentNotices = notices.slice((page - 1) * MESSAGES_PER_PAGE, page * MESSAGES_PER_PAGE);

    return (
        <Container size="xl" py={40}>
            <Title order={1} mb="xl" style={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
                공지사항
            </Title>

            <Paper
                p="xl"
                style={{
                    border: '3px solid black',
                    background: 'white',
                    boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                    borderRadius: '0px',
                    position: 'relative',
                    minHeight: '400px'
                }}
            >
                <LoadingOverlay visible={loading} />

                <Table>
                    <Table.Thead>
                        <Table.Tr style={{ borderBottom: '3px solid black' }}>
                            <Table.Th w={100}>구분</Table.Th>
                            <Table.Th>제목</Table.Th>
                            <Table.Th w={150}>날짜</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {currentNotices.length === 0 ? (
                            <Table.Tr>
                                <Table.Td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: '#868e96' }}>
                                    등록된 공지사항이 없습니다.
                                </Table.Td>
                            </Table.Tr>
                        ) : (
                            currentNotices.map((notice) => (
                                <Table.Tr key={notice.id} style={{ cursor: 'pointer' }}>
                                    <Table.Td>
                                        <Badge
                                            color={getPriorityColor(notice.priority)}
                                            variant="filled"
                                            radius="xs"
                                            style={{ border: '2px solid black', color: 'white' }}
                                        >
                                            {getPriorityText(notice.priority)}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text fw={700}>{notice.title}</Text>
                                        <Text size="sm" c="dimmed" lineClamp={1}>
                                            {notice.content}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">
                                            {new Date(notice.created_at).toLocaleDateString('ko-KR')}
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            ))
                        )}
                    </Table.Tbody>
                </Table>

                {totalPages > 1 && (
                    <Group justify="center" mt="xl">
                        <Pagination
                            total={totalPages}
                            value={page}
                            onChange={setPage}
                            color="dark"
                            radius={0}
                            styles={{
                                control: { border: '2px solid black' }
                            }}
                        />
                    </Group>
                )}
            </Paper>
        </Container>
    );
}
