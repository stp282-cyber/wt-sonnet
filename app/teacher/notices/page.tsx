'use client';

import { useState, useEffect } from 'react';
import {
    Container,
    Title,
    Paper,
    Table,
    Button,
    Group,
    Modal,
    TextInput,
    Textarea,
    Select,
    Stack,
    ActionIcon,
    Text,
    Badge,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';

// --- Types ---
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

interface User {
    id: string;
    username: string;
    full_name: string;
    role: string;
    academy_id: string;
}

export default function NoticesPage() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // --- Notices State ---
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loadingNotices, setLoadingNotices] = useState(false);
    const [modalOpened, setModalOpened] = useState(false);
    const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

    // --- Form for Notices ---
    const noticeForm = useForm({
        initialValues: {
            title: '',
            content: '',
            priority: 'normal' as 'high' | 'normal' | 'low',
            target_type: 'all' as 'all' | 'class',
            target_class: '',
            start_date: new Date(),
            end_date: null as Date | null,
        },
    });

    // --- Initial Load ---
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setCurrentUser(user);
            fetchNotices(user.academy_id);
        }
    }, []);

    // ==========================================
    // Notices Functions
    // ==========================================
    const fetchNotices = async (academyId: string) => {
        try {
            setLoadingNotices(true);
            const response = await fetch(`/api/notices?academy_id=${academyId}`);
            if (!response.ok) throw new Error('Failed to fetch notices');
            const data = await response.json();
            setNotices(data.notices || []);
        } catch (error: any) {
            notifications.show({ title: '오류', message: error.message, color: 'red' });
        } finally {
            setLoadingNotices(false);
        }
    };

    const handleNoticeSubmit = async (values: typeof noticeForm.values) => {
        if (!currentUser) return;
        try {
            const payload = {
                title: values.title,
                content: values.content,
                target_type: values.target_type,
                target_class_id: values.target_type === 'class' ? values.target_class : null,
                start_date: values.start_date.toISOString().split('T')[0],
                end_date: values.end_date?.toISOString().split('T')[0],
                is_permanent: !values.end_date,
                academy_id: currentUser.academy_id,
            };

            const url = editingNotice ? `/api/notices/${editingNotice.id}` : '/api/notices';
            const method = editingNotice ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Failed to save notice');

            notifications.show({
                title: '완료',
                message: `공지사항이 ${editingNotice ? '수정' : '등록'}되었습니다.`,
                color: 'green',
            });

            setModalOpened(false);
            noticeForm.reset();
            setEditingNotice(null);
            if (currentUser) {
                fetchNotices(currentUser.academy_id);
            }
        } catch (error: any) {
            notifications.show({ title: '오류', message: error.message, color: 'red' });
        }
    };

    const handleEditNotice = (notice: Notice) => {
        setEditingNotice(notice);
        noticeForm.setValues({
            title: notice.title,
            content: notice.content,
            priority: notice.priority,
            target_type: notice.target_type,
            target_class: notice.target_class || '',
            start_date: new Date(notice.start_date),
            end_date: notice.end_date ? new Date(notice.end_date) : null,
        });
        setModalOpened(true);
    };

    const handleDeleteNotice = async (id: string) => {
        if (!confirm('삭제하시겠습니까?')) return;
        try {
            const response = await fetch(`/api/notices/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete');
            notifications.show({ title: '삭제 완료', message: '공지사항이 삭제되었습니다.', color: 'red' });
            if (currentUser) {
                fetchNotices(currentUser.academy_id);
            }
        } catch (error: any) {
            notifications.show({ title: '오류', message: error.message, color: 'red' });
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'red';
            case 'normal': return 'blue';
            case 'low': return 'gray';
            default: return 'blue';
        }
    };

    const getPriorityText = (priority: string) => {
        switch (priority) {
            case 'high': return '중요';
            case 'normal': return '보통';
            case 'low': return '낮음';
            default: return '보통';
        }
    };

    return (
        <Container size="xl" py={40}>
            <Title order={1} style={{ fontWeight: 900, marginBottom: '2rem', color: 'white' }}>
                공지사항 관리
            </Title>

            <Group justify="space-between" mb="md">
                <Text c="gray.3">학생들에게 공지사항을 전달하세요</Text>
                <Button
                    leftSection={<IconPlus size={20} />}
                    onClick={() => {
                        setEditingNotice(null);
                        noticeForm.reset();
                        setModalOpened(true);
                    }}
                    style={{
                        background: '#FFD93D',
                        color: 'black',
                        border: '3px solid black',
                        boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                        fontWeight: 700,
                        borderRadius: '0px',
                    }}
                >
                    새 공지 작성
                </Button>
            </Group>

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
                            <Table.Th>중요도</Table.Th>
                            <Table.Th>제목</Table.Th>
                            <Table.Th>대상</Table.Th>
                            <Table.Th>게시 기간</Table.Th>
                            <Table.Th>작성일</Table.Th>
                            <Table.Th>액션</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {notices.length === 0 ? (
                            <Table.Tr>
                                <Table.Td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                                    등록된 공지사항이 없습니다.
                                </Table.Td>
                            </Table.Tr>
                        ) : notices.map((notice) => (
                            <Table.Tr key={notice.id}>
                                <Table.Td>
                                    <Badge color={getPriorityColor(notice.priority)} variant="filled" radius="xs" style={{ border: '2px solid black', color: 'black' }}>
                                        {getPriorityText(notice.priority)}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Text fw={700}>{notice.title}</Text>
                                    <Text size="sm" c="dimmed">{notice.content.substring(0, 50)}...</Text>
                                </Table.Td>
                                <Table.Td>{notice.target_type === 'all' ? '전체' : notice.target_class}</Table.Td>
                                <Table.Td>
                                    <Text size="sm">{notice.start_date}{notice.end_date && ` ~ ${notice.end_date}`}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{new Date(notice.created_at).toLocaleDateString('ko-KR')}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="xs">
                                        <ActionIcon variant="filled" color="blue" onClick={() => handleEditNotice(notice)} style={{ border: '2px solid black', borderRadius: '0px' }}>
                                            <IconEdit size={18} />
                                        </ActionIcon>
                                        <ActionIcon variant="filled" color="red" onClick={() => handleDeleteNotice(notice.id)} style={{ border: '2px solid black', borderRadius: '0px' }}>
                                            <IconTrash size={18} />
                                        </ActionIcon>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Paper>

            {/* Modal for Notices */}
            <Modal
                opened={modalOpened}
                onClose={() => { setModalOpened(false); setEditingNotice(null); noticeForm.reset(); }}
                title={<Text size="xl" fw={900}>{editingNotice ? '공지사항 수정' : '새 공지사항 작성'}</Text>}
                size="lg"
                radius={0}
                styles={{ content: { border: '4px solid black', borderRadius: '0px' }, header: { borderBottom: '2px solid black' } }}
            >
                <form onSubmit={noticeForm.onSubmit(handleNoticeSubmit)}>
                    <Stack gap="md">
                        <TextInput label="제목" required {...noticeForm.getInputProps('title')} styles={{ input: { border: '2px solid black', borderRadius: '0px' } }} />
                        <Textarea label="내용" required minRows={4} {...noticeForm.getInputProps('content')} styles={{ input: { border: '2px solid black', borderRadius: '0px' } }} />
                        <Select label="중요도" data={[{ value: 'high', label: '중요' }, { value: 'normal', label: '보통' }, { value: 'low', label: '낮음' }]} {...noticeForm.getInputProps('priority')} styles={{ input: { border: '2px solid black', borderRadius: '0px' } }} />
                        <Select label="대상" data={[{ value: 'all', label: '전체' }, { value: 'class', label: '특정 반' }]} {...noticeForm.getInputProps('target_type')} styles={{ input: { border: '2px solid black', borderRadius: '0px' } }} />
                        {noticeForm.values.target_type === 'class' && (
                            <Select label="반 선택" data={[{ value: 'A반', label: 'A반' }, { value: 'B반', label: 'B반' }, { value: 'C반', label: 'C반' }]} {...noticeForm.getInputProps('target_class')} styles={{ input: { border: '2px solid black', borderRadius: '0px' } }} />
                        )}
                        <DateInput label="게시 시작일" required {...noticeForm.getInputProps('start_date')} styles={{ input: { border: '2px solid black', borderRadius: '0px' } }} />
                        <DateInput label="게시 종료일 (선택)" clearable {...noticeForm.getInputProps('end_date')} styles={{ input: { border: '2px solid black', borderRadius: '0px' } }} />
                        <Group justify="flex-end" mt="md">
                            <Button variant="outline" color="dark" onClick={() => { setModalOpened(false); setEditingNotice(null); noticeForm.reset(); }} style={{ border: '2px solid black', borderRadius: '0px' }}>취소</Button>
                            <Button type="submit" style={{ background: '#FFD93D', color: 'black', border: '2px solid black', borderRadius: '0px', boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}>{editingNotice ? '수정' : '등록'}</Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </Container >
    );
}
