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
    Progress,
    Badge,
    Stack,
    Center,
    Loader,
    Button,
    ActionIcon,
    Tooltip,
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
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import StudentLayout from '../../student/layout';

interface Word {
    no: number;
    english: string;
    korean: string;
}

interface WordToken {
    id: string;
    text: string;
}

// Web Audio API 사운드 효과음 (비활성화)
function playSound(_type: 'click' | 'correct' | 'wrong' | 'complete', _soundEnabled: boolean) {
    // 효과음 비활성화
    return;
}

// 문장 부호 및 대소문자 정규화 비교 함수
function cleanSentence(s: string): string {
    return s.trim().replace(/[.,!?;:'"’‘“”]/g, '').toLowerCase().replace(/\s+/g, ' ');
}

// 문제(단어) 목록 셔플 함수 (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function ScrambleContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [words, setWords] = useState<Word[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // 단어 토큰 상태 (풀 / 조립 영역)
    const [poolWords, setPoolWords] = useState<WordToken[]>([]);
    const [assembledWords, setAssembledWords] = useState<WordToken[]>([]);

    // 시험 진행 상태
    const [isAnswered, setIsAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [results, setResults] = useState<boolean[]>([]);
    const [timeLeft, setTimeLeft] = useState(60);
    const [loading, setLoading] = useState(true);
    const [combo, setCombo] = useState(0);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [shake, setShake] = useState(false);

    // 폴백 기본 예제 문장 (파라미터 누락 시 안전장치)
    const defaultWords: Word[] = [
        { no: 1, english: 'I love learning English with my friends.', korean: '나는 친구들과 함께 영어 배우는 것을 좋아한다.' },
        { no: 2, english: 'She goes to school every day.', korean: '그녀는 매일 학교에 간다.' },
        { no: 3, english: 'Practice makes perfect if you try.', korean: '노력한다면 연습이 완벽을 만든다.' },
    ];

    const currentWord = words[currentIndex];
    const isSingleWord = currentWord ? !(/\s+/.test(currentWord.english.trim())) : false;
    const correctCount = results.filter((r) => r).length;
    const wrongCount = results.filter((r) => !r).length;
    const progress = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;

    // 데이터 초기화 및 세션 복원
    useEffect(() => {
        const init = async () => {
            const mode = searchParams.get('mode');
            const isResume = searchParams.get('resume') === 'true';
            const itemId = searchParams.get('itemId');
            const startStr = searchParams.get('start');
            const endStr = searchParams.get('end');

            let targetWords: Word[] = [];

            try {
                const studentInfoStr = localStorage.getItem('user');
                let sessionData: any = null;

                if (studentInfoStr) {
                    const studentInfo = JSON.parse(studentInfoStr);
                    const res = await fetch(`/api/test/session?studentId=${studentInfo.id}`, { cache: 'no-store' });
                    if (res.ok) {
                        const data = await res.json();
                        sessionData = data.session?.session_data;
                    }
                }

                const isRetry = mode === 'retry' || sessionData?.step === 'SCRAMBLE_RETRY';

                // 1. 오답 재시험 모드 (Retry)
                if (isRetry && sessionData?.wrongWords && sessionData.wrongWords.length > 0) {
                    // 재시험 신규 시작 시 문제 순서 랜덤 셔플
                    targetWords = isResume ? sessionData.wrongWords : shuffleArray(sessionData.wrongWords);
                    if (isResume) {
                        setCurrentIndex(sessionData.currentRetryIndex || 0);
                        setResults(sessionData.retryResults || []);
                    }
                }
                // 2. 세션 이어하기 모드 (Resume)
                else if (isResume && sessionData?.type === 'scramble' && sessionData.words) {
                    targetWords = sessionData.words;
                    setCurrentIndex(sessionData.currentIndex || 0);
                    setResults(sessionData.results || []);
                }
                // 3. 정상 신규 시험 시작 (단어장 로드)
                else if (itemId && startStr && endStr) {
                    const start = parseInt(startStr, 10);
                    const end = parseInt(endStr, 10);
                    const res = await fetch(`/api/wordbooks/${itemId}`);
                    if (res.ok) {
                        const data = await res.json();
                        const allWords: Word[] = data.wordbook?.words || [];
                        const sliced = allWords.slice(start - 1, end);
                        // 예습(플래시카드)과 달리 실제 시험 문제는 랜덤 순서로 출제
                        targetWords = shuffleArray(sliced);
                    }
                }
            } catch (e) {
                console.error("Scramble init error:", e);
            }

            // 폴백 처리
            if (!targetWords || targetWords.length === 0) {
                targetWords = defaultWords;
            }

            setWords(targetWords);
            setLoading(false);
        };

        init();
    }, [searchParams]);

    // 문제 인덱스 변경 시 문장 또는 단어를 토큰화하고 셔플
    useEffect(() => {
        if (words.length > 0 && words[currentIndex]) {
            const rawSentence = words[currentIndex].english.trim();
            const single = !(/\s+/.test(rawSentence));

            let rawTokens: string[] = [];
            if (single) {
                // 단일 단어: 문장 부호를 제거한 순수 철자(Letters) 단위로 분리
                const clean = rawSentence.replace(/[.,!?;:'"’‘“”]/g, '');
                rawTokens = (clean.length > 0 ? clean : rawSentence).split('');
            } else {
                // 구/문장: 공백 기준 단어(Words) 단위로 분리
                rawTokens = rawSentence.split(/\s+/);
            }

            const tokens: WordToken[] = rawTokens.map((w, idx) => ({
                id: `${currentIndex}-${idx}-${w}`,
                text: w,
            }));

            // 단어/철자 셔플 (원문과 순서가 달라질 때까지 셔플)
            let shuffled = [...tokens].sort(() => Math.random() - 0.5);
            if (tokens.length >= 2) {
                let attempts = 0;
                const originalSequence = rawTokens.join('');
                while (
                    attempts < 10 &&
                    shuffled.map((t) => t.text).join('') === originalSequence
                ) {
                    shuffled = [...tokens].sort(() => Math.random() - 0.5);
                    attempts++;
                }
            }

            setPoolWords(shuffled);
            setAssembledWords([]);
            setIsAnswered(false);
            setIsCorrect(null);
            setTimeLeft(60);
        }
    }, [currentIndex, words]);

    // 타이머
    useEffect(() => {
        if (!loading && timeLeft > 0 && !isAnswered && words.length > 0) {
            const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !isAnswered && words.length > 0) {
            handleSubmit(true);
        }
    }, [timeLeft, isAnswered, words, loading]);

    // 풀에서 단어 클릭 -> 조립 영역으로 이동
    const handleWordClickFromPool = (word: WordToken) => {
        if (isAnswered) return;
        playSound('click', soundEnabled);
        setPoolWords((prev) => prev.filter((w) => w.id !== word.id));
        setAssembledWords((prev) => [...prev, word]);
    };

    // 조립 영역에서 단어 클릭 -> 다시 풀로 복귀
    const handleWordClickFromAssembled = (word: WordToken) => {
        if (isAnswered) return;
        playSound('click', soundEnabled);
        setAssembledWords((prev) => prev.filter((w) => w.id !== word.id));
        setPoolWords((prev) => [...prev, word]);
    };

    // 한 단어 취소 (Undo)
    const handleUndo = () => {
        if (isAnswered || assembledWords.length === 0) return;
        playSound('click', soundEnabled);
        const lastWord = assembledWords[assembledWords.length - 1];
        setAssembledWords((prev) => prev.slice(0, -1));
        setPoolWords((prev) => [...prev, lastWord]);
    };

    // 전체 초기화 (Reset)
    const handleReset = () => {
        if (isAnswered || assembledWords.length === 0) return;
        playSound('click', soundEnabled);
        setPoolWords((prev) => [...prev, ...assembledWords]);
        setAssembledWords([]);
    };

    // 진행 상태 세션 저장
    const saveSession = async (idx: number, currentResults: boolean[]) => {
        try {
            const studentInfoStr = localStorage.getItem('user');
            if (!studentInfoStr) return;
            const studentInfo = JSON.parse(studentInfoStr);
            const isRetry = searchParams.get('mode') === 'retry';

            await fetch('/api/test/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: studentInfo.id,
                    sessionData: {
                        type: 'scramble',
                        step: isRetry ? 'SCRAMBLE_RETRY' : 'BASIC_TEST',
                        words,
                        currentIndex: isRetry ? undefined : idx,
                        currentRetryIndex: isRetry ? idx : undefined,
                        results: isRetry ? undefined : currentResults,
                        retryResults: isRetry ? currentResults : undefined,
                        wrongWords: isRetry ? words : undefined,
                        itemId: searchParams.get('itemId'),
                        start: searchParams.get('start'),
                        end: searchParams.get('end'),
                        curriculumId: searchParams.get('curriculumId'),
                        curriculumItemId: searchParams.get('curriculumItemId'),
                        scheduledDate: searchParams.get('scheduledDate'),
                    },
                }),
            });
        } catch (e) {
            console.error("Save session failed", e);
        }
    };

    // 정답 확인 / 제출
    const handleSubmit = (timeout = false) => {
        if (isAnswered || !words[currentIndex]) return;

        const joinChar = isSingleWord ? '' : ' ';
        const userAnswer = assembledWords.map((w) => w.text).join(joinChar);
        const correctAnswer = words[currentIndex].english;
        // 단어/문장의 전체 조각이 모두 채워졌을 때만 정답 검사 수행 (조각이 덜 채워진 상태는 미완성 오답)
        const isComplete = poolWords.length === 0 && assembledWords.length > 0;
        const correct = !timeout && isComplete && cleanSentence(userAnswer) === cleanSentence(correctAnswer);

        const newResults = [...results, correct];
        setResults(newResults);
        setIsAnswered(true);
        setIsCorrect(correct);

        if (correct) {
            playSound('correct', soundEnabled);
            setCombo((c) => c + 1);
        } else {
            playSound('wrong', soundEnabled);
            setCombo(0);
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }

        saveSession(currentIndex + 1, newResults);

        const delay = correct ? 1200 : 2500;
        setTimeout(() => {
            if (currentIndex < words.length - 1) {
                setCurrentIndex((prev) => prev + 1);
            } else {
                finishTest(newResults);
            }
        }, delay);
    };

    // 시험 종료 처리
    const finishTest = async (finalResults: boolean[]) => {
        const studentInfoStr = localStorage.getItem('user');
        if (!studentInfoStr) return;
        const studentInfo = JSON.parse(studentInfoStr);

        const finalCorrectCount = finalResults.filter((r) => r).length;
        const wrongWords = words.filter((_, i) => !finalResults[i]);
        const score = Math.round((finalCorrectCount / words.length) * 100);

        const itemId = searchParams.get('itemId') || '';
        const start = searchParams.get('start') || '1';
        const end = searchParams.get('end') || `${words.length}`;
        const curriculumId = searchParams.get('curriculumId') || '';
        const curriculumItemId = searchParams.get('curriculumItemId') || '';
        const scheduledDate = searchParams.get('scheduledDate') || new Date().toISOString().split('T')[0];

        // 1. LocalStorage 저장 (결과 화면용)
        const testResult = {
            totalQuestions: words.length,
            correctCount: finalCorrectCount,
            wrongCount: words.length - finalCorrectCount,
            score,
            passed: score === 100,
            wrongWords,
            timestamp: new Date().toISOString(),
            testType: 'scramble',
        };
        localStorage.setItem('testResult', JSON.stringify(testResult));

        // 2. 학습 로그 저장 (타이핑 시험과 동일하게 진도 반영)
        try {
            await fetch('/api/study-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: studentInfo.id,
                    curriculum_id: curriculumId,
                    curriculum_item_id: curriculumItemId,
                    scheduled_date: scheduledDate,
                    status: 'in_progress',
                    test_phase: wrongWords.length > 0 ? 'WRONG_FLASHCARD' : 'BASIC_PASSED',
                    score,
                    wrong_answers: wrongWords
                })
            });
        } catch (logErr) {
            console.error("Study log error:", logErr);
        }

        // 3. 오답이 남아있는 경우 -> WRONG_FLASHCARD 루프
        if (wrongWords.length > 0) {
            await fetch('/api/test/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: studentInfo.id,
                    sessionData: {
                        type: 'scramble',
                        step: 'WRONG_FLASHCARD',
                        wrongWords,
                        itemId,
                        start,
                        end,
                        curriculumId,
                        curriculumItemId,
                        scheduledDate,
                    },
                }),
            });

            // 결과 요약 페이지를 거쳐 오답 플래시카드로 이동
            router.push(
                `/test/result?itemId=${itemId}&start=${start}&end=${end}&curriculumId=${curriculumId}&curriculumItemId=${curriculumItemId}&mode=basic&nextStep=WRONG_FLASHCARD&scheduledDate=${scheduledDate}&testType=scramble`
            );
        } else {
            // 4. 모든 문제를 100% 맞힌 경우 -> 복습 단계(check_review)로 이동!
            router.push(
                `/test/result?nextAction=check_review&scheduledDate=${scheduledDate}&curriculumItemId=${curriculumItemId}&itemId=${itemId}&start=${start}&end=${end}&curriculumId=${curriculumId}&testType=scramble`
            );
        }
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

    if (loading) {
        return (
            <StudentLayout>
                <Center style={{ minHeight: '80vh' }}>
                    <Stack align="center" gap="md">
                        <Loader size="xl" color="yellow" type="dots" />
                        <Text fw={800} c="white">문제를 준비하는 중입니다...</Text>
                    </Stack>
                </Center>
            </StudentLayout>
        );
    }

    if (!currentWord) {
        return (
            <StudentLayout>
                <Container size="sm" py={60}>
                    <Paper p="xl" style={{ border: '3px solid black', textAlign: 'center' }}>
                        <Text fw={800} size="lg">출제할 문장 데이터를 찾을 수 없습니다.</Text>
                        <Button mt="md" onClick={() => router.push('/student/learning')} color="dark">
                            학습 일정으로 돌아가기
                        </Button>
                    </Paper>
                </Container>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <Box
                style={{
                    minHeight: '100%',
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px 10px',
                    width: '100%',
                }}
            >
                <Container size={800} style={{ width: '100%', maxWidth: '800px' }}>
                    <div className="animate-fade-in" style={{ width: '100%' }}>
                        {/* 헤더 & 음소거 토글 */}
                        <Group justify="space-between" align="center" mb={16}>
                            <Group gap="xs">
                                <Badge
                                    size="lg"
                                    color="yellow"
                                    variant="filled"
                                    radius={0}
                                    style={{ border: '2px solid black', color: 'black', fontWeight: 900 }}
                                >
                                    🔀 문장 스크램블
                                </Badge>
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
                            </Group>
                        </Group>

                        {/* 상태 바 (타이머 & 맞힌 개수) */}
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
                                        <Text fw={900} size="lg" c={timeLeft <= 5 ? 'red' : 'violet'}>
                                            {timeLeft}초
                                        </Text>
                                    </Group>

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
                                <Text fw={800} size="xs" c="dimmed">진행률</Text>
                                <Text fw={900} size="xs" c="violet">
                                    {currentIndex + 1} / {words.length}
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

                        {/* 1. 문제 카드 (한글 문장 & 발음 듣기) */}
                        <Paper
                            p="xl"
                            mb={16}
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
                                    문제 {currentWord.no || currentIndex + 1}
                                </Badge>

                                <Tooltip label="영어 문장 원어민 발음 듣기">
                                    <ActionIcon
                                        size="lg"
                                        color="yellow"
                                        variant="filled"
                                        onClick={() => speakSentence(currentWord.english)}
                                        style={{ border: '2px solid black', borderRadius: '0px', color: 'black' }}
                                    >
                                        <IconVolume size={20} />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>

                            <Text
                                size="1.6rem"
                                fw={900}
                                style={{
                                    color: '#0F172A',
                                    lineHeight: 1.4,
                                    letterSpacing: '-0.5px',
                                }}
                            >
                                {currentWord.korean}
                            </Text>
                            <Text size="xs" fw={700} c="dimmed" mt={6}>
                                💡 아래 단어를 순서대로 클릭하여 올바른 영어 문장을 완성하세요.
                            </Text>
                        </Paper>

                        {/* 2. 학생 조립 슬롯 (정답 조립 영역) */}
                        <Paper
                            p="lg"
                            mb={16}
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
                                minHeight: '140px',
                                width: '100%',
                                boxSizing: 'border-box',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-start',
                                transition: 'background-color 0.2s ease',
                            }}
                        >
                            <Text size="xs" fw={800} c="dimmed" mb="xs">
                                ✏️ {isSingleWord ? '내가 조립한 단어 (클릭하면 아래로 돌아갑니다)' : '내가 조립한 문장 (클릭하면 아래로 돌아갑니다)'}
                            </Text>

                            <Box
                                style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '8px',
                                    alignItems: 'center',
                                    alignContent: 'flex-start',
                                    minHeight: '52px',
                                    width: '100%',
                                }}
                            >
                                {assembledWords.length === 0 && (
                                    <Text size="sm" c="gray.5" fw={600} style={{ fontStyle: 'italic', padding: '12px 0' }}>
                                        {isSingleWord ? '아래 철자를 클릭하면 여기에 단어가 차례대로 들어갑니다...' : '아래 단어를 클릭하면 여기에 문장이 차례대로 들어갑니다...'}
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
                                            padding: isSingleWord ? '8px 14px' : '8px 16px',
                                            minWidth: isSingleWord ? '42px' : 'auto',
                                            textAlign: 'center',
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

                            {/* 정답/오답 판정 배너 */}
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
                                                ❌ 오답입니다! (정답을 확인하세요)
                                            </Text>
                                            <Text fw={900} size="1.25rem" style={{ color: '#9333EA', wordBreak: 'break-word' }}>
                                                {currentWord.english}
                                            </Text>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </Paper>

                        {/* 3. 하단: 단어 선택지 풀 (Word Bank) */}
                        <Paper
                            p="lg"
                            mb={16}
                            style={{
                                border: '4px solid black',
                                borderRadius: '0px',
                                background: '#1E293B',
                                boxShadow: '6px 6px 0px #3B82F6',
                                minHeight: '140px',
                                width: '100%',
                                boxSizing: 'border-box',
                            }}
                        >
                            <Text size="xs" fw={800} c="gray.4" mb="sm">
                                {isSingleWord ? '🔀 철자 선택 풀 (클릭하여 위로 올리세요)' : '🔀 단어 선택 풀 (클릭하여 위로 올리세요)'}
                            </Text>

                            <Box
                                style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '10px',
                                    alignItems: 'center',
                                    alignContent: 'flex-start',
                                    minHeight: '52px',
                                    width: '100%',
                                }}
                            >
                                {poolWords.length === 0 && (
                                    <Text size="sm" c="gray.5" fw={600} style={{ fontStyle: 'italic', padding: '12px 0' }}>
                                        모든 조각을 배치했습니다. 아래 정답 확인을 눌러주세요!
                                    </Text>
                                )}
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
                                            padding: isSingleWord ? '8px 14px' : '10px 18px',
                                            minWidth: isSingleWord ? '44px' : 'auto',
                                            textAlign: 'center',
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

                        {/* 4. 조작 버튼군 (초기화 / 취소 / 정답 확인) */}
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
                                    {isSingleWord ? '한 글자 취소' : '한 단어 취소'}
                                </Button>
                            </Group>

                            <button
                                onClick={() => handleSubmit(false)}
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
                    </div>
                </Container>
            </Box>

            {/* 흔들림 애니메이션 CSS */}
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
        </StudentLayout>
    );
}

export default function ScrambleTestPage() {
    return (
        <Suspense
            fallback={
                <StudentLayout>
                    <Center style={{ minHeight: '100vh', background: '#0F172A' }}>
                        <Loader size="xl" color="yellow" type="dots" />
                    </Center>
                </StudentLayout>
            }
        >
            <ScrambleContent />
        </Suspense>
    );
}
