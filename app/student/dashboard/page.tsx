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
                const noticeRes = await fetch(`/api/notices?academy_id=${userData.academy_id}`);
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
                {/* PRIMARY COLUMN: Today's Learning (Left, Wider) */}
                <Grid.Col span={{ base: 12, md: 8 }}>
                    <Paper
                        p={30}
                        className="neo-box animate-slide-up"
                        style={{ minHeight: '500px', animationDelay: '200ms', boxShadow: '8px 8px 0px #A855F7' }} // Purple Shadow
                    >
                        <Group mb={30} justify="space-between" align="center">
                            <Group>
                                <Box style={{ background: '#FFD43B', padding: '12px', border: '2px solid black' }}>
                                    <IconBook size={32} color="black" stroke={2} />
                                </Box>
                                <Box>
                                    <Title order={2} fw={900} style={{ textTransform: 'uppercase' }}>Today's Mission</Title>
                                    <Text size="sm" fw={600} c="dimmed">오늘 완료해야 할 학습들입니다.</Text>
                                </Box>
                            </Group>
                            <Badge
                                size="xl"
                                color="dark"
                                variant="filled"
                                radius={0}
                                style={{ border: '2px solid black', height: '40px', fontSize: '1.2rem' }}
                            >
                                {learning.length} TASKS
                            </Badge>
                        </Group>

                        <Stack gap="lg">
                            {learning.length === 0 ? (
                                <Box py={80} style={{ textAlign: 'center', opacity: 0.6 }}>
                                    <Box style={{ animation: 'float 3s ease-in-out infinite' }}>
                                        <IconCheck size={80} stroke={1.5} style={{ margin: '0 auto', marginBottom: '1.5rem' }} />
                                    </Box>
                                    <Title order={3} fw={800} mb="xs">ALL CLEARED!</Title>
                                    <Text size="lg" fw={600}>오늘의 학습을 모두 마쳤습니다. 완벽해요! 😎</Text>
                                </Box>
                            ) : (
                                learning.map((item, index) => {
                                    const status = getStatusInfo(item.status);
                                    return (
                                        <Box
                                            key={item.id}
                                            className="hover-lift animate-slide-up"
                                            onClick={() => router.push('/student/learning')}
                                            style={{
                                                border: '3px solid black',
                                                background: 'white',
                                                padding: '20px',
                                                cursor: 'pointer',
                                                animationDelay: `${300 + (index * 100)}ms`,
                                                position: 'relative'
                                            }}
                                        >
                                            {/* Status Indicator Stripe */}
                                            <Box style={{
                                                position: 'absolute',
                                                left: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: '8px',
                                                background: status.color === 'green' ? '#40C057' : (status.color === 'blue' ? '#339AF0' : '#CED4DA'),
                                                borderRight: '2px solid black'
                                            }} />

                                            <Group justify="space-between" wrap="nowrap" pl="md">
                                                <Group wrap="nowrap" align="center" gap="lg">
                                                    <Box style={{ textAlign: 'center', minWidth: '60px' }}>
                                                        <Text fw={900} size="xs" style={{ letterSpacing: '1px' }}>TYPE</Text>
                                                        <Badge
                                                            color={item.type === 'wordbook' ? 'grape' : 'orange'}
                                                            variant="filled"
                                                            radius={0}
                                                            size="lg"
                                                            style={{ border: '2px solid black' }}
                                                        >
                                                            {item.type === 'wordbook' ? '단어' : '듣기'}
                                                        </Badge>
                                                    </Box>

                                                    <Box>
                                                        <Group gap="xs" mb={4}>
                                                            <Text fw={900} size="lg" style={{ textTransform: 'uppercase' }}>
                                                                {item.curriculum_name}
                                                            </Text>
                                                            {item.status === 'in_progress' && (
                                                                <Badge color="blue" variant="outline" radius={0} style={{ border: '1px solid black' }}>진행중</Badge>
                                                            )}
                                                        </Group>
                                                        <Text fw={700} size="xl" lineClamp={1} style={{ fontFamily: 'Pretendard' }}>
                                                            {item.title}
                                                        </Text>
                                                        <Text size="sm" fw={600} c="dimmed" mt={4}>
                                                            {item.subInfo}
                                                        </Text>
                                                    </Box>
                                                </Group>

                                                <Button
                                                    size="lg"
                                                    color="black"
                                                    radius={0}
                                                    rightSection={<IconArrowRight size={20} />}
                                                    style={{
                                                        border: '2px solid black',
                                                        boxShadow: '4px 4px 0px #CED4DA', // Subtle shadow
                                                        transition: 'all 0.2s',
                                                    }}
                                                    className="neo-button"
                                                >
                                                    START
                                                </Button>
                                            </Group>
                                        </Box>
                                    );
                                })
                            )}
                        </Stack>
                    </Paper>
                </Grid.Col>

                {/* SECONDARY COLUMN: Stats & Notices */}
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Stack gap={30} className="animate-slide-up" style={{ animationDelay: '400ms' }}>
                        {/* Weekly Stats Card */}
                        <Paper
                            p={30}
                            className="neo-box"
                            style={{ background: '#74C0FC', boxShadow: '5px 5px 0px white' }} // Bright Blue + White Shadow for contrast on dark
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

                        {/* Notices Card */}
                        <Paper
                            p={30}
                            className="neo-box"
                            style={{ position: 'relative', boxShadow: '5px 5px 0px white' }} // White shadow for contrast
                        >
                            <Box style={{
                                position: 'absolute',
                                top: '-15px',
                                right: '-15px',
                                background: '#FF0000',
                                color: 'white',
                                padding: '5px 10px',
                                border: '2px solid black',
                                fontWeight: 900,
                                transform: 'rotate(5deg)'
                            }}>
                                NOTICE
                            </Box>

                            <Group mb="xl" justify="space-between">
                                <Group gap="xs">
                                    <IconBell size={28} stroke={2.5} />
                                    <Title order={3} fw={900}>LATEST NEWS</Title>
                                </Group>
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
                                                padding: '15px',
                                                border: '2px solid black',
                                                background: '#F8F9FA'
                                            }}
                                        >
                                            <Group justify="space-between" align="start" wrap="nowrap" mb={5}>
                                                <Text fw={800} size="sm" lineClamp={1}>{notice.title}</Text>
                                                {notice.priority === 'high' && (
                                                    <Box style={{ width: 10, height: 10, background: '#FF0000', border: '1px solid black' }} />
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
                                variant="outline"
                                color="dark"
                                radius={0}
                                style={{ border: '2px solid black', borderTop: 'none' }}
                                onClick={() => router.push('/student/notices')}
                            >
                                VIEW ALL
                            </Button>
                        </Paper>
                    </Stack>
                </Grid.Col>
            </Grid>
        </Container>
    );
}

