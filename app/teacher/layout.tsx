
'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    AppShell,
    Burger,
    Group,
    NavLink,
    Box,
    Text,
    Paper,
    Stack,
    Badge
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
import { SpotlightEffect } from '@/components/ui/SpotlightEffect';

export default function TeacherLayout({ children }: { children: ReactNode }) {
    const [opened, { toggle }] = useDisclosure();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            router.push('/');
            return;
        }
        try {
            const user = JSON.parse(userStr);
            if (user.role === 'student') {
                router.replace('/student/dashboard');
            }
        } catch (e) {
            router.push('/');
        }
    }, [router, pathname]);

    const menuItems = [
        { icon: IconDashboard, label: '대시보드', href: '/teacher/dashboard' },
        { icon: IconList, label: '수업 일지', href: '/teacher/class-log' },
        { icon: IconUsers, label: '학생 관리', href: '/teacher/students' },
        { icon: IconBook, label: '단어장 관리', href: '/teacher/wordbooks' },
        { icon: IconList, label: '커리큘럼 관리', href: '/teacher/curriculums' },
        { icon: IconHeadphones, label: '듣기 문제 관리', href: '/teacher/listening' },
        { icon: IconBell, label: '공지사항', href: '/teacher/notices' },
        { icon: IconSettings, label: '설정', href: '/teacher/settings' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/');
    };

    return (
        <Box
            style={{
                minHeight: '100vh',
                backgroundColor: '#0F172A', // Dark Base
                position: 'relative',
            }}
        >
            <SpotlightEffect spotlightColor="rgba(139, 92, 246, 0.25)" size={500} /> {/* Purple spotlight to match student */}

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
                    background: 'transparent',
                }}
            >
                <AppShell.Header
                    style={{
                        borderBottom: '2px solid white',
                        backgroundColor: '#0F172A',
                        zIndex: 101,
                    }}
                >
                    <Group h="100%" px="md" justify="space-between">
                        <Group>
                            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="white" />

                            {/* 로고 영역 */}
                            <Box
                                onClick={() => router.push('/teacher/dashboard')}
                                style={{
                                    background: 'var(--accent)', // Yellow
                                    border: '2px solid white',
                                    borderRadius: '0px',
                                    padding: '0.4rem 1rem',
                                    boxShadow: '0 0 10px rgba(250, 204, 21, 0.3)',
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
                                border: '2px solid white',
                                borderRadius: '0px',
                                boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.1)',
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
                            }}
                            onMouseUp={(e) => {
                                e.currentTarget.style.transform = 'translate(0, 0)';
                            }}
                        >
                            <IconLogout size={16} stroke={2.5} />
                            LOGOUT
                        </button>
                    </Group>
                </AppShell.Header>

                <AppShell.Navbar p="md" style={{ borderRight: '2px solid white', backgroundColor: '#0F172A' }}>
                    <Box>
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
                                            border: isActive ? '2px solid #FACC15' : '2px solid transparent', // Yellow border active
                                            backgroundColor: isActive ? 'rgba(250, 204, 21, 0.15)' : 'transparent',
                                            color: isActive ? '#FACC15' : '#E2E8F0', // Yellow active, Light Gray inactive
                                            fontWeight: isActive ? 900 : 700,
                                            fontSize: '1.1rem', // Slightly larger
                                            padding: '1rem',
                                            marginBottom: '0.5rem',
                                            boxShadow: isActive ? '0 0 15px rgba(250, 204, 21, 0.3)' : 'none', // Glow
                                            textShadow: isActive ? '0 0 10px rgba(250, 204, 21, 0.5)' : 'none',
                                            transform: isActive ? 'scale(1.02)' : 'none',
                                            transition: 'all 0.2s ease',
                                        }}
                                        classNames={{
                                            root: 'hover:bg-slate-800 hover:text-yellow-400'
                                        }}
                                    />
                                );
                            })}
                        </Stack>
                    </Box>
                </AppShell.Navbar>

                <AppShell.Main
                    style={{
                        background: 'transparent',
                        minHeight: '100vh',
                    }}
                >
                    {children}
                </AppShell.Main>
            </AppShell>
        </Box>
    );
}
