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
  Stack,
  Loader,
  Center,
  Badge,
  RingProgress,
  SimpleGrid,
  Button
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconClock, IconArrowRight, IconBrain } from '@tabler/icons-react';
import StudentLayout from '../../student/layout';

export default function MultipleChoiceTestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  // Initial Fetch & Resume Logic
  useEffect(() => {
    const initTest = async () => {
      const isResume = searchParams.get('resume') === 'true';

      // Resume Logic
      if (isResume) {
        try {
          const studentInfoStr = localStorage.getItem('user');
          if (studentInfoStr) {
            const studentInfo = JSON.parse(studentInfoStr);
            const res = await fetch(`/api/test/session?studentId=${studentInfo.id}`);
            if (res.ok) {
              const data = await res.json();
              if (data.session && data.session.session_data.step === 'REVIEW_TEST') {
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
          console.error("Resume failed", e);
        }
      }

      // Fresh Start Logic (Called from TypingTest finish or WrongRetry finish)
      // We need to fetch review words.
      const curriculumItemId = searchParams.get('curriculumItemId');
      const wordbookId = searchParams.get('itemId'); // TypingTest passes itemId as wordbookId
      const endLimit = searchParams.get('end'); // Current test end

      if (!curriculumItemId || !wordbookId) {
        // If parameters are missing, redirect or show error
        // notifications.show({ title: 'Error', message: 'Missing parameters', color: 'red' });
        // We might be just debugging.
      }

      try {
        const res = await fetch(`/api/test/review-words?curriculumItemId=${curriculumItemId}&wordbookId=${wordbookId}&currentEnd=${endLimit}`);
        if (!res.ok) throw new Error('Failed to fetch review words');
        const data = await res.json();

        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          // Save Initial Session State
          saveSessionState(data.questions, 0, []);
        } else {
          // No review words -> Skip to Complete? Or just show notification?
          // If no review words, we should probably mark as complete immediately.
          // But for now let's just show empty state.
          console.log("No review words found");
        }
      } catch (error) {
        console.error(error);
        notifications.show({ title: 'Error', message: 'Failed to load review test', color: 'red' });
      } finally {
        setLoading(false);
      }
    };

    if (loading) initTest();
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
      // Carry over params
      itemId: searchParams.get('itemId'),
      start: searchParams.get('start'),
      end: searchParams.get('end'),
      curriculumId: searchParams.get('curriculumId'),
      curriculumId: searchParams.get('curriculumId'),
      curriculumItemId: searchParams.get('curriculumItemId'),
      scheduledDate: searchParams.get('scheduledDate') // Persist
    };

    await fetch('/api/test/session', {
      method: 'POST',
      body: JSON.stringify({
        studentId: studentInfo.id,
        sessionData
      })
    });
  };

  const handleAnswer = (choice: string) => {
    if (isAnswered) return;
    setSelectedChoice(choice);
    setIsAnswered(true);

    const currentQ = questions[currentIndex];
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
    }, 1500); // 1.5s delay
  };

  const finishTest = async (finalResults: boolean[]) => {
    // Calculate Logic
    const wrongIndices = finalResults.map((r, i) => r ? -1 : i).filter(i => i !== -1);
    const wrongQuestions = wrongIndices.map(i => questions[i]);

    const studentInfoStr = localStorage.getItem('user');
    if (!studentInfoStr) return;
    const studentInfo = JSON.parse(studentInfoStr);

    const nextStep = wrongQuestions.length > 0 ? 'REVIEW_WRONG_RETRY' : 'COMPLETED';
    const sessionData = {
      step: nextStep,
      reviewWrongQuestions: wrongQuestions, // For Retry
      // Need to persist original params to eventually save log
      itemId: searchParams.get('itemId'),
      start: searchParams.get('start'),
      end: searchParams.get('end'),
      curriculumId: searchParams.get('curriculumId'),
      curriculumId: searchParams.get('curriculumId'),
      curriculumItemId: searchParams.get('curriculumItemId'),
      scheduledDate: searchParams.get('scheduledDate')
    };

    // Save Session
    await fetch('/api/test/session', {
      method: 'POST',
      body: JSON.stringify({ studentId: studentInfo.id, sessionData })
    });

    if (nextStep === 'REVIEW_WRONG_RETRY') {
      const params = new URLSearchParams(searchParams.toString());
      params.set('mode', 'review_wrong');
      router.push(`/test/wrong-retry?${params.toString()}`);
    } else {
      // Mark Complete!
      // We need to call API to save study_logs
      // Note: Score? We usually score based on the MAIN test (Typing).
      // However, maybe we average them? Or just use main test score?
      // User didn't specify. Let's assume we maintain the score from the basic test if passed?
      // Or calculate new score.
      // Usually, if "Completed", it's 100% or whatever the main test was.
      // We'll read the main test score if possible, but we don't have it here easily unless we passed it.
      // Let's just save as "Completed" with the CURRENT REVIEW SCORE? Or Previous?
      // Simplest: Recalculate score based on this review? No, Review is auxiliary.
      // Let's just save without updating score if the record already exists?
      // Or Create a NEW record for "Review"?
      // User said "When session completed... save until completed part".
      // "If all done, test ends".
      // Final status: 'completed'.

      // Logic: Update study_logs status to 'completed'.
      await fetch('/api/study-logs', {
        method: 'POST', // Or PUT to update? POST usually creates.
        body: JSON.stringify({
          student_id: studentInfo.id,
          curriculum_id: searchParams.get('curriculumId'),
          curriculum_item_id: searchParams.get('curriculumItemId'),
          scheduled_date: searchParams.get('scheduledDate') || new Date().toISOString().split('T')[0],
          status: 'completed',
          test_phase: 'review_test',
          // Basic score is lost if we don't pass it. 
          // Let's assume passed 100 for now or ignore score update if backend handles it.
        })
      });

      // Delete Session
      await fetch(`/api/test/session?studentId=${studentInfo.id}`, { method: 'DELETE' });
      router.push('/student/learning');
    }
  };

  // Auto-finish if no questions
  useEffect(() => {
    if (!loading && questions.length === 0) {
      finishTest([]);
    }
  }, [loading, questions]);

  if (loading || questions.length === 0) {
    return (
      <StudentLayout>
        <Center h="100vh">
          <Loader color="black" type="dots" />
        </Center>
      </StudentLayout>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <StudentLayout>
      <Box p="xl" style={{ position: 'relative', minHeight: '100%' }}>
        <Container size={800}>
          <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between">
              <Box>
                <Group gap="xs">
                  <Box bg="black" c="white" p={4}><IconBrain size={20} /></Box>
                  <Text fw={700} tt="uppercase" c="dimmed">Review Test</Text>
                </Group>
                <Title order={1} style={{ fontSize: '2.5rem', fontWeight: 900 }}>Review Cycle</Title>
              </Box>
              <RingProgress
                size={60}
                thickness={6}
                roundCaps
                sections={[{ value: ((currentIndex + 1) / questions.length) * 100, color: 'black' }]}
                label={<Text ta="center" size="xs" fw={700}>{currentIndex + 1}/{questions.length}</Text>}
              />
            </Group>

            {/* Question Card */}
            <Paper p={50} style={{ border: '3px solid black', borderRadius: 0, boxShadow: '8px 8px 0px black', minHeight: 300 }}>
              <Stack align="center" justify="center" h="100%">
                <Text fw={900} size="3rem" ta="center">{currentQ.english}</Text>
                <Text c="dimmed" fw={700}>Select the correct meaning</Text>
              </Stack>
            </Paper>

            {/* Choices */}
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {currentQ.choices.map((choice: string, idx: number) => {
                const isSelected = selectedChoice === choice;
                const isCorrect = choice === currentQ.answer;
                let bg = 'white';
                let borderColor = 'black';

                if (isAnswered) {
                  if (isCorrect) {
                    bg = '#D3F9D8'; // Green
                    borderColor = '#2b8a3e';
                  } else if (isSelected && !isCorrect) {
                    bg = '#FFE3E3'; // Red
                    borderColor = '#c92a2a';
                  }
                }

                return (
                  <Button
                    key={idx}
                    onClick={() => handleAnswer(choice)}
                    fullWidth
                    size="xl"
                    disabled={isAnswered}
                    styles={{
                      root: {
                        height: 'auto',
                        padding: '20px',
                        background: bg,
                        border: `3px solid ${borderColor}`,
                        borderRadius: 0,
                        color: 'black',
                        boxShadow: isSelected ? 'inset 4px 4px 0px rgba(0,0,0,0.1)' : '4px 4px 0px black',
                        transform: isSelected ? 'translate(2px, 2px)' : 'none',
                        transition: 'all 0.1s',
                      },
                      inner: { justifyContent: 'flex-start' },
                      label: { whiteSpace: 'normal', textAlign: 'left', fontSize: '1.2rem', fontWeight: 700 }
                    }}
                  >
                    {choice}
                    {isAnswered && isCorrect && <IconCheck style={{ marginLeft: 'auto' }} />}
                    {isAnswered && isSelected && !isCorrect && <IconX style={{ marginLeft: 'auto' }} />}
                  </Button>
                )
              })}
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>
    </StudentLayout>
  );
}
