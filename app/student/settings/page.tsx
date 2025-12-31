'use client';

import { useState, useEffect } from 'react';
import { Container, Title, Paper, Text, Box, Group, Stack, PasswordInput, Button, Center, Loader } from '@mantine/core';
import { IconLock, IconCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

export default function StudentSettingsPage() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        }
    }, []);

    const handleSave = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            notifications.show({ title: '오류', message: '모든 필드를 입력해주세요.', color: 'red' });
            return;
        }

        if (newPassword !== confirmPassword) {
            notifications.show({ title: '오류', message: '새 비밀번호가 일치하지 않습니다.', color: 'red' });
            return;
        }

        if (!user || !user.username) {
            notifications.show({ title: '오류', message: '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.', color: 'red' });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/users/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: user.username,
                    currentPassword: currentPassword,
                    newPassword: newPassword
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || '비밀번호 변경 실패');
            }

            notifications.show({
                title: '성공',
                message: '비밀번호가 성공적으로 변경되었습니다.',
                color: 'green',
                styles: { root: { border: '2px solid black', boxShadow: '4px 4px 0px black' } }
            });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

        } catch (error: any) {
            console.error(error);
            notifications.show({
                title: '오류',
                message: error.message || '비밀번호 변경 중 오류가 발생했습니다.',
                color: 'red'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container size="md" py={40}>
            {/* Custom Animations Styles */}
            <style jsx global>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .neo-box {
                    border: 3px solid black;
                    border-radius: 0px;
                    box-shadow: 5px 5px 0px black;
                    background: white;
                }
                .neo-input input {
                    border: 2px solid black !important;
                    border-radius: 0px !important;
                    font-size: 1rem !important;
                    padding: 24px 16px !important;
                }
                .neo-input input:focus {
                    border-color: #339AF0 !important;
                    box-shadow: 4px 4px 0px rgba(0,0,0,0.1) !important;
                }
                .neo-button {
                    transition: transform 0.1s;
                }
                .neo-button:active {
                    transform: translate(2px, 2px);
                    box-shadow: 2px 2px 0px #CED4DA !important;
                }
            `}</style>

            {/* Header Section - Matches Dashboard */}
            <Group justify="space-between" align="flex-end" mb={50} className="animate-slide-up" style={{ animationDelay: '0ms' }}>
                <Box>
                    <Box
                        style={{
                            display: 'inline-block',
                            background: '#000',
                            padding: '0.5rem 2rem',
                            marginBottom: '1rem',
                            transform: 'skew(-10deg)',
                            boxShadow: '8px 8px 0px #FFD43B'
                        }}
                    >
                        <Title order={1} style={{
                            fontWeight: 900,
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: '3rem',
                            color: 'white',
                            transform: 'skew(10deg)',
                            lineHeight: 1
                        }}>
                            SETTINGS
                        </Title>
                    </Box>
                    <Text size="xl" fw={800} style={{ letterSpacing: '-0.5px' }}>
                        개인 정보 수정 (비밀번호 변경)
                    </Text>
                </Box>
            </Group>

            <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
                <Paper
                    p={40}
                    className="neo-box"
                >
                    <Group mb={30}>
                        <Box style={{ background: '#FFD43B', padding: '10px', border: '2px solid black' }}>
                            <IconLock size={32} color="black" stroke={2} />
                        </Box>
                        <Title order={2} fw={900}>비밀번호 변경</Title>
                    </Group>

                    <Stack gap="xl">
                        <PasswordInput
                            label="현재 비밀번호"
                            placeholder="현재 사용 중인 비밀번호"
                            description="보안을 위해 현재 비밀번호를 입력해주세요."
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            classNames={{ wrapper: 'neo-input' }}
                            styles={{
                                label: { fontWeight: 800, marginBottom: 8, fontSize: '1rem' },
                                description: { marginBottom: 16 }
                            }}
                        />

                        <Stack gap="xs">
                            <PasswordInput
                                label="새 비밀번호"
                                placeholder="새로운 비밀번호"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                classNames={{ wrapper: 'neo-input' }}
                                styles={{
                                    label: { fontWeight: 800, marginBottom: 8, fontSize: '1rem' }
                                }}
                            />

                            <PasswordInput
                                label="새 비밀번호 확인"
                                placeholder="새로운 비밀번호 다시 입력"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                classNames={{ wrapper: 'neo-input' }}
                                styles={{
                                    label: { fontWeight: 800, marginBottom: 8, fontSize: '1rem' }
                                }}
                            />
                        </Stack>

                        <Button
                            onClick={handleSave}
                            fullWidth
                            size="xl"
                            color="dark"
                            loading={loading}
                            radius={0}
                            className="neo-button"
                            leftSection={<IconCheck size={24} />}
                            style={{
                                border: '3px solid black',
                                boxShadow: '6px 6px 0px #CED4DA',
                                fontSize: '1.2rem',
                                fontWeight: 900,
                                height: '60px'
                            }}
                        >
                            변경 내용 저장
                        </Button>
                    </Stack>
                </Paper>
            </div>
        </Container>
    );
}
