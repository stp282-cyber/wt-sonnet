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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconClock, IconCheck, IconX, IconKeyboard, IconAlertTriangle, IconArrowRight } from '@tabler/icons-react';
import StudentLayout from '../../student/layout';

interface Word {
    no: number;
    english: string;
    korean: string;
}

import { normalizeAnswer } from '@/lib/stringUtils';

function TypingTestContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [results, setResults] = useState<boolean[]>([]);
    const [timeLeft, setTimeLeft] = useState(40);
    const [isAnswered, setIsAnswered] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [words, setWords] = useState<Word[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial Fetch & Resume Logic
    useEffect(() => {
        const initTest = async () => {
            const itemId = searchParams.get('itemId');
            const startStr = searchParams.get('start');
            const endStr = searchParams.get('end');
            const isResume = searchParams.get('resume') === 'true';

            // Check for Resume first
            if (isResume) {
                try {
                    const studentInfoStr = localStorage.getItem('user');
                    if (studentInfoStr) {
                        const studentInfo = JSON.parse(studentInfoStr);
                        const res = await fetch(`/api/test/session?studentId=${studentInfo.id}`);
                        if (res.ok) {
                            const data = await res.json();
                            if (data.session && data.session.session_data.type === 'typing_test') {
                                const sData = data.session.session_data;
                                setWords(sData.words);
                                setCurrentIndex(sData.currentIndex);
                                setResults(sData.results);
                                setLoading(false);
                                notifications.show({ title: 'Resumed', message: 'Test resumed from last save.', color: 'blue' });
                                return;
                            }
                        }
                    }
                } catch (e) {
                    console.error("Resume failed", e);
                }
            }

            // Normal Start
            if (!itemId || !startStr || !endStr) {
                // If parameters missing and not resumed successfully (or not requested)
                if (!isResume) {
                    notifications.show({ title: '오류', message: '시험 정보를 찾을 수 없습니다.', color: 'red' });
                    setLoading(false);
                    return;
                }
            }

            try {
                if (itemId && startStr && endStr) {
                    const start = parseInt(startStr, 10);
                    const end = parseInt(endStr, 10);
                    const res = await fetch(`/api/wordbooks/${itemId}`);
                    if (!res.ok) throw new Error('Failed to fetch wordbook');
                    const data = await res.json();

                    const allWords: Word[] = data.wordbook.words || [];
                    let targetWords = allWords.slice(start - 1, end);

                    // Shuffle the words
                    targetWords = targetWords.sort(() => Math.random() - 0.5);

                    if (targetWords.length === 0) {
                        notifications.show({ title: '알림', message: '해당 범위에 단어가 없습니다.', color: 'orange' });
                    }
                    setWords(targetWords);
                }
            } catch (error) {
                console.error(error);
                notifications.show({ title: '오류', message: '단어 목록을 불러오는데 실패했습니다.', color: 'red' });
            } finally {
                setLoading(false);
            }
        };
        initTest();
    }, [searchParams]);

    // Save Session Helper
    const saveProgress = async (idx: number, currentResults: boolean[]) => {
        try {
            const studentInfoStr = localStorage.getItem('user');
            if (!studentInfoStr) return;
            const studentInfo = JSON.parse(studentInfoStr);

            const sessionData = {
                type: 'typing_test',
                words: words,
                itemId: searchParams.get('itemId'),
                start: searchParams.get('start'),
                end: searchParams.get('end'),
                currentIndex: idx,
                results: currentResults,
                studentInfo: studentInfo,
                curriculumId: searchParams.get('curriculumId'),
                curriculumItemId: searchParams.get('curriculumItemId'),
                scheduledDate: searchParams.get('scheduledDate') // Persist Date
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

    const currentWord = words[currentIndex];
    const correctCount = results.filter((r) => r).length;
    const wrongCount = results.filter((r) => !r).length;

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
                title: '경고',
                message: '시험 중에는 복사/붙여넣기 및 우클릭이 금지됩니다.',
                color: 'red',
                autoClose: 2000,
            });
        };
        window.addEventListener('copy', preventAction);
        window.addEventListener('cut', preventAction);
        window.addEventListener('paste', preventAction);
        window.addEventListener('contextmenu', preventAction);
        return () => {
            window.removeEventListener('copy', preventAction);
            window.removeEventListener('cut', preventAction);
            window.removeEventListener('paste', preventAction);
            window.removeEventListener('contextmenu', preventAction);
        };
    }, []);

    const handleSubmit = (timeout = false) => {
        if (!currentWord) return;

        const normalizedUser = normalizeAnswer(userAnswer);
        const normalizedCorrect = normalizeAnswer(currentWord.english);
        const isCorrect = normalizedUser === normalizedCorrect;

        const newResults = [...results, isCorrect];
        setResults(newResults);
        setIsAnswered(true);

        // Sound Output
        if (isCorrect && !timeout) {
            // Optional: Correct sound
        } else if (!isCorrect || timeout) {
            // Optional: Wrong sound
        }

        if (timeout) {
            notifications.show({ title: '시간 초과', message: '다음 문제로 넘어갑니다.', color: 'orange' });
        }

        // Save Progress
        saveProgress(currentIndex + 1, newResults);

        // Dynamic Delay: 200ms for Correct, 1000ms for Wrong/Timeout
        const delay = (isCorrect && !timeout) ? 200 : 1000;

        setTimeout(() => {
            if (currentIndex < words.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setUserAnswer('');
                setTimeLeft(40);
                setIsAnswered(false);
                setTimeout(() => inputRef.current?.focus(), 50);
            } else {
                finishTest(newResults);
            }
        }, delay);
    };

    const finishTest = async (finalResults: boolean[]) => {
        const studentInfoStr = localStorage.getItem('user'); // Use 'user' key consistency
        if (!studentInfoStr) return;
        const studentInfo = JSON.parse(studentInfoStr);

        const finalCorrectCount = finalResults.filter(r => r).length;
        const finalWrongCount = finalResults.length - finalCorrectCount;
        const savedScore = Math.round((finalCorrectCount / words.length) * 100);
        const wrongWords = words.filter((_, index) => !finalResults[index]);

        // Params
        const itemId = searchParams.get('itemId');
        const start = searchParams.get('start');
        const end = searchParams.get('end');
        const curriculumId = searchParams.get('curriculumId');
        const curriculumItemId = searchParams.get('curriculumItemId');
        const scheduledDate = searchParams.get('scheduledDate');

        // Local Storage for Result Page
        const testResult = {
            totalQuestions: words.length,
            correctCount: finalCorrectCount,
            wrongCount: finalWrongCount,
            score: savedScore,
            passed: savedScore === 100,
            wrongWords: wrongWords,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('testResult', JSON.stringify(testResult));

        // Logic:
        // 1. If Wrongs > 0 -> Go to Result Page (Summary) -> Then to WRONG_FLASHCARD
        // 2. If Wrongs == 0 -> Go to REVIEW_TEST (Review Previous Days)

        let nextStep = '';
        let route = '';

        if (finalWrongCount > 0) {
            nextStep = 'WRONG_FLASHCARD';
            // Redirect to Intermediate Result Page first!
            route = `/test/result?itemId=${itemId}&start=${start}&end=${end}&curriculumId=${curriculumId}&curriculumItemId=${curriculumItemId}&mode=basic&nextStep=WRONG_FLASHCARD&scheduledDate=${scheduledDate}`;
        } else {
            nextStep = 'REVIEW_TEST';
            // Pass parameters to result page for progress-based review (including start for actual range)
            route = `/test/result?nextAction=check_review&scheduledDate=${scheduledDate}&curriculumItemId=${curriculumItemId}&itemId=${itemId}&start=${start}&end=${end}&curriculumId=${curriculumId}`;
        }

        const sessionData = {
            type: 'typing_test_finished',
            step: nextStep,
            basicResults: {
                score: savedScore,
                wrongWords: wrongWords,
                total: words.length
            },
            wrongWords: wrongWords,
            // Persist Params
            itemId, start, end, curriculumId, curriculumItemId, scheduledDate
        };

        await fetch('/api/test/session', {
            method: 'POST',
            body: JSON.stringify({
                studentId: studentInfo.id,
                sessionData
            })
        });

        // Also Save "Pending" Log if needed? 
        try {
            await fetch('/api/study-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: studentInfo.id,
                    curriculum_id: curriculumId,
                    curriculum_item_id: curriculumItemId,
                    scheduled_date: scheduledDate || new Date().toISOString().split('T')[0], // Use scheduled date
                    status: 'in_progress',
                    test_phase: nextStep,
                    score: savedScore, // Intermediate score
                    wrong_answers: wrongWords
                })
            });
        } catch (e) {
            console.error("Log save failed", e);
        }

        router.push(route);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isAnswered && userAnswer.trim()) {
            handleSubmit();
        }
    };

    // Auto focus
    useEffect(() => {
        if (!loading && !isAnswered) {
            inputRef.current?.focus();
        }
    }, [currentIndex, loading, isAnswered]);

    if (loading) {
        return (
            <StudentLayout>
                <Center style={{ minHeight: '100vh', background: '#fff' }}>
                    <Loader size="xl" color="dark" type="dots" />
                </Center>
            </StudentLayout>
        );
    }

    if (words.length === 0) {
        return (
            <StudentLayout>
                <Center style={{ minHeight: '100vh', background: '#fff' }}>
                    <Stack align="center">
                        <Text size="lg" fw={700}>시험볼 단어가 없습니다.</Text>
                        <button onClick={() => router.back()} style={{
                            padding: '0.8rem 2rem', background: 'black', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700
                        }}>돌아가기</button>
                    </Stack>
                </Center>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <Box
                style={{
                    minHeight: '100%',
                    background: 'transparent',
                    padding: '40px 20px',
                    position: 'relative',
                }}
            >
                <Container size={800}>
                    <div className="animate-fade-in">
                        {/* 헤더 */}
                        <Group justify="space-between" align="flex-end" mb={50}>
                            <Box>
                                <Group gap="sm" mb="xs">
                                    <Box p={4} bg="#FFD93D" c="black" style={{ border: '2px solid black' }}>
                                        <IconKeyboard size={20} stroke={2} />
                                    </Box>
                                    <Text fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '1px', color: '#94a3b8' }}>Typing Test</Text>
                                </Group>
                                <Title
                                    order={1}
                                    style={{
                                        color: 'white',
                                        fontWeight: 900,
                                        fontSize: '3rem',
                                        letterSpacing: '-1px',
                                        lineHeight: 1
                                    }}
                                >

                                    Spelling Check
                                </Title>
                            </Box>

                            <Group gap="xl">
                                <Box style={{ textAlign: 'right' }}>
                                    <Text size="xs" fw={700} c="dimmed" tt="uppercase">Progress</Text>
                                    <Text size="xl" fw={900} c="white">{currentIndex + 1} / {words.length}</Text>
                                </Box>
                                <RingProgress
                                    size={60}
                                    thickness={6}
                                    roundCaps
                                    sections={[{ value: ((currentIndex + 1) / words.length) * 100, color: '#FFD93D' }]}
                                    label={
                                        <Text c="white" fw={700} ta="center" size="xs">
                                            {Math.round(((currentIndex + 1) / words.length) * 100)}%
                                        </Text>
                                    }
                                />
                            </Group>
                        </Group>

                        {/* 메인 문제 카드 */}
                        <Paper
                            p={50}
                            style={{
                                border: '3px solid black',
                                borderRadius: '0px',
                                background: isAnswered
                                    ? (results[results.length - 1] ? '#D3F9D8' : '#FFE3E3')
                                    : 'white',
                                boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
                                minHeight: '400px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                transition: 'background-color 0.3s ease'
                            }}
                        >
                            {/* Timer Badge */}
                            <Badge
                                size="xl"
                                variant="filled"
                                color={timeLeft <= 5 ? 'red' : 'dark'}
                                radius="xs"
                                leftSection={<IconClock size={16} />}
                                style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '20px',
                                    borderRadius: '0px',
                                    border: '2px solid black',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '1.2rem',
                                    height: 'auto',
                                    padding: '8px 16px'
                                }}
                            >
                                {timeLeft}s
                            </Badge>

                            <Stack align="center" gap="xl" style={{ width: '100%', maxWidth: '600px' }}>
                                <Box>
                                    <Text size="sm" ta="center" c="dimmed" fw={700} mb="xs" tt="uppercase">
                                        Translate to English
                                    </Text>
                                    <Text
                                        size="3.5rem"
                                        fw={900}
                                        ta="center"
                                        style={{
                                            color: 'black',
                                            lineHeight: 1.2,
                                            wordBreak: 'keep-all',
                                        }}
                                    >
                                        {currentWord.korean}
                                    </Text>
                                </Box>

                                <Box style={{ width: '100%', position: 'relative' }}>
                                    <TextInput
                                        ref={inputRef}
                                        value={userAnswer}
                                        onChange={(e) => setUserAnswer(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder={isAnswered ? '' : "Type the english word..."}
                                        size="xl"
                                        disabled={isAnswered}
                                        autoComplete="off"
                                        styles={{
                                            input: {
                                                border: '3px solid black',
                                                fontSize: '2rem',
                                                textAlign: 'center',
                                                fontWeight: 700,
                                                padding: '2.5rem',
                                                borderRadius: '0px',
                                                background: isAnswered ? 'transparent' : 'white', // 투명하게 해서 뒤 배경 보이게
                                                color: 'black',
                                                transition: 'all 0.2s',
                                                '&:focus': {
                                                    borderColor: '#FFD93D',
                                                }
                                            },
                                        }}
                                        style={{ width: '100%' }}
                                    />

                                    {/* 결과 피드백 오버레이 */}
                                    {isAnswered && (
                                        <Box
                                            style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                zIndex: 10,
                                                pointerEvents: 'none',
                                            }}
                                        >
                                            {results[results.length - 1] ? (
                                                <IconCheck size={60} color="#2b8a3e" stroke={4} />
                                            ) : (
                                                <IconX size={60} color="#c92a2a" stroke={4} />
                                            )}
                                        </Box>
                                    )}
                                </Box>

                                {/* 정답 및 피드백 */}
                                {isAnswered && !results[results.length - 1] && (
                                    <Box style={{ animation: 'fadeIn 0.3s ease' }}>
                                        <Text size="lg" fw={700} c="red" ta="center">
                                            정답: <span style={{ textDecoration: 'underline' }}>{currentWord.english}</span>
                                        </Text>
                                    </Box>
                                )}

                                {/* 제출 버튼 */}
                                {!isAnswered && (
                                    <button
                                        onClick={() => handleSubmit()}
                                        disabled={!userAnswer.trim()}
                                        style={{
                                            background: 'black',
                                            color: '#FFD93D',
                                            border: 'none',
                                            borderRadius: '0px',
                                            fontSize: '1.2rem',
                                            fontWeight: 900,
                                            padding: '1.2rem 4rem',
                                            cursor: userAnswer.trim() ? 'pointer' : 'not-allowed',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            transition: 'all 0.2s ease',
                                            opacity: userAnswer.trim() ? 1 : 0.5,
                                            boxShadow: userAnswer.trim() ? '6px 6px 0px #FFD93D' : 'none',
                                            marginTop: '1rem'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (userAnswer.trim()) {
                                                e.currentTarget.style.transform = 'translate(-2px, -2px)';
                                                e.currentTarget.style.boxShadow = '8px 8px 0px #FFD93D';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (userAnswer.trim()) {
                                                e.currentTarget.style.transform = 'translate(0px, 0px)';
                                                e.currentTarget.style.boxShadow = '6px 6px 0px #FFD93D';
                                            }
                                        }}
                                    >
                                        SUBMIT ANSWER
                                        <IconArrowRight size={20} stroke={3} />
                                    </button>
                                )}
                            </Stack>
                        </Paper>

                        {/* 하단 점수판 */}
                        <Group mt={40} justify="center" gap={30}>
                            <Paper p="md" style={{ border: '2px solid black', borderRadius: '0px', boxShadow: '4px 4px 0px #D3F9D8', background: 'white', minWidth: '150px' }}>
                                <Group justify="center" gap="xs">
                                    <IconCheck color="black" size={20} />
                                    <Text fw={700} size="sm" tt="uppercase" c="dimmed">Correct</Text>
                                </Group>
                                <Text fw={900} size="2rem" ta="center" c="#2b8a3e">{correctCount}</Text>
                            </Paper>
                            <Paper p="md" style={{ border: '2px solid black', borderRadius: '0px', boxShadow: '4px 4px 0px #FFE3E3', background: 'white', minWidth: '150px' }}>
                                <Group justify="center" gap="xs">
                                    <IconX color="black" size={20} />
                                    <Text fw={700} size="sm" tt="uppercase" c="dimmed">Wrong</Text>
                                </Group>
                                <Text fw={900} size="2rem" ta="center" c="#c92a2a">{wrongCount}</Text>
                            </Paper>
                        </Group>

                        {/* 경고 문구 */}
                        <Group justify="center" gap="xs" mt={40} style={{ opacity: 0.5 }}>
                            <IconAlertTriangle size={16} color="white" />
                            <Text size="xs" fw={600} c="white">Copying and Pasting is disabled during the test.</Text>
                        </Group>

                    </div>
                </Container>
            </Box >
        </StudentLayout >
    );
}

export default function TypingTestPage() {
    return (
        <Suspense fallback={
            <StudentLayout>
                <Center style={{ minHeight: '100vh', background: '#fff' }}>
                    <Loader size="xl" color="dark" type="dots" />
                </Center>
            </StudentLayout>
        }>
            <TypingTestContent />
        </Suspense>
    );
}
