'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AppShell, Burger, Group, Text, NavLink, Box, Paper, Stack } from '@mantine/core'; // Removed Badge
import { useDisclosure } from '@mantine/hooks';
import {
    IconHome,
    IconBook,
    IconSettings,
    IconLogout,
    IconVideo,
} from '@tabler/icons-react'; // Removed IconMail
import { SpotlightEffect } from '@/components/ui/SpotlightEffect';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [opened, { toggle }] = useDisclosure();
    const pathname = usePathname();

    // 학생 정보 상태
    const [studentName, setStudentName] = useState('학생');
    // Removed unreadCount state

    // localStorage에서 사용자 정보 가져오기 및 보안 체크
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                router.replace('/');
                return;
            }

            try {
                const user = JSON.parse(userStr);

                // 학생이 아니면 선생님 대시보드로 리다이렉트
                if (user.role !== 'student') {
                    router.replace('/teacher/dashboard');
                    return;
                }

                setStudentName(user.full_name || user.name || '학생');
                // Removed fetchUnreadMessages call
            } catch (error) {
                console.error('Failed to parse user data:', error);
                router.replace('/');
            }
        }
    }, [router, pathname]);

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('user');
        }
        router.push('/');
    };

    const navItems = [
        { icon: IconBook, label: '나의 학습', href: '/student/learning' },
        { icon: IconVideo, label: '강의보기', href: '/student/grammar-lectures' },
        // Removed Messages nav item
        { icon: IconSettings, label: '설정', href: '/student/settings' },
    ];

    return (
        <Box
            style={{
                minHeight: '100vh',
                backgroundColor: '#0F172A', // Base Dark Background
                position: 'relative',
            }}
        >
            <SpotlightEffect spotlightColor="rgba(139, 92, 246, 0.25)" size={500} />

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
                    background: 'transparent', // Important for visibility
                }}
            >
                {/* 헤더 */}
                <AppShell.Header
                    style={{
                        borderBottom: '2px solid white', // Dark mode border
                        backgroundColor: '#0F172A', // Dark Header
                        zIndex: 101
                    }}
                >
                    <Group h="100%" px="md" justify="space-between">
                        <Group>
                            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="white" />

                            {/* 로고 영역 */}
                            <Box
                                onClick={() => router.push('/student/learning')}
                                style={{
                                    background: '#FFD93D', // Yellow Accent remains
                                    border: '2px solid white',
                                    padding: '0.4rem 1rem',
                                    boxShadow: '0 0 10px rgba(255, 217, 61, 0.5)',
                                    transform: 'rotate(2deg)',
                                    cursor: 'pointer',
                                }}
                            >
                                <Text
                                    size="xl"
                                    fw={900}
                                    style={{
                                        color: 'black',
                                        textShadow: 'none',
                                        fontFamily: "'Montserrat', sans-serif",
                                        letterSpacing: '-1px'
                                    }}
                                >
                                    WORDTEST
                                    <span style={{ fontSize: '0.8em', marginLeft: '5px', fontWeight: 500, color: 'black' }}>
                                        STUDENT
                                    </span>
                                </Text>
                            </Box>
                        </Group>

                        <button
                            onClick={handleLogout}
                            style={{
                                background: 'transparent',
                                color: 'white',
                                border: '2px solid white',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                padding: '0.4rem 0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                marginTop: '2px', // Alignment fix
                                transition: 'all 0.1s',
                            }}
                            className="neo-button hover:bg-white hover:text-black"
                        >
                            <IconLogout size={16} stroke={2} />
                        </button>
                    </Group>
                </AppShell.Header>

                {/* 사이드바 */}
                <AppShell.Navbar p="md" style={{ borderRight: '3px solid white', backgroundColor: '#0F172A' }}>
                    <Box>
                        <Paper
                            p="md"
                            mb="xl"
                            style={{
                                background: '#1E293B', // Slightly lighter dark
                                border: '2px solid white',
                                boxShadow: '4px 4px 0px white', // White shadow pop
                                borderRadius: 0,
                            }}
                        >
                            <Text size="sm" c="dimmed" mb="xs" fw={700}>
                                WELCOME BACK!
                            </Text>
                            <Text size="xl" fw={900} style={{ fontFamily: 'Pretendard', color: 'white' }}>
                                {studentName}님
                            </Text>
                            <Text size="sm" fw={600} c="gray.3">
                                오늘도 파이팅!
                            </Text>
                        </Paper>

                        <Stack gap="xs">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <NavLink
                                        key={item.href}
                                        label={item.label}
                                        leftSection={<item.icon size={24} stroke={2} />}
                                        onClick={() => {
                                            router.push(item.href);
                                            toggle(); // 모바일에서 메뉴 선택 시 사이드바 닫기
                                        }}
                                        style={{
                                            borderRadius: '0px',
                                            border: '2px solid white',
                                            backgroundColor: isActive ? '#3B82F6' : 'transparent', // Blue active, Transparent inactive
                                            color: isActive ? 'white' : 'white',
                                            fontWeight: isActive ? 900 : 700,
                                            padding: '1rem',
                                            fontSize: '1rem',
                                            boxShadow: isActive ? '4px 4px 0px white' : 'none',
                                            transform: isActive ? 'translate(-2px, -2px)' : 'none',
                                            transition: 'all 0.1s',
                                        }}
                                        classNames={{
                                            root: 'hover:bg-slate-800'
                                        }}
                                    />
                                );
                            })}
                        </Stack>
                    </Box>
                </AppShell.Navbar>

                {/* 메인 콘텐츠 */}
                <AppShell.Main
                    style={{
                        background: 'transparent',
                        minHeight: '100vh',
                    }}
                >
                    {children}
                </AppShell.Main>
            </AppShell >
        </Box>
    );
}
