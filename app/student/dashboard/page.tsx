'use client';

import { useState, useEffect } from 'react';
import { Container, Title, Grid, Paper, Text, Box, Group, Stack, Badge, Progress, Button, RingProgress, Center, Loader } from '@mantine/core';
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
            case 'pending': return { text: '학습 전', color: 'gray', bg: '#F1F3F5' };
            case 'in_progress': return { text: '진행중', color: 'blue', bg: '#E7F5FF' };
            case 'completed': return { text: '완료', color: 'green', bg: '#EBFBEE' };
            default: return { text: '대기', color: 'gray', bg: '#F8F9FA' };
        }
    };

    if (loading) {
        return (
            <Container size="xl" py={40} h="100vh">
                <Center h="100%">
                    <Loader size="xl" color="dark" type="dots" />
                </Center>
            </Container>
        );
    }

    return (
        <Container size="xl" py={40}>
            {/* Header Section */}
            <Group justify="space-between" align="flex-end" mb={40} className="animate-fade-in">
                <Box>
                    <Box
                        style={{
                            display: 'inline-block',
                            background: '#20C20E', // Vibrant Green for Energy
                            border: '3px solid black',
                            padding: '0.5rem 1.5rem',
                            boxShadow: '6px 6px 0px black',
                            marginBottom: '1.5rem',
                            transform: 'rotate(-2deg)'
                        }}
                    >
                        <Title order={1} style={{ fontWeight: 900, fontFamily: "'Montserrat', sans-serif", fontSize: '2.5rem', color: 'white', textShadow: '2px 2px 0px black' }}>
                            DASHBOARD
                        </Title>
                    </Box>
                    <Text size="xl" fw={800} style={{ letterSpacing: '-0.5px' }}>
                        반가워요, <span style={{ background: '#FFD43B', padding: '0 5px' }}>{user?.full_name}</span> 학생! 🚀
                    </Text>
                </Box>
                <Text size="sm" fw={600} c="dimmed">
                    {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                </Text>
            </Group>

            <Grid gutter="xl">
                {/* PRIMARY COLUMN: Today's Learning (Left, Wider) */}
                <Grid.Col span={{ base: 12, md: 8 }}>
                    <Paper
                        p="xl"
                        className="neo-card-hover" // We can style this via style prop if class missing
                        style={{
                            border: '3px solid black',
                            background: 'white',
                            boxShadow: '8px 8px 0px black',
                            borderRadius: '12px',
                            minHeight: '400px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <Group mb="xl" justify="space-between" align="center">
                            <Group>
                                <Box style={{ background: 'black', padding: '10px', borderRadius: '8px' }}>
                                    <IconBook size={28} color="#FFD43B" stroke={2.5} />
                                </Box>
                                <Title order={2} fw={900}>오늘의 학습</Title>
                            </Group>
                            <Badge size="lg" color="dark" variant="filled" radius="sm" style={{ border: '2px solid black' }}>
                                {learning.length}개의 할일
                            </Badge>
                        </Group>

                        <Stack gap="md">
                            {learning.length === 0 ? (
                                <Box py={60} style={{ textAlign: 'center', opacity: 0.5 }}>
                                    <IconCheck size={60} stroke={1.5} style={{ margin: '0 auto', marginBottom: '1rem' }} />
                                    <Text size="lg" fw={700}>모든 학습을 완료했어요!</Text>
                                    <Text size="sm">푹 쉬거나 복습을 해보세요.</Text>
                                </Box>
                            ) : (
                                learning.map((item) => {
                                    const status = getStatusInfo(item.status);
                                    return (
                                        <Paper
                                            key={item.id}
                                            p="lg"
                                            radius="md"
                                            style={{
                                                border: '3px solid black',
                                                background: status.bg,
                                                transition: 'transform 0.2s',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => router.push('/student/learning')}
                                        >
                                            <Group justify="space-between" wrap="nowrap">
                                                <Group wrap="nowrap">
                                                    <Box
                                                        style={{
                                                            minWidth: '60px',
                                                            height: '60px',
                                                            background: 'white',
                                                            border: '2px solid black',
                                                            borderRadius: '8px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexDirection: 'column'
                                                        }}
                                                    >
                                                        <Text fw={900} size="xs" c="dimmed">TYPE</Text>
                                                        <Text fw={900} size="sm">{item.type === 'wordbook' ? '단어' : '듣기'}</Text>
                                                    </Box>

                                                    <Box>
                                                        <Group gap="xs" mb={4}>
                                                            <Badge color="dark" variant="transparent" p={0} size="sm">{item.curriculum_name}</Badge>
                                                        </Group>
                                                        <Text fw={800} size="lg" lineClamp={1}>{item.title}</Text>
                                                        <Text size="sm" fw={600} c="dimmed">{item.subInfo}</Text>
                                                    </Box>
                                                </Group>

                                                <Button
                                                    color="black"
                                                    radius="md"
                                                    rightSection={<IconArrowRight size={16} />}
                                                    style={{ border: '2px solid transparent' }}
                                                >
                                                    시작
                                                </Button>
                                            </Group>
                                        </Paper>
                                    );
                                })
                            )}
                        </Stack>
                    </Paper>
                </Grid.Col>

                {/* SECONDARY COLUMN: Stats & Notices */}
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Stack gap="xl">
                        {/* Weekly Stats Card */}
                        <Paper
                            p="xl"
                            style={{
                                border: '3px solid black',
                                background: '#FFD43B', // Yellow
                                boxShadow: '6px 6px 0px black',
                                borderRadius: '12px',
                            }}
                        >
                            <Group mb="lg">
                                <IconTrophy size={32} stroke={2.5} />
                                <Title order={3} fw={900}>주간 통계</Title>
                            </Group>

                            <Group grow mb="md">
                                <Box style={{ textAlign: 'center' }}>
                                    <Text size="xs" fw={700} c="dark" mb={4}>완료한 학습</Text>
                                    <Text size="2rem" fw={900} style={{ lineHeight: 1 }}>{stats.completedThisWeek}</Text>
                                    <Text size="xs" fw={600} c="dimmed">건</Text>
                                </Box>
                                <Box style={{ textAlign: 'center', borderLeft: '2px solid rgba(0,0,0,0.1)' }}>
                                    <Text size="xs" fw={700} c="dark" mb={4}>평균 점수</Text>
                                    <Text size="2rem" fw={900} style={{ lineHeight: 1 }}>{stats.averageScore}</Text>
                                    <Text size="xs" fw={600} c="dimmed">점</Text>
                                </Box>
                            </Group>

                            <Text size="xs" ta="center" fw={600} style={{ opacity: 0.7 }}>
                                지난 7일간의 학습 기록입니다.
                            </Text>
                        </Paper>

                        {/* Notices Card */}
                        <Paper
                            p="xl"
                            style={{
                                border: '3px solid black',
                                background: 'white',
                                boxShadow: '6px 6px 0px black',
                                borderRadius: '12px',
                            }}
                        >
                            <Group mb="lg" justify="space-between">
                                <Group gap="xs">
                                    <IconBell size={24} />
                                    <Title order={3} fw={900}>공지사항</Title>
                                </Group>
                                <Button
                                    variant="subtle"
                                    color="dark"
                                    compact
                                    size="xs"
                                    onClick={() => router.push('/student/notices')}
                                >
                                    더보기
                                </Button>
                            </Group>

                            <Stack gap="md">
                                {notices.length === 0 ? (
                                    <Text size="sm" c="dimmed" ta="center">새로운 공지가 없습니다.</Text>
                                ) : (
                                    notices.map((notice, index) => (
                                        <Box
                                            key={index}
                                            onClick={() => router.push('/student/notices')}
                                            style={{ cursor: 'pointer', paddingBottom: '10px', borderBottom: index !== notices.length - 1 ? '2px dashed #eee' : 'none' }}
                                        >
                                            <Group justify="space-between" align="start" wrap="nowrap">
                                                <Text fw={700} size="sm" lineClamp={1}>{notice.title}</Text>
                                                {notice.priority === 'high' && <Box style={{ width: 8, height: 8, borderRadius: '50%', background: 'red' }} />}
                                            </Group>
                                            <Text size="xs" c="dimmed">{new Date(notice.created_at).toLocaleDateString()}</Text>
                                        </Box>
                                    ))
                                )}
                            </Stack>
                        </Paper>
                    </Stack>
                </Grid.Col>
            </Grid>
        </Container>
    );
}
