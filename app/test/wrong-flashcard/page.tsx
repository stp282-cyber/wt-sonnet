'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Title, Paper, Text, Box, Group, Badge, Progress } from '@mantine/core';
import { IconVolume, IconArrowRight } from '@tabler/icons-react';

interface Word {
    no: number;
    english: string;
    korean: string;
}

export default function WrongFlashcardPage() {
    const router = useRouter();
    const [words, setWords] = useState<Word[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        // localStorage에서 오답 단어 로드
        const savedWrongWords = localStorage.getItem('wrongWords');
        if (savedWrongWords) {
            setWords(JSON.parse(savedWrongWords));
        } else {
            // 테스트용 샘플 데이터
            const sampleWrongWords = [
                { no: 1, english: 'apple', korean: '사과' },
                { no: 3, english: 'orange', korean: '오렌지' },
                { no: 5, english: 'watermelon', korean: '수박' },
            ];
            setWords(sampleWrongWords);
            localStorage.setItem('wrongWords', JSON.stringify(sampleWrongWords));
        }
    }, [router]);

    useEffect(() => {
        // 카드가 바뀔 때마다 자동으로 영어 발음
        if (words.length > 0 && !isFlipped) {
            speakWord(words[currentIndex].english);
        }
    }, [currentIndex, words]);

    const speakWord = (word: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleNext = () => {
        if (currentIndex < words.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setIsFlipped(false);
        } else {
            // 모든 오답 복습 완료 → 오답 재시험으로 이동
            router.push('/test/wrong-retry');
        }
    };

    if (words.length === 0) {
        return (
            <Container size="sm" py={40}>
                <Text>오답 단어를 불러오는 중...</Text>
            </Container>
        );
    }

    const currentWord = words[currentIndex];
    const progress = ((currentIndex + 1) / words.length) * 100;

    return (
        <Box
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
            }}
        >
            <Container size={600}>
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
                            🔄 오답 복습
                        </Title>
                        <Text
                            size="xl"
                            style={{
                                color: 'white',
                                fontWeight: 600,
                                textShadow: '2px 2px 0px rgba(0, 0, 0, 0.2)',
                            }}
                        >
                            틀린 단어를 다시 학습하세요!
                        </Text>
                    </Box>

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
                                오답 복습 진행률
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
                                root: {
                                    border: '3px solid black',
                                },
                                section: {
                                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                                },
                            }}
                        />
                    </Paper>

                    {/* 플래시카드 */}
                    <Paper
                        p={60}
                        style={{
                            border: '6px solid black',
                            borderRadius: '20px',
                            background: isFlipped ? '#FFD93D' : 'white',
                            boxShadow: '12px 12px 0px 0px rgba(0, 0, 0, 1)',
                            minHeight: '400px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                        }}
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="animate-bounce-in"
                    >
                        <Badge
                            size="xl"
                            variant="filled"
                            color="red"
                            style={{
                                border: '3px solid black',
                                fontSize: '1.2rem',
                                padding: '1rem 2rem',
                                marginBottom: '2rem',
                            }}
                        >
                            오답 #{currentWord.no}
                        </Badge>

                        {!isFlipped ? (
                            // 앞면: 영어
                            <Box style={{ textAlign: 'center' }}>
                                <Text
                                    size="5rem"
                                    fw={900}
                                    style={{
                                        color: '#7950f2',
                                        marginBottom: '2rem',
                                    }}
                                >
                                    {currentWord.english}
                                </Text>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        speakWord(currentWord.english);
                                    }}
                                    style={{
                                        background: '#7950f2',
                                        color: 'white',
                                        border: '4px solid black',
                                        borderRadius: '50%',
                                        width: '80px',
                                        height: '80px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                                        margin: '0 auto',
                                    }}
                                >
                                    <IconVolume size={40} />
                                </button>
                            </Box>
                        ) : (
                            // 뒷면: 한글
                            <Text
                                size="5rem"
                                fw={900}
                                style={{
                                    color: 'black',
                                }}
                            >
                                {currentWord.korean}
                            </Text>
                        )}

                        <Text
                            size="lg"
                            c="dimmed"
                            mt="xl"
                            style={{
                                textAlign: 'center',
                            }}
                        >
                            {isFlipped ? '카드를 클릭하면 영어가 나와요' : '카드를 클릭하면 한글 뜻이 나와요'}
                        </Text>
                    </Paper>

                    {/* 다음 버튼 */}
                    <Group justify="center" mt={30}>
                        <button
                            onClick={handleNext}
                            style={{
                                background: '#FFD93D',
                                color: 'black',
                                border: '5px solid black',
                                borderRadius: '15px',
                                boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
                                fontSize: '1.5rem',
                                fontWeight: 900,
                                padding: '1.5rem 3rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                transition: 'all 0.15s ease',
                            }}
                            onMouseDown={(e) => {
                                e.currentTarget.style.transform = 'translate(8px, 8px)';
                                e.currentTarget.style.boxShadow = '0px 0px 0px 0px rgba(0, 0, 0, 1)';
                            }}
                            onMouseUp={(e) => {
                                e.currentTarget.style.transform = 'translate(0px, 0px)';
                                e.currentTarget.style.boxShadow = '8px 8px 0px 0px rgba(0, 0, 0, 1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translate(0px, 0px)';
                                e.currentTarget.style.boxShadow = '8px 8px 0px 0px rgba(0, 0, 0, 1)';
                            }}
                        >
                            {currentIndex < words.length - 1 ? '다음 단어' : '오답 재시험 시작'}
                            <IconArrowRight size={28} />
                        </button>
                    </Group>
                </div>
            </Container>
        </Box>
    );
}
