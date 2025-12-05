'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Container,
    Title,
    Paper,
    Text,
    Box,
    Group,
    Progress,
    Stack,
    TextInput,
    Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconClock, IconCheck, IconX } from '@tabler/icons-react';

interface Word {
    no: number;
    english: string;
    korean: string;
}

// 답안 정규화 함수
function normalizeAnswer(answer: string): string {
    return answer
        .toLowerCase()
        .replace(/[^a-z가-힣]/g, '')
        .trim();
}

export default function WrongRetryPage() {
    const router = useRouter();
    const [words, setWords] = useState<Word[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [results, setResults] = useState<boolean[]>([]);
    const [timeLeft, setTimeLeft] = useState(20);
    const [isAnswered, setIsAnswered] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // localStorage에서 오답 단어 로드
        const savedWrongWords = localStorage.getItem('wrongWords');
        if (savedWrongWords) {
            setWords(JSON.parse(savedWrongWords));
        } else {
            // 테스트용 샘플 데이터
            const sampleWrongWords = [
                { no: 1, english: 'apple', korean: '사과' },
                { no: 3, english: 'orange', korean: '오렌지' },
                { no: 5, english: 'watermelon', korean: '수박' },
            ];
            setWords(sampleWrongWords);
            localStorage.setItem('wrongWords', JSON.stringify(sampleWrongWords));
        }
    }, [router]);

    const currentWord = words[currentIndex];
    const progress = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;
    const correctCount = results.filter((r) => r).length;
    const wrongCount = results.filter((r) => !r).length;

    // 타이머
    useEffect(() => {
        if (timeLeft > 0 && !isAnswered && words.length > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !isAnswered) {
            handleSubmit(true);
        }
    }, [timeLeft, isAnswered, words]);

    // 복사/붙여넣기 방지
    useEffect(() => {
        const preventCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            notifications.show({
                title: '복사/붙여넣기 금지',
                message: '시험 중에는 복사/붙여넣기를 할 수 없습니다.',
                color: 'red',
            });
        };

        const preventContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        document.addEventListener('copy', preventCopy);
        document.addEventListener('paste', preventCopy);
        document.addEventListener('contextmenu', preventContextMenu);

        return () => {
            document.removeEventListener('copy', preventCopy);
            document.removeEventListener('paste', preventCopy);
            document.removeEventListener('contextmenu', preventContextMenu);
        };
    }, []);

    const handleSubmit = (timeout = false) => {
        const normalizedUser = normalizeAnswer(userAnswer);
        const normalizedCorrect = normalizeAnswer(currentWord.english);
        const isCorrect = normalizedUser === normalizedCorrect;

        setResults([...results, isCorrect]);
        setIsAnswered(true);

        if (timeout) {
            notifications.show({
                title: '시간 초과',
                message: '다음 문제로 넘어갑니다.',
                color: 'orange',
            });
        }

        setTimeout(() => {
            if (currentIndex < words.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setUserAnswer('');
                setTimeLeft(20);
                setIsAnswered(false);
                inputRef.current?.focus();
            } else {
                // 재시험 완료
                const finalResults = [...results, isCorrect];
                const finalWrongWords = words.filter((_, index) => !finalResults[index]);

                if (finalWrongWords.length === 0) {
                    // 모든 오답 해결 → 완료!
                    notifications.show({
                        title: '🎉 완벽합니다!',
                        message: '모든 오답을 정복했습니다!',
                        color: 'green',
                    });

                    setTimeout(() => {
                        router.push('/teacher/dashboard');
                    }, 2000);
                } else {
                    // 여전히 오답 존재 → 다시 플래시카드
                    localStorage.setItem('wrongWords', JSON.stringify(finalWrongWords));

                    notifications.show({
                        title: '조금 더 노력이 필요해요',
                        message: `아직 ${finalWrongWords.length}개의 오답이 있습니다. 다시 복습하세요!`,
                        color: 'orange',
                    });

                    setTimeout(() => {
                        router.push('/test/wrong-flashcard');
                    }, 2000);
                }
            }
        }, 1500);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isAnswered && userAnswer.trim()) {
            handleSubmit();
        }
    };

    useEffect(() => {
        inputRef.current?.focus();
    }, [currentIndex]);

    if (words.length === 0) {
        return (
            <Container size="sm" py={40}>
                <Text>오답 단어를 불러오는 중...</Text>
            </Container>
        );
    }

    return (
        <Box
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #FA8BFF 0%, #2BD2FF 90%, #2BFF88 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
            }}
        >
            <Container size={700}>
                <div className="animate-fade-in">
                    {/* 헤더 */}
                    <Box mb={30} style={{ textAlign: 'center' }}>
                        <Title
                            order={1}
                            style={{
                                color: 'white',
                                fontWeight: 900,
                                fontSize: '2.5rem',
                                textShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)',
                                marginBottom: '1rem',
                            }}
                        >
                            🔁 오답 재시험
                        </Title>
                        <Text
                            size="xl"
                            style={{
                                color: 'white',
                                fontWeight: 600,
                                textShadow: '2px 2px 0px rgba(0, 0, 0, 0.2)',
                            }}
                        >
                            틀린 단어를 다시 시험봅니다!
                        </Text>
                    </Box>

                    {/* 상태 바 */}
                    <Group mb={20} justify="space-between">
                        <Paper
                            p="md"
                            style={{
                                border: '4px solid black',
                                borderRadius: '12px',
                                background: 'white',
                                flex: 1,
                            }}
                        >
                            <Group gap="xs">
                                <IconClock size={24} color="#7950f2" />
                                <Text fw={900} size="xl" c={timeLeft <= 5 ? 'red' : 'violet'}>
                                    {timeLeft}초
                                </Text>
                            </Group>
                        </Paper>

                        <Paper
                            p="md"
                            style={{
                                border: '4px solid black',
                                borderRadius: '12px',
                                background: 'white',
                            }}
                        >
                            <Group gap="md">
                                <Group gap="xs">
                                    <IconCheck size={20} color="green" />
                                    <Text fw={700} c="green">
                                        {correctCount}
                                    </Text>
                                </Group>
                                <Group gap="xs">
                                    <IconX size={20} color="red" />
                                    <Text fw={700} c="red">
                                        {wrongCount}
                                    </Text>
                                </Group>
                            </Group>
                        </Paper>
                    </Group>

                    {/* 진행률 */}
                    <Paper
                        p="md"
                        mb={20}
                        style={{
                            border: '4px solid black',
                            borderRadius: '12px',
                            background: 'white',
                        }}
                    >
                        <Group justify="space-between" mb={10}>
                            <Text fw={700} size="lg">
                                재시험 진행률
                            </Text>
                            <Text fw={900} size="lg" c="violet">
                                {currentIndex + 1} / {words.length}
                            </Text>
                        </Group>
                        <Progress
                            value={progress}
                            size="xl"
                            radius="xl"
                            styles={{
                                root: {
                                    border: '3px solid black',
                                },
                                section: {
                                    background: 'linear-gradient(90deg, #FA8BFF 0%, #2BD2FF 100%)',
                                },
                            }}
                        />
                    </Paper>

                    {/* 문제 카드 */}
                    <Paper
                        p={60}
                        style={{
                            border: '6px solid black',
                            borderRadius: '20px',
                            background: isAnswered
                                ? results[results.length - 1]
                                    ? '#d3f9d8'
                                    : '#ffe3e3'
                                : 'white',
                            boxShadow: '12px 12px 0px 0px rgba(0, 0, 0, 1)',
                            minHeight: '400px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        className="animate-bounce-in"
                    >
                        <Stack align="center" gap="xl" style={{ width: '100%' }}>
                            <Badge
                                size="xl"
                                variant="filled"
                                color="red"
                                style={{
                                    border: '3px solid black',
                                    fontSize: '1.2rem',
                                    padding: '1rem 2rem',
                                }}
                            >
                                오답 #{currentWord.no}
                            </Badge>

                            <Text
                                size="4rem"
                                fw={900}
                                style={{
                                    color: '#7950f2',
                                    textAlign: 'center',
                                }}
                            >
                                {currentWord.korean}
                            </Text>

                            <TextInput
                                ref={inputRef}
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="영어로 입력하세요"
                                size="xl"
                                disabled={isAnswered}
                                styles={{
                                    input: {
                                        border: '5px solid black',
                                        fontSize: '2rem',
                                        textAlign: 'center',
                                        fontWeight: 700,
                                        padding: '2rem',
                                        borderRadius: '15px',
                                        background: isAnswered ? '#f1f3f5' : 'white',
                                    },
                                }}
                                style={{ width: '100%', maxWidth: '500px' }}
                            />

                            {isAnswered && (
                                <Box
                                    className="animate-slide-in-right"
                                    style={{
                                        background: results[results.length - 1] ? '#51cf66' : '#ff6b6b',
                                        color: 'white',
                                        border: '4px solid black',
                                        borderRadius: '12px',
                                        padding: '1rem 2rem',
                                        boxShadow: '6px 6px 0px rgba(0, 0, 0, 1)',
                                    }}
                                >
                                    <Text fw={900} size="xl" ta="center">
                                        {results[results.length - 1] ? '✅ 정답!' : '❌ 오답!'}
                                    </Text>
                                    {!results[results.length - 1] && (
                                        <Text fw={700} size="lg" ta="center" mt={5}>
                                            정답: {currentWord.english}
                                        </Text>
                                    )}
                                </Box>
                            )}

                            {!isAnswered && (
                                <button
                                    onClick={() => handleSubmit()}
                                    disabled={!userAnswer.trim()}
                                    style={{
                                        background: userAnswer.trim() ? '#7950f2' : '#ccc',
                                        color: 'white',
                                        border: '5px solid black',
                                        borderRadius: '15px',
                                        boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
                                        fontSize: '1.5rem',
                                        fontWeight: 900,
                                        padding: '1.5rem 3rem',
                                        cursor: userAnswer.trim() ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.15s ease',
                                        opacity: userAnswer.trim() ? 1 : 0.5,
                                    }}
                                    onMouseDown={(e) => {
                                        if (userAnswer.trim()) {
                                            e.currentTarget.style.transform = 'translate(8px, 8px)';
                                            e.currentTarget.style.boxShadow = '0px 0px 0px 0px rgba(0, 0, 0, 1)';
                                        }
                                    }}
                                    onMouseUp={(e) => {
                                        if (userAnswer.trim()) {
                                            e.currentTarget.style.transform = 'translate(0px, 0px)';
                                            e.currentTarget.style.boxShadow = '8px 8px 0px 0px rgba(0, 0, 0, 1)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (userAnswer.trim()) {
                                            e.currentTarget.style.transform = 'translate(0px, 0px)';
                                            e.currentTarget.style.boxShadow = '8px 8px 0px 0px rgba(0, 0, 0, 1)';
                                        }
                                    }}
                                >
                                    제출하기
                                </button>
                            )}
                        </Stack>
                    </Paper>

                    {/* 하단 경고 */}
                    <Paper
                        p="md"
                        mt={20}
                        style={{
                            border: '3px solid white',
                            background: 'rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '12px',
                        }}
                    >
                        <Text c="white" ta="center" fw={600}>
                            ⚠️ 복사/붙여넣기 및 우클릭이 금지되어 있습니다
                        </Text>
                    </Paper>
                </div>
            </Container>
        </Box>
    );
}
