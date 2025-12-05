'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Title, Paper, Text, Box, Group, Progress, Badge, Button } from '@mantine/core';
import { IconClock, IconCheck, IconX, IconPlayerPlay, IconPlayerPause, IconVolume } from '@tabler/icons-react';

interface ListeningQuestion {
    question_no: number;
    question_text: string;
    choices: string[];
    correct_answer: number;
    script: string;
}

export default function ListeningTestPage() {
    const router = useRouter();

    const [questions] = useState<ListeningQuestion[]>([
        {
            question_no: 1,
            question_text: 'What is the man doing?',
            choices: ['Reading a book', 'Watching TV', 'Cooking dinner', 'Playing games'],
            correct_answer: 2,
            script: 'The man is cooking dinner in the kitchen.',
        },
        {
            question_no: 2,
            question_text: 'Where are they going?',
            choices: ['To the park', 'To the library', 'To the mall', 'To the school'],
            correct_answer: 0,
            script: 'They are going to the park to play soccer.',
        },
        {
            question_no: 3,
            question_text: 'What time does the movie start?',
            choices: ['At 3:00', 'At 4:00', 'At 5:00', 'At 6:00'],
            correct_answer: 1,
            script: 'The movie starts at 4:00 in the afternoon.',
        },
    ]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [results, setResults] = useState<boolean[]>([]);
    const [timeLeft, setTimeLeft] = useState(30);
    const [playCount, setPlayCount] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const correctCount = results.filter((r) => r).length;
    const wrongCount = results.filter((r) => !r).length;
    const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

    useEffect(() => {
        if (timeLeft > 0 && !isAnswered && questions.length > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !isAnswered) {
            handleSubmit(null, true);
        }
    }, [timeLeft, isAnswered, questions]);

    const handlePlayAudio = () => {
        if (playCount >= 3) {
            return;
        }

        const currentQuestion = questions[currentIndex];
        const utterance = new SpeechSynthesisUtterance(currentQuestion.script);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;

        setIsPlaying(true);
        utterance.onend = () => {
            setIsPlaying(false);
            setPlayCount(playCount + 1);
        };

        window.speechSynthesis.speak(utterance);
    };

    const handleChoiceClick = (index: number) => {
        if (isAnswered) return;
        setSelectedChoice(index);
        handleSubmit(index, false);
    };

    const handleSubmit = (choiceIndex: number | null, timeout: boolean) => {
        const currentQuestion = questions[currentIndex];
        const isCorrect = choiceIndex === currentQuestion.correct_answer;
        setResults([...results, isCorrect]);
        setIsAnswered(true);

        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setSelectedChoice(null);
                setTimeLeft(30);
                setIsAnswered(false);
                setPlayCount(0);
            } else {
                const finalResults = [...results, isCorrect];
                const finalCorrectCount = finalResults.filter((r) => r).length;
                const score = Math.round((finalCorrectCount / questions.length) * 100);

                // 오답 문제 저장
                const wrongQuestions = questions.filter((_, idx) => !finalResults[idx]);

                const testResult = {
                    totalQuestions: questions.length,
                    correctCount: finalCorrectCount,
                    wrongCount: questions.length - finalCorrectCount,
                    score,
                    passed: score >= 80,
                    wrongQuestions,
                    timestamp: new Date().toISOString(),
                };

                localStorage.setItem('listeningTestResult', JSON.stringify(testResult));

                // 오답이 있으면 빈칸 채우기로, 없으면 결과 페이지로
                if (wrongQuestions.length > 0) {
                    setTimeout(() => router.push('/test/listening-fill'), 1500);
                } else {
                    setTimeout(() => router.push('/test/result'), 1500);
                }
            }
        }, 1500);
    };

    if (questions.length === 0) {
        return (
            <Container size="sm" py={40}>
                <Text>문제를 불러오는 중...</Text>
            </Container>
        );
    }

    const currentQuestion = questions[currentIndex];
    const numberSymbols = ['①', '②', '③', '④'];

    return (
        <Box
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
            }}
        >
            <Container size={700}>
                <div className="animate-fade-in">
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
                            🎧 듣기 시험
                        </Title>
                        <Text size="xl" style={{ color: 'white', fontWeight: 600, textShadow: '2px 2px 0px rgba(0, 0, 0, 0.2)' }}>
                            오디오를 듣고 정답을 선택하세요!
                        </Text>
                    </Box>

                    <Group mb={20} justify="space-between">
                        <Paper p="md" style={{ border: '4px solid black', borderRadius: '12px', background: 'white', flex: 1 }}>
                            <Group gap="xs">
                                <IconClock size={24} color="#7950f2" />
                                <Text fw={900} size="xl" c={timeLeft <= 5 ? 'red' : 'violet'}>
                                    {timeLeft}초
                                </Text>
                            </Group>
                        </Paper>
                        <Paper p="md" style={{ border: '4px solid black', borderRadius: '12px', background: 'white' }}>
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

                    <Paper p="md" mb={20} style={{ border: '4px solid black', borderRadius: '12px', background: 'white' }}>
                        <Group justify="space-between" mb={10}>
                            <Text fw={700} size="lg">
                                진행률
                            </Text>
                            <Text fw={900} size="lg" c="violet">
                                {currentIndex + 1} / {questions.length}
                            </Text>
                        </Group>
                        <Progress
                            value={progress}
                            size="xl"
                            radius="xl"
                            styles={{
                                root: { border: '3px solid black' },
                                section: { background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' },
                            }}
                        />
                    </Paper>

                    <Paper
                        p={60}
                        mb={20}
                        style={{
                            border: '6px solid black',
                            borderRadius: '20px',
                            background: 'white',
                            boxShadow: '12px 12px 0px 0px rgba(0, 0, 0, 1)',
                            textAlign: 'center',
                        }}
                    >
                        <Badge
                            size="xl"
                            variant="filled"
                            color="grape"
                            style={{ border: '3px solid black', fontSize: '1.2rem', padding: '1rem 2rem', marginBottom: '2rem' }}
                        >
                            문제 {currentQuestion.question_no}
                        </Badge>

                        <Box mb={30}>
                            <button
                                onClick={handlePlayAudio}
                                disabled={playCount >= 3 || isPlaying}
                                style={{
                                    background: playCount >= 3 ? '#ccc' : '#667eea',
                                    color: 'white',
                                    border: '4px solid black',
                                    borderRadius: '50%',
                                    width: '120px',
                                    height: '120px',
                                    boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
                                    fontSize: '3rem',
                                    cursor: playCount >= 3 ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    if (playCount < 3 && !isPlaying) e.currentTarget.style.transform = 'translateY(-4px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                {isPlaying ? '🔊' : '🎵'}
                            </button>
                            <Text size="sm" c="dimmed" mt={10}>
                                재생 횟수: {playCount} / 3
                            </Text>
                        </Box>

                        <Text size="2rem" fw={900} style={{ color: '#764ba2', marginBottom: '1rem' }}>
                            {currentQuestion.question_text}
                        </Text>
                        <Text size="lg" c="dimmed">
                            정답을 선택하세요
                        </Text>
                    </Paper>

                    <Box>
                        {currentQuestion.choices.map((choice: string, index: number) => {
                            const isSelected = selectedChoice === index;
                            const isCorrect = index === currentQuestion.correct_answer;
                            const showResult = isAnswered;
                            let backgroundColor = 'white';
                            if (showResult) {
                                if (isCorrect) backgroundColor = '#d3f9d8';
                                else if (isSelected && !isCorrect) backgroundColor = '#ffe3e3';
                            } else if (isSelected) backgroundColor = '#fff3bf';

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleChoiceClick(index)}
                                    disabled={isAnswered}
                                    style={{
                                        width: '100%',
                                        background: backgroundColor,
                                        border: '4px solid black',
                                        borderRadius: '12px',
                                        boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                                        fontSize: '1.5rem',
                                        fontWeight: 700,
                                        padding: '1.5rem 2rem',
                                        marginBottom: '1rem',
                                        cursor: isAnswered ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isAnswered) e.currentTarget.style.transform = 'translateY(-4px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <Text size="2rem" fw={900}>
                                        {numberSymbols[index]}
                                    </Text>
                                    <Text size="xl" fw={700} style={{ flex: 1, textAlign: 'left' }}>
                                        {choice}
                                    </Text>
                                    {showResult && isCorrect && <IconCheck size={32} color="#37B24D" stroke={3} />}
                                    {showResult && isSelected && !isCorrect && <IconX size={32} color="#FA5252" stroke={3} />}
                                </button>
                            );
                        })}
                    </Box>
                </div>
            </Container>
        </Box>
    );
}
