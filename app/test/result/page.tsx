'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Title, Paper, Text, Box, Group, Stack, Badge, Button } from '@mantine/core';
import { IconCheck, IconX, IconRefresh, IconArrowRight, IconChevronDown, IconChevronUp } from '@tabler/icons-react';

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
            // 테스트용 샘플 결과 데이터
            const sampleResult = {
                totalQuestions: 5,
                correctCount: 2,
                wrongCount: 3,
                score: 40,
                passed: false,
                wrongWords: [
                    { no: 1, english: 'apple', korean: '사과' },
                    { no: 3, english: 'orange', korean: '오렌지' },
                    { no: 5, english: 'watermelon', korean: '수박' },
                ],
                timestamp: new Date().toISOString(),
            };
            setResult(sampleResult);
            localStorage.setItem('testResult', JSON.stringify(sampleResult));
        }
    }, [router]);

    if (!result) {
        return (
            <Container size="sm" py={40}>
                <Text>결과를 불러오는 중...</Text>
            </Container>
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
        <Container size="md" py={40}>
            <div className="animate-fade-in">
                {/* 결과 헤더 */}
                <Box mb={30} style={{ textAlign: 'center' }}>
                    <Title order={1} style={{ fontWeight: 900, marginBottom: '1rem' }}>
                        시험 결과
                    </Title>
                    <Text size="lg" c="dimmed">
                        {new Date(result.timestamp).toLocaleString('ko-KR')}
                    </Text>
                </Box>

                {/* 점수 카드 */}
                <Paper
                    p="xl"
                    radius="lg"
                    mb={30}
                    style={{
                        border: '6px solid black',
                        background: result.passed
                            ? 'linear-gradient(135deg, #51CF66 0%, #37B24D 100%)'
                            : 'linear-gradient(135deg, #FF6B6B 0%, #FA5252 100%)',
                        boxShadow: '12px 12px 0px 0px rgba(0, 0, 0, 1)',
                        textAlign: 'center',
                    }}
                >
                    <div
                        style={{
                            width: '200px',
                            height: '200px',
                            margin: '0 auto',
                            borderRadius: '50%',
                            border: '8px solid white',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                        }}
                    >
                        <Text size="80px" fw={900} c="white" style={{ lineHeight: 1 }}>
                            {result.score}
                        </Text>
                        <Text size="xl" fw={700} c="white">
                            점
                        </Text>
                    </div>

                    <Title order={2} mt="xl" c="white" style={{ fontWeight: 900 }}>
                        {result.passed ? '🎉 합격!' : '😢 불합격'}
                    </Title>
                    <Text size="lg" c="white" mt="sm">
                        {result.passed
                            ? '축하합니다! 다음 단계로 진행할 수 있습니다.'
                            : '조금 더 노력이 필요합니다. 오답을 복습하세요.'}
                    </Text>
                </Paper>

                {/* 통계 카드 */}
                <Group grow mb={30}>
                    <Paper
                        p="lg"
                        radius="lg"
                        style={{
                            border: '4px solid black',
                            background: 'white',
                            boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                        }}
                    >
                        <Group>
                            <div
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: '#E3FAFC',
                                    border: '3px solid black',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Text size="xl" fw={900}>
                                    📝
                                </Text>
                            </div>
                            <div>
                                <Text size="sm" c="dimmed">
                                    총 문제 수
                                </Text>
                                <Text size="xl" fw={900}>
                                    {result.totalQuestions}개
                                </Text>
                            </div>
                        </Group>
                    </Paper>

                    <Paper
                        p="lg"
                        radius="lg"
                        style={{
                            border: '4px solid black',
                            background: 'white',
                            boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                        }}
                    >
                        <Group>
                            <div
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: '#D3F9D8',
                                    border: '3px solid black',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <IconCheck size={32} color="#37B24D" stroke={3} />
                            </div>
                            <div>
                                <Text size="sm" c="dimmed">
                                    정답
                                </Text>
                                <Text size="xl" fw={900} c="green">
                                    {result.correctCount}개
                                </Text>
                            </div>
                        </Group>
                    </Paper>

                    <Paper
                        p="lg"
                        radius="lg"
                        style={{
                            border: '4px solid black',
                            background: 'white',
                            boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                        }}
                    >
                        <Group>
                            <div
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: '#FFE3E3',
                                    border: '3px solid black',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <IconX size={32} color="#FA5252" stroke={3} />
                            </div>
                            <div>
                                <Text size="sm" c="dimmed">
                                    오답
                                </Text>
                                <Text size="xl" fw={900} c="red">
                                    {result.wrongCount}개
                                </Text>
                            </div>
                        </Group>
                    </Paper>
                </Group>

                {/* 오답 목록 */}
                {result.wrongCount > 0 && (
                    <Paper
                        p="lg"
                        radius="lg"
                        mb={30}
                        style={{
                            border: '4px solid black',
                            background: 'white',
                            boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                        }}
                    >
                        <Group
                            justify="space-between"
                            mb="md"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setShowWrongWords(!showWrongWords)}
                        >
                            <Group>
                                <Text size="lg" fw={900}>
                                    오답 목록
                                </Text>
                                <Badge color="red" size="lg" style={{ border: '2px solid black' }}>
                                    {result.wrongCount}개
                                </Badge>
                            </Group>
                            {showWrongWords ? <IconChevronUp size={24} /> : <IconChevronDown size={24} />}
                        </Group>

                        {showWrongWords && (
                            <Stack gap="sm" mt="md">
                                {result.wrongWords.map((word) => (
                                    <Paper
                                        key={word.no}
                                        p="md"
                                        style={{
                                            border: '3px solid #FFE3E3',
                                            background: '#FFF5F5',
                                        }}
                                    >
                                        <Group justify="space-between">
                                            <div>
                                                <Text fw={700} size="lg">
                                                    {word.korean}
                                                </Text>
                                                <Text c="dimmed" size="sm">
                                                    정답: {word.english}
                                                </Text>
                                            </div>
                                            <Badge color="red" variant="filled">
                                                #{word.no}
                                            </Badge>
                                        </Group>
                                    </Paper>
                                ))}
                            </Stack>
                        )}
                    </Paper>
                )}

                {/* 액션 버튼 */}
                <Group justify="center" gap="md">
                    {result.wrongCount > 0 && (
                        <button
                            onClick={handleReviewWrongWords}
                            style={{
                                background: '#7950f2',
                                color: 'white',
                                border: '4px solid black',
                                borderRadius: '12px',
                                boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                                fontSize: '1.2rem',
                                fontWeight: 900,
                                padding: '1.2rem 2.5rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.8rem',
                                transition: 'all 0.2s',
                            }}
                            onMouseDown={(e) => {
                                e.currentTarget.style.transform = 'translate(3px, 3px)';
                                e.currentTarget.style.boxShadow = '3px 3px 0px 0px rgba(0, 0, 0, 1)';
                            }}
                            onMouseUp={(e) => {
                                e.currentTarget.style.transform = 'translate(0, 0)';
                                e.currentTarget.style.boxShadow = '6px 6px 0px 0px rgba(0, 0, 0, 1)';
                            }}
                        >
                            <IconRefresh size={28} />
                            오답 복습하기
                        </button>
                    )}

                    {result.passed && (
                        <button
                            onClick={handleNextStep}
                            style={{
                                background: '#51CF66',
                                color: 'white',
                                border: '4px solid black',
                                borderRadius: '12px',
                                boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                                fontSize: '1.2rem',
                                fontWeight: 900,
                                padding: '1.2rem 2.5rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.8rem',
                                transition: 'all 0.2s',
                            }}
                            onMouseDown={(e) => {
                                e.currentTarget.style.transform = 'translate(3px, 3px)';
                                e.currentTarget.style.boxShadow = '3px 3px 0px 0px rgba(0, 0, 0, 1)';
                            }}
                            onMouseUp={(e) => {
                                e.currentTarget.style.transform = 'translate(0, 0)';
                                e.currentTarget.style.boxShadow = '6px 6px 0px 0px rgba(0, 0, 0, 1)';
                            }}
                        >
                            다음 단계로
                            <IconArrowRight size={28} />
                        </button>
                    )}
                </Group>
            </div>
        </Container>
    );
}
