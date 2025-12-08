'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Title, Paper, Text, Box, Group, Stack, Badge, RingProgress, Center } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconRefresh, IconArrowRight, IconChevronDown, IconChevronUp, IconTrophy } from '@tabler/icons-react';
import StudentLayout from '../../student/layout';

interface Word {
    no: number;
    english: string;
    korean: string;
}

interface TestResult {
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    score: number;
    passed: boolean;
    wrongWords?: Word[];
    wrongQuestions?: any[];
    timestamp: string;
    testType?: string;
}

function TestResultContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [result, setResult] = useState<TestResult | null>(null);
    const [showWrongWords, setShowWrongWords] = useState(false);
    const [checkingReview, setCheckingReview] = useState(false);

    useEffect(() => {
        const savedResult = localStorage.getItem('testResult');
        if (savedResult) {
            setResult(JSON.parse(savedResult));
        } else {
            router.push('/student/learning');
        }
    }, [router]);

    if (!result) {
        return (
            <StudentLayout>
                <Center style={{ minHeight: '100vh', background: '#fff' }}>
                    <Text>결과를 불러오는 중...</Text>
                </Center>
            </StudentLayout>
        );
    }

    const handleReviewWrongWords = () => {
        if (result.testType === 'listening') {
            router.push('/test/listening-fill');
            return;
        }

        if (result.wrongWords) {
            localStorage.setItem('wrongWords', JSON.stringify(result.wrongWords));
        }

        const mode = searchParams.get('mode') || 'basic';
        const nextAction = searchParams.get('nextAction');

        // Preserve all context parameters
        const params = new URLSearchParams();
        params.set('mode', mode);
        if (nextAction) params.set('nextAction', nextAction);

        const preserveParams = ['itemId', 'start', 'end', 'curriculumId', 'curriculumItemId', 'scheduledDate'];
        preserveParams.forEach(key => {
            const val = searchParams.get(key);
            if (val) params.set(key, val);
        });

        router.push(`/test/wrong-flashcard?${params.toString()}`);
    };

    const handleNextStep = async () => {
        const nextAction = searchParams.get('nextAction');

        if (nextAction === 'check_review') {
            setCheckingReview(true);
            try {
                const studentInfoStr = localStorage.getItem('studentInfo');
                if (!studentInfoStr) {
                    console.error('Student info not found');
                    router.push('/student/learning');
                    return;
                }
                const studentInfo = JSON.parse(studentInfoStr);

                const res = await fetch('/api/test/review', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studentId: studentInfo.id,
                        curriculumId: studentInfo.curriculum_id
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.reviewWords && data.reviewWords.length > 0) {
                        localStorage.setItem('reviewWords', JSON.stringify(data.reviewWords));
                        notifications.show({
                            title: '복습 시험',
                            message: `지난 복습 단어 ${data.reviewWords.length}개가 있습니다. 복습 시험을 시작합니다!`,
                            color: 'blue',
                            autoClose: 3000
                        });
                        router.push(`/test/multiple-choice?nextAction=home&scheduledDate=${searchParams.get('scheduledDate')}`);
                        return;
                    }
                }
            } catch (error) {
                console.error('Failed to check review words', error);
            }
            setCheckingReview(false);
            router.push('/student/learning');

        } else {
            router.push('/student/learning');
        }
    };

    return (
        <StudentLayout>
            <Box
                style={{
                    minHeight: '100%',
                    background: '#ffffff',
                    padding: '20px',
                    position: 'relative',
                }}
            >
                <Container size={800}>
                    <div className="animate-fade-in">
                        {/* Header */}
                        <Group justify="center" mb={30}>
                            <Stack align="center" gap={4}>
                                <Box p={6} bg="black" c="white" style={{ borderRadius: '0px' }}>
                                    <IconTrophy size={24} stroke={2} />
                                </Box>
                                <Title
                                    order={1}
                                    style={{
                                        color: 'black',
                                        fontWeight: 900,
                                        fontSize: '2rem',
                                        letterSpacing: '-1px',
                                        lineHeight: 1,
                                        textAlign: 'center'
                                    }}
                                >
                                    시험 결과
                                </Title>
                                <Text size="sm" c="dimmed" fw={700}>
                                    {new Date(result.timestamp).toLocaleDateString()}
                                </Text>
                            </Stack>
                        </Group>

                        {/* Split Layout: Score (Left) + Stats (Right) */}
                        <Group align="stretch" mb={30} grow>
                            {/* Left: Score Card */}
                            <Paper
                                p={30}
                                style={{
                                    border: '4px solid black',
                                    borderRadius: '0px',
                                    background: 'white',
                                    boxShadow: 'none',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    flex: 1
                                }}
                            >
                                <Box
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '10px',
                                        background: result.passed ? '#51CF66' : '#FF6B6B',
                                        borderBottom: '2px solid black'
                                    }}
                                />

                                <Stack align="center" justify="center" h="100%" gap="md">
                                    <RingProgress
                                        size={160}
                                        thickness={16}
                                        roundCaps={false}
                                        sections={[{ value: result.score, color: result.passed ? '#51CF66' : '#FF6B6B' }]}
                                        rootColor="#f1f3f5"
                                        label={
                                            <Stack gap={0} align="center">
                                                <Text size="2.5rem" fw={900} lts={-2} style={{ lineHeight: 1 }}>
                                                    {result.score}
                                                </Text>
                                                <Text size="md" fw={700} c="dimmed">점수</Text>
                                            </Stack>
                                        }
                                    />
                                    <Box ta="center">
                                        <Title order={3} style={{ fontSize: '1.5rem', fontWeight: 900 }}>
                                            {result.passed ? '참 잘했어요!' : '조금만 더 힘내요!'}
                                        </Title>
                                    </Box>
                                </Stack>
                            </Paper>

                            {/* Right: Stats Cards (Stacked) */}
                            <Stack gap="md" style={{ flex: 1 }}>
                                <Paper
                                    p="md"
                                    h="100%"
                                    style={{
                                        border: '3px solid black',
                                        borderRadius: '0px',
                                        background: '#D3F9D8',
                                        boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Group justify="space-between" w="100%">
                                        <Box>
                                            <Text size="xs" fw={700} tt="uppercase" c="dimmed">정답</Text>
                                            <Text size="2.5rem" fw={900} style={{ lineHeight: 1 }}>{result.correctCount}</Text>
                                        </Box>
                                        <IconCheck size={40} stroke={3} opacity={0.2} />
                                    </Group>
                                </Paper>

                                <Paper
                                    p="md"
                                    h="100%"
                                    style={{
                                        border: '3px solid black',
                                        borderRadius: '0px',
                                        background: '#FFE3E3',
                                        boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Group justify="space-between" w="100%">
                                        <Box>
                                            <Text size="xs" fw={700} tt="uppercase" c="dimmed">오답</Text>
                                            <Text size="2.5rem" fw={900} style={{ lineHeight: 1 }}>{result.wrongCount}</Text>
                                        </Box>
                                        <IconX size={40} stroke={3} opacity={0.2} />
                                    </Group>
                                </Paper>
                            </Stack>
                        </Group>

                        {/* Wrong Words List - Only for Word Tests */}
                        {result.wrongCount > 0 && result.testType !== 'listening' && result.wrongWords && (
                            <Box mb={20}>
                                <Paper
                                    p="lg"
                                    style={{
                                        border: '3px solid black',
                                        borderRadius: '0px',
                                        background: 'white',
                                        boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s',
                                    }}
                                    onClick={() => setShowWrongWords(!showWrongWords)}
                                    className="hover-lift"
                                >
                                    <Group justify="space-between">
                                        <Group gap="sm">
                                            <IconX size={24} color="red" />
                                            <Text fw={800} size="xl">오답 확인하기</Text>
                                            <Badge color="red" size="lg" radius="xs" variant="filled">{result.wrongCount}</Badge>
                                        </Group>
                                        {showWrongWords ? <IconChevronUp size={24} /> : <IconChevronDown size={24} />}
                                    </Group>
                                </Paper>

                                {showWrongWords && (
                                    <Stack gap="md" mt="lg">
                                        {result.wrongWords.map((word) => (
                                            <Paper
                                                key={word.no}
                                                p="lg"
                                                style={{
                                                    border: '2px solid black',
                                                    borderRadius: '0px',
                                                    background: '#fff',
                                                    borderLeft: '8px solid #FF6B6B'
                                                }}
                                            >
                                                <Group justify="space-between">
                                                    <Box>
                                                        <Text fw={900} size="xl">{word.korean}</Text>
                                                        <Group gap="xs">
                                                            <Text size="sm" c="dimmed">정답:</Text>
                                                            <Text fw={700} c="red">{word.english}</Text>
                                                        </Group>
                                                    </Box>
                                                    <Badge color="dark" variant="light" radius="xs">No. {word.no}</Badge>
                                                </Group>
                                            </Paper>
                                        ))}
                                    </Stack>
                                )}
                            </Box>
                        )}

                        {/* Actions */}
                        <Group justify="center" gap="md" mt={40}>
                            {result.wrongCount > 0 ? (
                                <button
                                    onClick={handleReviewWrongWords}
                                    style={{
                                        background: '#FF6B6B',
                                        color: 'white',
                                        border: '3px solid black',
                                        borderRadius: '0px',
                                        boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                                        fontSize: '1.2rem',
                                        fontWeight: 900,
                                        padding: '1.5rem 4rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        transition: 'all 0.2s',
                                        width: '100%',
                                        justifyContent: 'center'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translate(-2px, -2px)';
                                        e.currentTarget.style.boxShadow = '8px 8px 0px 0px rgba(0, 0, 0, 1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translate(0, 0)';
                                        e.currentTarget.style.boxShadow = '6px 6px 0px 0px rgba(0, 0, 0, 1)';
                                    }}
                                >
                                    <IconRefresh size={28} stroke={3} />
                                    오답 연습 시작하기
                                </button>
                            ) : (
                                <button
                                    onClick={handleNextStep}
                                    style={{
                                        background: 'black',
                                        color: '#FFD93D',
                                        border: '3px solid black',
                                        borderRadius: '0px',
                                        boxShadow: '6px 6px 0px 0px #FFD93D',
                                        fontSize: '1.2rem',
                                        fontWeight: 900,
                                        padding: '1.5rem 4rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translate(-2px, -2px)';
                                        e.currentTarget.style.boxShadow = '8px 8px 0px 0px #FFD93D';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translate(0, 0)';
                                        e.currentTarget.style.boxShadow = '6px 6px 0px 0px #FFD93D';
                                    }}
                                >
                                    <IconArrowRight size={28} />
                                    완료
                                </button>
                            )}
                        </Group>
                    </div>
                </Container>
            </Box>
        </StudentLayout>
    );
}

export default function TestResultPage() {
    return (
        <Suspense fallback={
            <StudentLayout>
                <Center style={{ minHeight: '100vh', background: '#fff' }}>
                    <Text>결과를 불러오는 중...</Text>
                </Center>
            </StudentLayout>
        }>
            <TestResultContent />
        </Suspense>
    );
}

