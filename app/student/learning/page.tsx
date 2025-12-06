'use client';

import { useState } from 'react';
import { Container, Title, Paper, Text, Box, Group, Grid, Badge, Modal, Stack, Button } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconClock, IconBook, IconTarget, IconPlayerPlay } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

interface LearningItem {
    id: string;
    curriculum: string;
    type: 'wordbook' | 'listening';
    section: string;
    wordCount: number;
    timeLimit: number;
    passingScore: number;
    status: 'pending' | 'in_progress' | 'completed';
    score?: number;
}

interface DaySchedule {
    date: string;
    dayOfWeek: string;
    items: LearningItem[];
}

export default function StudentLearningPage() {
    const router = useRouter();
    const [currentWeek, setCurrentWeek] = useState(0);
    const [selectedItem, setSelectedItem] = useState<LearningItem | null>(null);
    const [modalOpened, setModalOpened] = useState(false);

    // 샘플 주별 데이터
    const weekSchedule: DaySchedule[] = [
        {
            date: '2024-01-15',
            dayOfWeek: '월',
            items: [
                {
                    id: '1',
                    curriculum: '중학 영단어 1000',
                    type: 'wordbook',
                    section: '1-1',
                    wordCount: 20,
                    timeLimit: 20,
                    passingScore: 80,
                    status: 'completed',
                    score: 95,
                },
            ],
        },
        {
            date: '2024-01-16',
            dayOfWeek: '화',
            items: [
                {
                    id: '2',
                    curriculum: '중학 영단어 1000',
                    type: 'wordbook',
                    section: '1-2',
                    wordCount: 20,
                    timeLimit: 20,
                    passingScore: 80,
                    status: 'completed',
                    score: 88,
                },
            ],
        },
        {
            date: '2024-01-17',
            dayOfWeek: '수',
            items: [
                {
                    id: '3',
                    curriculum: '중학 영단어 1000',
                    type: 'wordbook',
                    section: '2-1',
                    wordCount: 20,
                    timeLimit: 20,
                    passingScore: 80,
                    status: 'in_progress',
                },
            ],
        },
        {
            date: '2024-01-18',
            dayOfWeek: '목',
            items: [
                {
                    id: '4',
                    curriculum: 'CHAPTER 5: TRAVEL',
                    type: 'listening',
                    section: '5-1',
                    wordCount: 15,
                    timeLimit: 25,
                    passingScore: 80,
                    status: 'pending',
                },
            ],
        },
        {
            date: '2024-01-19',
            dayOfWeek: '금',
            items: [
                {
                    id: '5',
                    curriculum: '중학 영단어 1000',
                    type: 'wordbook',
                    section: '2-2',
                    wordCount: 20,
                    timeLimit: 20,
                    passingScore: 80,
                    status: 'pending',
                },
            ],
        },
    ];

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return '✅';
            case 'in_progress':
                return '📝';
            case 'pending':
                return '⏰';
            default:
                return '⏰';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return '#A3E635'; // Lime Green
            case 'in_progress':
                return '#FACC15'; // Yellow
            case 'pending':
                return '#FFFFFF'; // White
            default:
                return '#FFFFFF';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed':
                return '완료';
            case 'in_progress':
                return '진행중';
            case 'pending':
                return '대기';
            default:
                return '대기';
        }
    };

    const handleItemClick = (item: LearningItem) => {
        setSelectedItem(item);
        setModalOpened(true);
    };

    const handleStartTest = () => {
        setModalOpened(false);
        // 시험 시작 (플래시카드로 이동)
        router.push('/test/flashcard');
    };

    return (
        <Container size="xl" py={40}>
            <div className="animate-fade-in">
                {/* 페이지 헤더 */}
                <Box mb={30}>
                    <Title order={1} style={{ fontWeight: 900, marginBottom: '0.5rem' }}>
                        나의 학습
                    </Title>
                    <Text size="lg" c="dimmed">
                        이번 주 학습 일정을 확인하세요
                    </Text>
                </Box>

                {/* 주차 선택 */}
                <Paper
                    p="lg"
                    mb={30}
                    style={{
                        border: '2px solid black',
                        background: 'white',
                        boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                        borderRadius: 0,
                    }}
                >
                    <Group justify="space-between">
                        <button
                            onClick={() => setCurrentWeek(currentWeek - 1)}
                            style={{
                                background: '#F1F3F5',
                                border: '2px solid black',
                                borderRadius: '0px',
                                boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                                padding: '0.5rem 1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontWeight: 700,
                            }}
                        >
                            <IconChevronLeft size={20} />
                            이전 주
                        </button>

                        <Text size="xl" fw={900}>
                            2024년 1월 3주차 (1/15 - 1/19)
                        </Text>

                        <button
                            onClick={() => setCurrentWeek(currentWeek + 1)}
                            style={{
                                background: '#F1F3F5',
                                border: '2px solid black',
                                borderRadius: '0px',
                                boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                                padding: '0.5rem 1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontWeight: 700,
                            }}
                        >
                            다음 주
                            <IconChevronRight size={20} />
                        </button>
                    </Group>
                </Paper>

                {/* 주별 캘린더 */}
                <Grid>
                    {weekSchedule.map((day) => (
                        <Grid.Col key={day.date} span={{ base: 12, sm: 6, md: 2.4 }}>
                            <Paper
                                p="lg"
                                style={{
                                    border: '2px solid black',
                                    background: 'white',
                                    boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                                    minHeight: '300px',
                                    borderRadius: 0,
                                }}
                            >
                                {/* 요일 헤더 */}
                                <Box
                                    mb="md"
                                    style={{
                                        background: 'black',
                                        color: 'white',
                                        border: '2px solid black',
                                        borderRadius: '0px',
                                        padding: '0.5rem',
                                        textAlign: 'center',
                                    }}
                                >
                                    <Text fw={900} size="lg">
                                        {day.dayOfWeek}
                                    </Text>
                                    <Text fw={600} size="sm">
                                        {day.date}
                                    </Text>
                                </Box>

                                {/* 학습 항목 */}
                                <Stack gap="sm">
                                    {day.items.map((item) => (
                                        <Paper
                                            key={item.id}
                                            p="md"
                                            style={{
                                                border: '2px solid black',
                                                background: getStatusColor(item.status),
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s',
                                                borderRadius: 0,
                                            }}
                                            onClick={() => handleItemClick(item)}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            <Group justify="center" mb="xs">
                                                {item.type === 'wordbook' ? (
                                                    <IconBook size={24} color="black" />
                                                ) : (
                                                    <IconClock size={24} color="black" />
                                                )}
                                            </Group>
                                            <Text fw={700} size="sm" ta="center" mb="xs" c="black">
                                                {item.curriculum}
                                            </Text>
                                            <Text size="xs" ta="center" mb="xs" style={{ color: 'rgba(0,0,0,0.6)' }}>
                                                {item.section}
                                            </Text>
                                            <Badge
                                                variant="filled"
                                                color="black"
                                                fullWidth
                                                radius={0}
                                                style={{ border: '1px solid black' }}
                                            >
                                                {getStatusText(item.status)}
                                            </Badge>
                                            {item.score && (
                                                <Text fw={900} size="lg" ta="center" mt="xs" c="black">
                                                    {item.score}점
                                                </Text>
                                            )}
                                        </Paper>
                                    ))}
                                </Stack>
                            </Paper>
                        </Grid.Col>
                    ))}
                </Grid>

                {/* 범례 */}
                <Paper
                    p="lg"
                    mt={30}
                    style={{
                        border: '2px solid black',
                        background: 'white',
                        boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                        borderRadius: 0,
                    }}
                >
                    <Text fw={900} mb="md">
                        상태 범례
                    </Text>
                    <Group>
                        <Group gap="xs">
                            <Box w={20} h={20} style={{ border: '2px solid black', background: '#A3E635' }} />
                            <Text fw={700}>완료</Text>
                        </Group>
                        <Group gap="xs">
                            <Box w={20} h={20} style={{ border: '2px solid black', background: '#FACC15' }} />
                            <Text fw={700}>진행중</Text>
                        </Group>
                        <Group gap="xs">
                            <Box w={20} h={20} style={{ border: '2px solid black', background: '#FFFFFF' }} />
                            <Text fw={700}>대기</Text>
                        </Group>
                    </Group>
                </Paper>

                {/* 상세 정보 모달 */}
                <Modal
                    opened={modalOpened}
                    onClose={() => setModalOpened(false)}
                    title={
                        <Text size="xl" fw={900}>
                            학습 상세 정보
                        </Text>
                    }
                    size="lg"
                    styles={{
                        header: {
                            borderBottom: '2px solid black',
                        },
                        body: {
                            padding: '2rem',
                        },
                        content: {
                            border: '2px solid black',
                            borderRadius: 0,
                            boxShadow: '8px 8px 0px black'
                        }
                    }}
                >
                    {selectedItem && (
                        <Stack gap="lg">
                            {/* 헤더 카드 */}
                            <Paper
                                p="xl"
                                style={{
                                    border: '2px solid black',
                                    background: '#FFD93D',
                                    borderRadius: 0,
                                    boxShadow: '4px 4px 0px black',
                                }}
                            >
                                <Group justify="center" mb="md">
                                    <Box
                                        p="md"
                                        style={{
                                            background: 'black',
                                            border: '2px solid black',
                                            display: 'inline-flex',
                                        }}
                                    >
                                        {selectedItem.type === 'wordbook' ? (
                                            <IconBook size={48} color="white" stroke={1.5} />
                                        ) : (
                                            <IconClock size={48} color="white" stroke={1.5} />
                                        )}
                                    </Box>
                                </Group>
                                <Text size="xl" fw={900} ta="center" mb="xs">
                                    {selectedItem.curriculum}
                                </Text>
                                <Text size="lg" ta="center" fw={700}>
                                    {selectedItem.section}
                                </Text>
                            </Paper>

                            {/* 정보 그리드 */}
                            <Grid>
                                <Grid.Col span={6}>
                                    <Paper p="md" style={{ border: '2px solid black', borderRadius: 0, background: 'white', boxShadow: '4px 4px 0px black' }}>
                                        <Group gap="xs" mb={5}>
                                            <IconBook size={20} />
                                            <Text size="sm" c="dimmed" fw={700}>학습 유형</Text>
                                        </Group>
                                        <Text fw={900} size="lg">{selectedItem.type === 'wordbook' ? '단어장' : '듣기'}</Text>
                                    </Paper>
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <Paper p="md" style={{ border: '2px solid black', borderRadius: 0, background: 'white', boxShadow: '4px 4px 0px black' }}>
                                        <Group gap="xs" mb={5}>
                                            <IconTarget size={20} />
                                            <Text size="sm" c="dimmed" fw={700}>문항 수</Text>
                                        </Group>
                                        <Text fw={900} size="lg">{selectedItem.wordCount}개</Text>
                                    </Paper>
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <Paper p="md" style={{ border: '2px solid black', borderRadius: 0, background: 'white', boxShadow: '4px 4px 0px black' }}>
                                        <Group gap="xs" mb={5}>
                                            <IconClock size={20} />
                                            <Text size="sm" c="dimmed" fw={700}>제한 시간</Text>
                                        </Group>
                                        <Text fw={900} size="lg">{selectedItem.timeLimit}초</Text>
                                    </Paper>
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <Paper p="md" style={{ border: '2px solid black', borderRadius: 0, background: 'white', boxShadow: '4px 4px 0px black' }}>
                                        <Group gap="xs" mb={5}>
                                            <IconTarget size={20} />
                                            <Text size="sm" c="dimmed" fw={700}>합격 점수</Text>
                                        </Group>
                                        <Text fw={900} size="lg">{selectedItem.passingScore}점</Text>
                                    </Paper>
                                </Grid.Col>
                            </Grid>

                            {selectedItem.score && (
                                <Paper
                                    p="md"
                                    style={{
                                        border: '2px solid black',
                                        background: '#D3F9D8',
                                        textAlign: 'center',
                                        borderRadius: 0,
                                        boxShadow: '4px 4px 0px black',
                                    }}
                                >
                                    <Text size="sm" fw={700} mb="xs">
                                        이전 시험 결과
                                    </Text>
                                    <Text size="3rem" fw={900} c="black">
                                        {selectedItem.score}점
                                    </Text>
                                </Paper>
                            )}

                            {selectedItem.status !== 'completed' && (
                                <button
                                    onClick={handleStartTest}
                                    style={{
                                        background: 'black',
                                        color: '#FFD93D',
                                        border: '2px solid black',
                                        borderRadius: '0px',
                                        boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                                        fontSize: '1.5rem',
                                        fontWeight: 900,
                                        padding: '1.2rem 2rem',
                                        cursor: 'pointer',
                                        width: '100%',
                                        marginTop: '0.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                    }}
                                >
                                    <IconPlayerPlay size={32} />
                                    시험 시작하기
                                </button>
                            )}
                        </Stack>
                    )}
                </Modal>
            </div>
        </Container>
    );
}
