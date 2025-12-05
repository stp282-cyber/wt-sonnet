'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Container,
    Title,
    Paper,
    Text,
    Box,
    Group,
    Progress,
    Stack,
} from '@mantine/core';
import { IconVolume, IconArrowRight } from '@tabler/icons-react';

interface Word {
    no: number;
    english: string;
    korean: string;
}

const sampleWords: Word[] = [
    { no: 1, english: 'apple', korean: '사과' },
    { no: 2, english: 'banana', korean: '바나나' },
    { no: 3, english: 'orange', korean: '오렌지' },
    { no: 4, english: 'grape', korean: '포도' },
    { no: 5, english: 'watermelon', korean: '수박' },
];

export default function FlashcardPage() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [isFlipping, setIsFlipping] = useState(false);

    const currentWord = sampleWords[currentIndex];
    const progress = ((currentIndex + 1) / sampleWords.length) * 100;

    // TTS 음성 재생
    const speakWord = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            speechSynthesis.speak(utterance);
        }
    };

    // 카드 뒤집기
    const handleFlip = () => {
        setIsFlipping(true);
        setTimeout(() => {
            setShowAnswer(!showAnswer);
            setIsFlipping(false);
        }, 150);
    };

    // 다음 카드
    const handleNext = () => {
        if (currentIndex < sampleWords.length - 1) {
            setShowAnswer(false);
            setCurrentIndex(currentIndex + 1);
        } else {
            // 플래시카드 완료 → 타이핑 시험으로 이동
            router.push('/test/typing');
        }
    };

    // 자동 음성 재생
    useEffect(() => {
        speakWord(currentWord.english);
    }, [currentIndex]);

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
                            📚 플래시카드 학습
                        </Title>
                        <Text
                            size="xl"
                            style={{
                                color: 'white',
                                fontWeight: 600,
                                textShadow: '2px 2px 0px rgba(0, 0, 0, 0.2)',
                            }}
                        >
                            단어를 익히고 발음을 들어보세요!
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
                                진행률
                            </Text>
                            <Text fw={900} size="lg" c="violet">
                                {currentIndex + 1} / {sampleWords.length}
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
                                bar: {
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
                            background: showAnswer ? '#FFD93D' : 'white',
                            boxShadow: '12px 12px 0px 0px rgba(0, 0, 0, 1)',
                            minHeight: '350px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            transform: isFlipping ? 'scale(0.95)' : 'scale(1)',
                        }}
                        onClick={handleFlip}
                        className="animate-bounce-in"
                    >
                        <Stack align="center" gap="xl">
                            {!showAnswer ? (
                                <>
                                    {/* 한글 (앞면) */}
                                    <Text
                                        size="3rem"
                                        fw={900}
                                        style={{
                                            color: '#7950f2',
                                            textAlign: 'center',
                                        }}
                                    >
                                        {currentWord.korean}
                                    </Text>
                                    <Text size="lg" c="dimmed" fw={600}>
                                        카드를 클릭하여 답 확인
                                    </Text>
                                </>
                            ) : (
                                <>
                                    {/* 영어 (뒷면) */}
                                    <Text
                                        size="3.5rem"
                                        fw={900}
                                        style={{
                                            color: 'black',
                                            textAlign: 'center',
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
                                            boxShadow: '6px 6px 0px rgba(0, 0, 0, 1)',
                                            transition: 'all 0.15s ease',
                                        }}
                                        onMouseDown={(e) => {
                                            e.currentTarget.style.transform = 'translate(6px, 6px)';
                                            e.currentTarget.style.boxShadow = '0px 0px 0px rgba(0, 0, 0, 1)';
                                        }}
                                        onMouseUp={(e) => {
                                            e.currentTarget.style.transform = 'translate(0px, 0px)';
                                            e.currentTarget.style.boxShadow = '6px 6px 0px rgba(0, 0, 0, 1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translate(0px, 0px)';
                                            e.currentTarget.style.boxShadow = '6px 6px 0px rgba(0, 0, 0, 1)';
                                        }}
                                    >
                                        <IconVolume size={40} />
                                    </button>
                                </>
                            )}
                        </Stack>
                    </Paper>

                    {/* 다음 버튼 */}
                    <Group justify="center" mt={30}>
                        <button
                            onClick={handleNext}
                            disabled={!showAnswer}
                            style={{
                                background: showAnswer ? '#4ECDC4' : '#ccc',
                                color: 'white',
                                border: '5px solid black',
                                borderRadius: '15px',
                                boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
                                fontSize: '1.5rem',
                                fontWeight: 900,
                                padding: '1.5rem 3rem',
                                cursor: showAnswer ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                transition: 'all 0.15s ease',
                                opacity: showAnswer ? 1 : 0.5,
                            }}
                            onMouseDown={(e) => {
                                if (showAnswer) {
                                    e.currentTarget.style.transform = 'translate(8px, 8px)';
                                    e.currentTarget.style.boxShadow = '0px 0px 0px 0px rgba(0, 0, 0, 1)';
                                }
                            }}
                            onMouseUp={(e) => {
                                if (showAnswer) {
                                    e.currentTarget.style.transform = 'translate(0px, 0px)';
                                    e.currentTarget.style.boxShadow = '8px 8px 0px 0px rgba(0, 0, 0, 1)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (showAnswer) {
                                    e.currentTarget.style.transform = 'translate(0px, 0px)';
                                    e.currentTarget.style.boxShadow = '8px 8px 0px 0px rgba(0, 0, 0, 1)';
                                }
                            }}
                        >
                            {currentIndex < sampleWords.length - 1 ? '다음 단어' : '시험 시작'}
                            <IconArrowRight size={30} />
                        </button>
                    </Group>

                    {/* 하단 힌트 */}
                    <Paper
                        p="md"
                        mt={20}
                        style={{
                            border: '3px solid white',
                            background: 'rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '12px',
                        }}
                    >
                        <Text c="white" ta="center" fw={600}>
                            💡 팁: 카드를 클릭하면 답을 확인할 수 있어요!
                        </Text>
                    </Paper>
                </div>
            </Container>
        </Box>
    );
}
