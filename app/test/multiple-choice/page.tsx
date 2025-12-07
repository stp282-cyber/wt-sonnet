'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Title, Paper, Text, Box, Group, Progress, Badge, Stack, Center, Loader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconClock, IconCheck, IconX, IconAlertTriangle } from '@tabler/icons-react';
import StudentLayout from '../../student/layout';

interface Word {
  no: number;
  english: string;
  korean: string;
}

export default function MultipleChoiceTestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [words, setWords] = useState<Word[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [timeLeft, setTimeLeft] = useState(15);
  const [loading, setLoading] = useState(true);

  // Load Review Words
  useEffect(() => {
    const savedReviewWords = localStorage.getItem('reviewWords');
    if (savedReviewWords) {
      const parsedWords = JSON.parse(savedReviewWords);
      if (parsedWords.length > 0) {
        setWords(parsedWords);
      } else {
        notifications.show({ title: '알림', message: '복습할 단어가 없습니다.', color: 'blue' });
        router.push('/student/learning');
      }
    } else {
      // Fallback for direct testing if needed, or redirect
      notifications.show({ title: '알림', message: '복습할 단어가 없습니다.', color: 'blue' });
      router.push('/student/learning');
    }
    setLoading(false);
  }, [router]);

  const correctCount = results.filter((r) => r).length;
  const wrongCount = results.filter((r) => !r).length;
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const generateChoices = (correctWord: Word, allWords: Word[]): string[] => {
    const choices: string[] = [correctWord.english];
    // Filter out the correct word to pick distractors
    const otherWords = allWords.filter(w => w.no !== correctWord.no);

    // If not enough words for choices, use dummy words or duplicates (fallback)
    // Assuming sufficient pool for now, but safe fallback:
    const pool = otherWords.length > 0 ? otherWords : [{ english: 'apple' }, { english: 'banana' }, { english: 'grape' }]; // Fallback

    // Shuffle pool
    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);

    for (let i = 0; i < 3 && i < shuffledPool.length; i++) {
      // @ts-ignore
      choices.push(shuffledPool[i].english);
    }

    // If still less than 4, pad with dummies
    while (choices.length < 4) {
      choices.push(`Option ${choices.length + 1}`);
    }

    return choices.sort(() => Math.random() - 0.5);
  };

  useEffect(() => {
    if (words.length > 0) {
      const generatedQuestions = words.map((word) => {
        const choices = generateChoices(word, words);
        const correctIndex = choices.indexOf(word.english);
        return { word, choices, correctIndex };
      });
      setQuestions(generatedQuestions);
    }
  }, [words]);

  useEffect(() => {
    if (!loading && questions.length > 0 && timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered && !loading && questions.length > 0) {
      handleSubmit(null, true);
    }
  }, [timeLeft, isAnswered, questions, loading]);

  const handleChoiceClick = (index: number) => {
    if (isAnswered) return;
    setSelectedChoice(index);
    handleSubmit(index, false);
  };

  const handleSubmit = (choiceIndex: number | null, timeout: boolean) => {
    const currentQuestion = questions[currentIndex];
    const isCorrect = choiceIndex === currentQuestion.correctIndex;
    setResults([...results, isCorrect]);
    setIsAnswered(true);

    // Sound
    if (isCorrect) {
      new Audio('/sounds/correct.mp3').play().catch(() => { });
    } else {
      new Audio('/sounds/wrong.mp3').play().catch(() => { });
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedChoice(null);
        setTimeLeft(15);
        setIsAnswered(false);
      } else {
        // Finish Test
        const finalResults = [...results, isCorrect];
        const finalCorrectCount = finalResults.filter(r => r).length;
        const finalWrongCount = questions.length - finalCorrectCount;
        const score = Math.round((finalCorrectCount / questions.length) * 100);

        // Find Wrong Words
        const wrongWords = questions
          .filter((_, idx) => !finalResults[idx])
          .map(q => q.word);

        const testResult = {
          totalQuestions: questions.length,
          correctCount: finalCorrectCount,
          wrongCount: finalWrongCount,
          score,
          passed: score === 100, // Strict? Or 80? Usually score doesn't matter for "passed" flag as much as wrongWords list
          wrongWords: wrongWords,
          timestamp: new Date().toISOString(),
        };

        localStorage.setItem('testResult', JSON.stringify(testResult));

        // Redirect to Result Page with nextAction
        const nextAction = searchParams.get('nextAction');
        const url = nextAction ? `/test/result?nextAction=${nextAction}` : '/test/result';
        router.push(url);
      }
    }, 1500); // Wait 1.5s to show result
  };

  if (loading || questions.length === 0) {
    return (
      <StudentLayout>
        <Center h="100vh" bg="white">
          <Stack align="center">
            <Loader color="violet" type="dots" />
            <Text>Preparing Review Test...</Text>
          </Stack>
        </Center>
      </StudentLayout>
    );
  }

  const currentQuestion = questions[currentIndex];
  const numberSymbols = ['①', '②', '③', '④'];

  return (
    <StudentLayout>
      <Box style={{ minHeight: '100%', background: '#ffffff', padding: '40px 20px', position: 'relative' }}>
        <Container size={800}>
          {/* Header */}
          <Box mb={30} style={{ textAlign: 'center' }}>
            <Title order={1} style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.5rem' }}>
              Multiple Choice
              <Badge size="lg" color="violet" variant="filled" ml={10} style={{ verticalAlign: 'middle', border: '2px solid black' }}>REVIEW</Badge>
            </Title>
            <Text size="xl" fw={700} c="dimmed">
              Select the correct English word!
            </Text>
          </Box>

          {/* Status Bar */}
          <Group mb={20} justify="space-between" align="stretch">
            <Paper p="md" style={{ border: '4px solid black', background: 'white', flex: 1, boxShadow: '4px 4px 0px black' }}>
              <Group gap="xs" justify="center">
                <IconClock size={28} />
                <Text fw={900} size="xl" c={timeLeft <= 3 ? 'red' : 'black'}>{timeLeft}s</Text>
              </Group>
            </Paper>
            <Paper p="md" style={{ border: '4px solid black', background: 'white', flex: 1, boxShadow: '4px 4px 0px black' }}>
              <Group gap="xl" justify="center">
                <Group gap="xs"><IconCheck size={24} color="green" stroke={3} /><Text fw={900} size="lg">{correctCount}</Text></Group>
                <Group gap="xs"><IconX size={24} color="red" stroke={3} /><Text fw={900} size="lg">{wrongCount}</Text></Group>
              </Group>
            </Paper>
          </Group>

          {/* Question Card */}
          <Paper p={50} mb={30} style={{
            border: '4px solid black',
            background: 'white',
            boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
            textAlign: 'center',
            minHeight: '250px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <Badge
              size="xl"
              variant="filled"
              color="pink"
              radius="xs"
              style={{ border: '2px solid black', position: 'absolute', top: 20, left: 20 }}
            >
              Q.{currentIndex + 1}
            </Badge>

            <Text size="4rem" fw={900} style={{ color: 'black', lineHeight: 1.2 }}>
              {currentQuestion.word.korean}
            </Text>
          </Paper>

          {/* Choices */}
          <Stack gap="md">
            {currentQuestion.choices.map((choice: string, index: number) => {
              const isSelected = selectedChoice === index;
              const isCorrect = index === currentQuestion.correctIndex;
              const showResult = isAnswered;

              let backgroundColor = 'white';
              let borderColor = 'black';
              let textColor = 'black';

              if (showResult) {
                if (isCorrect) {
                  backgroundColor = '#D3F9D8'; // Green
                  // textColor = 'green';
                } else if (isSelected && !isCorrect) {
                  backgroundColor = '#FFE3E3'; // Red
                  // textColor = 'red';
                }
              } else if (isSelected) {
                backgroundColor = '#FFF9DB'; // Yellow
              }

              return (
                <button key={index}
                  onClick={() => handleChoiceClick(index)}
                  disabled={isAnswered}
                  style={{
                    width: '100%',
                    background: backgroundColor,
                    border: `4px solid ${borderColor}`,
                    padding: '1.5rem 2rem',
                    cursor: isAnswered ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    transition: 'transform 0.1s',
                    boxShadow: isSelected || (showResult && isCorrect) ? 'none' : '6px 6px 0px black',
                    transform: isSelected || (showResult && isCorrect) ? 'translate(4px, 4px)' : 'none',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!isAnswered) {
                      e.currentTarget.style.transform = 'translate(-2px, -2px)';
                      e.currentTarget.style.boxShadow = '8px 8px 0px black';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isAnswered && !isSelected) {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '6px 6px 0px black';
                    }
                  }}
                >
                  <Text size="2rem" fw={900} style={{ width: '40px' }}>{numberSymbols[index]}</Text>
                  <Text size="xl" fw={700} style={{ flex: 1, textAlign: 'left', color: textColor }}>{choice}</Text>

                  {showResult && isCorrect && <IconCheck size={32} color="green" stroke={4} style={{ position: 'absolute', right: 20 }} />}
                  {showResult && isSelected && !isCorrect && <IconX size={32} color="red" stroke={4} style={{ position: 'absolute', right: 20 }} />}
                </button>
              );
            })}
          </Stack>

          {/* Progress Bar */}
          <Box mt={40} style={{ border: '3px solid black', height: '16px', background: '#eee' }}>
            <Box style={{ width: `${progress}%`, height: '100%', background: '#7048E8', transition: 'width 0.3s' }} />
          </Box>
        </Container>
      </Box>
    </StudentLayout>
  );
}
