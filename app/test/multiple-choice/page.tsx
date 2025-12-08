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
  Button
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconBrain } from '@tabler/icons-react';

function MultipleChoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

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
          saveSessionState(data.questions, 0, []);
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

  const saveSessionState = async (qs: any[], idx: number, res: boolean[]) => {
    const studentInfoStr = localStorage.getItem('user');
    if (!studentInfoStr) return;
    const studentInfo = JSON.parse(studentInfoStr);

    const sessionData = {
      step: 'REVIEW_TEST',
      reviewQuestions: qs,
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
      await fetch('/api/test/session', {
        method: 'POST',
        body: JSON.stringify({
          studentId: studentInfo.id,
          sessionData
        })
      });
    } catch (e) {
      console.error("Failed to save session", e);
    }
  };

  const handleAnswer = (choice: string) => {
    if (isAnswered) return;
    setSelectedChoice(choice);
    setIsAnswered(true);

    const currentQ = questions[currentIndex];
    // Ensure answer comparison is safe
    const isCorrect = choice === currentQ.answer;
    const newResults = [...results, isCorrect];
    setResults(newResults);

    saveSessionState(questions, currentIndex + 1, newResults);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsAnswered(false);
        setSelectedChoice(null);
      } else {
        finishTest(newResults);
      }
    }, 1500);
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
      <MultipleChoiceContent />
    </Suspense>
  );
}
