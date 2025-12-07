'use client';

import { useState, useEffect } from 'react';
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
                        border: '1px solid black',
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
                        <Text size="xs" fw={700} tt="uppercase" ls={1}>Click to Listen</Text>
                    </Group>
                </Stack>
            </Paper>
        </Box>
    );
}

export default function WrongFlashcardPage() {
    const router = useRouter();
    const searchParams = useSearchParams(); // searchParams 추가
    const [words, setWords] = useState<Word[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // localStorage에서 오답 단어 로드
        const savedWrongWords = localStorage.getItem('wrongWords');
        if (savedWrongWords) {
            setWords(JSON.parse(savedWrongWords));
            setLoading(false);
        } else {
            // 데이터가 없으면 알림 후 뒤로가기? or 샘플 데이터?
            // 여기서는 안전하게 학습 메인으로 보내거나 알림 표시
            notifications.show({
                title: '알림',
                message: '복습할 오답 단어가 없습니다.',
                color: 'blue'
            });
            setLoading(false);
            // router.push('/student/learning'); // 선택적 리다이렉트
        }
    }, [router]);

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

    const handleStartRetryTest = () => {
        const nextAction = searchParams.get('nextAction');
        if (nextAction) {
            router.push(`/test/wrong-retry?nextAction=${nextAction}`);
        } else {
            router.push('/test/wrong-retry');
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
                    <Stack align="center">
                        <Text size="lg" fw={700}>복습할 오답 단어가 없습니다!</Text>
                        <button onClick={() => router.push('/student/learning')} style={{
                            padding: '0.8rem 2rem',
                            background: 'black',
                            color: 'white',
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                        }}>
                            학습 홈으로 이동
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
                                    }}
                                >
                                    Wrong Answer<br />
                                    <span style={{ color: '#FF6B6B' }}>Practice</span>
                                </Title>
                            </Box>

                            <Box ta="right">
                                <Text fw={700} size="xl">{words.length} Words</Text>
                                <Text c="dimmed" size="sm" fw={600}>Keep going until you master them!</Text>
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
