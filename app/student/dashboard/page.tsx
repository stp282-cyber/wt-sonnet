'use client';

import { Container, Title, Grid, Paper, Text, Box, Group, Stack, Badge, Progress, Button } from '@mantine/core';
import { IconBell, IconBook, IconCoin, IconTrophy, IconClock, IconArrowRight } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export default function StudentDashboardPage() {
    const router = useRouter();

    // 샘플 데이터
    const notices = [
        { id: 1, title: '이번 주 시험 일정 안내', date: '2024-01-15', priority: 'high' },
        { id: 2, title: '달러 사용처 안내', date: '2024-01-14', priority: 'normal' },
        { id: 3, title: '새로운 단어장 추가', date: '2024-01-13', priority: 'normal' },
    ];

    const todayLearning = [
        {
            id: 1,
            curriculum: '중학 영단어 1000',
            type: '단어장',
            section: '1-1',
            status: 'pending',
            wordCount: 20,
        },
        {
            id: 2,
            curriculum: 'CHAPTER 5: TRAVEL',
            type: '듣기',
            section: '5-1',
            status: 'in_progress',
            wordCount: 15,
        },
    ];

    const dollarHistory = [
        { id: 1, reason: '타이핑 시험 완료', amount: 10, date: '2024-01-15' },
        { id: 2, reason: '플래시카드 학습', amount: 5, date: '2024-01-15' },
        { id: 3, reason: '오답 0개 달성', amount: 20, date: '2024-01-14' },
    ];

    const stats = {
        completedThisWeek: 8,
        totalHours: 12,
        averageScore: 85,
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'pending': return { text: '대기', color: 'gray' };
            case 'in_progress': return { text: '진행중', color: 'yellow' };
            case 'completed': return { text: '완료', color: 'green' };
            default: return { text: '대기', color: 'gray' };
        }
    };

    return (
        <Container size="xl" py={40}>
            {/* 페이지 헤더 */}
            <Box mb={30} className="animate-fade-in">
                <Box
                    style={{
                        display: 'inline-block',
                        background: '#FFD93D',
                        border: '3px solid black',
                        padding: '0.5rem 1rem',
                        boxShadow: '4px 4px 0px black',
                        marginBottom: '1rem',
                    }}
                >
                    <Title order={1} style={{ fontWeight: 900, fontFamily: "'Montserrat', sans-serif" }}>
                        STUDENT DASHBOARD
                    </Title>
                </Box>
                <Text size="lg" fw={700}>
                    오늘도 열심히 공부해봐요!
                </Text>
            </Box>

            <Grid>
                {/* 1. 공지사항 (단순화된 스타일) */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper
                        p="xl"
                        className="neo-card"
                        style={{
                            border: '3px solid black',
                            background: 'white',
                            boxShadow: '6px 6px 0px black',
                            height: '100%',
                            borderRadius: 0,
                        }}
                    >
                        <Group mb="lg">
                            <Box style={{ background: 'black', padding: '8px', border: '2px solid black' }}>
                                <IconBell size={24} color="white" stroke={2.5} />
                            </Box>
                            <Title order={3} fw={900}>공지사항</Title>
                        </Group>

                        <Stack gap="sm">
                            {notices.map((notice) => (
                                <Paper
                                    key={notice.id}
                                    p="md"
                                    onClick={() => router.push('/student/notices')}
                                    style={{
                                        border: '2px solid black',
                                        background: 'white',
                                        cursor: 'pointer',
                                        transition: 'transform 0.1s',
                                        borderRadius: 0,
                                    }}
                                >
                                    <Group justify="space-between" align="flex-start">
                                        <div>
                                            {notice.priority === 'high' && (
                                                <Badge color="red" variant="filled" mb={5} radius={0} style={{ border: '1px solid black' }}>중요</Badge>
                                            )}
                                            <Text fw={700} size="md">{notice.title}</Text>
                                            <Text size="xs" c="dimmed" fw={600}>{notice.date}</Text>
                                        </div>
                                    </Group>
                                </Paper>
                            ))}
                        </Stack>
                    </Paper>
                </Grid.Col>

                {/* 2. 오늘의 학습 */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper
                        p="xl"
                        className="neo-card"
                        style={{
                            border: '3px solid black',
                            background: 'white',
                            boxShadow: '6px 6px 0px black',
                            height: '100%',
                            borderRadius: 0,
                        }}
                    >
                        <Group mb="lg">
                            <Box style={{ background: 'black', padding: '8px', border: '2px solid black' }}>
                                <IconBook size={24} color="white" stroke={2.5} />
                            </Box>
                            <Title order={3} fw={900}>오늘의 학습</Title>
                        </Group>

                        <Stack gap="md">
                            {todayLearning.map((item) => {
                                const status = getStatusInfo(item.status);
                                return (
                                    <Paper
                                        key={item.id}
                                        p="md"
                                        style={{
                                            border: '3px solid black',
                                            background: '#F8F9FA',
                                            borderRadius: 0,
                                        }}
                                    >
                                        <Group justify="space-between" mb="xs">
                                            <Badge
                                                color="gray"
                                                variant="light"
                                                size="lg"
                                                radius={0}
                                                style={{ border: '2px solid black', color: 'black', fontWeight: 800 }}
                                            >
                                                {item.type}
                                            </Badge>
                                            <Badge
                                                color={status.color}
                                                variant="filled"
                                                radius={0}
                                                style={{ border: '2px solid black', fontWeight: 700 }}
                                            >
                                                {status.text}
                                            </Badge>
                                        </Group>
                                        <Text fw={800} size="lg" truncate>{item.curriculum}</Text>
                                        <Text size="sm" c="dimmed" fw={600} mb="md">
                                            {item.section} · {item.wordCount}개 단어
                                        </Text>
                                        <Button
                                            fullWidth
                                            className="neo-button"
                                            onClick={() => router.push('/student/learning')}
                                            rightSection={<IconArrowRight size={18} />}
                                            radius={0}
                                            style={{ backgroundColor: 'black', color: 'white', border: '2px solid black' }}
                                        >
                                            학습 시작하기
                                        </Button>
                                    </Paper>
                                );
                            })}
                        </Stack>
                    </Paper>
                </Grid.Col>

                {/* 3. 달러 현황 */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper
                        p="xl"
                        className="neo-card"
                        style={{
                            border: '3px solid black',
                            background: 'white',
                            boxShadow: '6px 6px 0px black',
                            borderRadius: 0,
                        }}
                    >
                        <Group mb="lg">
                            <Box style={{ background: 'black', padding: '8px', border: '2px solid black' }}>
                                <IconCoin size={24} color="white" stroke={2.5} />
                            </Box>
                            <Title order={3} fw={900}>내 지갑</Title>
                        </Group>

                        <Box mb="lg" style={{ textAlign: 'center', background: '#FFF9DB', border: '3px solid black', padding: '1rem' }}>
                            <Text size="3rem" fw={900} style={{ color: 'black', lineHeight: 1 }}>
                                $150
                            </Text>
                            <Text size="sm" fw={700} c="dimmed">이번 주 획득: +$35</Text>
                        </Box>

                        <Stack gap="xs">
                            {dollarHistory.map((item) => (
                                <Group key={item.id} justify="space-between" style={{ borderBottom: '2px solid #eee', paddingBottom: '8px' }}>
                                    <Text size="sm" fw={600}>{item.reason}</Text>
                                    <Text fw={800} c="green">+{item.amount}</Text>
                                </Group>
                            ))}
                        </Stack>
                    </Paper>
                </Grid.Col>

                {/* 4. 학습 통계 */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper
                        p="xl"
                        className="neo-card"
                        style={{
                            border: '3px solid black',
                            background: 'white',
                            boxShadow: '6px 6px 0px black',
                            borderRadius: 0,
                        }}
                    >
                        <Group mb="lg">
                            <Box style={{ background: 'black', padding: '8px', border: '2px solid black' }}>
                                <IconTrophy size={24} color="white" stroke={2.5} />
                            </Box>
                            <Title order={3} fw={900}>주간 통계</Title>
                        </Group>

                        <Stack gap="lg">
                            <Box>
                                <Group justify="space-between" mb={5}>
                                    <Text fw={700}>완료한 학습</Text>
                                    <Text fw={900} size="lg">{stats.completedThisWeek}개</Text>
                                </Group>
                                <Progress
                                    value={80}
                                    size="xl"
                                    radius={0}
                                    color="dark"
                                    style={{ border: '2px solid black' }}
                                />
                            </Box>

                            <Box>
                                <Group justify="space-between" mb={5}>
                                    <Text fw={700}>평균 점수</Text>
                                    <Text fw={900} size="lg" c="green">{stats.averageScore}점</Text>
                                </Group>
                                <Progress
                                    value={stats.averageScore}
                                    size="xl"
                                    radius={0}
                                    color="dark"
                                    style={{ border: '2px solid black' }}
                                />
                            </Box>
                        </Stack>
                    </Paper>
                </Grid.Col>
            </Grid>
        </Container>
    );
}
