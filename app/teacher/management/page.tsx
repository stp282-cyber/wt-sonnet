'use client';

import { useState, useEffect } from 'react';
import { Title, Text, Container, Paper, Grid, TextInput, PasswordInput, Button, Table, Group, Badge, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconUserPlus, IconChalkboard } from '@tabler/icons-react';

export default function TeacherManagementPage() {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    const [form, setForm] = useState({
        username: '',
        password: '',
        full_name: ''
    });

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const userData = JSON.parse(userStr);
            setUser(userData);
            fetchTeachers(userData.academy_id);
        }
    }, []);

    const fetchTeachers = async (academyId: string) => {
        if (!academyId) return;
        try {
            const res = await fetch(`/api/users?role=teacher&academy_id=${academyId}`);
            if (res.ok) {
                const data = await res.json();
                setTeachers(data.users || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!form.username || !form.password || !form.full_name) {
            notifications.show({ title: '오류', message: '모든 정보를 입력해주세요.', color: 'red' });
            return;
        }

        try {
            const res = await fetch('/api/admin/teachers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    academy_id: user.academy_id
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed');
            }

            notifications.show({ title: '성공', message: '선생님 계정이 생성되었습니다.', color: 'green' });
            setForm({ username: '', password: '', full_name: '' });
            fetchTeachers(user.academy_id);

        } catch (error: any) {
            notifications.show({ title: '실패', message: error.message, color: 'red' });
        }
    };

    return (
        <Container size="xl" py="xl">
            <Group mb="xl">
                <IconChalkboard size={32} />
                <Title order={2}>선생님 관리</Title>
            </Group>

            <Grid>
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Paper p="lg" withBorder shadow="sm">
                        <Title order={4} mb="md">새 선생님 등록</Title>
                        <Stack>
                            <TextInput
                                label="아이디"
                                placeholder="User ID"
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                            />
                            <PasswordInput
                                label="비밀번호"
                                placeholder="Password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                            />
                            <TextInput
                                label="이름"
                                placeholder="선생님 성함"
                                value={form.full_name}
                                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                            />
                            <Button
                                leftSection={<IconUserPlus size={18} />}
                                color="blue"
                                fullWidth
                                onClick={handleCreate}
                                mt="sm"
                            >
                                계정 생성
                            </Button>
                        </Stack>
                    </Paper>
                    <Text size="xs" c="dimmed" mt="xs">
                        * 생성된 계정은 현재 로그인된 학원({user?.academy_id})에 소속됩니다.
                    </Text>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 8 }}>
                    <Paper p="lg" withBorder shadow="sm">
                        <Title order={4} mb="md">등록된 선생님 목록</Title>
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>이름</Table.Th>
                                    <Table.Th>아이디</Table.Th>
                                    <Table.Th>상태</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {teachers.map((teacher) => (
                                    <Table.Tr key={teacher.id}>
                                        <Table.Td fw={500}>{teacher.full_name}</Table.Td>
                                        <Table.Td>{teacher.username}</Table.Td>
                                        <Table.Td>
                                            <Badge color="green" variant="light">Active</Badge>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                                {teachers.length === 0 && !loading && (
                                    <Table.Tr>
                                        <Table.Td colSpan={3} ta="center" py="xl" c="dimmed">
                                            등록된 선생님이 없습니다.
                                        </Table.Td>
                                    </Table.Tr>
                                )}
                            </Table.Tbody>
                        </Table>
                    </Paper>
                </Grid.Col>
            </Grid>
        </Container>
    );
}
