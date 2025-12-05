'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, Burger, Group, Text, NavLink, Box, Badge } from '@mantine/core';
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
    const [active, setActive] = useState('dashboard');

    // 샘플 학생 데이터
    const studentName = '김철수';
    const studentDollars = 150;

    const handleLogout = () => {
        router.push('/');
    };

    const navItems = [
        { icon: IconHome, label: '대시보드', value: 'dashboard', href: '/student/dashboard' },
        { icon: IconBook, label: '나의 학습', value: 'learning', href: '/student/learning' },
        { icon: IconMail, label: '쪽지함', value: 'messages', href: '/student/messages', badge: 3 },
        { icon: IconSettings, label: '설정', value: 'settings', href: '/student/settings' },
    ];

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
            {/* 헤더 */}
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                    <Group>
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                        <Text
                            size="xl"
                            fw={900}
                            style={{
                                background: 'linear-gradient(45deg, #FFD93D, #FF6B9D)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            🎓 Eastern-WordTest
                        </Text>
                    </Group>

                    <Group>
                        <Box
                            style={{
                                background: '#FFD93D',
                                border: '3px solid black',
                                borderRadius: '12px',
                                padding: '0.5rem 1rem',
                                boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                            }}
                        >
                            <IconCoin size={24} color="black" />
                            <Text fw={900} size="lg" c="black">
                                {studentDollars}
                            </Text>
                        </Box>

                        <Text fw={700} size="lg">
                            {studentName} 학생
                        </Text>

                        <button
                            onClick={handleLogout}
                            style={{
                                background: '#FF6B6B',
                                color: 'white',
                                border: '3px solid black',
                                borderRadius: '10px',
                                boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
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
                </Group>
            </AppShell.Header>

            {/* 사이드바 */}
            <AppShell.Navbar p="md">
                <Box mb="xl">
                    <Text size="sm" c="dimmed" mb="xs">
                        학생 포털
                    </Text>
                    <Text size="xl" fw={900}>
                        안녕하세요! 👋
                    </Text>
                    <Text size="lg" fw={700} c="violet">
                        {studentName}
                    </Text>
                </Box>

                {navItems.map((item) => (
                    <NavLink
                        key={item.value}
                        active={active === item.value}
                        label={item.label}
                        leftSection={<item.icon size={24} stroke={2} />}
                        rightSection={
                            item.badge ? (
                                <Badge
                                    size="sm"
                                    variant="filled"
                                    color="red"
                                    style={{ border: '2px solid black' }}
                                >
                                    {item.badge}
                                </Badge>
                            ) : null
                        }
                        onClick={() => {
                            setActive(item.value);
                            router.push(item.href);
                            toggle(); // 모바일에서 메뉴 선택 시 사이드바 닫기
                        }}
                        style={{
                            borderRadius: '12px',
                            marginBottom: '0.5rem',
                            border: active === item.value ? '3px solid black' : 'none',
                            background: active === item.value ? '#FFD93D' : 'transparent',
                            fontWeight: active === item.value ? 900 : 600,
                            padding: '1rem',
                        }}
                    />
                ))}
            </AppShell.Navbar>

            {/* 메인 콘텐츠 */}
            <AppShell.Main
                style={{
                    background: 'linear-gradient(135deg, #FFF5E6 0%, #FFE5F0 100%)',
                    minHeight: '100vh',
                }}
            >
                {children}
            </AppShell.Main>
        </AppShell>
    );
}
