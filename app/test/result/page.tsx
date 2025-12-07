'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Title, Paper, Text, Box, Group, Stack, Badge, RingProgress, Center } from '@mantine/core';
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
    wrongWords: Word[];
    timestamp: string;
}

export default function TestResultPage() {
    const router = useRouter();
    const [result, setResult] = useState<TestResult | null>(null);
    const [showWrongWords, setShowWrongWords] = useState(false);

    useEffect(() => {
        // localStorage에서 결과 데이터 로드
        const savedResult = localStorage.getItem('testResult');
        if (savedResult) {
            setResult(JSON.parse(savedResult));
        } else {
            // 데이터가 없으면 학습 메인으로 리다이렉트 (혹은 개발 중 편의를 위해 샘플 데이터 유지 여부 결정)
            // 여기서는 사용자 경험을 위해 메인으로 보냅니다.
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
        // 오답 단어를 localStorage에 저장
        localStorage.setItem('wrongWords', JSON.stringify(result.wrongWords));
        router.push('/test/wrong-flashcard');
    };

    const handleNextStep = () => {
        // 학습 메인으로 이동
        router.push('/student/learning');
    };

    return (
        <StudentLayout>
            <Box
                style={{
                    minHeight: '100%',
                    background: '#ffffff',
                    padding: '40px 20px',
                    position: 'relative',
                }}
            >
                <Container size={800}>
                    <div className="animate-fade-in">
                        {/* 헤더 */}
                        <Group justify="center" mb={50}>
                            <Stack align="center" gap="xs">
                                <Box p={8} bg="black" c="white" style={{ borderRadius: '0px' }}>
                                    <IconTrophy size={32} stroke={2} />
                                </Box>
                                <Title
                                    order={1}
                                    style={{
                                        color: 'black',
                                        fontWeight: 900,
                                        fontSize: '3rem',
                                        letterSpacing: '-1px',
                                        lineHeight: 1,
                                        textAlign: 'center'
                                    }}
                                >
                                    Test Result
                                </Title>
                                <Text size="lg" c="dimmed" fw={700}>
                                    {new Date(result.timestamp).toLocaleDateString()}
                                </Text>
                            </Stack>
                        </Group>

                        {/* 점수 카드 */}
                        <Paper
                            p={50}
                            mb={40}
                            style={{
                                border: '4px solid black',
                                borderRadius: '0px',
                                background: 'white',
                                boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
                                position: 'relative',
                                overflow: 'hidden'
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

                            <Stack align="center" gap="xl">
                                <Box style={{ position: 'relative' }}>
                                    <RingProgress
                                        size={220}
                                        thickness={20}
                                        roundCaps={false}
                                        sections={[{ value: result.score, color: result.passed ? '#51CF66' : '#FF6B6B' }]}
                                        rootColor="#f1f3f5"
                                        label={
                                            <Stack gap={0} align="center">
                                                <Text size="4rem" fw={900} lts={-2} style={{ lineHeight: 1 }}>
                                                    {result.score}
                                                </Text>
                                                <Text size="xl" fw={700} c="dimmed">SCORE</Text>
                                            </Stack>
                                        }
                                        style={{ filter: 'drop-shadow(4px 4px 0px black)' }}
                                    />
                                </Box>

                                <Box ta="center">
                                    <Title order={2} style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                                        {result.passed ? 'Excellent Work! 🎉' : 'Keep Trying! 💪'}
                                    </Title>
                                    <Text size="lg" c="dimmed" fw={600}>
                                        {result.passed
                                            ? 'You successfully passed the test.'
                                            : 'Review your mistakes and try again.'}
                                    </Text>
                                </Box>
                            </Stack>
                        </Paper>

                        {/* 통계 요약 */}
                        <Group grow mb={40} gap="lg">
                            <Paper
                                p="lg"
                                style={{
                                    border: '3px solid black',
                                    borderRadius: '0px',
                                    background: '#D3F9D8',
                                    boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                                }}
                            >
                                <Group justify="space-between">
                                    <Box>
                                        <Text size="xs" fw={700} tt="uppercase" c="dimmed">Correct</Text>
                                        <Text size="2.5rem" fw={900} style={{ lineHeight: 1 }}>{result.correctCount}</Text>
                                    </Box>
                                    <IconCheck size={40} stroke={3} opacity={0.2} />
                                </Group>
                            </Paper>

                            <Paper
                                p="lg"
                                style={{
                                    border: '3px solid black',
                                    borderRadius: '0px',
                                    background: '#FFE3E3',
                                    boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                                }}
                            >
                                <Group justify="space-between">
                                    <Box>
                                        <Text size="xs" fw={700} tt="uppercase" c="dimmed">Wrong</Text>
                                        <Text size="2.5rem" fw={900} style={{ lineHeight: 1 }}>{result.wrongCount}</Text>
                                    </Box>
                                    <IconX size={40} stroke={3} opacity={0.2} />
                                </Group>
                            </Paper>
                        </Group>

                        {/* 오답 목록 */}
                        {result.wrongCount > 0 && (
                            <Box mb={40}>
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
                                            <Text fw={800} size="xl">Review Wrong Answers</Text>
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
                                                            <Text size="sm" c="dimmed">Correct Answer:</Text>
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

                        {/* 액션 버튼 */}
                        <Group justify="center" gap="md">
                            {result.wrongCount > 0 && (
                                <button
                                    onClick={handleReviewWrongWords}
                                    style={{
                                        background: 'white',
                                        color: 'black',
                                        border: '3px solid black',
                                        borderRadius: '0px',
                                        boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                                        fontSize: '1.1rem',
                                        fontWeight: 800,
                                        padding: '1.2rem 2.5rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.8rem',
                                        transition: 'all 0.2s',
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
                                    <IconRefresh size={24} />
                                    REVIEW WRONG WORDS
                                </button>
                            )}

                            <button
                                onClick={handleNextStep}
                                style={{
                                    background: 'black',
                                    color: '#FFD93D',
                                    border: '3px solid black',
                                    borderRadius: '0px',
                                    boxShadow: '6px 6px 0px 0px #FFD93D',
                                    fontSize: '1.1rem',
                                    fontWeight: 800,
                                    padding: '1.2rem 2.5rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.8rem',
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
                                BACK TO LEARNING
                                <IconArrowRight size={24} />
                            </button>
                        </Group>
                    </div>
                </Container>
            </Box>
        </StudentLayout>
    );
}
