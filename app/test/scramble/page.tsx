'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Title, Paper, Text, Box, Group, Progress, Badge, Stack } from '@mantine/core';
import { IconClock, IconCheck, IconX, IconGripVertical } from '@tabler/icons-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import StudentLayout from '../../student/layout';

interface Word {
    no: number;
    english: string;
    korean: string;
}

export default function ScrambleTestPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [words, setWords] = useState<Word[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [scrambledWords, setScrambledWords] = useState<string[]>([]);
    const [isAnswered, setIsAnswered] = useState(false);
    const [results, setResults] = useState<boolean[]>([]);
    const [timeLeft, setTimeLeft] = useState(30);
    const [loading, setLoading] = useState(true);

    const correctCount = results.filter((r) => r).length;
    const wrongCount = results.filter((r) => !r).length;
    const progress = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;

    // Hardcoded Fallback Words
    const defaultWords: Word[] = [
        { no: 1, english: 'I love learning English', korean: '나는 영어 배우는 것을 좋아한다' },
        { no: 2, english: 'She goes to school every day', korean: '그녀는 매일 학교에 간다' },
        { no: 3, english: 'We are studying together', korean: '우리는 함께 공부하고 있다' },
        { no: 4, english: 'He likes playing soccer', korean: '그는 축구하는 것을 좋아한다' },
        { no: 5, english: 'They will visit the museum', korean: '그들은 박물관을 방문할 것이다' },
    ];

    // Initialization
    useEffect(() => {
        const init = async () => {
            const mode = searchParams.get('mode');
            const isResume = searchParams.get('resume') === 'true';

            let targetWords = defaultWords;

            try {
                const studentInfoStr = localStorage.getItem('user');
                if (studentInfoStr) {
                    const studentInfo = JSON.parse(studentInfoStr);
                    const res = await fetch(`/api/test/session?studentId=${studentInfo.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.session) {
                            const sData = data.session.session_data;

                            // If Retrying Scramble
                            if (mode === 'retry' && sData.wrongWords) {
                                targetWords = sData.wrongWords;
                            }
                            // If Resuming Scramble (General)
                            else if (sData.type === 'scramble' && isResume) {
                                targetWords = sData.words || defaultWords;
                                setCurrentIndex(sData.currentIndex || 0);
                                setResults(sData.results || []);
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("Session load error", e);
            }

            setWords(targetWords);
            setLoading(false);
        };
        init();
    }, [searchParams]);

    // 문장을 단어로 섞기
    useEffect(() => {
        if (words.length > 0 && words[currentIndex]) {
            const sentence = words[currentIndex].english;
            const wordsArray = sentence.split(' ');
            const shuffled = [...wordsArray].sort(() => Math.random() - 0.5);
            setScrambledWords(shuffled);
        }
    }, [currentIndex, words]);

    // 타이머
    useEffect(() => {
        if (!loading && timeLeft > 0 && !isAnswered && words.length > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !isAnswered) {
            handleSubmit(true);
        }
    }, [timeLeft, isAnswered, words, loading]);

    const handleDragEnd = (result: any) => {
        if (!result.destination || isAnswered) return;

        const items = Array.from(scrambledWords);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setScrambledWords(items);
    };

    const saveSession = async (idx: number, currentResults: boolean[]) => {
        try {
            const studentInfoStr = localStorage.getItem('user');
            if (!studentInfoStr) return;
            const studentInfo = JSON.parse(studentInfoStr);

            await fetch('/api/test/session', {
                method: 'POST',
                body: JSON.stringify({
                    studentId: studentInfo.id,
                    sessionData: {
                        type: 'scramble',
                        words,
                        currentIndex: idx,
                        results: currentResults,
                        // Preserve context
                        itemId: searchParams.get('itemId'),
                        curriculumId: searchParams.get('curriculumId'),
                        scheduledDate: searchParams.get('scheduledDate')
                    }
                })
            });
        } catch (e) {
            console.error("Save session failed", e);
        }
    };

    const handleSubmit = (timeout: boolean) => {
        if (!words[currentIndex]) return;

        const userAnswer = scrambledWords.join(' ');
        const correctAnswer = words[currentIndex].english;
        const isCorrect = userAnswer === correctAnswer;

        const newResults = [...results, isCorrect];
        setResults(newResults);
        setIsAnswered(true);

        saveSession(currentIndex + 1, newResults);

        setTimeout(() => {
            if (currentIndex < words.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setTimeLeft(30);
                setIsAnswered(false);
            } else {
                finishTest(newResults);
            }
        }, 1500);
    };

    const finishTest = async (finalResults: boolean[]) => {
        const studentInfoStr = localStorage.getItem('user');
        if (!studentInfoStr) return;
        const studentInfo = JSON.parse(studentInfoStr);

        const finalCorrectCount = finalResults.filter(r => r).length;
        const wrongWords = words.filter((_, i) => !finalResults[i]);
        const score = Math.round((finalCorrectCount / words.length) * 100);

        // Save Result to LocalStorage (Legacy support)
        const testResult = {
            totalQuestions: words.length,
            correctCount: finalCorrectCount,
            wrongCount: words.length - finalCorrectCount,
            score,
            passed: score >= 80,
            wrongWords: wrongWords,
            timestamp: new Date().toISOString(),
            testType: 'scramble'
        };
        localStorage.setItem('testResult', JSON.stringify(testResult));

        // Recursive Retry Logic
        if (wrongWords.length > 0) {
            // Update Session for Flashcard -> Retry Loop
            await fetch('/api/test/session', {
                method: 'POST',
                body: JSON.stringify({
                    studentId: studentInfo.id,
                    sessionData: {
                        type: 'scramble', // Keep type
                        step: 'WRONG_FLASHCARD', // Set step
                        wrongWords: wrongWords,
                        // Context
                        itemId: searchParams.get('itemId'),
                        curriculumId: searchParams.get('curriculumId'),
                        scheduledDate: searchParams.get('scheduledDate')
                    }
                })
            });

            // Redirect to Wrong Flashcard with testType param
            const params = new URLSearchParams(searchParams.toString());
            params.set('testType', 'scramble');
            params.set('mode', 'retry');
            router.push(`/test/wrong-flashcard?${params.toString()}`);
        } else {
            // Success - Go to Result
            // Clear session or mark complete? 
            // Usually Result page handles finalization or user clicks "Done".
            // Since Scramble is standalone-ish, let's just go to result.
            // But if we want to clear session:
            await fetch(`/api/test/session?studentId=${studentInfo.id}`, { method: 'DELETE' });
            router.push('/test/result');
        }
    };

    if (loading) {
        return (
            <StudentLayout>
                <Container size="sm" py={40}><Text>로딩 중...</Text></Container>
            </StudentLayout>
        );
    }

    if (words.length === 0) {
        return (
            <Container size="sm" py={40}>
                <Text>문제를 불러오는 중...</Text>
            </Container>
        );
    }

    const currentWord = words[currentIndex];

    return (
        <StudentLayout>
            <Box
                style={{
                    minHeight: '100%',
                    background: 'transparent',
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
                                🔀 문장 섞기 시험
                            </Title>
                            <Text
                                size="xl"
                                style={{
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '2px 2px 0px rgba(0, 0, 0, 0.2)',
                                }}
                            >
                                단어를 드래그하여 올바른 순서로 배열하세요!
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
                                    {currentIndex + 1} / {words.length}
                                </Text>
                            </Group>
                            <Progress
                                value={progress}
                                size="xl"
                                radius="xl"
                                styles={{
                                    root: { border: '3px solid black' },
                                    section: { background: 'linear-gradient(90deg, #FA8BFF 0%, #2BD2FF 100%)' },
                                }}
                            />
                        </Paper>

                        {/* 한글 문장 */}
                        <Paper
                            p="xl"
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
                                color="violet"
                                style={{
                                    border: '3px solid black',
                                    fontSize: '1.2rem',
                                    padding: '1rem 2rem',
                                    marginBottom: '1rem',
                                }}
                            >
                                문제 {currentWord.no}
                            </Badge>

                            <Text
                                size="3rem"
                                fw={900}
                                style={{
                                    color: '#7950f2',
                                }}
                            >
                                {currentWord.korean}
                            </Text>
                        </Paper>

                        {/* 드래그 앤 드롭 영역 */}
                        <Paper
                            p="xl"
                            style={{
                                border: '6px solid black',
                                borderRadius: '20px',
                                background: isAnswered
                                    ? results[results.length - 1]
                                        ? '#d3f9d8'
                                        : '#ffe3e3'
                                    : 'white',
                                boxShadow: '12px 12px 0px 0px rgba(0, 0, 0, 1)',
                                minHeight: '200px',
                            }}
                        >
                            <DragDropContext onDragEnd={handleDragEnd}>
                                <Droppable droppableId="words">
                                    {(provided) => (
                                        <Stack
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            gap="sm"
                                        >
                                            {scrambledWords.map((word, index) => (
                                                <Draggable
                                                    key={`${word}-${index}`}
                                                    draggableId={`${word}-${index}`}
                                                    index={index}
                                                    isDragDisabled={isAnswered}
                                                >
                                                    {(provided, snapshot) => (
                                                        <Paper
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            p="md"
                                                            style={{
                                                                ...provided.draggableProps.style,
                                                                border: '4px solid black',
                                                                background: snapshot.isDragging ? '#FFD93D' : 'white',
                                                                cursor: isAnswered ? 'not-allowed' : 'grab',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '1rem',
                                                            }}
                                                        >
                                                            <IconGripVertical size={24} />
                                                            <Text size="xl" fw={700}>
                                                                {word}
                                                            </Text>
                                                        </Paper>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </Stack>
                                    )}
                                </Droppable>
                            </DragDropContext>

                            {isAnswered && (
                                <Box mt="xl" style={{ textAlign: 'center' }}>
                                    <Text fw={900} size="xl" c={results[results.length - 1] ? 'green' : 'red'}>
                                        {results[results.length - 1] ? '✅ 정답!' : '❌ 오답!'}
                                    </Text>
                                    {!results[results.length - 1] && (
                                        <Text fw={700} size="lg" mt="xs">
                                            정답: {currentWord.english}
                                        </Text>
                                    )}
                                </Box>
                            )}

                            {!isAnswered && (
                                <button
                                    onClick={() => handleSubmit(false)}
                                    style={{
                                        background: '#7950f2',
                                        color: 'white',
                                        border: '4px solid black',
                                        borderRadius: '12px',
                                        boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                                        fontSize: '1.2rem',
                                        fontWeight: 900,
                                        padding: '1rem 2rem',
                                        cursor: 'pointer',
                                        width: '100%',
                                        marginTop: '1rem',
                                    }}
                                >
                                    제출하기
                                </button>
                            )}
                        </Paper>
                    </div>
                </Container>
            </Box>
        </StudentLayout>
    );
}
