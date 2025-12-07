'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AppShell, Burger, Group, Text, NavLink, Box, Badge, Paper, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconHome,
    IconBook,
    IconMail,
    IconSettings,
    IconLogout,

} from '@tabler/icons-react';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [opened, { toggle }] = useDisclosure();
    const pathname = usePathname();

    // 학생 정보 상태
    const [studentName, setStudentName] = useState('학생');


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
        { icon: IconHome, label: '대시보드', href: '/student/dashboard' },
        { icon: IconBook, label: '나의 학습', href: '/student/learning' },
        { icon: IconMail, label: '쪽지함', href: '/student/messages', badge: 3 },
        { icon: IconSettings, label: '설정', href: '/student/settings' },
    ];

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
            {/* 헤더 */}
            <AppShell.Header
                style={{
                    borderBottom: '2px solid black',
                    backgroundColor: 'white',
                    zIndex: 101
                }}
            >
                <Group h="100%" px="md" justify="space-between">
                    <Group>
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />

                        {/* 로고 영역 */}
                        <Box
                            onClick={() => router.push('/student/dashboard')}
                            style={{
                                background: '#FFD93D', // Yellow
                                border: '2px solid black',
                                padding: '0.4rem 1rem',
                                boxShadow: '4px 4px 0px rgba(0, 0, 0, 1)',
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
                            background: 'white',
                            color: 'black',
                            border: '2px solid black',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            padding: '0.4rem 0.8rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            marginTop: '2px', // Alignment fix
                            transition: 'all 0.1s',
                        }}
                        className="neo-button"
                    >
                        <IconLogout size={16} stroke={2} />
                    </button>
                </Group>
            </AppShell.Header>

            {/* 사이드바 */}
            <AppShell.Navbar p="md" style={{ borderRight: '3px solid black', backgroundColor: '#FACC15' }}>
                <Box>
                    <Paper
                        p="md"
                        mb="xl"
                        style={{
                            background: 'white',
                            border: '3px solid black',
                            boxShadow: '4px 4px 0px black',
                            borderRadius: 0,
                        }}
                    >
                        <Text size="sm" c="dimmed" mb="xs" fw={700}>
                            WELCOME BACK!
                        </Text>
                        <Text size="xl" fw={900} style={{ fontFamily: 'Pretendard' }}>
                            {studentName}님
                        </Text>
                        <Text size="sm" fw={600} c="black">
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
                                    rightSection={
                                        item.badge ? (
                                            <Badge
                                                size="sm"
                                                variant="filled"
                                                color="dark"
                                                radius={0}
                                                style={{ border: '1px solid black', fontWeight: 900 }}
                                            >
                                                {item.badge}
                                            </Badge>
                                        ) : null
                                    }
                                    onClick={() => {
                                        router.push(item.href);
                                        toggle(); // 모바일에서 메뉴 선택 시 사이드바 닫기
                                    }}
                                    style={{
                                        borderRadius: '0px',
                                        border: '3px solid black',
                                        backgroundColor: isActive ? '#2563EB' : 'white',
                                        color: isActive ? 'white' : 'black',
                                        fontWeight: isActive ? 900 : 700,
                                        padding: '1rem',
                                        fontSize: '1rem',
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

            {/* 메인 콘텐츠 */}
            <AppShell.Main
                style={{
                    background: 'white',
                    minHeight: '100vh',
                }}
            >
                {children}
            </AppShell.Main>
        </AppShell >
    );
}
