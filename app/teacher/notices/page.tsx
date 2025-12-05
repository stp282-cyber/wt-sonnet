'use client';

import { useState } from 'react';
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
import { IconPlus, IconEdit, IconTrash, IconBell } from '@tabler/icons-react';

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

export default function NoticesPage() {
    const [notices, setNotices] = useState<Notice[]>([
        {
            id: '1',
            title: '이번 주 시험 일정 안내',
            content: '월요일부터 금요일까지 매일 타이핑 시험이 있습니다.',
            priority: 'high',
            target_type: 'all',
            start_date: '2024-01-15',
            created_at: '2024-01-15T10:00:00',
        },
        {
            id: '2',
            title: '달러 사용처 안내',
            content: '달러로 문구류를 구매할 수 있습니다.',
            priority: 'normal',
            target_type: 'class',
            target_class: 'A반',
            start_date: '2024-01-14',
            created_at: '2024-01-14T10:00:00',
        },
    ]);

    const [modalOpened, setModalOpened] = useState(false);
    const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

    const form = useForm({
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

    const handleSubmit = (values: typeof form.values) => {
        if (editingNotice) {
            // 수정
            setNotices(
                notices.map((n) =>
                    n.id === editingNotice.id
                        ? {
                            ...n,
                            ...values,
                            start_date: values.start_date.toISOString().split('T')[0],
                            end_date: values.end_date?.toISOString().split('T')[0],
                        }
                        : n
                )
            );
            notifications.show({
                title: '공지사항 수정 완료',
                message: '공지사항이 수정되었습니다.',
                color: 'green',
            });
        } else {
            // 생성
            const newNotice: Notice = {
                id: Date.now().toString(),
                ...values,
                start_date: values.start_date.toISOString().split('T')[0],
                end_date: values.end_date?.toISOString().split('T')[0],
                created_at: new Date().toISOString(),
            };
            setNotices([newNotice, ...notices]);
            notifications.show({
                title: '공지사항 생성 완료',
                message: '새 공지사항이 등록되었습니다.',
                color: 'green',
            });
        }

        setModalOpened(false);
        form.reset();
        setEditingNotice(null);
    };

    const handleEdit = (notice: Notice) => {
        setEditingNotice(notice);
        form.setValues({
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

    const handleDelete = (id: string) => {
        setNotices(notices.filter((n) => n.id !== id));
        notifications.show({
            title: '공지사항 삭제 완료',
            message: '공지사항이 삭제되었습니다.',
            color: 'red',
        });
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'red';
            case 'normal':
                return 'blue';
            case 'low':
                return 'gray';
            default:
                return 'blue';
        }
    };

    const getPriorityText = (priority: string) => {
        switch (priority) {
            case 'high':
                return '중요';
            case 'normal':
                return '보통';
            case 'low':
                return '낮음';
            default:
                return '보통';
        }
    };

    return (
        <Container size="xl" py={40}>
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={1} style={{ fontWeight: 900 }}>
                        📢 공지사항 관리
                    </Title>
                    <Text c="dimmed" mt="xs">
                        학생들에게 공지사항을 전달하세요
                    </Text>
                </div>
                <Button
                    leftSection={<IconPlus size={20} />}
                    onClick={() => {
                        setEditingNotice(null);
                        form.reset();
                        setModalOpened(true);
                    }}
                    style={{
                        background: '#FFD93D',
                        color: 'black',
                        border: '3px solid black',
                        boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                        fontWeight: 700,
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
                }}
            >
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>중요도</Table.Th>
                            <Table.Th>제목</Table.Th>
                            <Table.Th>대상</Table.Th>
                            <Table.Th>게시 기간</Table.Th>
                            <Table.Th>작성일</Table.Th>
                            <Table.Th>액션</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {notices.map((notice) => (
                            <Table.Tr key={notice.id}>
                                <Table.Td>
                                    <Badge color={getPriorityColor(notice.priority)} variant="filled">
                                        {getPriorityText(notice.priority)}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Text fw={700}>{notice.title}</Text>
                                    <Text size="sm" c="dimmed">
                                        {notice.content.substring(0, 50)}...
                                    </Text>
                                </Table.Td>
                                <Table.Td>
                                    {notice.target_type === 'all' ? '전체' : notice.target_class}
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">
                                        {notice.start_date}
                                        {notice.end_date && ` ~ ${notice.end_date}`}
                                    </Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">
                                        {new Date(notice.created_at).toLocaleDateString('ko-KR')}
                                    </Text>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="xs">
                                        <ActionIcon
                                            variant="light"
                                            color="blue"
                                            onClick={() => handleEdit(notice)}
                                        >
                                            <IconEdit size={18} />
                                        </ActionIcon>
                                        <ActionIcon
                                            variant="light"
                                            color="red"
                                            onClick={() => handleDelete(notice.id)}
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

            {/* 공지사항 작성/수정 모달 */}
            <Modal
                opened={modalOpened}
                onClose={() => {
                    setModalOpened(false);
                    setEditingNotice(null);
                    form.reset();
                }}
                title={
                    <Text size="xl" fw={900}>
                        {editingNotice ? '공지사항 수정' : '새 공지사항 작성'}
                    </Text>
                }
                size="lg"
            >
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack gap="md">
                        <TextInput
                            label="제목"
                            placeholder="공지사항 제목을 입력하세요"
                            required
                            {...form.getInputProps('title')}
                        />

                        <Textarea
                            label="내용"
                            placeholder="공지사항 내용을 입력하세요"
                            required
                            minRows={4}
                            {...form.getInputProps('content')}
                        />

                        <Select
                            label="중요도"
                            data={[
                                { value: 'high', label: '중요' },
                                { value: 'normal', label: '보통' },
                                { value: 'low', label: '낮음' },
                            ]}
                            {...form.getInputProps('priority')}
                        />

                        <Select
                            label="대상"
                            data={[
                                { value: 'all', label: '전체' },
                                { value: 'class', label: '특정 반' },
                            ]}
                            {...form.getInputProps('target_type')}
                        />

                        {form.values.target_type === 'class' && (
                            <Select
                                label="반 선택"
                                data={[
                                    { value: 'A반', label: 'A반' },
                                    { value: 'B반', label: 'B반' },
                                    { value: 'C반', label: 'C반' },
                                ]}
                                {...form.getInputProps('target_class')}
                            />
                        )}

                        <DateInput
                            label="게시 시작일"
                            placeholder="게시 시작일을 선택하세요"
                            required
                            {...form.getInputProps('start_date')}
                        />

                        <DateInput
                            label="게시 종료일 (선택)"
                            placeholder="종료일을 선택하세요 (영구 게시는 비워두세요)"
                            clearable
                            {...form.getInputProps('end_date')}
                        />

                        <Group justify="flex-end" mt="md">
                            <Button
                                variant="default"
                                onClick={() => {
                                    setModalOpened(false);
                                    setEditingNotice(null);
                                    form.reset();
                                }}
                            >
                                취소
                            </Button>
                            <Button
                                type="submit"
                                style={{
                                    background: '#7950f2',
                                    border: '3px solid black',
                                    boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                                }}
                            >
                                {editingNotice ? '수정' : '등록'}
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </Container>
    );
}
