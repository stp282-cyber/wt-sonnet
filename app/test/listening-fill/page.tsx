'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Title, Paper, Text, Box, Group, Progress, Badge, TextInput, Button } from '@mantine/core';
import { IconCheck, IconX, IconPlayerPlay, IconVolume } from '@tabler/icons-react';
import StudentLayout from '../../student/layout';
import { normalizeAnswer } from '@/lib/stringUtils';

interface ListeningQuestion {
    question_no: number;
    question_text: string;
    choices: string[];
    correct_answer: number;
    script: string;
}

interface BlankWord {
    word: string;
    index: number;
}

export function ListeningFillPage() {
    const router = useRouter();
    const [wrongQuestions, setWrongQuestions] = useState<ListeningQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [blanks, setBlanks] = useState<BlankWord[]>([]);
    const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
    const [checkedBlanks, setCheckedBlanks] = useState<{ [key: number]: boolean }>({});
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const result = localStorage.getItem('listeningTestResult');
        if (result) {
            const testResult = JSON.parse(result);
            setWrongQuestions(testResult.wrongQuestions || []);
        }
    }, []);

    useEffect(() => {
        if (wrongQuestions.length > 0) {
            generateBlanks();
        }
    }, [currentIndex, wrongQuestions]);

    const generateBlanks = () => {
        const currentQuestion = wrongQuestions[currentIndex];
        if (!currentQuestion) return;

        const words = currentQuestion.script.split(' ');
        const blankCount = Math.min(3, Math.floor(words.length / 3));
        const blankIndices: number[] = [];

        while (blankIndices.length < blankCount) {
            const randomIndex = Math.floor(Math.random() * words.length);
            if (!blankIndices.includes(randomIndex) && words[randomIndex].length > 2) {
                blankIndices.push(randomIndex);
            }
        }

        const newBlanks: BlankWord[] = blankIndices.map((idx) => ({
            word: words[idx].replace(/[.,!?]/g, ''),
            index: idx,
        }));

        setBlanks(newBlanks);
        setUserAnswers({});
        setCheckedBlanks({});
    };

    const handlePlayAudio = () => {
        const currentQuestion = wrongQuestions[currentIndex];
        const utterance = new SpeechSynthesisUtterance(currentQuestion.script);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;

        setIsPlaying(true);
        utterance.onend = () => {
            setIsPlaying(false);
        };

        window.speechSynthesis.speak(utterance);
    };

    const handleCheckAnswer = (blankIndex: number) => {
        const blank = blanks.find((b) => b.index === blankIndex);
        if (!blank) return;

        const userAnswer = normalizeAnswer(userAnswers[blankIndex]);
        const correctAnswer = normalizeAnswer(blank.word);

        setCheckedBlanks({
            ...checkedBlanks,
            [blankIndex]: userAnswer === correctAnswer,
        });
    };

    const handleNextQuestion = () => {
        // 먼저 모든 빈칸을 자동으로 체크
        const newCheckedBlanks: { [key: number]: boolean } = {};
        let allCorrect = true;

        blanks.forEach((blank) => {
            const userAnswer = normalizeAnswer(userAnswers[blank.index]);
            const correctAnswer = normalizeAnswer(blank.word);
            const isCorrect = userAnswer === correctAnswer;
            newCheckedBlanks[blank.index] = isCorrect;
            if (!isCorrect) allCorrect = false;
        });

        // 체크 결과를 상태에 반영
        setCheckedBlanks(newCheckedBlanks);

        if (!allCorrect) {
            alert('모든 빈칸을 맞춰야 다음 문제로 넘어갈 수 있습니다!');
            return;
        }

        if (currentIndex < wrongQuestions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            // 모든 오답 문제를 완료했으면 결과 페이지로
            router.push('/test/result');
        }
    };

    if (wrongQuestions.length === 0) {
        return (
            <Container size="sm" py={40}>
                <Text>오답 문제가 없습니다.</Text>
            </Container>
        );
    }

    const currentQuestion = wrongQuestions[currentIndex];
    const progress = wrongQuestions.length > 0 ? ((currentIndex + 1) / wrongQuestions.length) * 100 : 0;

    const renderScriptWithBlanks = () => {
        const words = currentQuestion.script.split(' ');
        return words.map((word, idx) => {
            const blank = blanks.find((b) => b.index === idx);
            if (blank) {
                const isChecked = checkedBlanks[idx] !== undefined;
                const isCorrect = checkedBlanks[idx] === true;

                return (
                    <span key={idx} style={{ display: 'inline-block', margin: '0.25rem' }}>
                        <TextInput
                            value={userAnswers[idx] || ''}
                            onChange={(e) =>
                                setUserAnswers({
                                    ...userAnswers,
                                    [idx]: e.target.value,
                                })
                            }
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleCheckAnswer(idx);
                                }
                            }}
                            placeholder="___"
                            size="sm"
                            style={{
                                width: '120px',
                                display: 'inline-block',
                            }}
                            styles={{
                                input: {
                                    border: '3px solid black',
                                    background: isChecked ? (isCorrect ? '#d3f9d8' : '#ffe3e3') : 'white',
                                    fontWeight: 700,
                                    textAlign: 'center',
                                },
                            }}
                            rightSection={
                                isChecked ? (
                                    isCorrect ? (
                                        <IconCheck size={16} color="green" />
                                    ) : (
                                        <IconX size={16} color="red" />
                                    )
                                ) : null
                            }
                        />
                        {isChecked && !isCorrect && (
                            <Text size="xs" c="red" style={{ marginTop: '0.25rem' }}>
                                정답: {blank.word}
                            </Text>
                        )}
                    </span>
                );
            }
            return (
                <span key={idx} style={{ margin: '0 0.25rem' }}>
                    {word}
                </span>
            );
        });
    };

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
            <Container size={900}>
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
                            ✏️ 빈칸 채우기
                        </Title>
                        <Text size="xl" style={{ color: 'white', fontWeight: 600, textShadow: '2px 2px 0px rgba(0, 0, 0, 0.2)' }}>
                            오디오를 듣고 빈칸을 채우세요!
                        </Text>
                    </Box>

                    <Paper p="md" mb={20} style={{ border: '4px solid black', borderRadius: '12px', background: 'white' }}>
                        <Group justify="space-between" mb={10}>
                            <Text fw={700} size="lg">
                                진행률
                            </Text>
                            <Text fw={900} size="lg" c="pink">
                                {currentIndex + 1} / {wrongQuestions.length}
                            </Text>
                        </Group>
                        <Progress
                            value={progress}
                            size="xl"
                            radius="xl"
                            styles={{
                                root: { border: '3px solid black' },
                                section: { background: 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)' },
                            }}
                        />
                    </Paper>

                    <Paper
                        p={40}
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
                            color="pink"
                            style={{ border: '3px solid black', fontSize: '1.2rem', padding: '1rem 2rem', marginBottom: '2rem' }}
                        >
                            문제 {currentQuestion.question_no}
                        </Badge>

                        <Box mb={30}>
                            <button
                                onClick={handlePlayAudio}
                                disabled={isPlaying}
                                style={{
                                    background: '#f5576c',
                                    color: 'white',
                                    border: '4px solid black',
                                    borderRadius: '50%',
                                    width: '100px',
                                    height: '100px',
                                    boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
                                    fontSize: '2.5rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isPlaying) e.currentTarget.style.transform = 'translateY(-4px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                {isPlaying ? '🔊' : '🎵'}
                            </button>
                            <Text size="sm" c="dimmed" mt={10}>
                                무제한 재생 가능
                            </Text>
                        </Box>

                        <Text size="xl" fw={900} style={{ color: '#f5576c', marginBottom: '1rem' }}>
                            {currentQuestion.question_text}
                        </Text>
                    </Paper>

                    <Paper
                        p={40}
                        mb={20}
                        style={{
                            border: '6px solid black',
                            borderRadius: '20px',
                            background: 'white',
                            boxShadow: '12px 12px 0px 0px rgba(0, 0, 0, 1)',
                        }}
                    >
                        <Text size="lg" fw={700} mb={20}>
                            스크립트
                        </Text>
                        <Box
                            style={{
                                fontSize: '1.3rem',
                                lineHeight: '2.5',
                                padding: '1rem',
                                background: '#f8f9fa',
                                borderRadius: '12px',
                                border: '3px solid black',
                            }}
                        >
                            {renderScriptWithBlanks()}
                        </Box>

                        <Group justify="center" mt={30}>
                            <button
                                onClick={handleNextQuestion}
                                style={{
                                    background: '#f5576c',
                                    color: 'white',
                                    border: '4px solid black',
                                    borderRadius: '12px',
                                    boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                                    fontSize: '1.2rem',
                                    fontWeight: 900,
                                    padding: '1rem 2rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                {currentIndex < wrongQuestions.length - 1 ? '다음 문제' : '완료'}
                            </button>
                        </Group>
                    </Paper>
                </div>
            </Container>
        </Box>
    );
}

export default function ListeningFillPageWithLayout() {
    return (
        <StudentLayout>
            <ListeningFillPage />
        </StudentLayout>
    );
}
