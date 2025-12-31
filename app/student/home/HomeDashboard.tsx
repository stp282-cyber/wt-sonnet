'use client';

import { ActionIcon, Box, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title, Badge } from '@mantine/core';
import { IconArrowRight, IconBook, IconPlayerPlay, IconSchool, IconVideo } from '@tabler/icons-react';
import Link from 'next/link';
import { SpotlightEffect } from '@/components/ui/SpotlightEffect';
import StudentGreeting from './Greeting';

interface HomeDashboardProps {
    books: { id: string; title: string; description?: string }[];
}

export default function HomeDashboard({ books }: HomeDashboardProps) {
    return (
        <Box
            style={{
                minHeight: '100vh',
                background: '#0F172A', // Slate 900
                position: 'relative',
                overflowX: 'hidden',
                padding: '2rem',
            }}
        >
            <SpotlightEffect spotlightColor="rgba(59, 130, 246, 0.25)" size={600} />

            {/* Header / Welcome (Client Component) */}
            <StudentGreeting />

            {/* Main Navigation Cards */}
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" mb={40} style={{ position: 'relative', zIndex: 10 }}>
                {/* Card 1: My Learning */}
                <Link href="/student/learning" style={{ textDecoration: 'none' }}>
                    <Paper
                        style={{
                            overflow: 'hidden',
                            cursor: 'pointer',
                            background: 'white',
                            border: '4px solid white',
                            borderRadius: '0px', // Neo-Brutalist
                            height: '100%',
                            minHeight: '220px',
                            position: 'relative',
                            boxShadow: '8px 8px 0px 0px #3B82F6', // Blue Shadow
                            transition: 'transform 0.2s ease',
                        }}
                        className="hover:-translate-y-1" // Tailwind utility for simple hover effect
                    >
                        <Box p="xl" style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <Group justify="space-between" align="flex-start">
                                <ThemeIcon size={64} radius="md" color="blue" variant="light">
                                    <IconSchool size={40} stroke={1.5} />
                                </ThemeIcon>
                                <IconArrowRight size={32} color="black" />
                            </Group>
                            <Box mt="lg">
                                <Title order={2} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, color: 'black' }}>
                                    MY LEARNING
                                </Title>
                                <Text size="md" fw={600} c="dimmed" mt="xs">
                                    오늘의 학습 일정과 진도를 확인하세요.
                                </Text>
                            </Box>
                        </Box>
                        {/* Decorative BG */}
                        <Box
                            style={{
                                position: 'absolute',
                                top: '-20%',
                                right: '-10%',
                                width: '200px',
                                height: '200px',
                                borderRadius: '50%',
                                background: 'rgba(59, 130, 246, 0.1)',
                                zIndex: 1,
                            }}
                        />
                    </Paper>
                </Link>

                {/* Card 2: Lecture Library */}
                <Link href="/student/grammar-lectures" style={{ textDecoration: 'none' }}>
                    <Paper
                        style={{
                            overflow: 'hidden',
                            cursor: 'pointer',
                            background: '#FFD93D', // Yellow
                            border: '4px solid white',
                            borderRadius: '0px',
                            height: '100%',
                            minHeight: '220px',
                            position: 'relative',
                            boxShadow: '8px 8px 0px 0px white', // White Shadow on Dark BG
                            transition: 'transform 0.2s ease',
                        }}
                        className="hover:-translate-y-1"
                    >
                        <Box p="xl" style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <Group justify="space-between" align="flex-start">
                                <ThemeIcon size={64} radius="md" color="dark" variant="filled" style={{ background: 'black' }}>
                                    <IconVideo size={36} stroke={1.5} color="#FFD93D" />
                                </ThemeIcon>
                                <IconArrowRight size={32} color="black" />
                            </Group>
                            <Box mt="lg">
                                <Title order={2} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, color: 'black' }}>
                                    LECTURE LIBRARY
                                </Title>
                                <Text size="md" fw={700} style={{ color: 'rgba(0,0,0,0.7)' }} mt="xs">
                                    모든 문법 및 독해 강의를 시청하세요.
                                </Text>
                            </Box>
                        </Box>
                        <Box
                            style={{
                                position: 'absolute',
                                bottom: '-20%',
                                left: '-10%',
                                width: '180px',
                                height: '180px',
                                borderRadius: '0%',
                                transform: 'rotate(45deg)',
                                background: 'rgba(255,255,255,0.4)',
                                zIndex: 1,
                            }}
                        />
                    </Paper>
                </Link>
            </SimpleGrid>

            {/* All Books Section */}
            <Box mt={60} style={{ position: 'relative', zIndex: 10 }}>
                <Group align="center" mb="lg">
                    <IconBook size={28} color="#FACC15" />
                    <Title order={3} c="white" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800 }}>
                        LECTURE BOOKS <span style={{ fontWeight: 400, color: '#94A3B8', fontSize: '1rem', marginLeft: '10px' }}>전체 교재 목록</span>
                    </Title>
                </Group>

                {books.length > 0 ? (
                    <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }} spacing="md">
                        {books.map((book) => (
                            <Link key={book.id} href={`/student/grammar-lectures?bookId=${book.id}`} style={{ textDecoration: 'none' }}>
                                <Paper
                                    p="sm"
                                    style={{
                                        cursor: 'pointer',
                                        background: '#1E293B', // Dark Slate
                                        border: '1px solid #334155',
                                        transition: 'all 0.2s',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                    className="hover:border-yellow-400 group hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Group justify="space-between" mb={8} align="flex-start">
                                        <Badge color="yellow" variant="light" size="xs" radius="sm">BOOK</Badge>
                                        <IconPlayerPlay size={14} color="gray" style={{ transition: 'color 0.2s' }} />
                                    </Group>
                                    <Text
                                        fw={700}
                                        c="white"
                                        size="sm"
                                        style={{ lineHeight: 1.3, flex: 1 }}
                                        lineClamp={2}
                                    >
                                        {book.title}
                                    </Text>
                                    {book.description && (
                                        <Text size="xs" c="dimmed" lineClamp={1} mt={4}>
                                            {book.description}
                                        </Text>
                                    )}
                                </Paper>
                            </Link>
                        ))}
                    </SimpleGrid>
                ) : (
                    <Text c="dimmed">등록된 교재가 없습니다.</Text>
                )}
            </Box>
        </Box>
    );
}
