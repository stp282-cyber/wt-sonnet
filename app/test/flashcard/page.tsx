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
import { IconVolume, IconCards, IconBulb, IconClock, IconCheck, IconX, IconKeyboard, IconAlertTriangle, IconArrowRight } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import StudentLayout from '@/app/student/layout';

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
            <style jsx global>{`
                .flashcard-wrapper {
                    perspective: 1000px;
                }
                .flashcard-item {
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    transform: translateY(0) scale(1);
                    box-shadow: 6px 6px 0px black;
                }
                .flashcard-item:hover {
                    transform: translateY(-8px) scale(1.02);
                    box-shadow: 12px 12px 0px #FFD93D !important; /* Yellow shadow */
                    border-color: black;
                    z-index: 10;
                }
                .flashcard-clicking {
                    animation: popRotate 0.4s ease forwards;
                }
                @keyframes popRotate {
                    0% { transform: scale(1); }
                    40% { transform: scale(1.05) rotate(2deg); box-shadow: 14px 14px 0px #FF6B6B !important; } /* Red accent on click */
                    100% { transform: scale(1); }
                }
            `}</style>
            <Paper
                p="xl"
                className={`flashcard-item ${isClicked ? "flashcard-clicking" : ""}`}
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
                    // Removed inline boxShadow to let CSS handle it
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
                        <Text size="xs" fw={700} tt="uppercase" style={{ letterSpacing: '1px' }}>Click to Listen</Text>
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

    return (
        <Box
            style={{
                minHeight: '100%',
                background: 'transparent',
                padding: '40px 20px',
                position: 'relative',
            }}
        >
            <Container size={1200}>
                <div className="animate-fade-in">
                    <Stack gap="xl">
                        {/* Header */}
                        <Group justify="space-between" align="center" mb="lg">
                            <Box>
                                <Paper
                                    p="xs"
                                    style={{
                                        background: '#FFD93D',
                                        border: '3px solid black',
                                        display: 'inline-block',
                                        boxShadow: '4px 4px 0px black',
                                        marginBottom: '10px'
                                    }}
                                >
                                    <Group gap={8}>
                                        <IconCards color="black" size={20} stroke={3} />
                                        <Text c="black" fw={900} tt="uppercase" size="sm">Flashcard Mode</Text>
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
                                    Word<br />
                                    <span style={{ color: '#FFD93D' }}>Practice</span>
                                </Title>
                            </Box>

                            <Box ta="right">
                                <Text fw={700} size="xl" c="white">{words.length} Words</Text>
                                <Text c="dimmed" size="sm" fw={600} style={{ color: '#94a3b8' }}>Review carefully before testing!</Text>
                            </Box>
                        </Group>

                        {/* Grid */}
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

                        {/* Footer - Start Button */}
                        <Center mt={40} mb={60}>
                            <button
                                onClick={handleStartTest}
                                style={{
                                    background: '#FFD93D',
                                    color: 'black',
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
                                    boxShadow: '8px 8px 0px #FFD93D',
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
                        </Center>
                    </Stack>
                </div>
            </Container>
        </Box>
    );
}

export default function FlashcardPage() {
    return (
        <Suspense fallback={
            <Center style={{ minHeight: '100vh', background: 'transparent' }}>
                <Stack align="center" gap="md">
                    <Loader size="xl" color="yellow" type="dots" />
                </Stack>
            </Center>
        }>
            <StudentLayout>
                <FlashcardContent />
            </StudentLayout>
        </Suspense>
    );
}
