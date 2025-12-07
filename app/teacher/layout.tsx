'use client';

import { ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    AppShell,
    Burger,
    Group,
    NavLink,
    Title,
    Box,
    Text,
    Paper,
    Stack,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconUsers,
    IconBook,
    IconList,
    IconBell,
    IconSettings,
    IconLogout,
    IconDashboard,
    IconHeadphones,
} from '@tabler/icons-react';

export default function TeacherLayout({ children }: { children: ReactNode }) {
    const [opened, { toggle }] = useDisclosure();
    const router = useRouter();
    const pathname = usePathname();

    const menuItems = [
        { icon: IconDashboard, label: '대시보드', href: '/teacher/dashboard' },
        { icon: IconList, label: '수업 일지', href: '/teacher/class-log' },
        { icon: IconList, label: '당일 관리', href: '/teacher/today' },
        { icon: IconUsers, label: '학생 관리', href: '/teacher/students' },
        { icon: IconBook, label: '단어장 관리', href: '/teacher/wordbooks' },
        { icon: IconList, label: '커리큘럼 관리', href: '/teacher/curriculums' },
        { icon: IconHeadphones, label: '듣기 문제 관리', href: '/teacher/listening' },
        { icon: IconBell, label: '공지/쪽지', href: '/teacher/notices' },
        { icon: IconSettings, label: '설정', href: '/teacher/settings' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/');
    };

    return (
        <AppShell
            header={{ height: 80 }}
            navbar={{
                width: 300,
                breakpoint: 'sm',
                collapsed: { mobile: !opened },
            }}
            padding="md"
            style={{
                '--app-shell-header-height': '80px',
            }}
        >
            <AppShell.Header
                style={{
                    borderBottom: '3px solid black',
                    backgroundColor: 'white',
                    zIndex: 101
                }}
            >
                <Group h="100%" px="md" justify="space-between">
                    <Group>
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />

                        {/* 로고 영역 */}
                        <Box
                            onClick={() => router.push('/teacher/dashboard')}
                            style={{
                                background: 'var(--accent)', // Yellow
                                border: '3px solid black',
                                borderRadius: '0px',
                                padding: '0.4rem 1rem',
                                boxShadow: '4px 4px 0px rgba(0, 0, 0, 1)',
                                transform: 'rotate(-2deg)',
                                transition: 'transform 0.2s',
                                cursor: 'pointer',
                            }}
                        >
                            <Text
                                size="xl"
                                fw={900}
                                style={{
                                    color: 'black',
                                    fontFamily: "'Montserrat', sans-serif",
                                    letterSpacing: '-1px'
                                }}
                            >
                                WORDTEST
                                <span style={{ fontSize: '0.8em', marginLeft: '5px', fontWeight: 500 }}>
                                    TEACHER
                                </span>
                            </Text>
                        </Box>
                    </Group>

                    {/* 로그아웃 버튼 */}
                    <button
                        onClick={handleLogout}
                        style={{
                            background: '#FF90E8', // Pink
                            color: 'black',
                            border: '3px solid black',
                            borderRadius: '0px',
                            boxShadow: '4px 4px 0px black',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            padding: '0.4rem 0.8rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.1s',
                        }}
                        onMouseDown={(e) => {
                            e.currentTarget.style.transform = 'translate(2px, 2px)';
                            e.currentTarget.style.boxShadow = '2px 2px 0px black';
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.transform = 'translate(0, 0)';
                            e.currentTarget.style.boxShadow = '4px 4px 0px black';
                        }}
                    >
                        <IconLogout size={16} stroke={2.5} />
                        LOGOUT
                    </button>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="md" style={{ borderRight: '3px solid black', backgroundColor: '#FACC15' }}>
                <Box>
                    {/* 프로필 카드 */}
                    <Paper
                        p="md"
                        mb="xl"
                        style={{
                            background: 'white',
                            border: '3px solid black',
                            borderRadius: '0px',
                            boxShadow: '4px 4px 0px black',
                        }}
                    >
                        <Group>
                            <Box
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    background: '#2563EB',
                                    borderRadius: '50%',
                                    border: '2px solid black'
                                }}
                            />
                            <Box>
                                <Text size="sm" c="dimmed" fw={700} style={{ textTransform: 'uppercase' }}>
                                    Create User
                                </Text>
                                <Text size="lg" fw={900} style={{ fontFamily: 'Pretendard' }}>
                                    선생님
                                </Text>
                            </Box>
                        </Group>
                    </Paper>

                    <Stack gap="xs">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <NavLink
                                    key={item.href}
                                    label={item.label}
                                    leftSection={<Icon size={22} stroke={2.5} />}
                                    active={isActive}
                                    onClick={() => {
                                        router.push(item.href);
                                        toggle();
                                    }}
                                    style={{
                                        borderRadius: '0px',
                                        border: '3px solid black',
                                        backgroundColor: isActive ? '#2563EB' : 'white',
                                        color: isActive ? 'white' : 'black',
                                        fontWeight: 800,
                                        fontSize: '1rem',
                                        padding: '1rem',
                                        boxShadow: '4px 4px 0px black',
                                        transform: isActive ? 'translate(-2px, -2px)' : 'none',
                                        transition: 'all 0.1s',
                                    }}
                                />
                            );
                        })}
                    </Stack>
                </Box>
            </AppShell.Navbar>

            <AppShell.Main
                style={{
                    background: '#F3F4F6',
                    minHeight: '100vh',
                }}
            >
                {children}
            </AppShell.Main>
        </AppShell>
    );
}
