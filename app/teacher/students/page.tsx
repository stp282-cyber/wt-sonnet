'use client';

import { useState, useEffect } from 'react';
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
    Loader,
    Tabs,
    Divider,
    Card,
    SimpleGrid,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash, IconUserPlus, IconUsers, IconSchool } from '@tabler/icons-react';

interface Student {
    id: string;
    username: string;
    full_name: string;
    status: 'active' | 'on_break';
    class_id?: string;
    class_name?: string;
    created_at: string;
}

interface ClassInfo {
    id: string;
    name: string;
    created_at: string;
}

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpened, setModalOpened] = useState(false);
    const [classModalOpened, setClassModalOpened] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [selectedClassFilter, setSelectedClassFilter] = useState<string | null>(null);
    const [newClassName, setNewClassName] = useState('');

    const form = useForm({
        initialValues: {
            username: '',
            full_name: '',
            password: '',
            status: 'active',
            class_id: '',
        },
        validate: {
            username: (value) => (!value ? '아이디를 입력해주세요' : null),
            full_name: (value) => (!value ? '이름을 입력해주세요' : null),
            password: (value) => (!editingStudent && !value ? '비밀번호를 입력해주세요' : null),
        },
    });

    // 학생 목록 로드
    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/students');
            if (!response.ok) throw new Error('Failed to fetch students');

            const data = await response.json();
            setStudents(data.students || []);
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
            setClasses(data.classes || []);
        } catch (error: any) {
            console.error('Failed to fetch classes:', error);
        }
    };

    useEffect(() => {
        fetchStudents();
        fetchClasses();
    }, []);

    const handleOpenModal = (student?: Student) => {
        if (student) {
            setEditingStudent(student);
            form.setValues({
                username: student.username,
                full_name: student.full_name,
                password: '',
                status: student.status,
                class_id: student.class_id || '',
            });
        } else {
            setEditingStudent(null);
            form.reset();
        }
        setModalOpened(true);
    };

    // 반 추가 핸들러
    const handleAddClass = async () => {
        if (!newClassName.trim()) {
            notifications.show({
                title: '오류',
                message: '반 이름을 입력해주세요.',
                color: 'red',
            });
            return;
        }

        try {
            const response = await fetch('/api/classes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newClassName.trim() }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create class');
            }

            notifications.show({
                title: '반 생성 완료',
                message: `${newClassName} 반이 생성되었습니다.`,
                color: 'green',
            });

            setNewClassName('');
            setClassModalOpened(false);
            fetchClasses();
        } catch (error: any) {
            notifications.show({
                title: '오류',
                message: error.message || '반 생성에 실패했습니다.',
                color: 'red',
            });
        }
    };

    // 반 삭제 핸들러
    const handleDeleteClass = async (classInfo: ClassInfo) => {
        const studentsInClass = students.filter(s => s.class_id === classInfo.id);
        if (studentsInClass.length > 0) {
            notifications.show({
                title: '삭제 불가',
                message: `${classInfo.name} 반에 ${studentsInClass.length}명의 학생이 있습니다. 먼저 학생들을 다른 반으로 이동해주세요.`,
                color: 'yellow',
            });
            return;
        }

        if (!confirm(`${classInfo.name} 반을 삭제하시겠습니까?`)) return;

        try {
            const response = await fetch(`/api/classes/${classInfo.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete class');
            }

            notifications.show({
                title: '반 삭제 완료',
                message: `${classInfo.name} 반이 삭제되었습니다.`,
                color: 'red',
            });

            fetchClasses();
        } catch (error: any) {
            notifications.show({
                title: '오류',
                message: error.message || '반 삭제에 실패했습니다.',
                color: 'red',
            });
        }
    };

    const handleSubmit = async (values: typeof form.values) => {
        try {
            if (editingStudent) {
                // 수정
                const response = await fetch(`/api/students/${editingStudent.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(values),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to update student');
                }

                notifications.show({
                    title: '학생 정보 수정 완료',
                    message: `${values.full_name} 학생 정보가 수정되었습니다.`,
                    color: 'blue',
                });
            } else {
                // 추가
                const response = await fetch('/api/students', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(values),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to create student');
                }

                notifications.show({
                    title: '학생 등록 완료',
                    message: `${values.full_name} 학생이 등록되었습니다.`,
                    color: 'green',
                });
            }

            setModalOpened(false);
            form.reset();
            fetchStudents(); // 목록 새로고침
        } catch (error: any) {
            notifications.show({
                title: '오류',
                message: error.message || '작업에 실패했습니다.',
                color: 'red',
            });
        }
    };

    const handleDelete = async (student: Student) => {
        if (!confirm(`${student.full_name} 학생을 삭제하시겠습니까?`)) return;

        try {
            const response = await fetch(`/api/students/${student.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete student');
            }

            notifications.show({
                title: '학생 삭제 완료',
                message: `${student.full_name} 학생이 삭제되었습니다.`,
                color: 'red',
            });

            fetchStudents(); // 목록 새로고침
        } catch (error: any) {
            notifications.show({
                title: '오류',
                message: error.message || '삭제에 실패했습니다.',
                color: 'red',
            });
        }
    };

    // 필터된 학생 목록
    const filteredStudents = selectedClassFilter === 'unassigned'
        ? students.filter(s => !s.class_id)
        : selectedClassFilter
            ? students.filter(s => s.class_id === selectedClassFilter)
            : students;

    // 반별 학생 수 계산
    const getStudentCountByClass = (classId: string) => {
        return students.filter(s => s.class_id === classId).length;
    };

    const getUnassignedStudentCount = () => {
        return students.filter(s => !s.class_id).length;
    };


    return (
        <Container size="xl" py={40}>
            <div className="animate-fade-in">
                <Group justify="space-between" mb={30}>
                    <Box>
                        <Title order={1} style={{ fontWeight: 900, marginBottom: '0.5rem' }}>
                            학생 관리
                        </Title>
                        <Text c="dimmed" size="lg">
                            학생 등록, 수정, 삭제 및 상태 관리
                        </Text>
                    </Box>
                    <Group>
                        <button
                            onClick={() => setClassModalOpened(true)}
                            style={{
                                background: '#63E6BE',
                                color: 'black',
                                border: '4px solid black',
                                borderRadius: '0px',
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
                        >
                            <IconSchool size={24} />
                            반 추가
                        </button>
                        <button
                            onClick={() => handleOpenModal()}
                            style={{
                                background: '#FFD93D',
                                color: 'black',
                                border: '4px solid black',
                                borderRadius: '0px',
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
                        >
                            <IconUserPlus size={24} />
                            학생 추가
                        </button>
                    </Group>
                </Group>

                {/* 반 목록 카드 */}
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
                    <Group justify="space-between" mb="md">
                        <Group gap="xs">
                            <IconSchool size={24} />
                            <Text fw={900} size="lg">반 목록</Text>
                        </Group>
                        <Text size="sm" c="dimmed">클릭하여 필터링</Text>
                    </Group>
                    <Group gap="sm">
                        <Badge
                            size="xl"
                            variant={selectedClassFilter === null ? 'filled' : 'outline'}
                            color="dark"
                            style={{
                                border: '3px solid black',
                                borderRadius: '0px',
                                cursor: 'pointer',
                                padding: '1rem 1.5rem',
                            }}
                            onClick={() => setSelectedClassFilter(null)}
                        >
                            전체 ({students.length}명)
                        </Badge>
                        {classes.map((classInfo) => (
                            <Group key={classInfo.id} gap={4}>
                                <Badge
                                    size="xl"
                                    variant={selectedClassFilter === classInfo.id ? 'filled' : 'outline'}
                                    color="blue"
                                    style={{
                                        border: '3px solid black',
                                        borderRadius: '0px',
                                        cursor: 'pointer',
                                        padding: '1rem 1.5rem',
                                    }}
                                    onClick={() => setSelectedClassFilter(
                                        selectedClassFilter === classInfo.id ? null : classInfo.id
                                    )}
                                >
                                    {classInfo.name} ({getStudentCountByClass(classInfo.id)}명)
                                </Badge>
                                <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    color="red"
                                    onClick={() => handleDeleteClass(classInfo)}
                                >
                                    <IconTrash size={14} />
                                </ActionIcon>
                            </Group>
                        ))}
                        {getUnassignedStudentCount() > 0 && (
                            <Badge
                                size="xl"
                                variant={selectedClassFilter === 'unassigned' ? 'filled' : 'outline'}
                                color="gray"
                                style={{
                                    border: '3px solid black',
                                    borderRadius: '0px',
                                    cursor: 'pointer',
                                    padding: '1rem 1.5rem',
                                }}
                                onClick={() => setSelectedClassFilter(
                                    selectedClassFilter === 'unassigned' ? null : 'unassigned'
                                )}
                            >
                                반 미지정 ({getUnassignedStudentCount()}명)
                            </Badge>
                        )}
                    </Group>
                </Paper>

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
                            {filteredStudents.length === 0 ? (
                                <Table.Tr>
                                    <Table.Td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                                        <Text size="lg" c="dimmed">
                                            {selectedClassFilter ? '해당 반에 등록된 학생이 없습니다.' : '등록된 학생이 없습니다. 학생을 추가해주세요.'}
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            ) : (
                                filteredStudents.map((student) => (
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

                            <Select
                                label="반"
                                placeholder="반을 선택하세요"
                                data={[
                                    { value: '', label: '반 없음' },
                                    ...classes.map(c => ({ value: c.id, label: c.name }))
                                ]}
                                {...form.getInputProps('class_id')}
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

                {/* 반 추가 모달 */}
                <Modal
                    opened={classModalOpened}
                    onClose={() => setClassModalOpened(false)}
                    title={
                        <Title order={3} style={{ fontWeight: 900 }}>
                            새 반 추가
                        </Title>
                    }
                    size="sm"
                    styles={{
                        content: {
                            border: '4px solid black',
                            borderRadius: '15px',
                        },
                    }}
                >
                    <Stack gap="md">
                        <TextInput
                            label="반 이름"
                            placeholder="예: A반, 초급반, 중등반"
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.currentTarget.value)}
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
                                onClick={() => setClassModalOpened(false)}
                                style={{
                                    border: '3px solid black',
                                    color: 'black',
                                }}
                            >
                                취소
                            </Button>
                            <button
                                onClick={handleAddClass}
                                style={{
                                    background: '#63E6BE',
                                    color: 'black',
                                    border: '3px solid black',
                                    borderRadius: '8px',
                                    boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    padding: '0.75rem 1.5rem',
                                    cursor: 'pointer',
                                }}
                            >
                                반 추가
                            </button>
                        </Group>
                    </Stack>
                </Modal>
            </div>
        </Container >
    );
}
