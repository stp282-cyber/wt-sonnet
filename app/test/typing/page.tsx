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

const sampleWords: Word[] = [
    { no: 1, english: 'apple', korean: '사과' },
    { no: 2, english: 'banana', korean: '바나나' },
    { no: 3, english: 'orange', korean: '오렌지' },
    { no: 4, english: 'grape', korean: '포도' },
    { no: 5, english: 'watermelon', korean: '수박' },
];

// 답안 정규화 함수 (특수문자, 띄어쓰기, 대소문자, 괄호 무시)
function normalizeAnswer(answer: string): string {
    return answer
        .toLowerCase()
        .replace(/[^a-z가-힣]/g, '') // 영문자와 한글만 남김
        .trim();
}

export default function TypingTestPage() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [results, setResults] = useState<boolean[]>([]);
    const [timeLeft, setTimeLeft] = useState(20); // 제한 시간 20초
    const [isAnswered, setIsAnswered] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const currentWord = sampleWords[currentIndex];
    const progress = ((currentIndex + 1) / sampleWords.length) * 100;
    const correctCount = results.filter((r) => r).length;
    const wrongCount = results.filter((r) => !r).length;

    // 타이머
    useEffect(() => {
        if (timeLeft > 0 && !isAnswered) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !isAnswered) {
            // 시간 초과
            handleSubmit(true);
        }
    }, [timeLeft, isAnswered]);

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

    // 답안 제출
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

        // 1.5초 후 다음 문제로
        setTimeout(() => {
            if (currentIndex < sampleWords.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setUserAnswer('');
                setTimeLeft(20);
                setIsAnswered(false);
                inputRef.current?.focus();
            } else {
                // 시험 완료
                const score = Math.round((correctCount + (isCorrect ? 1 : 0)) / sampleWords.length * 100);
                notifications.show({
                    title: '시험 완료!',
                    message: `점수: ${score}점 (${correctCount + (isCorrect ? 1 : 0)}/${sampleWords.length})`,
                    color: score >= 80 ? 'green' : 'red',
                });

                setTimeout(() => {
                    router.push('/teacher/dashboard');
                }, 2000);
            }
        }, 1500);
    };

    // Enter 키로 제출
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isAnswered && userAnswer.trim()) {
            handleSubmit();
        }
    };

    // 포커스 자동 설정
    useEffect(() => {
        inputRef.current?.focus();
    }, [currentIndex]);

    return (
        <Box
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
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
                            ✍️ 타이핑 시험
                        </Title>
                        <Text
                            size="xl"
                            style={{
                                color: 'white',
                                fontWeight: 600,
                                textShadow: '2px 2px 0px rgba(0, 0, 0, 0.2)',
                            }}
                        >
                            한글을 보고 영어로 입력하세요!
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
                                진행률
                            </Text>
                            <Text fw={900} size="lg" c="violet">
                                {currentIndex + 1} / {sampleWords.length}
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
                                bar: {
                                    background: 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)',
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
                            {/* 한글 문제 */}
                            <Badge
                                size="xl"
                                variant="filled"
                                color="violet"
                                style={{
                                    border: '3px solid black',
                                    fontSize: '1.2rem',
                                    padding: '1rem 2rem',
                                }}
                            >
                                문제 {currentWord.no}
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

                            {/* 입력 필드 */}
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

                            {/* 정답 표시 */}
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

                            {/* 제출 버튼 */}
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
