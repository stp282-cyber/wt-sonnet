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
  Stack,
  Loader,
  Center,
  Button,
  SimpleGrid,
  Badge
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconBrain, IconCards, IconArrowRight, IconVolume } from '@tabler/icons-react';
import StudentLayout from '../../student/layout';

// Flashcard Component for Review Phase
function ReviewFlashcardView({ questions, onStart }: { questions: any[], onStart: () => void }) {
  const speakWord = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <Box p="xl" style={{ position: 'relative', minHeight: '100%', background: 'transparent' }}>
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
                    marginBottom: '10px',
                    boxShadow: '4px 4px 0px black'
                  }}
                >
                  <Group gap={8}>
                    <IconCards color="black" size={20} stroke={3} />
                    <Text c="black" fw={900} tt="uppercase" size="sm">Learning Phase</Text>
                  </Group>
                </Paper>
                <Title
                  order={1}
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    color: 'white',
                    lineHeight: 1
                  }}
                >
                  Brief<br />
                  <span style={{ color: '#FFD93D' }}>Review</span>
                </Title>
              </Box>

              <Box ta="right">
                <Text fw={700} size="xl" c="white">{questions.length} Words</Text>
                <Text c="dimmed" size="sm" fw={600} style={{ color: '#94a3b8' }}>Review before the test!</Text>
              </Box>
            </Group>

            {/* Grid */}
            <SimpleGrid
              cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
              spacing="lg"
              verticalSpacing="lg"
              style={{ maxHeight: '60vh', overflowY: 'auto', padding: '10px' }} // Scrollable if many
            >
              {questions.map((q, index) => (
                <Paper
                  key={index}
                  p="xl"
                  onClick={() => speakWord(q.english)}
                  style={{
                    border: '3px solid black',
                    borderRadius: '0px',
                    background: 'white',
                    minHeight: '180px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    boxShadow: '4px 4px 0px black',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Text size="1.5rem" fw={900} ta="center" style={{ color: 'black', marginBottom: '8px' }}>
                    {q.english}
                  </Text>
                  <Box style={{ width: '30px', height: '3px', background: '#FFD93D', marginBottom: '8px' }} />
                  <Text size="1.2rem" fw={600} ta="center" style={{ color: '#495057' }}>
                    {q.answer}
                  </Text>
                  <Group gap={4} mt={10} style={{ opacity: 0.4 }}>
                    <IconVolume size={16} />
                  </Group>
                </Paper>
              ))}
            </SimpleGrid>

            {/* Footer - Start Button */}
            <Center mt={20} mb={40}>
              <Button
                onClick={onStart}
                size="xl"
                rightSection={<IconArrowRight size={24} stroke={3} />}
                styles={{
                  root: {
                    background: '#FFD93D',
                    color: 'black',
                    border: '3px solid black',
                    borderRadius: '0px',
                    boxShadow: '8px 8px 0px 0px black',
                    height: '70px',
                    paddingLeft: '40px',
                    paddingRight: '40px',
                    transition: 'all 0.2s'
                  },
                  label: {
                    fontSize: '1.5rem',
                    fontWeight: 900
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  e.currentTarget.style.boxShadow = '10px 10px 0px 0px black';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translate(0, 0)';
                  e.currentTarget.style.boxShadow = '8px 8px 0px 0px black';
                }}
              >
                START TEST
              </Button>
            </Center>
          </Stack>
        </div>
      </Container>
    </Box>
  );
}

function MultipleChoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [phase, setPhase] = useState<'learning' | 'testing'>('learning');

  // Initial Fetch
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
            // Support Resume
            if (isResume && data.session && data.session.session_data.step === 'REVIEW_TEST') {
              const sData = data.session.session_data;
              setQuestions(sData.reviewQuestions || []);
              setCurrentIndex(sData.currentIndex || 0);
              setResults(sData.results || []);

              // Only skip learning if we have actually started answering
              if ((sData.currentIndex || 0) > 0) {
                setPhase('testing');
              } else {
                setPhase('learning');
              }

              setLoading(false);
              return;
            }
          }
        }
      } catch (e) {
        console.error("Session check failed", e);
      }

      // Fresh Start - Fetch Review Words
      const curriculumItemId = searchParams.get('curriculumItemId');
      const wordbookId = searchParams.get('itemId');
      const endLimit = searchParams.get('end');

      if (!curriculumItemId || !wordbookId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/test/review-words?curriculumItemId=${curriculumItemId}&wordbookId=${wordbookId}&currentEnd=${endLimit}`);
        if (!res.ok) throw new Error('Failed to fetch review words');
        const data = await res.json();

        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          setPhase('learning'); // Default to learning on fresh start
          saveSessionState(0, []);
        } else {
          // No review words -> Finish immediately
          finishTest([], true);
        }
      } catch (error) {
        console.error(error);
        notifications.show({ title: 'Error', message: 'Failed to load review test', color: 'red' });
      } finally {
        setLoading(false);
      }
    };
    initTest();
  }, [searchParams]);

  // Check user info once
  const [studentInfo, setStudentInfo] = useState<any>(null);

  useEffect(() => {
    const sStr = localStorage.getItem('user');
    if (sStr) setStudentInfo(JSON.parse(sStr));
  }, []);

  const saveSessionState = async (idx: number, res: boolean[]) => {
    if (!studentInfo) return;

    // Payload reduced: Removed 'reviewQuestions'
    const sessionData = {
      step: 'REVIEW_TEST',
      // reviewQuestions: qs, // REMOVED for performance
      currentIndex: idx,
      results: res,
      itemId: searchParams.get('itemId'),
      start: searchParams.get('start'),
      end: searchParams.get('end'),
      curriculumId: searchParams.get('curriculumId'),
      curriculumItemId: searchParams.get('curriculumItemId'),
      scheduledDate: searchParams.get('scheduledDate')
    };

    try {
      // Fire and forget - don't await to block UI if not needed, but keep await for error handling if critical.
      // Since it's background save, we catch errors silently.
      fetch('/api/test/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentInfo.id,
          sessionData
        })
      }).catch(e => console.error("Background save failed", e));
    } catch (e) {
      console.error("Failed to save session", e);
    }
  };

  const handleAnswer = (choice: string) => {
    if (isAnswered) return;
    setSelectedChoice(choice);
    setIsAnswered(true);

    const currentQ = questions[currentIndex];
    const isCorrect = choice === currentQ.answer;
    const newResults = [...results, isCorrect];
    setResults(newResults);

    // Save in background (no questions array passed)
    saveSessionState(currentIndex + 1, newResults);

    // Dynamic Delay: 200ms for Correct, 1000ms for Wrong
    const delay = isCorrect ? 200 : 1000;

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsAnswered(false);
        setSelectedChoice(null);
      } else {
        finishTest(newResults);
      }
    }, delay);
  };

  const finishTest = async (finalResults: boolean[], forceEmpty = false) => {
    const studentInfoStr = localStorage.getItem('user');
    if (!studentInfoStr) return;
    const studentInfo = JSON.parse(studentInfoStr);

    try {
      if (forceEmpty) {
        // Just mark complete
        await fetch('/api/study-logs', {
          method: 'POST',
          body: JSON.stringify({
            student_id: studentInfo.id,
            curriculum_id: searchParams.get('curriculumId'),
            curriculum_item_id: searchParams.get('curriculumItemId'),
            scheduled_date: searchParams.get('scheduledDate') || new Date().toISOString().split('T')[0],
            status: 'completed',
            test_phase: 'review_test_skipped',
            score: 100
          })
        });
        await fetch(`/api/test/session?studentId=${studentInfo.id}`, { method: 'DELETE' });
        router.push('/student/learning');
        return;
      }

      // Calculate Logic
      const wrongQuestions = questions.filter((_, i) => !finalResults[i]);

      if (wrongQuestions.length > 0) {
        // Go to Wrong Retry
        // Reset Session for Retry
        const sessionData = {
          step: 'REVIEW_WRONG_RETRY',
          reviewWrongQuestions: wrongQuestions,
          itemId: searchParams.get('itemId'),
          start: searchParams.get('start'),
          end: searchParams.get('end'),
          curriculumId: searchParams.get('curriculumId'),
          curriculumItemId: searchParams.get('curriculumItemId'),
          scheduledDate: searchParams.get('scheduledDate')
        };

        await fetch('/api/test/session', {
          method: 'POST',
          body: JSON.stringify({ studentId: studentInfo.id, sessionData })
        });

        const params = new URLSearchParams(searchParams.toString());
        params.set('mode', 'review_wrong');
        router.push(`/test/wrong-retry?${params.toString()}`);
      } else {
        // Complete!
        await fetch('/api/study-logs', {
          method: 'POST',
          body: JSON.stringify({
            student_id: studentInfo.id,
            curriculum_id: searchParams.get('curriculumId'),
            curriculum_item_id: searchParams.get('curriculumItemId'),
            scheduled_date: searchParams.get('scheduledDate') || new Date().toISOString().split('T')[0],
            status: 'completed',
            test_phase: 'review_completed',
            score: 100
          })
        });
        await fetch(`/api/test/session?studentId=${studentInfo.id}`, { method: 'DELETE' });
        router.push('/student/learning');
      }
    } catch (e) {
      console.error("Finish test processing failed", e);
      // Fallback for demo/safety
      router.push('/student/learning');
    }
  };

  if (loading) {
    return <Center h="100vh"><Loader color="yellow" type="dots" /></Center>;
  }

  if (questions.length === 0) {
    return <Center h="100vh"><Text c="white">No questions loaded.</Text></Center>;
  }

  // --- Render Learning Phase ---
  if (phase === 'learning') {
    return <ReviewFlashcardView questions={questions} onStart={() => setPhase('testing')} />;
  }

  const currentQ = questions[currentIndex];

  return (
    <Box p="xl" style={{ position: 'relative', minHeight: '100%', background: 'transparent' }}>
      <Container size={800}>
        <div className="animate-fade-in">
          <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
              <Box>
                <Paper
                  p="xs"
                  style={{
                    background: '#FFD93D',
                    border: '3px solid black',
                    display: 'inline-block',
                    marginBottom: '10px',
                    boxShadow: '4px 4px 0px black'
                  }}
                >
                  <Group gap={8}>
                    <IconBrain color="black" size={20} stroke={3} />
                    <Text c="black" fw={900} tt="uppercase" size="sm">Review Cycle</Text>
                  </Group>
                </Paper>
                <Title
                  order={1}
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    color: 'white',
                    lineHeight: 1
                  }}
                >
                  Cumulative<br />
                  <span style={{ color: '#FFD93D' }}>Review Test</span>
                </Title>
              </Box>

              <Stack align="flex-end" gap="xs">
                <Button
                  onClick={() => {
                    if (window.confirm('시험을 중단하고 학습 홈으로 돌아가시겠습니까?')) {
                      router.push('/student/learning');
                    }
                  }}
                  variant="subtle"
                  color="gray"
                  leftSection={<IconX size={18} />}
                  size="xs"
                  styles={{
                    root: {
                      color: '#94a3b8',
                      '&:hover': { background: 'rgba(255,255,255,0.1)', color: 'white' }
                    }
                  }}
                >
                  나가기
                </Button>
                <Box ta="right">
                  <Text fw={700} size="xl" c="white">{currentIndex + 1} / {questions.length}</Text>
                  <Text c="dimmed" size="sm" fw={600} style={{ color: '#94a3b8' }}>Select the correct answer</Text>
                </Box>
              </Stack>
            </Group>

            {/* Question Card */}
            <Paper
              p={50}
              style={{
                border: '3px solid black',
                borderRadius: '0px',
                background: 'white',
                boxShadow: '8px 8px 0px black',
                minHeight: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Text size="3rem" fw={900} ta="center" style={{ color: 'black' }}>
                {currentQ.english}
              </Text>
            </Paper>

            {/* Choices */}
            <Stack gap="md">
              {currentQ.choices?.map((choice: string, idx: number) => {
                const isSelected = selectedChoice === choice;
                const isCorrect = choice === currentQ.answer;

                let bg = 'white';
                let borderColor = 'black';

                if (isAnswered) {
                  if (isCorrect) {
                    bg = '#D3F9D8'; borderColor = '#2b8a3e';
                  } else if (isSelected && !isCorrect) {
                    bg = '#FFE3E3'; borderColor = '#c92a2a';
                  }
                }

                return (
                  <Button
                    key={idx}
                    onClick={() => handleAnswer(choice)}
                    disabled={isAnswered}
                    fullWidth
                    styles={{
                      root: {
                        height: 'auto',
                        padding: '20px',
                        background: bg,
                        border: `3px solid ${borderColor}`,
                        borderRadius: '0px',
                        color: 'black',
                        boxShadow: isSelected ? 'none' : '4px 4px 0px black',
                        transform: isSelected ? 'translate(2px, 2px)' : 'none',
                        transition: 'all 0.1s'
                      },
                      inner: { justifyContent: 'flex-start' },
                      label: { fontSize: '1.2rem', fontWeight: 700 }
                    }}
                  >
                    {choice}
                    {isAnswered && isCorrect && <IconCheck style={{ marginLeft: 'auto' }} color="#2b8a3e" />}
                    {isAnswered && isSelected && !isCorrect && <IconX style={{ marginLeft: 'auto' }} color="#c92a2a" />}
                  </Button>
                );
              })}
            </Stack>
          </Stack>
        </div>
      </Container>
    </Box>
  );
}

export default function MultipleChoicePage() {
  return (
    <Suspense fallback={
      <Center h="100vh">
        <Loader color="yellow" type="dots" />
      </Center>
    }>
      <StudentLayout>
        <MultipleChoiceContent />
      </StudentLayout>
    </Suspense>
  );
}
