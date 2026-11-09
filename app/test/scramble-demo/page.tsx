'use client';

import { useState, useEffect } from 'react';
import {
    Container,
    Title,
    Paper,
    Text,
    Box,
    Group,
    Progress,
    Badge,
    Stack,
    Button,
    ActionIcon,
    Tooltip,
    SimpleGrid,
    Center,
} from '@mantine/core';
import {
    IconClock,
    IconCheck,
    IconX,
    IconVolume,
    IconRotate,
    IconArrowBackUp,
    IconFlame,
    IconSparkles,
    IconVolumeOff,
    IconTrophy,
    IconCards,
    IconArrowRight,
    IconRefresh,
} from '@tabler/icons-react';
import StudentLayout from '@/app/student/layout';

interface WordItem {
    id: string;
    text: string;
}

interface DemoSentence {
    no: number;
    english: string;
    korean: string;
}

const SAMPLE_SENTENCES: DemoSentence[] = [
    {
        no: 1,
        english: 'I like learning English with my friends.',
        korean: '나는 친구들과 함께 영어를 배우는 것을 좋아한다.',
    },
    {
        no: 2,
        english: 'She goes to the library every weekend.',
        korean: '그녀는 주말마다 도서관에 간다.',
    },
    {
        no: 3,
        english: 'Practice makes perfect if you try hard.',
        korean: '열심히 노력한다면 연습이 완벽을 만든다.',
    },
    {
        no: 4,
        english: 'We have to be careful when we cross the street.',
        korean: '우리는 길을 건널 때 조심해야 한다.',
    },
    {
        no: 5,
        english: 'The sun rises in the east and sets in the west.',
        korean: '태양은 동쪽에서 뜨고 서쪽으로 진다.',
    },
];

// Web Audio API 사운드 효과음
function playSound(type: 'click' | 'correct' | 'wrong' | 'complete', soundEnabled: boolean) {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();

        if (type === 'click') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        } else if (type === 'correct') {
            [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
                gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.08 + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + idx * 0.08);
                osc.stop(ctx.currentTime + idx * 0.08 + 0.25);
            });
        } else if (type === 'wrong') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.25);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.25);
        } else if (type === 'complete') {
            [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
                gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.1 + 0.4);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + idx * 0.1);
                osc.stop(ctx.currentTime + idx * 0.1 + 0.4);
            });
        }
    } catch {
        // 무음
    }
}

function cleanSentence(s: string): string {
    return s.trim().replace(/[.,!?;:'"]/g, '').toLowerCase().replace(/\s+/g, ' ');
}

type DemoPhase = 'PREVIEW' | 'TEST' | 'RESULT' | 'WRONG_PREVIEW';

export default function ScrambleDemoPage() {
    // 3단계 학습 단계 (예습 -> 시험 -> 결과 -> 오답예습 -> 오답재시험)
    const [phase, setPhase] = useState<DemoPhase>('PREVIEW');

    const [sentences, setSentences] = useState<DemoSentence[]>(SAMPLE_SENTENCES);
    const [currentIndex, setCurrentIndex] = useState(0);

    // 단어 상태
    const [poolWords, setPoolWords] = useState<WordItem[]>([]);
    const [assembledWords, setAssembledWords] = useState<WordItem[]>([]);

    // 퀴즈 진행 상태
    const [isAnswered, setIsAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [results, setResults] = useState<boolean[]>([]);
    const [wrongList, setWrongList] = useState<DemoSentence[]>([]);
    const [timeLeft, setTimeLeft] = useState(35);
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [shake, setShake] = useState(false);
    const [previewCountdown, setPreviewCountdown] = useState(3);

    const currentSentence = sentences[currentIndex] || sentences[0];
    const totalQuestions = sentences.length;
    const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
    const correctCount = results.filter((r) => r).length;
    const wrongCount = results.filter((r) => !r).length;

    // 예습 카운트다운 타이머
    useEffect(() => {
        if ((phase === 'PREVIEW' || phase === 'WRONG_PREVIEW') && previewCountdown > 0) {
            const timer = setTimeout(() => setPreviewCountdown((c) => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [phase, previewCountdown]);

    // 시험 문제 변경 시 단어 쪼개기 및 셔플
    useEffect(() => {
        if (phase !== 'TEST' || !currentSentence) return;

        const rawTokens = currentSentence.english.trim().split(/\s+/);
        const tokens: WordItem[] = rawTokens.map((w, idx) => ({
            id: `${currentIndex}-${idx}-${w}`,
            text: w,
        }));

        let shuffled = [...tokens].sort(() => Math.random() - 0.5);
        if (tokens.length > 2) {
            let attempts = 0;
            while (
                attempts < 5 &&
                shuffled.map((t) => t.text).join(' ') === currentSentence.english.trim()
            ) {
                shuffled = [...tokens].sort(() => Math.random() - 0.5);
                attempts++;
            }
        }

        setPoolWords(shuffled);
        setAssembledWords([]);
        setIsAnswered(false);
        setIsCorrect(null);
        setTimeLeft(35);
    }, [currentIndex, currentSentence, phase]);

    // 문제별 타이머
    useEffect(() => {
        if (phase !== 'TEST' || isAnswered) return;

        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !isAnswered) {
            handleCheckAnswer(true);
        }
    }, [timeLeft, isAnswered, phase]);

    // 단어 클릭
    const handleWordClickFromPool = (word: WordItem) => {
        if (isAnswered) return;
        playSound('click', soundEnabled);
        setPoolWords((prev) => prev.filter((w) => w.id !== word.id));
        setAssembledWords((prev) => [...prev, word]);
    };

    const handleWordClickFromAssembled = (word: WordItem) => {
        if (isAnswered) return;
        playSound('click', soundEnabled);
        setAssembledWords((prev) => prev.filter((w) => w.id !== word.id));
        setPoolWords((prev) => [...prev, word]);
    };

    const handleUndo = () => {
        if (isAnswered || assembledWords.length === 0) return;
        playSound('click', soundEnabled);
        const lastWord = assembledWords[assembledWords.length - 1];
        setAssembledWords((prev) => prev.slice(0, -1));
        setPoolWords((prev) => [...prev, lastWord]);
    };

    const handleReset = () => {
        if (isAnswered || assembledWords.length === 0) return;
        playSound('click', soundEnabled);
        setPoolWords((prev) => [...prev, ...assembledWords]);
        setAssembledWords([]);
    };

    // 정답 확인 / 제출
    const handleCheckAnswer = (isTimeout = false) => {
        if (isAnswered) return;

        const userAnswer = assembledWords.map((w) => w.text).join(' ');
        const targetAnswer = currentSentence.english;

        const correct = !isTimeout && cleanSentence(userAnswer) === cleanSentence(targetAnswer);

        setIsAnswered(true);
        setIsCorrect(correct);
        setResults((prev) => [...prev, correct]);

        if (correct) {
            playSound('correct', soundEnabled);
            const newCombo = combo + 1;
            setCombo(newCombo);
            if (newCombo > maxCombo) setMaxCombo(newCombo);
        } else {
            playSound('wrong', soundEnabled);
            setCombo(0);
            setShake(true);
            setTimeout(() => setShake(false), 500);

            if (!wrongList.some((w) => w.no === currentSentence.no)) {
                setWrongList((prev) => [...prev, currentSentence]);
            }
        }

        // [핵심] 오답 시에는 학생이 정답 문장을 충분히 읽을 수 있도록 2.5초(2500ms) 대기!
        const delay = correct ? 1200 : 2500;

        setTimeout(() => {
            if (currentIndex < sentences.length - 1) {
                setCurrentIndex((prev) => prev + 1);
            } else {
                playSound('complete', soundEnabled);
                setPhase('RESULT');
            }
        }, delay);
    };

    // TTS 발음 듣기
    const speakSentence = (text: string) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
    };

    // 예습 마치고 시험 시작
    const handleStartTest = () => {
        setPhase('TEST');
        setCurrentIndex(0);
        setResults([]);
    };

    // 틀린 문제 오답 예습 화면으로 전환
    const handleGoToWrongPreview = () => {
        if (wrongList.length === 0) return;
        setSentences(wrongList);
        setPreviewCountdown(2);
        setPhase('WRONG_PREVIEW');
    };

    // 오답 재시험 시작
    const handleStartRetryTest = () => {
        setResults([]);
        setWrongList([]);
        setCurrentIndex(0);
        setPhase('TEST');
        setCombo(0);
    };

    // 처음부터 다시 전체 체험
    const handleRestartAll = () => {
        setSentences(SAMPLE_SENTENCES);
        setWrongList([]);
        setResults([]);
        setCurrentIndex(0);
        setPreviewCountdown(3);
        setPhase('PREVIEW');
        setCombo(0);
    };

    return (
        <StudentLayout>
            <Box
                style={{
                    minHeight: '100%',
                    background: 'transparent',
                    padding: '20px 10px',
                    color: 'white',
                }}
            >
                <Container size={820}>
                    {/* 상단 컨트롤 바 */}
                    <Group justify="space-between" align="center" mb="lg">
                        <Group gap="sm">
                            <Paper
                                p="xs"
                                style={{
                                    background: '#FFD93D',
                                    border: '3px solid black',
                                    boxShadow: '4px 4px 0px black',
                                }}
                            >
                                <Group gap={6}>
                                    <IconSparkles size={20} color="black" />
                                    <Text fw={900} size="sm" c="black">
                                        SCRAMBLE DEMO
                                    </Text>
                                </Group>
                            </Paper>
                            <Badge
                                color={
                                    phase === 'PREVIEW'
                                        ? 'blue'
                                        : phase === 'WRONG_PREVIEW'
                                        ? 'red'
                                        : phase === 'TEST'
                                        ? 'violet'
                                        : 'green'
                                }
                                size="lg"
                                variant="filled"
                                style={{ border: '2px solid black' }}
                            >
                                {phase === 'PREVIEW' && '1단계: 시험 전 큰 카드 예습'}
                                {phase === 'TEST' && '2단계: 문장 스크램블 시험'}
                                {phase === 'RESULT' && '3단계: 결과 확인'}
                                {phase === 'WRONG_PREVIEW' && '🔁 오답 문장 재예습'}
                            </Badge>
                        </Group>

                        <Group gap="xs">
                            <Tooltip label={soundEnabled ? '효과음 끄기' : '효과음 켜기'}>
                                <ActionIcon
                                    size="lg"
                                    variant="filled"
                                    color="dark"
                                    onClick={() => setSoundEnabled(!soundEnabled)}
                                    style={{ border: '2px solid white', borderRadius: '0px' }}
                                >
                                    {soundEnabled ? <IconVolume size={18} /> : <IconVolumeOff size={18} />}
                                </ActionIcon>
                            </Tooltip>
                            <Button
                                size="sm"
                                variant="default"
                                leftSection={<IconRotate size={16} />}
                                onClick={handleRestartAll}
                                style={{
                                    border: '2px solid white',
                                    borderRadius: '0px',
                                    color: 'white',
                                    background: 'transparent',
                                }}
                            >
                                처음부터 다시 체험
                            </Button>
                        </Group>
                    </Group>

                    {/* ========================================================= */}
                    {/* [화면 1] 시험 전 큰 카드 예습 화면 (PREVIEW & WRONG_PREVIEW) */}
                    {/* ========================================================= */}
                    {(phase === 'PREVIEW' || phase === 'WRONG_PREVIEW') && (
                        <div className="animate-fade-in">
                            <Paper
                                p="xl"
                                mb="xl"
                                style={{
                                    border: '4px solid black',
                                    borderRadius: '0px',
                                    background: 'white',
                                    boxShadow: '8px 8px 0px #FFD93D',
                                }}
                            >
                                <Group justify="space-between" align="center" mb="md">
                                    <Box>
                                        <Badge
                                            size="lg"
                                            color={phase === 'WRONG_PREVIEW' ? 'red' : 'violet'}
                                            variant="filled"
                                            radius={0}
                                            style={{ border: '2px solid black' }}
                                        >
                                            {phase === 'WRONG_PREVIEW' ? '오답 집중 예습' : 'Flashcard Mode'}
                                        </Badge>
                                        <Title order={2} mt="xs" style={{ color: 'black', fontWeight: 900 }}>
                                            {phase === 'WRONG_PREVIEW'
                                                ? '틀렸던 문장을 큰 카드로 다시 눈에 익히세요!'
                                                : '오늘 시험 볼 5개 문장을 큰 카드로 예습하세요!'}
                                        </Title>
                                        <Text size="sm" c="dimmed" fw={600} mt={4}>
                                            카드를 터치하면 원어민 발음(TTS)을 들을 수 있습니다.
                                        </Text>
                                    </Box>
                                    <Text fw={900} size="xl" c={phase === 'WRONG_PREVIEW' ? 'red' : 'violet'}>
                                        총 {sentences.length}문장
                                    </Text>
                                </Group>
                            </Paper>

                            {/* 큰 카드 그리드 */}
                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mb="xl">
                                {sentences.map((sentence) => (
                                    <Paper
                                        key={sentence.no}
                                        p="xl"
                                        onClick={() => speakSentence(sentence.english)}
                                        style={{
                                            border: '3px solid black',
                                            borderRadius: '0px',
                                            background: 'white',
                                            boxShadow: '6px 6px 0px black',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            transition: 'transform 0.15s ease',
                                        }}
                                        className="hover:-translate-y-1 hover:shadow-[8px_8px_0px_#FFD93D]"
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
                                                border: '1px solid black',
                                            }}
                                        >
                                            #{sentence.no}
                                        </Badge>

                                        <Stack gap="md" align="center">
                                            <Text
                                                size="1.45rem"
                                                fw={900}
                                                ta="center"
                                                style={{ color: '#0F172A', lineHeight: 1.3 }}
                                            >
                                                {sentence.english}
                                            </Text>

                                            <Box style={{ width: '40px', height: '4px', background: '#FFD93D', border: '1px solid black' }} />

                                            <Text size="1.15rem" fw={700} ta="center" style={{ color: '#475569' }}>
                                                {sentence.korean}
                                            </Text>

                                            <Group gap={6} style={{ opacity: 0.6, marginTop: '4px' }}>
                                                <IconVolume size={18} color="#7C3AED" />
                                                <Text size="xs" fw={800} c="violet">Click to Listen</Text>
                                            </Group>
                                        </Stack>
                                    </Paper>
                                ))}
                            </SimpleGrid>

                            {/* 하단 시작 버튼 */}
                            <Center mt={30} mb={60}>
                                <button
                                    onClick={phase === 'WRONG_PREVIEW' ? handleStartRetryTest : handleStartTest}
                                    disabled={previewCountdown > 0}
                                    style={{
                                        background: previewCountdown > 0 ? '#E2E8F0' : '#FFD93D',
                                        color: previewCountdown > 0 ? '#94A3B8' : 'black',
                                        border: '4px solid black',
                                        borderRadius: '0px',
                                        fontSize: '1.3rem',
                                        fontWeight: 900,
                                        padding: '1.2rem 4rem',
                                        cursor: previewCountdown > 0 ? 'not-allowed' : 'pointer',
                                        boxShadow: previewCountdown > 0 ? 'none' : '8px 8px 0px black',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    {previewCountdown > 0 ? (
                                        `예습 시간 (${previewCountdown}초 대기)`
                                    ) : phase === 'WRONG_PREVIEW' ? (
                                        <>
                                            🚀 오답 재시험 시작하기 (START)
                                            <IconArrowRight size={22} stroke={3} />
                                        </>
                                    ) : (
                                        <>
                                            시험 시작하기 (START TEST)
                                            <IconArrowRight size={22} stroke={3} />
                                        </>
                                    )}
                                </button>
                            </Center>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* [화면 2] 스크램블 시험 진행 화면 (TEST) */}
                    {/* ========================================================= */}
                    {phase === 'TEST' && (
                        <div className="animate-fade-in">
                            {/* 상태 바 (타이머 & 맞힌 개수 & 콤보) */}
                            <Group mb={16} justify="space-between">
                                <Paper
                                    p="sm"
                                    style={{
                                        border: '3px solid black',
                                        borderRadius: '0px',
                                        background: 'white',
                                        flex: 1,
                                        boxShadow: '4px 4px 0px black',
                                    }}
                                >
                                    <Group justify="space-between">
                                        <Group gap="xs">
                                            <IconClock size={22} color={timeLeft <= 5 ? '#EF4444' : '#9333EA'} />
                                            <Text fw={900} size="lg" c={timeLeft <= 5 ? 'red' : 'dark'}>
                                                {timeLeft}초
                                            </Text>
                                        </Group>

                                        {combo >= 2 && (
                                            <Badge
                                                size="lg"
                                                color="orange"
                                                variant="filled"
                                                leftSection={<IconFlame size={14} />}
                                                style={{ border: '2px solid black' }}
                                            >
                                                {combo} COMBO!
                                            </Badge>
                                        )}

                                        <Group gap="md">
                                            <Group gap={4}>
                                                <IconCheck size={18} color="#22C55E" />
                                                <Text fw={900} c="green">{correctCount}</Text>
                                            </Group>
                                            <Group gap={4}>
                                                <IconX size={18} color="#EF4444" />
                                                <Text fw={900} c="red">{wrongCount}</Text>
                                            </Group>
                                        </Group>
                                    </Group>
                                </Paper>
                            </Group>

                            {/* 진행률 바 */}
                            <Paper
                                p="xs"
                                mb={16}
                                style={{
                                    border: '3px solid black',
                                    borderRadius: '0px',
                                    background: 'white',
                                    boxShadow: '4px 4px 0px black',
                                }}
                            >
                                <Group justify="space-between" mb={4}>
                                    <Text fw={800} size="xs" c="dimmed">진행 상황</Text>
                                    <Text fw={900} size="xs" c="violet">
                                        {currentIndex + 1} / {totalQuestions}
                                    </Text>
                                </Group>
                                <Progress
                                    value={progress}
                                    size="md"
                                    radius={0}
                                    styles={{
                                        root: { border: '2px solid black' },
                                        section: { background: 'linear-gradient(90deg, #9333EA 0%, #3B82F6 100%)' },
                                    }}
                                />
                            </Paper>

                            <Stack gap="lg">
                                {/* 문제 카드 (한글 해석 & 발음 듣기) */}
                                <Paper
                                    p="xl"
                                    style={{
                                        border: '4px solid black',
                                        borderRadius: '0px',
                                        background: 'white',
                                        boxShadow: '8px 8px 0px #FFD93D',
                                        position: 'relative',
                                    }}
                                >
                                    <Group justify="space-between" align="flex-start" mb="xs">
                                        <Badge
                                            size="lg"
                                            color="violet"
                                            variant="filled"
                                            radius={0}
                                            style={{ border: '2px solid black' }}
                                        >
                                            문제 {currentSentence.no}
                                        </Badge>

                                        <Tooltip label="원어민 발음 듣기">
                                            <ActionIcon
                                                size="lg"
                                                color="yellow"
                                                variant="filled"
                                                onClick={() => speakSentence(currentSentence.english)}
                                                style={{ border: '2px solid black', borderRadius: '0px', color: 'black' }}
                                            >
                                                <IconVolume size={20} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>

                                    <Text
                                        size="1.6rem"
                                        fw={900}
                                        style={{ color: '#0F172A', lineHeight: 1.4, letterSpacing: '-0.5px' }}
                                    >
                                        {currentSentence.korean}
                                    </Text>
                                    <Text size="xs" fw={700} c="dimmed" mt={6}>
                                        💡 아래 단어를 순서대로 클릭하여 올바른 영어 문장을 완성하세요.
                                    </Text>
                                </Paper>

                                {/* 학생 조립 슬롯 */}
                                <Paper
                                    p="lg"
                                    className={shake ? 'animate-shake' : ''}
                                    style={{
                                        border: '4px solid black',
                                        borderRadius: '0px',
                                        background: isAnswered
                                            ? isCorrect
                                                ? '#DCFCE7'
                                                : '#FEE2E2'
                                            : '#FFFFFF',
                                        boxShadow: '6px 6px 0px black',
                                        minHeight: '130px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <Text size="xs" fw={800} c="dimmed" mb="xs">
                                        ✏️ 내가 조립한 문장 (클릭하면 아래로 돌아갑니다)
                                    </Text>

                                    <Box
                                        style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '8px',
                                            alignItems: 'center',
                                            minHeight: '52px',
                                        }}
                                    >
                                        {assembledWords.length === 0 && (
                                            <Text size="sm" c="gray.5" fw={600} style={{ fontStyle: 'italic' }}>
                                                아래 단어를 클릭하면 여기에 문장이 들어갑니다...
                                            </Text>
                                        )}

                                        {assembledWords.map((word) => (
                                            <button
                                                key={word.id}
                                                onClick={() => handleWordClickFromAssembled(word)}
                                                disabled={isAnswered}
                                                style={{
                                                    background: '#9333EA',
                                                    color: 'white',
                                                    border: '3px solid black',
                                                    borderRadius: '0px',
                                                    boxShadow: '3px 3px 0px black',
                                                    padding: '8px 16px',
                                                    fontSize: '1.15rem',
                                                    fontWeight: 800,
                                                    cursor: isAnswered ? 'default' : 'pointer',
                                                    animation: 'popIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                                                    transition: 'transform 0.1s ease',
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isAnswered) e.currentTarget.style.transform = 'translate(-2px, -2px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isAnswered) e.currentTarget.style.transform = 'translate(0, 0)';
                                                }}
                                            >
                                                {word.text}
                                            </button>
                                        ))}
                                    </Box>

                                    {/* 정답/오답 배너 (오답 시 2.5초간 정답 문장을 대문짝만하게 보여줌!) */}
                                    {isAnswered && (
                                        <Box mt="md" pt="sm" style={{ borderTop: '2px dashed black' }}>
                                            {isCorrect ? (
                                                <Text fw={900} size="lg" c="green" ta="center">
                                                    🎉 정답입니다! 완벽해요!
                                                </Text>
                                            ) : (
                                                <Box
                                                    p="md"
                                                    style={{
                                                        background: '#FFF5F5',
                                                        border: '3px solid #EF4444',
                                                        boxShadow: '4px 4px 0px black',
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    <Text fw={900} size="md" c="red" mb={4}>
                                                        ❌ 오답입니다! (정답을 확인하세요 - 2.5초간 표시)
                                                    </Text>
                                                    <Text
                                                        fw={900}
                                                        size="1.25rem"
                                                        style={{ color: '#9333EA', wordBreak: 'break-word' }}
                                                    >
                                                        {currentSentence.english}
                                                    </Text>
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                </Paper>

                                {/* 하단 단어 풀 */}
                                <Paper
                                    p="lg"
                                    style={{
                                        border: '4px solid black',
                                        borderRadius: '0px',
                                        background: '#1E293B',
                                        boxShadow: '6px 6px 0px #3B82F6',
                                        minHeight: '120px',
                                    }}
                                >
                                    <Text size="xs" fw={800} c="gray.4" mb="sm">
                                        🔀 단어 선택 풀 (클릭하여 위로 올리세요)
                                    </Text>

                                    <Box
                                        style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '10px',
                                            alignItems: 'center',
                                            minHeight: '52px',
                                        }}
                                    >
                                        {poolWords.map((word) => (
                                            <button
                                                key={word.id}
                                                onClick={() => handleWordClickFromPool(word)}
                                                disabled={isAnswered}
                                                style={{
                                                    background: '#FFFFFF',
                                                    color: '#0F172A',
                                                    border: '3px solid black',
                                                    borderRadius: '0px',
                                                    boxShadow: '4px 4px 0px black',
                                                    padding: '10px 18px',
                                                    fontSize: '1.2rem',
                                                    fontWeight: 800,
                                                    cursor: isAnswered ? 'default' : 'pointer',
                                                    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isAnswered) {
                                                        e.currentTarget.style.transform = 'translate(-2px, -2px)';
                                                        e.currentTarget.style.boxShadow = '6px 6px 0px #FFD93D';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isAnswered) {
                                                        e.currentTarget.style.transform = 'translate(0, 0)';
                                                        e.currentTarget.style.boxShadow = '4px 4px 0px black';
                                                    }
                                                }}
                                            >
                                                {word.text}
                                            </button>
                                        ))}
                                    </Box>
                                </Paper>

                                {/* 조작 버튼군 */}
                                <Group justify="space-between">
                                    <Group gap="xs">
                                        <Button
                                            variant="default"
                                            color="gray"
                                            onClick={handleReset}
                                            disabled={isAnswered || assembledWords.length === 0}
                                            leftSection={<IconRotate size={16} />}
                                            style={{
                                                border: '2px solid white',
                                                borderRadius: '0px',
                                                background: 'transparent',
                                                color: 'white',
                                            }}
                                        >
                                            전체 초기화
                                        </Button>
                                        <Button
                                            variant="default"
                                            color="gray"
                                            onClick={handleUndo}
                                            disabled={isAnswered || assembledWords.length === 0}
                                            leftSection={<IconArrowBackUp size={16} />}
                                            style={{
                                                border: '2px solid white',
                                                borderRadius: '0px',
                                                background: 'transparent',
                                                color: 'white',
                                            }}
                                        >
                                            한 단어 취소
                                        </Button>
                                    </Group>

                                    <button
                                        onClick={() => handleCheckAnswer(false)}
                                        disabled={isAnswered || assembledWords.length === 0}
                                        style={{
                                            background: isAnswered || assembledWords.length === 0 ? '#64748B' : '#FFD93D',
                                            color: 'black',
                                            border: '3px solid black',
                                            borderRadius: '0px',
                                            boxShadow: isAnswered || assembledWords.length === 0 ? 'none' : '5px 5px 0px black',
                                            fontSize: '1.2rem',
                                            fontWeight: 900,
                                            padding: '0.9rem 2.5rem',
                                            cursor: isAnswered || assembledWords.length === 0 ? 'not-allowed' : 'pointer',
                                            transition: 'transform 0.1s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isAnswered && assembledWords.length > 0) {
                                                e.currentTarget.style.transform = 'translate(-2px, -2px)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isAnswered && assembledWords.length > 0) {
                                                e.currentTarget.style.transform = 'translate(0, 0)';
                                            }
                                        }}
                                    >
                                        정답 확인 (SUBMIT)
                                    </button>
                                </Group>
                            </Stack>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* [화면 3] 시험 결과 및 오답 재예습/재시험 유도 (RESULT) */}
                    {/* ========================================================= */}
                    {phase === 'RESULT' && (
                        <div className="animate-fade-in">
                            <Paper
                                p="xl"
                                style={{
                                    border: '5px solid black',
                                    borderRadius: '0px',
                                    background: 'white',
                                    color: 'black',
                                    boxShadow: '10px 10px 0px #FFD93D',
                                    textAlign: 'center',
                                    marginTop: '20px',
                                }}
                            >
                                <Stack align="center" gap="md">
                                    <Box
                                        p="md"
                                        style={{
                                            background: '#FFD93D',
                                            border: '3px solid black',
                                            display: 'inline-block',
                                        }}
                                    >
                                        <IconTrophy size={48} color="black" />
                                    </Box>

                                    <Title order={1} style={{ fontWeight: 900, fontSize: '2.5rem' }}>
                                        {wrongList.length === 0 ? '🏆 전 문장 100점 마스터 완료!' : '시험 완료!'}
                                    </Title>

                                    <Text size="lg" fw={700} c="dimmed">
                                        총 {totalQuestions}문제 중 {correctCount}문제를 맞혔습니다! (최대 {maxCombo}연속 콤보)
                                    </Text>

                                    <Group justify="center" gap="xl" my="md">
                                        <Paper p="md" style={{ border: '3px solid black', minWidth: '120px' }}>
                                            <Text size="xs" fw={800} c="green">정답</Text>
                                            <Text size="2rem" fw={900} c="green">{correctCount}</Text>
                                        </Paper>
                                        <Paper p="md" style={{ border: '3px solid black', minWidth: '120px' }}>
                                            <Text size="xs" fw={800} c="red">오답</Text>
                                            <Text size="2rem" fw={900} c="red">{wrongCount}</Text>
                                        </Paper>
                                        <Paper p="md" style={{ border: '3px solid black', minWidth: '120px' }}>
                                            <Text size="xs" fw={800} c="violet">최종 점수</Text>
                                            <Text size="2rem" fw={900} c="violet">
                                                {Math.round((correctCount / totalQuestions) * 100)}점
                                            </Text>
                                        </Paper>
                                    </Group>

                                    {/* 오답이 있을 경우 -> 다시 큰 카드로 예습하고 재시험 치는 루프! */}
                                    {wrongList.length > 0 ? (
                                        <Box mt="lg">
                                            <Text fw={800} size="md" c="red" mb="md">
                                                ⚠️ 틀린 문제 {wrongList.length}개가 있습니다! 큰 카드로 다시 예습하고 재시험을 칩니다.
                                            </Text>
                                            <button
                                                onClick={handleGoToWrongPreview}
                                                style={{
                                                    background: '#EF4444',
                                                    color: 'white',
                                                    border: '3px solid black',
                                                    borderRadius: '0px',
                                                    boxShadow: '6px 6px 0px black',
                                                    fontSize: '1.3rem',
                                                    fontWeight: 900,
                                                    padding: '1.2rem 3rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    margin: '0 auto',
                                                }}
                                            >
                                                <IconRefresh size={24} />
                                                🔁 틀린 {wrongList.length}문제 다시 예습하고 재시험치기
                                            </button>
                                        </Box>
                                    ) : (
                                        <Box mt="lg">
                                            <Badge
                                                size="xl"
                                                color="green"
                                                variant="filled"
                                                style={{ border: '2px solid black', padding: '1rem 2rem' }}
                                            >
                                                🎉 100점 통과 완료! 수업일지 완료 (PASSED)
                                            </Badge>
                                            <Group justify="center" mt="xl">
                                                <Button
                                                    size="md"
                                                    variant="outline"
                                                    color="dark"
                                                    onClick={handleRestartAll}
                                                    style={{ border: '2px solid black', borderRadius: '0px' }}
                                                >
                                                    처음부터 다시 전체 체험하기
                                                </Button>
                                            </Group>
                                        </Box>
                                    )}
                                </Stack>
                            </Paper>
                        </div>
                    )}
                </Container>

                {/* CSS 애니메이션 */}
                <style jsx global>{`
                    @keyframes popIn {
                        0% {
                            opacity: 0;
                            transform: scale(0.7) translateY(10px);
                        }
                        100% {
                            opacity: 1;
                            transform: scale(1) translateY(0);
                        }
                    }

                    .animate-shake {
                        animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
                    }

                    @keyframes shake {
                        10%, 90% {
                            transform: translate3d(-2px, 0, 0);
                        }
                        20%, 80% {
                            transform: translate3d(3px, 0, 0);
                        }
                        30%, 50%, 70% {
                            transform: translate3d(-4px, 0, 0);
                        }
                        40%, 60% {
                            transform: translate3d(4px, 0, 0);
                        }
                    }
                `}</style>
            </Box>
        </StudentLayout>
    );
}
