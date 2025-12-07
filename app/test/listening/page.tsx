'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Title, Paper, Text, Box, Group, Progress, Badge, Button } from '@mantine/core';
import { IconClock, IconCheck, IconX, IconPlayerPlay, IconPlayerPause, IconVolume } from '@tabler/icons-react';
import StudentLayout from '../../student/layout';

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
        <StudentLayout>
            <Container size="md" h="100%" py="xl" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box className="animate-fade-in" style={{ width: '100%' }}>

                    {/* Header Area: Title, Timer, Progress */}
                    <Group justify="space-between" align="flex-end" mb="lg">
                        <Box>
                            <Group gap="xs" mb={4}>
                                <Badge color="grape" variant="filled" size="lg" radius="xs" style={{ border: '2px solid black' }}>
                                    LISTENING TEST
                                </Badge>
                                <Text fw={700} c="dimmed">Question {currentIndex + 1} / {questions.length}</Text>
                            </Group>
                            <Title order={2} style={{ fontSize: '2rem', fontWeight: 900 }}>
                                {currentQuestion.question_text}
                            </Title>
                        </Box>

                        <Paper
                            p="xs"
                            px="md"
                            style={{
                                border: '3px solid black',
                                background: timeLeft <= 10 ? '#ffe3e3' : '#fff',
                                boxShadow: '4px 4px 0px black'
                            }}
                        >
                            <Group gap="xs">
                                <IconClock size={20} />
                                <Text fw={900} size="xl" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                    {timeLeft}s
                                </Text>
                            </Group>
                        </Paper>
                    </Group>

                    {/* Progress Bar */}
                    <Box mb="xl">
                        <Progress
                            value={progress}
                            size="lg"
                            radius="xs"
                            color="grape"
                            styles={{
                                root: { border: '2px solid black', backgroundColor: '#f1f3f5' },
                                section: { borderRight: '2px solid black' } // Optional style
                            }}
                        />
                    </Box>

                    {/* Main Interaction Area */}
                    <Group align="stretch" grow>
                        {/* Audio Player Card - Left (or Top on mobile) */}
                        <Paper
                            p="xl"
                            style={{
                                border: '3px solid black',
                                borderRadius: '0px',
                                background: 'white',
                                boxShadow: '6px 6px 0px black',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '250px'
                            }}
                        >
                            <button
                                onClick={handlePlayAudio}
                                disabled={playCount >= 3 || isPlaying}
                                style={{
                                    background: playCount >= 3 ? '#e9ecef' : '#BE4BDB', // Grape color
                                    color: 'white',
                                    border: '3px solid black',
                                    borderRadius: '50%',
                                    width: '100px',
                                    height: '100px',
                                    boxShadow: playCount >= 3 ? 'none' : '4px 4px 0px black',
                                    fontSize: '2.5rem',
                                    cursor: playCount >= 3 ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.1s',
                                    transform: isPlaying ? 'scale(0.95)' : 'scale(1)',
                                }}
                            >
                                {isPlaying ? <IconPlayerPause size={40} /> : <IconPlayerPlay size={40} />}
                            </button>
                            <Text fw={700} mt="md">
                                Play Audio ({playCount}/3)
                            </Text>
                            <Text size="sm" c="dimmed">Click button to listen</Text>
                        </Paper>

                        {/* Choices Grid - Right (or Bottom on mobile) */}
                        <Box style={{ flex: 2 }}>
                            <Box
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '16px',
                                    height: '100%'
                                }}
                            >
                                {currentQuestion.choices.map((choice: string, index: number) => {
                                    const isSelected = selectedChoice === index;
                                    const isCorrect = index === currentQuestion.correct_answer;
                                    const showResult = isAnswered;

                                    let bg = 'white';
                                    let borderColor = 'black';

                                    if (showResult) {
                                        if (isCorrect) { bg = '#d3f9d8'; borderColor = '#2b8a3e'; }
                                        else if (isSelected) { bg = '#ffe3e3'; borderColor = '#e03131'; }
                                    } else if (isSelected) {
                                        bg = '#f3d9fa'; // Light grape
                                    }

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handleChoiceClick(index)}
                                            disabled={isAnswered}
                                            style={{
                                                background: bg,
                                                border: `3px solid ${borderColor}`,
                                                borderRadius: '0px', // Brutalist
                                                padding: '1.5rem',
                                                cursor: isAnswered ? 'default' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'flex-start',
                                                textAlign: 'left',
                                                gap: '12px',
                                                boxShadow: isSelected ? '2px 2px 0px black' : '4px 4px 0px black',
                                                transform: isSelected ? 'translate(2px, 2px)' : 'none',
                                                transition: 'all 0.1s',
                                                height: '100%'
                                            }}
                                        >
                                            <Badge
                                                size="lg"
                                                circle
                                                variant={isSelected ? "filled" : "outline"}
                                                color="dark"
                                                style={{ border: '1px solid black' }}
                                            >
                                                {index + 1}
                                            </Badge>
                                            <Text size="lg" fw={700} style={{ lineHeight: 1.2 }}>
                                                {choice}
                                            </Text>

                                            {showResult && isCorrect && <IconCheck style={{ marginLeft: 'auto' }} color="green" />}
                                            {showResult && isSelected && !isCorrect && <IconX style={{ marginLeft: 'auto' }} color="red" />}
                                        </button>
                                    );
                                })}
                            </Box>
                        </Box>
                    </Group>
                </Box>
            </Container>
        </StudentLayout>
    );
}
