'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Container,
    Title,
    Paper,
    Text,
    Box,
    Group,
    Stack,
    TextInput,
    Loader,
    Center,
    Badge,
    RingProgress,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconClock, IconCheck, IconX, IconKeyboard, IconAlertTriangle, IconRefresh, IconArrowRight } from '@tabler/icons-react';
import StudentLayout from '../../student/layout';

interface Word {
    no: number;
    english: string;
    korean: string;
}

function normalizeAnswer(answer: string): string {
    return answer
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

export default function WrongRetryPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [words, setWords] = useState<Word[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [results, setResults] = useState<boolean[]>([]);
    const [timeLeft, setTimeLeft] = useState(20);
    const [isAnswered, setIsAnswered] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Save Session Helper
    const saveProgress = async (idx: number, currentResults: boolean[]) => {
        try {
            const studentInfoStr = localStorage.getItem('studentInfo');
            if (!studentInfoStr) return;
            const studentInfo = JSON.parse(studentInfoStr);

            const sessionData = {
                type: 'wrong_retry',
                words: words,
                currentIndex: idx,
                results: currentResults,
                nextAction: searchParams.get('nextAction'),
                studentInfo: studentInfo // Keep metadata
            };

            await fetch('/api/test/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: studentInfo.id,
                    sessionData
                })
            });
        } catch (error) {
            console.error('Failed to save session:', error);
        }
    };

    useEffect(() => {
        const initTest = async () => {
            const isResume = searchParams.get('resume') === 'true';

            if (isResume) {
                try {
                    const studentInfoStr = localStorage.getItem('studentInfo');
                    if (studentInfoStr) {
                        const studentInfo = JSON.parse(studentInfoStr);
                        const res = await fetch(`/api/test/session?studentId=${studentInfo.id}`);
                        if (res.ok) {
                            const data = await res.json();
                            if (data.session && (data.session.session_data.type === 'wrong_retry' || data.session.session_data.type === 'wrong_flashcard')) {
                                const sData = data.session.session_data;
                                setWords(sData.words);
                                setCurrentIndex(sData.currentIndex || 0);
                                setResults(sData.results || []);
                                setLoading(false);
                                notifications.show({ title: 'Resumed', message: 'Wrong Retry resumed.', color: 'blue' });
                                return;
                            }
                        }
                    }
                } catch (e) {
                    console.error("Resume failed", e);
                }
            }

            // localStorage에서 오답 단어 로드 (Fallback / Normal Flow)
            const savedWrongWords = localStorage.getItem('wrongWords');
            if (savedWrongWords) {
                const parsedWords = JSON.parse(savedWrongWords);
                if (parsedWords.length > 0) {
                    setWords(parsedWords);
                } else {
                    notifications.show({ title: '완료', message: '오답이 없습니다!', color: 'green' });
                    // If clean, verify next steps immediately
                    // finishTest(parsedWords, []); // Can't call finishTest here easily due to async/scope, so just redirect
                    router.push('/student/learning');
                    return;
                }
            } else {
                if (!isResume) {
                    router.push('/student/learning');
                }
            }
            setLoading(false);
        };

        initTest();
    }, [searchParams]);

    // Auto-focus logic
    useEffect(() => {
        if (!isAnswered && !loading && inputRef.current) {
            // Slight delay to ensure render
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [currentIndex, isAnswered, loading]);

    const currentWord = words[currentIndex];

    // Timer
    useEffect(() => {
        if (!loading && words.length > 0 && timeLeft > 0 && !isAnswered) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !isAnswered) {
            handleSubmit(true);
        }
    }, [timeLeft, isAnswered, loading, words]);

    // Copy/Paste Prevention
    useEffect(() => {
        const preventAction = (e: Event) => {
            e.preventDefault();
            notifications.show({
                title: 'No Cheating!',
                message: '복사/붙여넣기는 허용되지 않습니다.',
                color: 'red',
                autoClose: 1500,
            });
        };
        window.addEventListener('copy', preventAction);
        window.addEventListener('paste', preventAction);
        return () => {
            window.removeEventListener('copy', preventAction);
            window.removeEventListener('paste', preventAction);
        };
    }, []);

    const handleSubmit = (timeOut = false) => {
        if (isAnswered) return;

        const isCorrect = !timeOut && normalizeAnswer(userAnswer) === normalizeAnswer(currentWord?.english || '');
        const newResults = [...results, isCorrect];
        setResults(newResults);
        setIsAnswered(true);

        // Sound Effect
        const audioFile = isCorrect ? '/sounds/correct.mp3' : '/sounds/wrong.mp3';
        new Audio(audioFile).play().catch(() => { });

        // Save partial progress
        saveProgress(currentIndex + 1, newResults);

        // Auto Advance after delay
        setTimeout(() => {
            handleNext(newResults);
        }, 1200); // 1.2s delay to see the result
    };

    const handleNext = (currentResults: boolean[]) => {
        if (currentIndex < words.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setUserAnswer('');
            setIsAnswered(false);
            setTimeLeft(20);
        } else {
            finishTest(words, currentResults);
        }
    };

    const finishTest = async (finalWords: Word[], finalResults: boolean[]) => {
        setSaving(true);
        // Calculate new wrong words
        const newWrongWords = finalWords.filter((_, index) => !finalResults[index]);
        const newWrongCount = newWrongWords.length;
        const nextAction = searchParams.get('nextAction');

        if (newWrongCount > 0) {
            // RECURSIVE LOOP - Fail
            localStorage.setItem('wrongWords', JSON.stringify(newWrongWords));

            // Save Session for next loop
            const studentInfoStr = localStorage.getItem('studentInfo');
            if (studentInfoStr) {
                const studentInfo = JSON.parse(studentInfoStr);
                await fetch('/api/test/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studentId: studentInfo.id,
                        sessionData: {
                            type: 'wrong_flashcard', // Go to Flashcard
                            words: newWrongWords, // New set of words
                            nextAction: nextAction,
                            studentInfo: studentInfo
                        }
                    })
                });
            }

            notifications.show({
                title: 'Still Learning!',
                message: `${newWrongCount} words left. Let's try again!`,
                color: 'red',
                autoClose: 2000,
            });

            if (nextAction) {
                router.push(`/test/wrong-flashcard?nextAction=${nextAction}`);
            } else {
                router.push('/test/wrong-flashcard');
            }

        } else {
            // ALL CLEARED - Success
            localStorage.removeItem('wrongWords');

            if (nextAction === 'check_review') {
                try {
                    const studentInfoStr = localStorage.getItem('studentInfo');
                    if (studentInfoStr) {
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

                                // Save Session for Review Test
                                await fetch('/api/test/session', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        studentId: studentInfo.id,
                                        sessionData: {
                                            type: 'review_test',
                                            words: data.reviewWords,
                                            nextAction: 'home', // Completion leads to home
                                            studentInfo: studentInfo
                                        }
                                    })
                                });

                                notifications.show({
                                    title: 'Good Job! Now Review.',
                                    message: `Wrong answers cleared! Now starting review (${data.reviewWords.length} words).`,
                                    color: 'blue',
                                    autoClose: 3000
                                });
                                router.push('/test/multiple-choice?nextAction=home');
                                return;
                            }
                        }
                    }
                } catch (e) {
                    console.error(e);
                }
            }

            // Default: All Cleared & Done - Clear Session
            const studentInfoStr = localStorage.getItem('studentInfo');
            if (studentInfoStr) {
                const studentInfo = JSON.parse(studentInfoStr);
                await fetch(`/api/test/session?studentId=${studentInfo.id}`, {
                    method: 'DELETE'
                });
            }

            notifications.show({
                title: 'Perfect!',
                message: 'All wrong answers cleared! Great job.',
                color: 'green',
                autoClose: 3000,
            });
            router.push('/student/learning');
        }
        setSaving(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (!isAnswered) {
                handleSubmit();
            }
            // No action needed for Next, it's auto
        }
    };

    if (loading || saving || words.length === 0) {
        return (
            <StudentLayout>
                <Center h="100vh" bg="white">
                    <Loader color="red" type="dots" />
                </Center>
            </StudentLayout>
        );
    }

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
                    {/* Header */}
                    <Group justify="space-between" mb={30}>
                        <Group>
                            <Box p={8} bg="black" c="white" style={{ borderRadius: '0px' }}>
                                <IconRefresh size={28} stroke={2} />
                            </Box>
                            <Stack gap={0}>
                                <Title order={2} style={{ fontWeight: 900 }}>RETRY TEST</Title>
                                <Text size="sm" fw={700} c="dimmed">{currentIndex + 1} / {words.length}</Text>
                            </Stack>
                        </Group>

                        {/* Timer */}
                        <Group gap="xs">
                            <IconClock size={24} />
                            <Text fw={900} size="xl" c={timeLeft <= 5 ? 'red' : 'black'}>
                                {timeLeft}s
                            </Text>
                        </Group>
                    </Group>

                    {/* Main Interaction Area */}
                    <Paper
                        p={50}
                        style={{
                            border: '4px solid black',
                            borderRadius: '0px',
                            background: isAnswered
                                ? (results[currentIndex] ? '#D3F9D8' : '#FFE3E3')
                                : 'white',
                            boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
                            minHeight: '400px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.3s ease',
                        }}
                    >
                        <Stack align="center" gap="xl" w="100%">
                            <Badge
                                size="xl"
                                color="red"
                                variant="filled"
                                radius="xs"
                                style={{ border: '2px solid black' }}
                            >
                                Wrong Answer Review
                            </Badge>

                            <Text size="3.5rem" fw={900} ta="center" style={{ lineHeight: 1.2 }}>
                                {currentWord?.korean}
                            </Text>

                            {/* Input Area */}
                            {!isAnswered ? (
                                <TextInput
                                    ref={inputRef}
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Type answer here..."
                                    size="xl"
                                    styles={{
                                        input: {
                                            fontSize: '2rem',
                                            fontWeight: 700,
                                            textAlign: 'center',
                                            border: '3px solid black',
                                            borderRadius: '0px',
                                            padding: '30px',
                                            height: '80px',
                                        }
                                    }}
                                    style={{ width: '100%', maxWidth: '500px' }}
                                    autoComplete="off"
                                />
                            ) : (
                                <Stack align="center" gap="md">
                                    <Group>
                                        {results[currentIndex] ? (
                                            <IconCheck size={48} color="green" stroke={3} />
                                        ) : (
                                            <IconX size={48} color="red" stroke={3} />
                                        )}
                                        <Text size="2.5rem" fw={900}>
                                            {results[currentIndex] ? 'CORRECT!' : 'WRONG!'}
                                        </Text>
                                    </Group>

                                    {!results[currentIndex] && (
                                        <Text size="xl" fw={700} c="dimmed">
                                            Answer: <span style={{ color: 'red', textDecoration: 'underline' }}>{currentWord?.english}</span>
                                        </Text>
                                    )}

                                    {/* No Button - Auto Advance message */}
                                    <Text size="sm" c="dimmed" mt={10} className="animate-pulse">
                                        Next word in 1 second...
                                    </Text>
                                </Stack>
                            )}
                        </Stack>
                    </Paper>

                    {/* Progress Bar (Visual) */}
                    <Box mt={30} style={{ border: '3px solid black', height: '20px', width: '100%', position: 'relative' }}>
                        <Box
                            style={{
                                width: `${((currentIndex) / words.length) * 100}%`, // Fill based on currentIndex
                                height: '100%',
                                background: '#FFD93D',
                                transition: 'width 0.3s ease'
                            }}
                        />
                    </Box>

                    <Center mt="md">
                        <Text fw={700} size="sm" c="dimmed">
                            <IconAlertTriangle size={16} style={{ marginBottom: '-3px' }} /> No Cheating Allowed
                        </Text>
                    </Center>
                </Container>
            </Box>
        </StudentLayout>
    );
}
