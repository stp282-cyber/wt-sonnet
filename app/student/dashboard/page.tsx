'use client';

import { useState, useEffect } from 'react';
import { Container, Title, Grid, Paper, Text, Box, Group, Stack, Badge, Progress, Button, Center, Loader } from '@mantine/core';
import { IconBell, IconBook, IconTrophy, IconArrowRight, IconCalendarEvent, IconCheck } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

interface LearningItem {
    id: string;
    curriculum_name: string;
    type: 'wordbook' | 'listening';
    title: string;
    subInfo: string;
    status: 'pending' | 'in_progress' | 'completed';
    date: string;
}

interface DashboardStats {
    completedThisWeek: number;
    averageScore: number;
}

export default function StudentDashboardPage() {
    const router = useRouter();
    const [notices, setNotices] = useState<any[]>([]);
    const [learning, setLearning] = useState<LearningItem[]>([]);
    const [stats, setStats] = useState<DashboardStats>({ completedThisWeek: 0, averageScore: 0 });
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;

            const userData = JSON.parse(userStr);
            setUser(userData);

            try {
                // 1. Fetch Notices
                const noticeRes = await fetch(`/api/notices?academy_id=${userData.academy_id}&active_only=true`);
                if (noticeRes.ok) {
                    const data = await noticeRes.json();
                    setNotices((data.notices || []).slice(0, 3));
                }

                // 2. Fetch Dashboard Data (Learning + Stats)
                const dashRes = await fetch(`/api/student/dashboard?user_id=${userData.id}`);
                if (dashRes.ok) {
                    const data = await dashRes.json();
                    setLearning(data.learning || []);
                    setStats(data.stats || { completedThisWeek: 0, averageScore: 0 });
                }
            } catch (e) {
                console.error('Error fetching dashboard data:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'pending': return { text: '학습 전', color: 'gray', bg: 'white', border: '#ced4da' };
            case 'in_progress': return { text: '진행중', color: 'blue', bg: '#E7F5FF', border: '#339AF0' };
            case 'completed': return { text: '완료', color: 'green', bg: '#EBFBEE', border: '#40C057' };
            default: return { text: '대기', color: 'gray', bg: '#F8F9FA', border: '#ced4da' };
        }
    };

    if (loading) {
        return (
            <Container size="xl" py={40} h="100vh">
                <Center h="100%">
                    <Loader size="xl" color="yellow" type="dots" />
                </Center>
            </Container>
        );
    }

    return (
        <Container size="xl" py={40}>
            {/* Custom Animations Styles */}
            <style jsx global>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes popIn {
                    0% { transform: scale(0.9); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-5px); }
                    100% { transform: translateY(0px); }
                }
                .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-pop-in { animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                .hover-lift { transition: transform 0.2s, box-shadow 0.2s; }
                .hover-lift:hover { 
                    transform: translate(-4px, -4px); 
                    box-shadow: 8px 8px 0px black !important;
                }
                .neo-box {
                    border: 3px solid black;
                    border-radius: 0px;
                    box-shadow: 5px 5px 0px black;
                    background: white;
                }
                .neo-badge {
                    border: 2px solid black;
                    border-radius: 0px;
                    font-weight: 800;
                    text-transform: uppercase;
                }
                .neo-button {
                    transition: transform 0.1s;
                }
                .neo-button:active {
                    transform: translate(2px, 2px);
                    box-shadow: 2px 2px 0px #CED4DA !important;
                }
            `}</style>

            {/* Header Section */}
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
                            DASHBOARD
                        </Title>
                    </Box>
                    <Text size="xl" fw={800} style={{ letterSpacing: '-0.5px', color: 'white' }}> {/* Updated Color to White */}
                        READY TO LEARN, <span style={{ background: '#FFD43B', padding: '2px 8px', border: '2px solid white', color: 'black' }}>{user?.full_name}</span>? 🚀
                    </Text>
                </Box>
                <Paper
                    p="md"
                    className="animate-pop-in"
                    style={{
                        border: '3px solid black', // Keep black border on white paper
                        borderRadius: 0,
                        background: 'white',
                        boxShadow: '4px 4px 0px #3B82F6', // Blue shadow for cool factor
                        animationDelay: '100ms'
                    }}
                >
                    <Group gap="xs">
                        <IconCalendarEvent size={20} />
                        <Text fw={700}>
                            {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                        </Text>
                    </Group>
                </Paper>
            </Group>

            <Grid gutter={30}>
                {/* WEEKLY STATS - Left Column */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper
                        p={30}
                        className="neo-box animate-slide-up"
                        style={{ background: '#74C0FC', boxShadow: '5px 5px 0px white', animationDelay: '200ms', minHeight: '400px' }}
                    >
                        <Group mb="xl" justify="space-between">
                            <Group gap="xs">
                                <IconTrophy size={28} stroke={2.5} color="black" />
                                <Title order={3} fw={900}>WEEKLY STATS</Title>
                            </Group>
                        </Group>

                        <Group grow mb="xl">
                            <Box style={{
                                background: 'white',
                                padding: '15px',
                                border: '2px solid black',
                                textAlign: 'center',
                                boxShadow: '4px 4px 0px rgba(0,0,0,0.2)'
                            }}>
                                <Text size="xs" fw={800} c="dimmed" mb={5} tt="uppercase">Completed</Text>
                                <Text size="2.5rem" fw={900} style={{ lineHeight: 1 }}>{stats.completedThisWeek}</Text>
                            </Box>
                            <Box style={{
                                background: 'white',
                                padding: '15px',
                                border: '2px solid black',
                                textAlign: 'center',
                                boxShadow: '4px 4px 0px rgba(0,0,0,0.2)'
                            }}>
                                <Text size="xs" fw={800} c="dimmed" mb={5} tt="uppercase">Avg Score</Text>
                                <Text size="2.5rem" fw={900} style={{ lineHeight: 1, color: stats.averageScore >= 80 ? '#20C20E' : 'black' }}>
                                    {stats.averageScore}
                                </Text>
                            </Box>
                        </Group>

                        <Progress
                            value={stats.averageScore}
                            size="xl"
                            radius={0}
                            color="dark"
                            style={{ border: '2px solid black', height: '20px' }}
                        />
                        <Text size="xs" ta="right" mt={5} fw={700}>GOAL: 100</Text>
                    </Paper>
                </Grid.Col>

                {/* LATEST NEWS - Right Column (Expanded) */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper
                        p={30}
                        className="neo-box animate-slide-up"
                        style={{ position: 'relative', boxShadow: '5px 5px 0px white', animationDelay: '300ms', minHeight: '400px' }}
                    >
                        <Group mb="xl" justify="space-between" align="center">
                            <Group gap="xs">
                                <IconBell size={28} stroke={2.5} />
                                <Title order={3} fw={900}>LATEST NEWS</Title>
                            </Group>
                            <Badge color="red" size="lg" radius={0} variant="filled" style={{ border: '2px solid black' }}>
                                NOTICE
                            </Badge>
                        </Group>

                        <Stack gap="md">
                            {notices.length === 0 ? (
                                <Text size="sm" c="dimmed" ta="center" py="lg">새로운 공지가 없습니다.</Text>
                            ) : (
                                notices.map((notice, index) => (
                                    <Box
                                        key={index}
                                        onClick={() => router.push('/student/notices')}
                                        className="hover-lift"
                                        style={{
                                            cursor: 'pointer',
                                            padding: '16px',
                                            border: '2px solid black',
                                            background: 'white',
                                            boxShadow: '3px 3px 0px #dee2e6'
                                        }}
                                    >
                                        <Group justify="space-between" align="start" wrap="nowrap" mb={4}>
                                            <Text fw={800} size="md" lineClamp={1} style={{ flex: 1 }}>{notice.title}</Text>
                                            {notice.priority === 'high' && (
                                                <Badge size="xs" color="red" variant="dot">!</Badge>
                                            )}
                                        </Group>
                                        <Text size="xs" fw={600} c="dimmed">{new Date(notice.created_at).toLocaleDateString()}</Text>
                                    </Box>
                                ))
                            )}
                        </Stack>

                        <Button
                            fullWidth
                            mt="lg"
                            radius={0}
                            size="lg"
                            color="black"
                            variant="filled"
                            style={{
                                border: '2px solid black',
                                boxShadow: '4px 4px 0px #CED4DA',
                                transition: 'all 0.2s',
                                height: '50px'
                            }}
                            className="neo-button"
                            onClick={() => router.push('/student/notices')}
                        >
                            VIEW ALL
                        </Button>
                    </Paper>
                </Grid.Col>
            </Grid>
        </Container >
    );
}

