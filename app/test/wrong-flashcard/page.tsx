'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Container,
    Title,
    Paper,
    Text,
    Box,
    Group,
    SimpleGrid,
    Loader,
    Center,
    Stack,
    Badge,
} from '@mantine/core';
import { IconVolume, IconArrowRight, IconCards, IconBulb, IconRefresh } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import StudentLayout from '../../student/layout';

interface Word {
    no: number;
    english: string;
    korean: string;
}

// 개별 플래시카드 컴포넌트 (동일한 디자인 재사용)
function FlashcardItem({ word, index, onSpeak }: { word: Word; index: number; onSpeak: (text: string) => void }) {
    const [isClicked, setIsClicked] = useState(false);

    const handleClick = () => {
        if (!isClicked) {
            setIsClicked(true);
            onSpeak(word.english);
            setTimeout(() => setIsClicked(false), 400); // 400ms after animation
        } else {
            onSpeak(word.english);
        }
    };

    return (
        <Box
            style={{
                animation: `fadeInUp 0.5s ease-out forwards ${index * 0.1}s`,
                opacity: 0,
                transform: 'translateY(20px)',
            }}
        >
            <Paper
                p="xl"
                className={isClicked ? "card-clicking" : "card-interactive"}
                style={{
                    border: '3px solid black',
                    borderRadius: '0px',
                    background: 'white',
                    minHeight: '220px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    borderLeft: '8px solid #FF6B6B' // 오답 표시를 위한 빨간색 포인트
                }}
                onClick={handleClick}
            >
                <Badge
                    size="lg"
                    variant="filled"
                    color="red"
                    radius="xs"
                    style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        borderRadius: '0px',
                        fontWeight: 700,
                        border: '2px solid black',
                        color: 'white'
                    }}
                >
                    Wrong #{word.no}
                </Badge>

                <Stack align="center" gap="md" style={{ width: '100%' }}>
                    {/* 영어 단어 */}
                    <Text
                        size="2.2rem"
                        fw={900}
                        ta="center"
                        style={{
                            color: 'black',
                            lineHeight: 1.2,
                            letterSpacing: '-1px'
                        }}
                    >
                        {word.english}
                    </Text>

                    <Box style={{ width: '50px', height: '5px', background: '#FF6B6B', border: '1px solid black' }} />

                    {/* 한글 뜻 */}
                    <Text
                        size="1.6rem"
                        fw={600}
                        ta="center"
                        style={{ color: '#343a40' }}
                    >
                        {word.korean}
                    </Text>

                    {/* 듣기 아이콘 */}
                    <Group gap={6} style={{ marginTop: '0.8rem', opacity: 0.5 }}>
                        <IconVolume size={20} />
                        <Text size="xs" fw={700} tt="uppercase" style={{ letterSpacing: '1px' }}>Click to Listen</Text>
                    </Group>
                </Stack>
            </Paper>
        </Box>
    );
}

function WrongFlashcardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [words, setWords] = useState<Word[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initTest = async () => {
            const isResume = searchParams.get('resume') === 'true';

            try {
                const studentInfoStr = localStorage.getItem('user');
                if (studentInfoStr) {
                    const studentInfo = JSON.parse(studentInfoStr);
                    const res = await fetch(`/api/test/session?studentId=${studentInfo.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        // Support both legacy and new structure
                        if (data.session) {
                            const sData = data.session.session_data;
                            // If step is WRONG_FLASHCARD or similar re-entry
                            const mode = searchParams.get('mode');
                            // Determine which words to show
                            if (mode === 'review_wrong' && sData.reviewWrongQuestions && sData.reviewWrongQuestions.length > 0) {
                                setWords(sData.reviewWrongQuestions);
                            } else if (sData.wrongWords) {
                                setWords(sData.wrongWords || []);
                            }
                            // If resuming from Review Wrong Flashcard? (If we add that step later)
                            // For now assuming only Basic -> Wrong Flashcard
                        }
                    }
                }
            } catch (e) {
                console.error("Session load failed", e);
            }
            // Fallback to localStorage logic if session fails or empty?
            // Existing logic handles localStorage fallbacks below
            setLoading(false);
        };
        initTest();
    }, [router, searchParams]);

    // TTS 음성 재생
    const speakWord = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleStartRetryTest = async () => {
        // Handle Test Type
        const testType = searchParams.get('testType');
        const mode = searchParams.get('mode') || 'basic';

        const params = new URLSearchParams();
        params.set('mode', mode);
        params.set('resume', 'true'); // Add resume flag

        const preserveParams = ['itemId', 'start', 'end', 'curriculumId', 'curriculumItemId', 'scheduledDate'];
        preserveParams.forEach(key => {
            const val = searchParams.get(key);
            if (val) params.set(key, val);
        });

        // Update Session Step
        const studentInfoStr = localStorage.getItem('user');
        if (studentInfoStr) {
            const studentInfo = JSON.parse(studentInfoStr);
            const r = await fetch(`/api/test/session?studentId=${studentInfo.id}`);
            const d = await r.json();
            const sData = d.session?.session_data || {};

            let nextStep = mode === 'basic' ? 'BASIC_WRONG_RETRY' : 'REVIEW_WRONG_RETRY';
            // Custom Logic for Scramble
            if (testType === 'scramble') {
                nextStep = 'SCRAMBLE_RETRY';
            }

            // [NEW] Shuffle Function
            const shuffle = (array: any[]) => array.sort(() => Math.random() - 0.5);

            // Prepare updated data with shuffled words
            const updatedSessionData: any = { ...sData, step: nextStep };

            if (mode === 'review_wrong' && sData.reviewWrongQuestions) {
                updatedSessionData.reviewWrongQuestions = shuffle([...sData.reviewWrongQuestions]);
            } else if (sData.wrongWords) {
                updatedSessionData.wrongWords = shuffle([...sData.wrongWords]);
            }

            await fetch('/api/test/session', {
                method: 'POST',
                body: JSON.stringify({
                    studentId: studentInfo.id,
                    sessionData: updatedSessionData
                })
            });
        }

        if (testType === 'scramble') {
            router.push(`/test/scramble?${params.toString()}`);
        } else {
            router.push(`/test/wrong-retry?${params.toString()}`);
        }
    };

    if (loading) {
        return (
            <StudentLayout>
                <Center style={{ minHeight: '100vh', background: '#fff' }}>
                    <Stack align="center" gap="md">
                        <Loader size="xl" color="red" type="dots" />
                    </Stack>
                </Center>
            </StudentLayout>
        );
    }

    if (words.length === 0) {
        return (
            <StudentLayout>
                <Center style={{ minHeight: '100vh', background: '#fff' }}>
                    <Stack align="center" gap="lg">
                        <IconVolume size={48} color="#FFD93D" style={{ opacity: 0.5 }} />
                        <Title order={2}>잠시만요!</Title>
                        <Text size="lg" c="dimmed" ta="center">
                            복습할 오답 단어가 발견되지 않았습니다.<br />
                            데이터가 이미 처리되었거나 누락되었을 수 있습니다.
                        </Text>

                        <button
                            onClick={async () => {
                                try {
                                    const studentInfoStr = localStorage.getItem('user');
                                    if (studentInfoStr) {
                                        const studentInfo = JSON.parse(studentInfoStr);
                                        // Force Complete Logic
                                        await fetch('/api/study-logs', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                student_id: studentInfo.id,
                                                curriculum_id: searchParams.get('curriculumId'),
                                                curriculum_item_id: searchParams.get('curriculumItemId'),
                                                scheduled_date: searchParams.get('scheduledDate') || new Date().toISOString().split('T')[0],
                                                status: 'completed',
                                                test_phase: 'review_completed_empty',
                                                score: 100, // Score maintenance
                                                wrong_answers: []
                                            })
                                        });
                                        // Clear Session
                                        await fetch(`/api/test/session?studentId=${studentInfo.id}`, { method: 'DELETE' });

                                        notifications.show({
                                            title: '학습 완료',
                                            message: '오류가 있는 상태를 정리하고 학습을 완료 처리했습니다.',
                                            color: 'green'
                                        });
                                    }
                                } catch (e) {
                                    console.error("Force complete failed", e);
                                }
                                router.push('/student/learning');
                            }}
                            style={{
                                padding: '1rem 3rem',
                                background: 'black',
                                color: '#FFD93D',
                                fontWeight: 900,
                                border: '3px solid black',
                                cursor: 'pointer',
                                fontSize: '1.2rem',
                                boxShadow: '6px 6px 0px 0px rgba(0,0,0,0.2)'
                            }}
                        >
                            학습 완료 처리하고 나가기
                        </button>
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
                {/* CSS Animation Keyframes & Classes */}
                <style jsx global>{`
                    @keyframes fadeInUp {
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    @keyframes popRotate {
                        0% { transform: scale(1) rotate(0deg); }
                        40% { transform: scale(1.05) rotate(2deg); box-shadow: 12px 12px 0px rgba(0,0,0,0.8); }
                        80% { transform: scale(0.98) rotate(-1deg); }
                        100% { transform: scale(1) rotate(0deg); }
                    }

                    .card-interactive {
                        transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                        box-shadow: 6px 6px 0px black;
                        transform: translate(0, 0);
                    }
                    .card-interactive:hover {
                        transform: translate(-4px, -4px);
                        box-shadow: 10px 10px 0px black;
                    }
                    .card-interactive:active {
                        transform: translate(2px, 2px);
                         box-shadow: 4px 4px 0px black;
                    }

                    .card-clicking {
                        animation: popRotate 0.4s ease forwards;
                        box-shadow: 10px 10px 0px black;
                        z-index: 10; 
                        border-color: #FF6B6B;
                    }
                `}</style>

                <Container size={1200}>
                    <Stack gap="xl">
                        {/* Header Section */}
                        <Group justify="space-between" align="center" mb="lg">
                            <Box>
                                <Paper
                                    p="xs"
                                    style={{
                                        background: '#FF6B6B',
                                        border: '3px solid black',
                                        display: 'inline-block',
                                        boxShadow: '4px 4px 0px black',
                                        marginBottom: '10px'
                                    }}
                                >
                                    <Group gap={8}>
                                        <IconRefresh color="white" size={20} stroke={3} />
                                        <Text c="white" fw={900} tt="uppercase" size="sm">Review Required</Text>
                                    </Group>
                                </Paper>
                                <Title
                                    order={1}
                                    style={{
                                        fontSize: '3rem',
                                        fontWeight: 900,
                                        letterSpacing: '-2px',
                                        lineHeight: 1,
                                        color: 'white'
                                    }}
                                >
                                    Wrong Answer<br />
                                    <span style={{ color: '#FF6B6B' }}>Practice</span>
                                </Title>
                            </Box>

                            <Box ta="right">
                                <Text fw={700} size="xl" c="white">{words.length} Words</Text>
                                <Text c="dimmed" size="sm" fw={600} style={{ color: '#94a3b8' }}>Keep going until you master them!</Text>
                            </Box>
                        </Group>

                        {/* Grid Layout for Cards */}
                        <SimpleGrid
                            cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
                            spacing="lg"
                            verticalSpacing="lg"
                        >
                            {words.map((word, index) => (
                                <FlashcardItem
                                    key={word.no}
                                    word={word}
                                    index={index}
                                    onSpeak={speakWord}
                                />
                            ))}
                        </SimpleGrid>

                        {/* Footer / Action Button */}
                        <Center mt={40} mb={60}>
                            <button
                                onClick={handleStartRetryTest}
                                style={{
                                    background: 'black',
                                    color: '#FF6B6B',
                                    border: '4px solid black',
                                    padding: '1.5rem 4rem',
                                    fontSize: '1.5rem',
                                    fontWeight: 900,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: '8px 8px 0px #FF6B6B',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translate(-4px, -4px)';
                                    e.currentTarget.style.boxShadow = '12px 12px 0px #FF6B6B';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translate(0, 0)';
                                    e.currentTarget.style.boxShadow = '8px 8px 0px #FF6B6B';
                                }}
                            >
                                <IconRefresh size={32} stroke={3} />
                                START RETRY TEST
                            </button>
                        </Center>
                    </Stack>
                </Container>
            </Box>
        </StudentLayout>
    );
}

export default function WrongFlashcardPage() {
    return (
        <Suspense fallback={
            <StudentLayout>
                <Center style={{ minHeight: '100vh', background: '#fff' }}>
                    <Stack align="center" gap="md">
                        <Loader size="xl" color="red" type="dots" />
                    </Stack>
                </Center>
            </StudentLayout>
        }>
            <WrongFlashcardContent />
        </Suspense>
    );
}
