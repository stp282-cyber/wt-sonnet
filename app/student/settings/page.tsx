'use client';

import { useState } from 'react';
import { Container, Title, Paper, Text, Box, Stack, TextInput, PasswordInput, Switch, Select, Group } from '@mantine/core';
import { IconUser, IconLock, IconBell, IconPalette } from '@tabler/icons-react';

export default function StudentSettingsPage() {
    const [name, setName] = useState('김철수');
    const [className, setClassName] = useState('A반');
    const [notifications, setNotifications] = useState(true);
    const [theme, setTheme] = useState('light');

    const handleSave = () => {
        // 저장 로직 (추후 구현)
        console.log('설정 저장');
    };

    return (

        <Container size="md" py={40}>
            <div className="animate-fade-in">
                {/* 페이지 헤더 */}
                <Box mb={30}>
                    <Title order={1} style={{ fontWeight: 900, marginBottom: '0.5rem' }}>
                        설정
                    </Title>
                    <Text size="lg" c="dimmed">
                        개인 정보 및 환경 설정
                    </Text>
                </Box>

                <Stack gap="lg">
                    {/* 프로필 정보 */}
                    <Paper
                        p="xl"
                        style={{
                            border: '2px solid black',
                            background: 'white',
                            boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                            borderRadius: 0,
                        }}
                    >
                        <Group mb="md">
                            <Box style={{ background: 'black', padding: '6px', border: '2px solid black' }}>
                                <IconUser size={24} color="white" stroke={2} />
                            </Box>
                            <Text size="xl" fw={900}>
                                프로필 정보
                            </Text>
                        </Group>

                        <Stack gap="md">
                            <TextInput
                                label="이름"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                styles={{
                                    input: {
                                        border: '2px solid black',
                                        borderRadius: '0px',
                                        fontSize: '1rem',
                                    },
                                    label: {
                                        fontWeight: 700,
                                        marginBottom: '0.5rem',
                                    },
                                }}
                            />

                            <TextInput
                                label="반"
                                value={className}
                                disabled
                                styles={{
                                    input: {
                                        border: '2px solid black',
                                        borderRadius: '0px',
                                        fontSize: '1rem',
                                        background: '#F1F3F5',
                                        color: 'black',
                                    },
                                    label: {
                                        fontWeight: 700,
                                        marginBottom: '0.5rem',
                                    },
                                }}
                            />
                        </Stack>
                    </Paper>

                    {/* 비밀번호 변경 */}
                    <Paper
                        p="xl"
                        style={{
                            border: '2px solid black',
                            background: 'white',
                            boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                            borderRadius: 0,
                        }}
                    >
                        <Group mb="md">
                            <Box style={{ background: 'black', padding: '6px', border: '2px solid black' }}>
                                <IconLock size={24} color="white" stroke={2} />
                            </Box>
                            <Text size="xl" fw={900}>
                                비밀번호 변경
                            </Text>
                        </Group>

                        <Stack gap="md">
                            <PasswordInput
                                label="현재 비밀번호"
                                placeholder="현재 비밀번호를 입력하세요"
                                styles={{
                                    input: {
                                        border: '2px solid black',
                                        borderRadius: '0px',
                                        fontSize: '1rem',
                                    },
                                    label: {
                                        fontWeight: 700,
                                        marginBottom: '0.5rem',
                                    },
                                    innerInput: {
                                        fontSize: '1rem',
                                    }
                                }}
                            />

                            <PasswordInput
                                label="새 비밀번호"
                                placeholder="새 비밀번호를 입력하세요"
                                styles={{
                                    input: {
                                        border: '2px solid black',
                                        borderRadius: '0px',
                                        fontSize: '1rem',
                                    },
                                    label: {
                                        fontWeight: 700,
                                        marginBottom: '0.5rem',
                                    },
                                    innerInput: {
                                        fontSize: '1rem',
                                    }
                                }}
                            />

                            <PasswordInput
                                label="새 비밀번호 확인"
                                placeholder="새 비밀번호를 다시 입력하세요"
                                styles={{
                                    input: {
                                        border: '2px solid black',
                                        borderRadius: '0px',
                                        fontSize: '1rem',
                                    },
                                    label: {
                                        fontWeight: 700,
                                        marginBottom: '0.5rem',
                                    },
                                    innerInput: {
                                        fontSize: '1rem',
                                    }
                                }}
                            />
                        </Stack>
                    </Paper>

                    {/* 알림 설정 */}
                    <Paper
                        p="xl"
                        style={{
                            border: '2px solid black',
                            background: 'white',
                            boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                            borderRadius: 0,
                        }}
                    >
                        <Group mb="md">
                            <Box style={{ background: 'black', padding: '6px', border: '2px solid black' }}>
                                <IconBell size={24} color="white" stroke={2} />
                            </Box>
                            <Text size="xl" fw={900}>
                                알림 설정
                            </Text>
                        </Group>

                        <Stack gap="md">
                            <Group justify="space-between">
                                <div>
                                    <Text fw={700}>학습 알림</Text>
                                    <Text size="sm" c="dimmed">
                                        오늘의 학습이 있을 때 알림을 받습니다
                                    </Text>
                                </div>
                                <Switch
                                    checked={notifications}
                                    onChange={(e) => setNotifications(e.currentTarget.checked)}
                                    size="lg"
                                    color="gray"
                                    styles={{
                                        track: {
                                            border: '2px solid black',
                                            cursor: 'pointer',
                                            backgroundColor: notifications ? 'black' : '#e9ecef',
                                        },
                                        thumb: {
                                            border: '2px solid black',
                                        }
                                    }}
                                />
                            </Group>
                        </Stack>
                    </Paper>

                    {/* 테마 설정 */}
                    <Paper
                        p="xl"
                        style={{
                            border: '2px solid black',
                            background: 'white',
                            boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                            borderRadius: 0,
                        }}
                    >
                        <Group mb="md">
                            <Box style={{ background: 'black', padding: '6px', border: '2px solid black' }}>
                                <IconPalette size={24} color="white" stroke={2} />
                            </Box>
                            <Text size="xl" fw={900}>
                                테마 설정
                            </Text>
                        </Group>

                        <Select
                            label="테마"
                            value={theme}
                            onChange={(value) => setTheme(value || 'light')}
                            data={[
                                { value: 'light', label: '라이트 모드' },
                                { value: 'dark', label: '다크 모드' },
                            ]}
                            styles={{
                                input: {
                                    border: '2px solid black',
                                    borderRadius: '0px',
                                    fontSize: '1rem',
                                },
                                label: {
                                    fontWeight: 700,
                                    marginBottom: '0.5rem',
                                },
                                dropdown: {
                                    border: '2px solid black',
                                    borderRadius: 0,
                                    boxShadow: '4px 4px 0px black',
                                },
                                option: {
                                    borderRadius: 0,
                                }
                            }}
                        />
                    </Paper>

                    {/* 저장 버튼 */}
                    <button
                        onClick={handleSave}
                        style={{
                            background: 'black',
                            color: 'white',
                            border: '2px solid black',
                            borderRadius: '0px',
                            boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                            fontSize: '1.2rem',
                            fontWeight: 900,
                            padding: '1.2rem 2rem',
                            cursor: 'pointer',
                            width: '100%',
                        }}
                    >
                        설정 저장
                    </button>
                </Stack>
            </div>
        </Container>
    );
}
