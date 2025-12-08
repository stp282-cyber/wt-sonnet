'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
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
    Button
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconRefresh } from '@tabler/icons-react';
import StudentLayout from '../../student/layout';

function WrongRetryContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [words, setWords] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState(''); // For Typing
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null); // For MC
    const [results, setResults] = useState<boolean[]>([]);
    const [timeLeft, setTimeLeft] = useState(20);
    const [isAnswered, setIsAnswered] = useState(false);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState('basic'); // 'basic' | 'review_wrong'
    const inputRef = useRef<HTMLInputElement>(null);

    // Initial Fetch
    useEffect(() => {
        const init = async () => {
            const isResume = searchParams.get('resume') === 'true';
            const paramMode = searchParams.get('mode') || 'basic';
            setMode(paramMode);

            try {
                const studentInfoStr = localStorage.getItem('user');
                if (!studentInfoStr) throw new Error("No user found");
                const studentInfo = JSON.parse(studentInfoStr);

                const res = await fetch(`/api/test/session?studentId=${studentInfo.id}`);
                const data = await res.json();

                if (data.session) {
                    const sData = data.session.session_data;
                    let targetWords = [];

                    if (sData.step === 'BASIC_WRONG_RETRY' || (isResume && sData.step === 'BASIC_WRONG_RETRY')) {
                        // Resuming or Starting Basic Retry
                        targetWords = sData.wrongWords || [];
                    } else if (sData.step === 'REVIEW_WRONG_RETRY' || (isResume && sData.step === 'REVIEW_WRONG_RETRY')) {
                        // Review Retry
                        targetWords = sData.reviewWrongQuestions || [];
                        setMode('review_wrong'); // Force mode if derived from step
                    }

                    if (targetWords.length > 0) {
                        setWords(targetWords);
                        if (isResume && sData.currentRetryIndex) {
                            setCurrentIndex(sData.currentRetryIndex);
                            setResults(sData.retryResults || []);
                        }
                    } else {
                        notifications.show({ title: 'Info', message: 'No wrong words to retry', color: 'blue' });
                        finishTest([], paramMode);
                        return;
                    }
                }
                setLoading(false);
            } catch (e) {
                console.error(e);
                notifications.show({ title: 'Error', message: 'Failed to load retry session', color: 'red' });
            }
        };
        init();
    }, [searchParams]);

    const saveState = async (idx: number, res: boolean[]) => {
        const studentInfoStr = localStorage.getItem('user');
        if (!studentInfoStr) return;
        const studentInfo = JSON.parse(studentInfoStr);

        const r = await fetch(`/api/test/session?studentId=${studentInfo.id}`);
        const d = await r.json();
        const existingData = d.session?.session_data || {};

        const newData = {
            ...existingData,
            currentRetryIndex: idx,
            retryResults: res
        };

        await fetch('/api/test/session', {
            method: 'POST',
            body: JSON.stringify({ studentId: studentInfo.id, sessionData: newData })
        });
    };

    const handleSubmit = (choice?: string) => {
        if (!words[currentIndex]) return;
        const currentWord = words[currentIndex];
        let isCorrect = false;

        if (mode === 'review_wrong') {
            // MC Logic
            const userChoice = choice || selectedChoice;
            if (!userChoice) return;

            const correctRaw = currentWord.answer || currentWord.korean; // Safe fallback
            isCorrect = userChoice === correctRaw;
            setSelectedChoice(userChoice);
        } else {
            // Typing Logic (Basic)
            const correct = currentWord.english.toLowerCase().trim();
            const answer = userAnswer.toLowerCase().trim();
            isCorrect = correct === answer;
        }

        const newResults = [...results, isCorrect];
        setResults(newResults);
        setIsAnswered(true);

        saveState(currentIndex + 1, newResults);

        setTimeout(() => {
            if (currentIndex < words.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setUserAnswer('');
                setSelectedChoice(null); // Reset MC selection
                setTimeLeft(20);
                setIsAnswered(false);
                if (mode !== 'review_wrong') {
                    setTimeout(() => inputRef.current?.focus(), 50);
                }
            } else {
                finishTest(newResults, mode);
            }
        }, 1500);
    };

    const finishTest = async (finalResults: boolean[], currentMode: string) => {
        const studentInfoStr = localStorage.getItem('user');
        if (!studentInfoStr) return;
        const studentInfo = JSON.parse(studentInfoStr);

        const r = await fetch(`/api/test/session?studentId=${studentInfo.id}`);
        const d = await r.json();
        const sData = d.session?.session_data || {};

        if (currentMode === 'basic') {
            const nextStep = 'REVIEW_TEST';
            const gp = (key: string) => searchParams.get(key) || sData[key];
            const pItemId = gp('itemId');
            const pStart = gp('start');
            const pEnd = gp('end');
            const pCurrId = gp('curriculumId');
            const pCurrItemId = gp('curriculumItemId');
            const pDate = gp('scheduledDate');

            const route = `/test/multiple-choice?itemId=${pItemId}&start=${pStart}&end=${pEnd}&curriculumId=${pCurrId}&curriculumItemId=${pCurrItemId}&scheduledDate=${pDate}`;

            await fetch('/api/test/session', {
                method: 'POST',
                body: JSON.stringify({
                    studentId: studentInfo.id,
                    sessionData: { ...sData, step: nextStep, retryResults: finalResults }
                })
            });
            router.push(route);
        } else {
            // Review Wrong Retry -> Log as completed
            await fetch('/api/study-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: studentInfo.id,
                    curriculum_id: sData.curriculumId,
                    curriculum_item_id: sData.curriculumItemId,
                    scheduled_date: sData.scheduledDate || searchParams.get('scheduledDate') || new Date().toISOString().split('T')[0],
                    status: 'completed',
                    test_phase: 'completed',
                    score: sData.basicResults?.score || 0,
                    wrong_answers: sData.basicResults?.wrongWords || []
                })
            });

            await fetch(`/api/test/session?studentId=${studentInfo.id}`, { method: 'DELETE' });
            router.push('/student/learning');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isAnswered && mode !== 'review_wrong' && userAnswer.trim()) handleSubmit();
    };

    // Auto focus
    useEffect(() => {
        if (!loading && !isAnswered && mode !== 'review_wrong') {
            inputRef.current?.focus();
        }
    }, [currentIndex, loading, isAnswered, mode]);

    // Timer
    useEffect(() => {
        if (!loading && words.length > 0 && timeLeft > 0 && !isAnswered) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !isAnswered) {
            handleSubmit();
        }
    }, [timeLeft, isAnswered, loading]);

    if (loading) return <Center h="100vh"><Loader color="yellow" /></Center>;
    if (words.length === 0) return <Center h="100vh"><Text c="white">No words to retry.</Text></Center>;

    const currentWord = words[currentIndex];
    const isReview = mode === 'review_wrong';
    const questionText = isReview ? currentWord.english : currentWord.korean;
    const answerText = isReview ? (currentWord.answer || currentWord.korean) : currentWord.english;

    return (
        <Box p="xl" style={{ position: 'relative', minHeight: '100%', background: 'transparent' }}>
            <Container size={800}>
                <Stack gap="xl">
                    {/* Header */}
                    <Group justify="space-between">
                        <Box>
                            <Group gap="xs">
                                <Box bg="black" c="white" p={4}><IconRefresh size={20} /></Box>
                                <Text fw={700} tt="uppercase" c="dimmed">Wrong Answer Retry</Text>
                            </Group>
                            <Title order={1} style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white' }}>Retry: {currentIndex + 1} / {words.length}</Title>
                        </Box>
                        <Badge size="xl" variant="outline" color="red" style={{ border: '2px solid red' }}>{timeLeft}s</Badge>
                    </Group>

                    {/* Card */}
                    <Paper
                        p={50}
                        style={{
                            border: '3px solid black',
                            borderRadius: '0px',
                            background: isAnswered
                                ? (results[results.length - 1] ? '#D3F9D8' : '#FFE3E3')
                                : 'white',
                            boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
                            minHeight: '400px'
                        }}
                    >
                        <Stack align="center" gap="xl">
                            <Text size="3.5rem" fw={900} ta="center">{questionText}</Text>

                            {isReview ? (
                                // Multiple Choice UI
                                <Stack style={{ width: '100%' }}>
                                    {currentWord.choices?.map((choice: string, idx: number) => {
                                        const isSelected = selectedChoice === choice;
                                        const isCorrect = choice === answerText;
                                        let bg = 'white';
                                        let borderColor = 'black';

                                        if (isAnswered) {
                                            if (isCorrect) {
                                                bg = '#D3F9D8'; borderColor = '#2b8a3e';
                                            } else if (isSelected && !isCorrect) {
                                                bg = '#FFE3E3'; borderColor = '#c92a2a';
                                            }
                                        }

                                        return (
                                            <Button
                                                key={idx}
                                                onClick={() => handleSubmit(choice)}
                                                disabled={isAnswered}
                                                size="xl"
                                                styles={{
                                                    root: {
                                                        height: 'auto', padding: '20px',
                                                        background: bg, border: `3px solid ${borderColor}`,
                                                        borderRadius: 0, color: 'black',
                                                        boxShadow: isSelected ? 'none' : '4px 4px 0px black',
                                                        transform: isSelected ? 'translate(2px, 2px)' : 'none',
                                                    },
                                                    inner: { justifyContent: 'flex-start' },
                                                    label: { fontSize: '1.5rem', fontWeight: 700 }
                                                }}
                                            >
                                                {choice}
                                                {isAnswered && isCorrect && <IconCheck style={{ marginLeft: 'auto' }} />}
                                                {isAnswered && isSelected && !isCorrect && <IconX style={{ marginLeft: 'auto' }} />}
                                            </Button>
                                        )
                                    })}
                                </Stack>
                            ) : (
                                // Typing UI
                                <TextInput
                                    ref={inputRef}
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    disabled={isAnswered}
                                    size="xl"
                                    styles={{ input: { fontSize: '2rem', textAlign: 'center', border: '3px solid black' } }}
                                    style={{ width: '100%' }}
                                />
                            )}

                            {isAnswered && !results[results.length - 1] && (
                                <Text c="red" fw={700} size="xl">Answer: {answerText}</Text>
                            )}

                            {!isAnswered && !isReview && (
                                <Button onClick={() => handleSubmit()} color="black" size="lg" fullWidth>Submit</Button>
                            )}
                        </Stack>
                    </Paper>
                </Stack>
            </Container>
        </Box>
    );
}

export default function WrongRetryPage() {
    return (
        <Suspense fallback={
            <Center h="100vh">
                <Loader color="yellow" />
            </Center>
        }>
            <StudentLayout>
                <WrongRetryContent />
            </StudentLayout>
        </Suspense>
    );
}
