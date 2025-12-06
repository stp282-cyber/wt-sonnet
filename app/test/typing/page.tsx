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
import { IconClock, IconCheck, IconX, IconKeyboard, IconAlertTriangle } from '@tabler/icons-react';

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
                // 시험 완료 - 결과 저장 및 페이지 이동
                const finalResults = [...results, isCorrect];
                const finalCorrectCount = finalResults.filter(r => r).length;
                const finalWrongCount = finalResults.length - finalCorrectCount;
                const score = Math.round((finalCorrectCount / sampleWords.length) * 100);
                const passed = score >= 80;

                // 오답 단어 목록 생성
                const wrongWords = sampleWords.filter((_, index) => !finalResults[index]);

                // 결과 데이터 저장
                const testResult = {
                    totalQuestions: sampleWords.length,
                    correctCount: finalCorrectCount,
                    wrongCount: finalWrongCount,
                    score,
                    passed,
                    wrongWords,
                    timestamp: new Date().toISOString(),
                };

                localStorage.setItem('testResult', JSON.stringify(testResult));

                // 결과 페이지로 이동
                setTimeout(() => {
                    router.push('/test/result');
                }, 1500);
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
                background: 'white',
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
                        <Group justify="center" mb="md">
                            <Box p="sm" style={{ background: '#FFD93D', border: '2px solid black', boxShadow: '4px 4px 0px black' }}>
                                <IconKeyboard size={32} stroke={2} color="black" />
                            </Box>
                        </Group>
                        <Title
                            order={1}
                            style={{
                                color: 'black',
                                fontWeight: 900,
                                fontSize: '2.5rem',
                                marginBottom: '0.5rem',
                            }}
                        >
                            타이핑 시험
                        </Title>
                        <Text
                            size="xl"
                            style={{
                                color: 'black',
                                fontWeight: 500,
                            }}
                            c="dimmed"
                        >
                            한글을 보고 영어로 입력하세요
                        </Text>
                    </Box>

                    {/* 상태 바 */}
                    <Group mb={20} justify="space-between">
                        <Paper
                            p="md"
                            style={{
                                border: '2px solid black',
                                borderRadius: '0px',
                                background: 'white',
                                boxShadow: '4px 4px 0px black',
                                flex: 1,
                            }}
                        >
                            <Group gap="xs">
                                <IconClock size={24} color="black" />
                                <Text fw={900} size="xl" c={timeLeft <= 5 ? 'red' : 'black'}>
                                    {timeLeft}초
                                </Text>
                            </Group>
                        </Paper>

                        <Paper
                            p="md"
                            style={{
                                border: '2px solid black',
                                borderRadius: '0px',
                                background: 'white',
                                boxShadow: '4px 4px 0px black',
                            }}
                        >
                            <Group gap="md">
                                <Group gap="xs">
                                    <IconCheck size={20} color="#37b24d" />
                                    <Text fw={700} c="black">
                                        {correctCount}
                                    </Text>
                                </Group>
                                <Group gap="xs">
                                    <IconX size={20} color="#f03e3e" />
                                    <Text fw={700} c="black">
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
                            border: '2px solid black',
                            borderRadius: '0px',
                            background: 'white',
                            boxShadow: '4px 4px 0px black',
                        }}
                    >
                        <Group justify="space-between" mb={10}>
                            <Text fw={700} size="lg">
                                진행률
                            </Text>
                            <Text fw={900} size="lg">
                                {currentIndex + 1} / {sampleWords.length}
                            </Text>
                        </Group>
                        <Progress
                            value={progress}
                            size="xl"
                            radius="0"
                            styles={{
                                root: {
                                    border: '2px solid black',
                                    borderRadius: '0px',
                                    backgroundColor: '#F1F3F5',
                                },
                                section: {
                                    backgroundColor: '#FFD93D',
                                    borderRight: '2px solid black',
                                }
                            }}
                        />
                    </Paper>

                    {/* 문제 카드 */}
                    <Paper
                        p={60}
                        style={{
                            border: '2px solid black',
                            borderRadius: '0px',
                            background: isAnswered
                                ? results[results.length - 1]
                                    ? '#D3F9D8' // 정답 시 연두색
                                    : '#FFE3E3' // 오답 시 붉은색
                                : 'white', // 기본 흰색
                            boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
                            minHeight: '400px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Stack align="center" gap="xl" style={{ width: '100%' }}>
                            {/* 한글 문제 */}
                            <Box
                                style={{
                                    border: '2px solid black',
                                    background: 'black',
                                    color: 'white',
                                    padding: '0.5rem 1.5rem',
                                    fontWeight: 700,
                                    fontSize: '1.2rem',
                                }}
                            >
                                문제 {currentWord.no}
                            </Box>

                            <Text
                                size="4rem"
                                fw={900}
                                style={{
                                    color: 'black',
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
                                        border: '2px solid black',
                                        fontSize: '2rem',
                                        textAlign: 'center',
                                        fontWeight: 700,
                                        padding: '2rem',
                                        borderRadius: '0px',
                                        background: isAnswered ? 'rgba(0,0,0,0.05)' : 'white',
                                        color: 'black',
                                        boxShadow: '4px 4px 0px black',
                                    },
                                }}
                                style={{ width: '100%', maxWidth: '500px' }}
                            />

                            {/* 정답 표시 */}
                            {isAnswered && (
                                <Box
                                    className="animate-slide-in-right"
                                    style={{
                                        background: results[results.length - 1] ? 'black' : 'black',
                                        color: results[results.length - 1] ? '#A3E635' : '#FF6B6B', // 라임 / 레드
                                        border: '2px solid black',
                                        borderRadius: '0px',
                                        padding: '1rem 2rem',
                                        boxShadow: '6px 6px 0px rgba(0, 0, 0, 1)',
                                    }}
                                >
                                    <Text fw={900} size="xl" ta="center">
                                        {results[results.length - 1] ? '✅ 정답!' : '❌ 오답!'}
                                    </Text>
                                    {!results[results.length - 1] && (
                                        <Text fw={700} size="lg" ta="center" mt={5} c="white">
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
                                        background: userAnswer.trim() ? 'black' : '#e9ecef',
                                        color: userAnswer.trim() ? '#FFD93D' : '#adb5bd',
                                        border: '2px solid black',
                                        borderRadius: '0px',
                                        boxShadow: userAnswer.trim() ? '6px 6px 0px 0px rgba(0, 0, 0, 1)' : 'none',
                                        fontSize: '1.5rem',
                                        fontWeight: 900,
                                        padding: '1.2rem 3rem',
                                        cursor: userAnswer.trim() ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.15s ease',
                                        width: '100%',
                                        maxWidth: '500px',
                                    }}
                                    onMouseDown={(e) => {
                                        if (userAnswer.trim()) {
                                            e.currentTarget.style.transform = 'translate(2px, 2px)';
                                            e.currentTarget.style.boxShadow = '4px 4px 0px 0px rgba(0, 0, 0, 1)';
                                        }
                                    }}
                                    onMouseUp={(e) => {
                                        if (userAnswer.trim()) {
                                            e.currentTarget.style.transform = 'translate(0px, 0px)';
                                            e.currentTarget.style.boxShadow = '6px 6px 0px 0px rgba(0, 0, 0, 1)';
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
                            border: '2px solid black',
                            background: '#F1F3F5',
                            borderRadius: '0px',
                            boxShadow: '4px 4px 0px black',
                        }}
                    >
                        <Group justify="center" gap="xs">
                            <IconAlertTriangle size={20} color="black" />
                            <Text c="black" ta="center" fw={700}>
                                복사/붙여넣기 및 우클릭이 금지되어 있습니다
                            </Text>
                        </Group>
                    </Paper>
                </div>
            </Container>
        </Box>
    );
}
