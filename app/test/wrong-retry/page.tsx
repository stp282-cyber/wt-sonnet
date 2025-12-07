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
    RingProgress,
    Button
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconClock, IconArrowRight, IconRefresh } from '@tabler/icons-react';
import StudentLayout from '../../student/layout';

function WrongRetryContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [words, setWords] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [results, setResults] = useState<boolean[]>([]);
    const [timeLeft, setTimeLeft] = useState(20);
    const [isAnswered, setIsAnswered] = useState(false);
    const [loading, setLoading] = useState(true);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initial Fetch (Resume or Start)
    useEffect(() => {
        const init = async () => {
            const isResume = searchParams.get('resume') === 'true';
            const mode = searchParams.get('mode') || 'basic'; // basic | review_wrong

            try {
                const studentInfoStr = localStorage.getItem('user');
                if (!studentInfoStr) throw new Error("No user found");
                const studentInfo = JSON.parse(studentInfoStr);

                const res = await fetch(`/api/test/session?studentId=${studentInfo.id}`);
                const data = await res.json();

                if (data.session) {
                    const sData = data.session.session_data;

                    // Logic: Get 'wrongWords' or 'reviewWrongQuestions'
                    let targetWords = [];

                    if (sData.step === 'BASIC_WRONG_RETRY' || (isResume && sData.step === 'BASIC_WRONG_RETRY')) {
                        // Resuming or Starting Basic Retry
                        targetWords = sData.wrongWords || [];
                    } else if (sData.step === 'REVIEW_WRONG_RETRY' || (isResume && sData.step === 'REVIEW_WRONG_RETRY')) {
                        // Review Retry
                        const questions = sData.reviewWrongQuestions || [];
                        // Transform questions to words if needed, or just use them
                        targetWords = questions;
                    }

                    if (targetWords.length > 0) {
                        setWords(targetWords);
                        if (isResume && sData.currentRetryIndex) {
                            setCurrentIndex(sData.currentRetryIndex);
                            setResults(sData.retryResults || []);
                        }
                    } else {
                        // Error or empty?
                        notifications.show({ title: 'Info', message: 'No wrong words to retry', color: 'blue' });
                        // Go to next step?
                        finishTest([], mode);
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

    // Save Helper
    const saveState = async (idx: number, res: boolean[]) => {
        const studentInfoStr = localStorage.getItem('user');
        if (!studentInfoStr) return;
        const studentInfo = JSON.parse(studentInfoStr);
        const mode = searchParams.get('mode') || 'basic';

        // We need to merge with existing session data to keep params
        // But fetch/update is weird. We should have loaded session data in state ideally.
        // For simplicity, we assume backend handles upsert merging? No, upsert replaces.
        // So we need to reconstruct the session object.
        // Ideally we should have fetched the FULL session object in useEffect.
        // Let's rely on what we have.

        // FIXME: This might overwrite 'basicResults' if we don't include them.
        // To fix this, we should fetch current session first? Or keep it in state?
        // Let's assume we can tolerate just updating the specific fields if we use a PATCH or if we are careful.
        // `api/test/session` is UPSERT.
        // We MUST fetch existing session data to preserve other fields.
        // Since we didn't do that, let's fetch it now or use a global state.

        // Quick fix: Fetch, Modify, Save.
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

    const handleSubmit = () => {
        if (!words[currentIndex]) return;
        const currentWord = words[currentIndex];
        const correct = currentWord.english.toLowerCase().trim();
        const answer = userAnswer.toLowerCase().trim();
        const isCorrect = correct === answer;

        const newResults = [...results, isCorrect];
        setResults(newResults);
        setIsAnswered(true);

        saveState(currentIndex + 1, newResults);

        setTimeout(() => {
            if (currentIndex < words.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setUserAnswer('');
                setTimeLeft(20);
                setIsAnswered(false);
                setTimeout(() => inputRef.current?.focus(), 50);
            } else {
                finishTest(newResults, searchParams.get('mode') || 'basic');
            }
        }, 1500);
    };

    const finishTest = async (finalResults: boolean[], mode: string) => {
        const studentInfoStr = localStorage.getItem('user');
        if (!studentInfoStr) return;
        const studentInfo = JSON.parse(studentInfoStr);

        // Fetch session to preserve params
        const r = await fetch(`/api/test/session?studentId=${studentInfo.id}`);
        const d = await r.json();
        const sData = d.session?.session_data || {};

        if (mode === 'basic') {
            // Next: REVIEW_TEST
            // We need to fetch basic info again?
            const nextStep = 'REVIEW_TEST';
            const scheduledDate = searchParams.get('scheduledDate');
            const route = `/test/multiple-choice?itemId=${sData.itemId}&start=${sData.start}&end=${sData.end}&curriculumId=${sData.curriculumId}&curriculumItemId=${sData.curriculumItemId}&scheduledDate=${scheduledDate}`;

            await fetch('/api/test/session', {
                method: 'POST',
                body: JSON.stringify({
                    studentId: studentInfo.id,
                    sessionData: {
                        ...sData,
                        step: nextStep,
                        retryResults: finalResults // Archiving logic needed?
                    }
                })
            });
            router.push(route);

        } else {
            // mode === 'review_wrong' -> FINISH
            // Save Final Log
            await fetch('/api/study-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: studentInfo.id,
                    curriculum_id: sData.curriculumId,
                    curriculum_item_id: sData.curriculumItemId,
                    scheduled_date: sData.scheduledDate || searchParams.get('scheduledDate') || new Date().toISOString().split('T')[0],
                    status: 'completed', // Final Status
                    test_phase: 'completed',
                    score: sData.basicResults?.score || 0, // Keep basic score
                    wrong_answers: sData.basicResults?.wrongWords || [] // Or update?
                })
            });

            // Delete Session
            await fetch(`/api/test/session?studentId=${studentInfo.id}`, { method: 'DELETE' });
            router.push('/student/learning');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isAnswered && userAnswer.trim()) handleSubmit();
    };

    // Auto focus
    useEffect(() => {
        if (!loading && !isAnswered) {
            inputRef.current?.focus();
        }
    }, [currentIndex, loading, isAnswered]);

    // Timer
    useEffect(() => {
        if (!loading && words.length > 0 && timeLeft > 0 && !isAnswered) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !isAnswered) {
            handleSubmit();
        }
    }, [timeLeft, isAnswered, loading]);

    if (loading) return <StudentLayout><Center h="100vh"><Loader /></Center></StudentLayout>;
    if (words.length === 0) return <StudentLayout><Center h="100vh"><Text>No words to retry.</Text></Center></StudentLayout>;

    const currentWord = words[currentIndex];

    return (
        <StudentLayout>
            <Box p="xl" style={{ position: 'relative', minHeight: '100%' }}>
                <Container size={800}>
                    <Stack gap="xl">
                        {/* Header */}
                        <Group justify="space-between">
                            <Box>
                                <Group gap="xs">
                                    <Box bg="black" c="white" p={4}><IconRefresh size={20} /></Box>
                                    <Text fw={700} tt="uppercase" c="dimmed">Wrong Answer Retry</Text>
                                </Group>
                                <Title order={1} style={{ fontSize: '2.5rem', fontWeight: 900 }}>Retry: {currentIndex + 1} / {words.length}</Title>
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
                                <Text size="3.5rem" fw={900} ta="center">{currentWord.korean}</Text>
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
                                {isAnswered && !results[results.length - 1] && (
                                    <Text c="red" fw={700} size="xl">Answer: {currentWord.english}</Text>
                                )}

                                {!isAnswered && (
                                    <Button onClick={() => handleSubmit()} color="black" size="lg" fullWidth>Submit</Button>
                                )}
                            </Stack>
                        </Paper>
                    </Stack>
                </Container>
            </Box>
        </StudentLayout>
    );
}

export default function WrongRetryPage() {
    return (
        <Suspense fallback={
            <StudentLayout>
                <Center h="100vh">
                    <Loader />
                </Center>
            </StudentLayout>
        }>
            <WrongRetryContent />
        </Suspense>
    );
}
