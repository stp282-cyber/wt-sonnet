'use client';

import { useState } from 'react';
import {
    Container,
    Title,
    Paper,
    Table,
    Button,
    Group,
    Badge,
    Modal,
    TextInput,
    Select,
    Stack,
    ActionIcon,
    Text,
    Box,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash, IconUserPlus } from '@tabler/icons-react';

interface Student {
    id: string;
    username: string;
    full_name: string;
    status: 'active' | 'on_break';
    class_name?: string;
    created_at: string;
}

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([
        {
            id: '1',
            username: '홍길동',
            full_name: '홍길동',
            status: 'active',
            class_name: '초급반',
            created_at: '2024-01-01',
        },
        {
            id: '2',
            username: '김영희',
            full_name: '김영희',
            status: 'active',
            class_name: '중급반',
            created_at: '2024-01-02',
        },
    ]);

    const [modalOpened, setModalOpened] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);

    const form = useForm({
        initialValues: {
            username: '',
            full_name: '',
            password: '',
            status: 'active',
            class_name: '',
        },
        validate: {
            username: (value) => (!value ? '아이디를 입력해주세요' : null),
            full_name: (value) => (!value ? '이름을 입력해주세요' : null),
            password: (value) => (!editingStudent && !value ? '비밀번호를 입력해주세요' : null),
        },
    });

    const handleOpenModal = (student?: Student) => {
        if (student) {
            setEditingStudent(student);
            form.setValues({
                username: student.username,
                full_name: student.full_name,
                password: '',
                status: student.status,
                class_name: student.class_name || '',
            });
        } else {
            setEditingStudent(null);
            form.reset();
        }
        setModalOpened(true);
    };

    const handleSubmit = (values: typeof form.values) => {
        if (editingStudent) {
            // 수정
            setStudents(students.map(s =>
                s.id === editingStudent.id
                    ? { ...s, ...values }
                    : s
            ));
            notifications.show({
                title: '학생 정보 수정 완료',
                message: `${values.full_name} 학생 정보가 수정되었습니다.`,
                color: 'blue',
            });
        } else {
            // 추가
            const newStudent: Student = {
                id: Date.now().toString(),
                username: values.username,
                full_name: values.full_name,
                status: values.status as 'active' | 'on_break',
                class_name: values.class_name,
                created_at: new Date().toISOString(),
            };
            setStudents([...students, newStudent]);
            notifications.show({
                title: '학생 등록 완료',
                message: `${values.full_name} 학생이 등록되었습니다.`,
                color: 'green',
            });
        }
        setModalOpened(false);
        form.reset();
    };

    const handleDelete = (student: Student) => {
        if (confirm(`${student.full_name} 학생을 삭제하시겠습니까?`)) {
            setStudents(students.filter(s => s.id !== student.id));
            notifications.show({
                title: '학생 삭제 완료',
                message: `${student.full_name} 학생이 삭제되었습니다.`,
                color: 'red',
            });
        }
    };

    return (
        <Container size="xl" py={40}>
            <div className="animate-fade-in">
                <Group justify="space-between" mb={30}>
                    <Box>
                        <Title order={1} style={{ fontWeight: 900, marginBottom: '0.5rem' }}>
                            👥 학생 관리
                        </Title>
                        <Text c="dimmed" size="lg">
                            학생 등록, 수정, 삭제 및 상태 관리
                        </Text>
                    </Box>
                    <button
                        onClick={() => handleOpenModal()}
                        style={{
                            background: '#FFD93D',
                            color: 'black',
                            border: '4px solid black',
                            borderRadius: '12px',
                            boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                            fontSize: '1.1rem',
                            fontWeight: 900,
                            padding: '1rem 2rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}
                        onMouseDown={(e) => {
                            e.currentTarget.style.transform = 'translate(6px, 6px)';
                            e.currentTarget.style.boxShadow = '0px 0px 0px 0px rgba(0, 0, 0, 1)';
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.transform = 'translate(0px, 0px)';
                            e.currentTarget.style.boxShadow = '6px 6px 0px 0px rgba(0, 0, 0, 1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translate(0px, 0px)';
                            e.currentTarget.style.boxShadow = '6px 6px 0px 0px rgba(0, 0, 0, 1)';
                        }}
                    >
                        <IconUserPlus size={24} />
                        학생 추가
                    </button>
                </Group>

                <Paper
                    p="xl"
                    radius="lg"
                    className="neo-card"
                    style={{
                        border: '4px solid black',
                        background: 'white',
                    }}
                >
                    <Table highlightOnHover>
                        <Table.Thead>
                            <Table.Tr style={{ borderBottom: '3px solid black' }}>
                                <Table.Th style={{ fontWeight: 900, fontSize: '1.1rem' }}>아이디</Table.Th>
                                <Table.Th style={{ fontWeight: 900, fontSize: '1.1rem' }}>이름</Table.Th>
                                <Table.Th style={{ fontWeight: 900, fontSize: '1.1rem' }}>반</Table.Th>
                                <Table.Th style={{ fontWeight: 900, fontSize: '1.1rem' }}>상태</Table.Th>
                                <Table.Th style={{ fontWeight: 900, fontSize: '1.1rem' }}>등록일</Table.Th>
                                <Table.Th style={{ fontWeight: 900, fontSize: '1.1rem', textAlign: 'right' }}>관리</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {students.length === 0 ? (
                                <Table.Tr>
                                    <Table.Td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                                        <Text size="lg" c="dimmed">
                                            등록된 학생이 없습니다. 학생을 추가해주세요.
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            ) : (
                                students.map((student) => (
                                    <Table.Tr key={student.id}>
                                        <Table.Td style={{ fontSize: '1rem' }}>{student.username}</Table.Td>
                                        <Table.Td style={{ fontSize: '1rem', fontWeight: 600 }}>{student.full_name}</Table.Td>
                                        <Table.Td style={{ fontSize: '1rem' }}>{student.class_name || '-'}</Table.Td>
                                        <Table.Td>
                                            <Badge
                                                color={student.status === 'active' ? 'teal' : 'gray'}
                                                variant="filled"
                                                size="lg"
                                                style={{
                                                    border: '2px solid black',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {student.status === 'active' ? '정상' : '휴원'}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td style={{ fontSize: '1rem' }}>
                                            {new Date(student.created_at).toLocaleDateString('ko-KR')}
                                        </Table.Td>
                                        <Table.Td>
                                            <Group justify="flex-end" gap="xs">
                                                <ActionIcon
                                                    variant="filled"
                                                    color="blue"
                                                    size="lg"
                                                    onClick={() => handleOpenModal(student)}
                                                    style={{
                                                        border: '2px solid black',
                                                    }}
                                                >
                                                    <IconEdit size={18} />
                                                </ActionIcon>
                                                <ActionIcon
                                                    variant="filled"
                                                    color="red"
                                                    size="lg"
                                                    onClick={() => handleDelete(student)}
                                                    style={{
                                                        border: '2px solid black',
                                                    }}
                                                >
                                                    <IconTrash size={18} />
                                                </ActionIcon>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))
                            )}
                        </Table.Tbody>
                    </Table>
                </Paper>

                {/* 학생 추가/수정 모달 */}
                <Modal
                    opened={modalOpened}
                    onClose={() => setModalOpened(false)}
                    title={
                        <Title order={3} style={{ fontWeight: 900 }}>
                            {editingStudent ? '학생 정보 수정' : '새 학생 등록'}
                        </Title>
                    }
                    size="md"
                    styles={{
                        content: {
                            border: '4px solid black',
                            borderRadius: '15px',
                        },
                    }}
                >
                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <Stack gap="md">
                            <TextInput
                                label="아이디 (한글 이름)"
                                placeholder="홍길동"
                                required
                                {...form.getInputProps('username')}
                                styles={{
                                    input: {
                                        border: '3px solid black',
                                        fontSize: '1rem',
                                    },
                                }}
                            />

                            <TextInput
                                label="전체 이름"
                                placeholder="홍길동"
                                required
                                {...form.getInputProps('full_name')}
                                styles={{
                                    input: {
                                        border: '3px solid black',
                                        fontSize: '1rem',
                                    },
                                }}
                            />

                            {!editingStudent && (
                                <TextInput
                                    label="비밀번호"
                                    type="password"
                                    placeholder="비밀번호를 입력하세요"
                                    required
                                    {...form.getInputProps('password')}
                                    styles={{
                                        input: {
                                            border: '3px solid black',
                                            fontSize: '1rem',
                                        },
                                    }}
                                />
                            )}

                            <Select
                                label="상태"
                                data={[
                                    { value: 'active', label: '정상' },
                                    { value: 'on_break', label: '휴원' },
                                ]}
                                {...form.getInputProps('status')}
                                styles={{
                                    input: {
                                        border: '3px solid black',
                                        fontSize: '1rem',
                                    },
                                }}
                            />

                            <TextInput
                                label="반 (선택사항)"
                                placeholder="초급반"
                                {...form.getInputProps('class_name')}
                                styles={{
                                    input: {
                                        border: '3px solid black',
                                        fontSize: '1rem',
                                    },
                                }}
                            />

                            <Group justify="flex-end" mt="md">
                                <Button
                                    variant="outline"
                                    onClick={() => setModalOpened(false)}
                                    style={{
                                        border: '3px solid black',
                                        color: 'black',
                                    }}
                                >
                                    취소
                                </Button>
                                <button
                                    type="submit"
                                    style={{
                                        background: '#7950f2',
                                        color: 'white',
                                        border: '3px solid black',
                                        borderRadius: '8px',
                                        boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        padding: '0.75rem 1.5rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {editingStudent ? '수정하기' : '등록하기'}
                                </button>
                            </Group>
                        </Stack>
                    </form>
                </Modal>
            </div>
        </Container>
    );
}
