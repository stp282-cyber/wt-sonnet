'use client';

import { Container, Title, Grid, Paper, Text, Box, Group, Stack, Badge, Progress } from '@mantine/core';
import { IconBell, IconBook, IconCoin, IconTrophy, IconClock } from '@tabler/icons-react';
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'gray';
            case 'in_progress':
                return 'yellow';
            case 'completed':
                return 'green';
            default:
                return 'gray';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending':
                return '대기';
            case 'in_progress':
                return '진행중';
            case 'completed':
                return '완료';
            default:
                return '대기';
        }
    };

    return (
        <Container size="xl" py={40}>
            <div className="animate-fade-in">
                {/* 페이지 헤더 */}
                <Box mb={30}>
                    <Title order={1} style={{ fontWeight: 900, marginBottom: '0.5rem' }}>
                        📚 대시보드
                    </Title>
                    <Text size="lg" c="dimmed">
                        오늘도 열심히 공부해봐요!
                    </Text>
                </Box>

                <Grid>
                    {/* 공지사항 */}
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Paper
                            p="xl"
                            radius="lg"
                            style={{
                                border: '4px solid black',
                                background: 'white',
                                boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
                                height: '100%',
                            }}
                        >
                            <Group mb="md">
                                <IconBell size={28} color="#FF6B9D" />
                                <Text size="xl" fw={900}>
                                    공지사항
                                </Text>
                            </Group>

                            <Stack gap="sm">
                                {notices.map((notice) => (
                                    <Paper
                                        key={notice.id}
                                        p="md"
                                        style={{
                                            border: '3px solid black',
                                            background: notice.priority === 'high' ? '#FFE5E5' : '#F8F9FA',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <Group justify="space-between">
                                            <div>
                                                <Text fw={700} size="md">
                                                    {notice.title}
                                                </Text>
                                                <Text size="sm" c="dimmed">
                                                    {notice.date}
                                                </Text>
                                            </div>
                                            {notice.priority === 'high' && (
                                                <Badge color="red" variant="filled">
                                                    중요
                                                </Badge>
                                            )}
                                        </Group>
                                    </Paper>
                                ))}
                            </Stack>
                        </Paper>
                    </Grid.Col>

                    {/* 오늘의 학습 */}
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Paper
                            p="xl"
                            radius="lg"
                            style={{
                                border: '4px solid black',
                                background: 'white',
                                boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
                                height: '100%',
                            }}
                        >
                            <Group mb="md">
                                <IconBook size={28} color="#4ECDC4" />
                                <Text size="xl" fw={900}>
                                    오늘의 학습
                                </Text>
                            </Group>

                            <Stack gap="sm">
                                {todayLearning.map((item) => (
                                    <Paper
                                        key={item.id}
                                        p="md"
                                        style={{
                                            border: '3px solid black',
                                            background: '#F8F9FA',
                                        }}
                                    >
                                        <Group justify="space-between" mb="xs">
                                            <Text fw={700} size="md">
                                                {item.curriculum}
                                            </Text>
                                            <Badge color={getStatusColor(item.status)} variant="filled">
                                                {getStatusText(item.status)}
                                            </Badge>
                                        </Group>
                                        <Text size="sm" c="dimmed" mb="sm">
                                            {item.type} · {item.section} · {item.wordCount}개 단어
                                        </Text>
                                        <button
                                            onClick={() => router.push('/student/learning')}
                                            style={{
                                                background: '#7950f2',
                                                color: 'white',
                                                border: '3px solid black',
                                                borderRadius: '8px',
                                                boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                                                fontSize: '0.9rem',
                                                fontWeight: 700,
                                                padding: '0.5rem 1rem',
                                                cursor: 'pointer',
                                                width: '100%',
                                            }}
                                        >
                                            시작하기 →
                                        </button>
                                    </Paper>
                                ))}
                            </Stack>
                        </Paper>
                    </Grid.Col>

                    {/* 달러 현황 */}
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Paper
                            p="xl"
                            radius="lg"
                            style={{
                                border: '4px solid black',
                                background: 'linear-gradient(135deg, #FFD93D 0%, #FFA94D 100%)',
                                boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
                            }}
                        >
                            <Group mb="md">
                                <IconCoin size={28} color="black" />
                                <Text size="xl" fw={900} c="black">
                                    달러 현황
                                </Text>
                            </Group>

                            <Box
                                mb="md"
                                style={{
                                    background: 'white',
                                    border: '3px solid black',
                                    borderRadius: '12px',
                                    padding: '1.5rem',
                                    textAlign: 'center',
                                }}
                            >
                                <Text size="sm" c="dimmed" mb="xs">
                                    현재 보유 달러
                                </Text>
                                <Text size="3rem" fw={900} c="violet">
                                    150
                                </Text>
                                <Text size="sm" c="dimmed">
                                    이번 주 +35 달러
                                </Text>
                            </Box>

                            <Stack gap="xs">
                                <Text fw={700} size="sm" c="black">
                                    최근 내역
                                </Text>
                                {dollarHistory.map((item) => (
                                    <Paper
                                        key={item.id}
                                        p="sm"
                                        style={{
                                            border: '2px solid black',
                                            background: 'white',
                                        }}
                                    >
                                        <Group justify="space-between">
                                            <div>
                                                <Text fw={600} size="sm">
                                                    {item.reason}
                                                </Text>
                                                <Text size="xs" c="dimmed">
                                                    {item.date}
                                                </Text>
                                            </div>
                                            <Text fw={900} size="lg" c="green">
                                                +{item.amount}
                                            </Text>
                                        </Group>
                                    </Paper>
                                ))}
                            </Stack>
                        </Paper>
                    </Grid.Col>

                    {/* 학습 통계 */}
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Paper
                            p="xl"
                            radius="lg"
                            style={{
                                border: '4px solid black',
                                background: 'white',
                                boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
                            }}
                        >
                            <Group mb="md">
                                <IconTrophy size={28} color="#51CF66" />
                                <Text size="xl" fw={900}>
                                    이번 주 통계
                                </Text>
                            </Group>

                            <Stack gap="md">
                                <Box>
                                    <Group justify="space-between" mb="xs">
                                        <Text fw={700}>완료한 학습</Text>
                                        <Text fw={900} size="xl" c="violet">
                                            {stats.completedThisWeek}개
                                        </Text>
                                    </Group>
                                    <Progress
                                        value={(stats.completedThisWeek / 10) * 100}
                                        size="xl"
                                        radius="xl"
                                        styles={{
                                            root: { border: '3px solid black' },
                                            section: { background: '#7950f2' },
                                        }}
                                    />
                                </Box>

                                <Box>
                                    <Group justify="space-between" mb="xs">
                                        <Group gap="xs">
                                            <IconClock size={20} />
                                            <Text fw={700}>총 학습 시간</Text>
                                        </Group>
                                        <Text fw={900} size="xl" c="blue">
                                            {stats.totalHours}시간
                                        </Text>
                                    </Group>
                                </Box>

                                <Box>
                                    <Group justify="space-between" mb="xs">
                                        <Text fw={700}>평균 점수</Text>
                                        <Text fw={900} size="xl" c="green">
                                            {stats.averageScore}점
                                        </Text>
                                    </Group>
                                    <Progress
                                        value={stats.averageScore}
                                        size="xl"
                                        radius="xl"
                                        styles={{
                                            root: { border: '3px solid black' },
                                            section: { background: '#51CF66' },
                                        }}
                                    />
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid.Col>
                </Grid>
            </div>
        </Container>
    );
}
