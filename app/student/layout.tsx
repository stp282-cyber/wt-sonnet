'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AppShell, Burger, Group, Text, NavLink, Box, Badge, Paper } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconHome,
    IconBook,
    IconMail,
    IconSettings,
    IconLogout,
    IconCoin,
} from '@tabler/icons-react';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [opened, { toggle }] = useDisclosure();
    const pathname = usePathname();

    // 샘플 학생 데이터 (나중에 API 연동)
    const studentName = '김철수';
    const studentDollars = 150;

    const handleLogout = () => {
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
                            style={{
                                background: '#FF6B9D', // Pink
                                border: '3px solid black',
                                padding: '0.4rem 1rem',
                                boxShadow: '4px 4px 0px rgba(0, 0, 0, 1)',
                                transform: 'rotate(2deg)',
                            }}
                        >
                            <Text
                                size="xl"
                                fw={900}
                                style={{
                                    color: 'white',
                                    textShadow: '2px 2px 0px black',
                                    fontFamily: "'Montserrat', sans-serif",
                                    letterSpacing: '-1px'
                                }}
                            >
                                WORDTEST
                                <span style={{ fontSize: '0.8em', marginLeft: '5px', fontWeight: 500, color: 'black', textShadow: 'none' }}>
                                    STUDENT
                                </span>
                            </Text>
                        </Box>
                    </Group>

                    <Group>
                        {/* 달러 표시 */}
                        <Box
                            style={{
                                background: '#FFD93D', // Yellow
                                border: '3px solid black',
                                padding: '0.5rem 1rem',
                                boxShadow: '3px 3px 0px black',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                            }}
                        >
                            <IconCoin size={24} color="black" stroke={2.5} />
                            <Text fw={900} size="lg" c="black">
                                {studentDollars}
                            </Text>
                        </Box>

                        <Text fw={700} size="lg" visibleFrom="xs">
                            {studentName} 학생
                        </Text>

                        <button
                            onClick={handleLogout}
                            style={{
                                background: 'white',
                                color: 'black',
                                border: '3px solid black',
                                fontSize: '0.9rem',
                                fontWeight: 800,
                                padding: '0.5rem 1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                marginTop: '2px', // Alignment fix
                                transition: 'all 0.1s',
                            }}
                            className="neo-button"
                        >
                            <IconLogout size={18} stroke={2.5} />
                        </button>
                    </Group>
                </Group>
            </AppShell.Header>

            {/* 사이드바 */}
            <AppShell.Navbar p="md" style={{ borderRight: '3px solid black', backgroundColor: '#FFF0F6' }}>
                <Box mb="xl">
                    <Paper
                        p="md"
                        style={{
                            background: 'white',
                            border: '3px solid black',
                            boxShadow: '4px 4px 0px black',
                        }}
                    >
                        <Text size="sm" c="dimmed" mb="xs" fw={700}>
                            WELCOME BACK!
                        </Text>
                        <Text size="xl" fw={900} style={{ fontFamily: 'Pretendard' }}>
                            {studentName}님
                        </Text>
                        <Text size="sm" fw={600} c="blue">
                            오늘도 파이팅! 🔥
                        </Text>
                    </Paper>
                </Box>

                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <NavLink
                            key={item.href}
                            label={item.label}
                            leftSection={<item.icon size={24} stroke={2.5} />}
                            rightSection={
                                item.badge ? (
                                    <Badge
                                        size="sm"
                                        variant="filled"
                                        color="red"
                                        style={{ border: '2px solid black', fontWeight: 900 }}
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
                                marginBottom: '0.8rem',
                                border: '3px solid black',
                                background: isActive ? '#FF6B9D' : 'white', // Pink for active
                                color: isActive ? 'white' : 'black',
                                fontWeight: isActive ? 900 : 700,
                                padding: '1rem',
                                boxShadow: isActive ? '4px 4px 0px black' : '2px 2px 0px rgba(0,0,0,0.1)',
                                transform: isActive ? 'translate(-2px, -2px)' : 'none',
                                transition: 'all 0.1s',
                            }}
                        />
                    );
                })}
            </AppShell.Navbar>

            {/* 메인 콘텐츠 */}
            <AppShell.Main
                style={{
                    background: '#FDF2F8', // Very light pink
                    backgroundImage: 'radial-gradient(#FBCFE8 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    minHeight: '100vh',
                }}
            >
                {children}
            </AppShell.Main>
        </AppShell>
    );
}
