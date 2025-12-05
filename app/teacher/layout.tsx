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
} from '@tabler/icons-react';

export default function TeacherLayout({ children }: { children: ReactNode }) {
    const [opened, { toggle }] = useDisclosure();
    const router = useRouter();
    const pathname = usePathname();

    const menuItems = [
        { icon: IconDashboard, label: '대시보드', href: '/teacher/dashboard' },
        { icon: IconUsers, label: '학생 관리', href: '/teacher/students' },
        { icon: IconBook, label: '단어장 관리', href: '/teacher/wordbooks' },
        { icon: IconList, label: '커리큘럼 관리', href: '/teacher/curriculums' },
        { icon: IconBell, label: '공지/쪽지', href: '/teacher/notices' },
        { icon: IconSettings, label: '설정', href: '/teacher/settings' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/');
    };

    return (
        <AppShell
            header={{ height: 70 }}
            navbar={{
                width: 280,
                breakpoint: 'sm',
                collapsed: { mobile: !opened },
            }}
            padding="md"
        >
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                    <Group>
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                        <Box
                            style={{
                                background: '#FFD93D',
                                border: '3px solid black',
                                borderRadius: '10px',
                                padding: '0.5rem 1rem',
                                boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.3)',
                            }}
                        >
                            <Text size="xl" fw={900} style={{ color: 'black' }}>
                                📚 Eastern-WordTest
                            </Text>
                        </Box>
                    </Group>
                    <button
                        onClick={handleLogout}
                        style={{
                            background: '#FF6B9D',
                            color: 'white',
                            border: '3px solid black',
                            borderRadius: '8px',
                            boxShadow: '3px 3px 0px rgba(0, 0, 0, 1)',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}
                    >
                        <IconLogout size={18} />
                        로그아웃
                    </button>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="md">
                <Box>
                    <Paper
                        p="md"
                        mb="md"
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: '3px solid black',
                            borderRadius: '12px',
                            boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)',
                        }}
                    >
                        <Text size="sm" c="white" fw={700}>
                            👨‍🏫 선생님 포털
                        </Text>
                        <Text size="xs" c="white" mt={5}>
                            학생 관리 및 커리큘럼 운영
                        </Text>
                    </Paper>

                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <NavLink
                                key={item.href}
                                label={item.label}
                                leftSection={<Icon size={20} />}
                                active={isActive}
                                onClick={() => router.push(item.href)}
                                style={{
                                    borderRadius: '8px',
                                    marginBottom: '0.5rem',
                                    border: isActive ? '3px solid black' : 'none',
                                    background: isActive ? '#FFD93D' : 'transparent',
                                    fontWeight: isActive ? 900 : 600,
                                    boxShadow: isActive ? '3px 3px 0px rgba(0, 0, 0, 0.2)' : 'none',
                                }}
                            />
                        );
                    })}
                </Box>
            </AppShell.Navbar>

            <AppShell.Main
                style={{
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    minHeight: '100vh',
                }}
            >
                {children}
            </AppShell.Main>
        </AppShell>
    );
}
