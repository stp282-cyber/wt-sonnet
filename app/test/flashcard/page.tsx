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
import { IconVolume, IconArrowRight, IconCards, IconBulb } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import StudentLayout from '../../student/layout';

interface Word {
    no: number;
    english: string;
    korean: string;
}

// 개별 플래시카드 컴포넌트
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
                    // Shadow and Transform handled by CSS classes for interactions
                }}
                onClick={handleClick}
            >
                <Badge
                    size="lg"
                    variant="filled"
                    color="dark"
                    radius="xs"
                    style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        borderRadius: '0px',
                        fontWeight: 700,
                        border: '1px solid black', // Extra definition
                    }}
                >
                    {word.no}
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

                    <Box style={{ width: '50px', height: '5px', background: '#FFD93D', border: '1px solid black' }} />

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
                        <Text size="xs" fw={700} tt="uppercase" ls={1}>Click to Listen</Text>
                    </Group>
                </Stack>
            </Paper>
        </Box>
    );
}

// ... (FlashcardItem component remains unchanged)

function FlashcardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [words, setWords] = useState<Word[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWords = async () => {
            const itemId = searchParams.get('itemId');
            const startStr = searchParams.get('start');
            const endStr = searchParams.get('end');

            if (!itemId || !startStr || !endStr) {
                // Not showing notification here to avoid hydration mismatch or double render issues before load
                setLoading(false);
                return;
            }

            try {
                const start = parseInt(startStr, 10);
                const end = parseInt(endStr, 10);

                const res = await fetch(`/api/wordbooks/${itemId}`);
                if (!res.ok) throw new Error('Failed to fetch wordbook');
                const data = await res.json();

                const allWords: Word[] = data.wordbook.words || [];
                const targetWords = allWords.slice(start - 1, end);

                if (targetWords.length === 0) {
                    // Handle empty
                }

                setWords(targetWords);
            } catch (error) {
                console.error(error);
                notifications.show({
                    title: '오류',
                    message: '단어 목록을 불러오는데 실패했습니다.',
                    color: 'red'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchWords();
    }, [searchParams]);

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

    // 복사/붙여넣기 및 우클릭 방지
    useEffect(() => {
        const preventAction = (e: Event) => {
            e.preventDefault();
            notifications.show({
                title: '알림',
                message: '학습 중에는 복사/붙여넣기 및 우클릭을 할 수 없습니다.',
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

    const handleStartTest = () => {
        const params = new URLSearchParams(searchParams.toString());
        router.push(`/test/typing?${params.toString()}`);
    };

    if (loading) {
        return (
            <StudentLayout>
                <Center style={{ minHeight: '100vh', background: '#fff' }}>
                    <Stack align="center" gap="md">
                        <Loader size="xl" color="dark" type="dots" />
                    </Stack>
                </Center>
            </StudentLayout>
        );
    }

    if (words.length === 0) {
        return (
            <StudentLayout>
                <Center style={{ minHeight: '100vh', background: '#fff' }}>
                    <Stack align="center">
                        <Text size="lg" fw={700}>학습 정보를 찾을 수 없거나 단어가 없습니다.</Text>
                        <button onClick={() => router.back()} style={{
                            padding: '0.8rem 2rem',
                            background: 'black',
                            color: 'white',
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                        }}>
                            돌아가기
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
                    background: '#ffffff',
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
                        border-color: #FFD93D; /* Optional highlight */
                    }
                `}</style>

                <Container size={1200}>
                    <div className="animate-fade-in">
                        {/* 헤더 */}
                        <Group justify="space-between" align="flex-end" mb={50}>
                            <Box>
                                <Group gap="sm" mb="xs">
                                    <Box p={4} bg="black" c="white">
                                        <IconCards size={20} stroke={2} />
                                    </Box>
                                    <Text fw={700} tt="uppercase" ls={1} c="dimmed">Vocabulary / Flashcards</Text>
                                </Group>
                                <Title
                                    order={1}
                                    style={{
                                        color: 'black',
                                        fontWeight: 900,
                                        fontSize: '3rem',
                                        letterSpacing: '-1px',
                                        lineHeight: 1
                                    }}
                                >
                                    Word Study
                                </Title>
                            </Box>

                            <Box
                                style={{
                                    border: '2px solid black',
                                    padding: '12px 24px',
                                    background: '#FFD93D',
                                    fontWeight: 800,
                                    fontSize: '1.1rem',
                                    boxShadow: '4px 4px 0px black'
                                }}
                            >
                                Total {words.length} Words
                            </Box>
                        </Group>

                        {/* 그리드 레이아웃 (4열) */}
                        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="xl" verticalSpacing="xl">
                            {words.map((word, index) => (
                                <FlashcardItem key={word.no} word={word} index={index} onSpeak={speakWord} />
                            ))}
                        </SimpleGrid>

                        {/* 하단 팁 및 버튼 */}
                        <Stack align="center" mt={80} gap="xl">
                            <Group justify="center" gap="sm" c="dimmed">
                                <IconBulb size={18} />
                                <Text size="sm" fw={600}>
                                    Tip: Click on a card to hear the pronunciation.
                                </Text>
                            </Group>

                            <button
                                onClick={handleStartTest}
                                style={{
                                    background: 'black',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0px',
                                    fontSize: '1.2rem',
                                    fontWeight: 900,
                                    padding: '1.4rem 4.5rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '8px 8px 0px #FFD93D', // Yellow shadow
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translate(-2px, -2px)';
                                    e.currentTarget.style.boxShadow = '10px 10px 0px #FFD93D';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translate(0px, 0px)';
                                    e.currentTarget.style.boxShadow = '8px 8px 0px #FFD93D';
                                }}
                                onMouseDown={(e) => {
                                    e.currentTarget.style.transform = 'translate(2px, 2px)';
                                    e.currentTarget.style.boxShadow = '4px 4px 0px #FFD93D';
                                }}
                                onMouseUp={(e) => {
                                    e.currentTarget.style.transform = 'translate(-2px, -2px)';
                                    e.currentTarget.style.boxShadow = '10px 10px 0px #FFD93D';
                                }}
                            >
                                START TEST
                                <IconArrowRight size={20} stroke={3} />
                            </button>
                        </Stack>
                    </div>
                </Container>
            </Box>
        </StudentLayout>
    );
}

export default function FlashcardPage() {
    return (
        <Suspense fallback={
            <StudentLayout>
                <Center style={{ minHeight: '100vh', background: '#fff' }}>
                    <Stack align="center" gap="md">
                        <Loader size="xl" color="dark" type="dots" />
                    </Stack>
                </Center>
            </StudentLayout>
        }>
            <FlashcardContent />
        </Suspense>
    );
}
