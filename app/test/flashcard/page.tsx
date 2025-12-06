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
    ThemeIcon,
} from '@mantine/core';
import { IconVolume, IconArrowRight, IconBulb, IconCards } from '@tabler/icons-react';

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

    // 자동 음성 재생 (영어 면이 나올 때)
    useEffect(() => {
        if (showAnswer) {
            speakWord(currentWord.english);
        }
    }, [showAnswer, currentWord]); // 의존성 showAnswer로 변경하여 답이 보일 때 재생 선호

    return (
        <Box
            style={{
                minHeight: '100vh',
                background: 'white',
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
                        <Group justify="center" mb="md">
                            <Box p="sm" style={{ background: '#FFD93D', border: '2px solid black', boxShadow: '4px 4px 0px black' }}>
                                <IconCards size={32} stroke={2} color="black" />
                            </Box>
                        </Group>
                        <Title
                            order={1}
                            style={{
                                color: 'black',
                                fontWeight: 900,
                                fontSize: '2.5rem',
                                marginBottom: '0.5rem',
                            }}
                        >
                            플래시카드 학습
                        </Title>
                        <Text
                            size="xl"
                            style={{
                                color: 'black',
                                fontWeight: 500,
                            }}
                            c="dimmed"
                        >
                            단어를 익히고 발음을 들어보세요
                        </Text>
                    </Box>

                    {/* 진행률 */}
                    <Paper
                        p="md"
                        mb={20}
                        style={{
                            border: '2px solid black',
                            borderRadius: '0px',
                            background: 'white',
                            boxShadow: '4px 4px 0px black',
                        }}
                    >
                        <Group justify="space-between" mb={10}>
                            <Text fw={700} size="lg">
                                진행률
                            </Text>
                            <Text fw={900} size="lg">
                                {currentIndex + 1} / {sampleWords.length}
                            </Text>
                        </Group>
                        <Progress
                            value={progress}
                            size="xl"
                            radius="0"
                            color="black"
                            styles={{
                                root: {
                                    border: '2px solid black',
                                    borderRadius: '0px',
                                    backgroundColor: '#F1F3F5',
                                },
                                section: {
                                    backgroundColor: '#FFD93D',
                                    borderRight: '2px solid black',
                                }
                            }}
                        />
                    </Paper>

                    {/* 플래시카드 */}
                    <Paper
                        p={60}
                        style={{
                            border: '2px solid black',
                            borderRadius: '0px',
                            background: showAnswer ? '#FFD93D' : 'white',
                            boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
                            minHeight: '350px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            transform: isFlipping ? 'scale(0.98)' : 'scale(1)',
                        }}
                        onClick={handleFlip}
                    >
                        <Stack align="center" gap="xl">
                            {!showAnswer ? (
                                <>
                                    {/* 한글 (앞면) */}
                                    <Text
                                        size="3rem"
                                        fw={900}
                                        style={{
                                            color: 'black',
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
                                            background: 'black',
                                            color: 'white',
                                            border: '2px solid black',
                                            borderRadius: '0px', // 네모난 버튼
                                            width: '60px',
                                            height: '60px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            marginTop: '1rem',
                                            boxShadow: '4px 4px 0px white', // 대비를 위해 흰색 그림자? 아니면 검정? 배경이 노랑이라 검정이 나음
                                        }}
                                        onMouseDown={(e) => {
                                            const target = e.currentTarget;
                                            target.style.transform = 'translate(2px, 2px)';
                                            target.style.boxShadow = '2px 2px 0px white';
                                        }}
                                        onMouseUp={(e) => {
                                            const target = e.currentTarget;
                                            target.style.transform = 'translate(0px, 0px)';
                                            target.style.boxShadow = '4px 4px 0px white';
                                        }}
                                    >
                                        <IconVolume size={32} />
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
                                background: showAnswer ? 'black' : '#e9ecef',
                                color: showAnswer ? '#FFD93D' : '#adb5bd', // 노란 텍스트
                                border: '2px solid black',
                                borderRadius: '0px',
                                boxShadow: showAnswer ? '6px 6px 0px 0px rgba(0, 0, 0, 1)' : 'none',
                                fontSize: '1.5rem',
                                fontWeight: 900,
                                padding: '1.2rem 2.5rem',
                                cursor: showAnswer ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                transition: 'all 0.15s ease',
                                width: '100%',
                                justifyContent: 'center',
                            }}
                            onMouseDown={(e) => {
                                if (showAnswer) {
                                    e.currentTarget.style.transform = 'translate(2px, 2px)';
                                    e.currentTarget.style.boxShadow = '4px 4px 0px 0px rgba(0, 0, 0, 1)';
                                }
                            }}
                            onMouseUp={(e) => {
                                if (showAnswer) {
                                    e.currentTarget.style.transform = 'translate(0px, 0px)';
                                    e.currentTarget.style.boxShadow = '6px 6px 0px 0px rgba(0, 0, 0, 1)';
                                }
                            }}
                        >
                            {currentIndex < sampleWords.length - 1 ? '다음 단어' : '시험 종료'}
                            <IconArrowRight size={24} />
                        </button>
                    </Group>

                    {/* 하단 힌트 */}
                    <Paper
                        p="md"
                        mt={20}
                        style={{
                            border: '2px solid black',
                            background: '#F1F3F5',
                            borderRadius: '0px',
                            boxShadow: '4px 4px 0px black',
                        }}
                    >
                        <Group justify="center" gap="xs">
                            <IconBulb size={20} />
                            <Text c="black" ta="center" fw={700}>
                                팁: 카드를 클릭하면 답을 확인할 수 있어요!
                            </Text>
                        </Group>
                    </Paper>
                </div>
            </Container>
        </Box>
    );
}
