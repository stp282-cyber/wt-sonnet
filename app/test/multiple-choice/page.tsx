'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Title, Paper, Text, Box, Group, Progress, Badge } from '@mantine/core';
import { IconClock, IconCheck, IconX } from '@tabler/icons-react';

interface Word {
  no: number;
  english: string;
  korean: string;
}

export default function MultipleChoiceTestPage() {
  const router = useRouter();

  const [words] = useState<Word[]>([
    { no: 1, english: 'apple', korean: '사과' },
    { no: 2, english: 'banana', korean: '바나나' },
    { no: 3, english: 'orange', korean: '오렌지' },
    { no: 4, english: 'grape', korean: '포도' },
    { no: 5, english: 'watermelon', korean: '수박' },
    { no: 6, english: 'strawberry', korean: '딸기' },
    { no: 7, english: 'peach', korean: '복숭아' },
    { no: 8, english: 'pear', korean: '배' },
  ]);

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [timeLeft, setTimeLeft] = useState(15);

  const correctCount = results.filter((r) => r).length;
  const wrongCount = results.filter((r) => !r).length;
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const generateChoices = (correctWord: Word, allWords: Word[]): string[] => {
    const choices: string[] = [correctWord.english];
    const otherWords = allWords.filter(w => w.no !== correctWord.no);
    const shuffled = [...otherWords].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 3 && i < shuffled.length; i++) {
      choices.push(shuffled[i].english);
    }
    return choices.sort(() => Math.random() - 0.5);
  };

  useEffect(() => {
    const generatedQuestions = words.map((word) => {
      const choices = generateChoices(word, words);
      const correctIndex = choices.indexOf(word.english);
      return { word, choices, correctIndex };
    });
    setQuestions(generatedQuestions);
  }, [words]);

  useEffect(() => {
    if (timeLeft > 0 && !isAnswered && questions.length > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered) {
      handleSubmit(null, true);
    }
  }, [timeLeft, isAnswered, questions]);

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

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedChoice(null);
        setTimeLeft(15);
        setIsAnswered(false);
      } else {
        const finalResults = [...results, isCorrect];
        const finalCorrectCount = finalResults.filter(r => r).length;
        const score = Math.round((finalCorrectCount / questions.length) * 100);
        const testResult = {
          totalQuestions: questions.length,
          correctCount: finalCorrectCount,
          wrongCount: questions.length - finalCorrectCount,
          score,
          passed: score >= 80,
          wrongWords: [],
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem('testResult', JSON.stringify(testResult));
        setTimeout(() => router.push('/test/result'), 1500);
      }
    }, 1500);
  };

  if (questions.length === 0) {
    return <Container size="sm" py={40}><Text>문제를 생성하는 중...</Text></Container>;
  }

  const currentQuestion = questions[currentIndex];
  const numberSymbols = ['①', '②', '③', '④'];

  return (
    <Box style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <Container size={700}>
        <div className="animate-fade-in">
          <Box mb={30} style={{ textAlign: 'center' }}>
            <Title order={1} style={{ color: 'white', fontWeight: 900, fontSize: '2.5rem', textShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)', marginBottom: '1rem' }}>
              ✏️ 4지선다 시험
            </Title>
            <Text size="xl" style={{ color: 'white', fontWeight: 600, textShadow: '2px 2px 0px rgba(0, 0, 0, 0.2)' }}>
              한글 뜻에 맞는 영어 단어를 선택하세요!
            </Text>
          </Box>

          <Group mb={20} justify="space-between">
            <Paper p="md" style={{ border: '4px solid black', borderRadius: '12px', background: 'white', flex: 1 }}>
              <Group gap="xs">
                <IconClock size={24} color="#7950f2" />
                <Text fw={900} size="xl" c={timeLeft <= 3 ? 'red' : 'violet'}>{timeLeft}초</Text>
              </Group>
            </Paper>
            <Paper p="md" style={{ border: '4px solid black', borderRadius: '12px', background: 'white' }}>
              <Group gap="md">
                <Group gap="xs"><IconCheck size={20} color="green" /><Text fw={700} c="green">{correctCount}</Text></Group>
                <Group gap="xs"><IconX size={20} color="red" /><Text fw={700} c="red">{wrongCount}</Text></Group>
              </Group>
            </Paper>
          </Group>

          <Paper p="md" mb={20} style={{ border: '4px solid black', borderRadius: '12px', background: 'white' }}>
            <Group justify="space-between" mb={10}>
              <Text fw={700} size="lg">진행률</Text>
              <Text fw={900} size="lg" c="violet">{currentIndex + 1} / {questions.length}</Text>
            </Group>
            <Progress value={progress} size="xl" radius="xl" styles={{ root: { border: '3px solid black' }, section: { background: 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)' } }} />
          </Paper>

          <Paper p={60} mb={20} style={{ border: '6px solid black', borderRadius: '20px', background: 'white', boxShadow: '12px 12px 0px 0px rgba(0, 0, 0, 1)', textAlign: 'center' }}>
            <Badge size="xl" variant="filled" color="pink" style={{ border: '3px solid black', fontSize: '1.2rem', padding: '1rem 2rem', marginBottom: '2rem' }}>
              문제 {currentQuestion.word.no}
            </Badge>
            <Text size="5rem" fw={900} style={{ color: '#f5576c', marginBottom: '2rem' }}>{currentQuestion.word.korean}</Text>
            <Text size="lg" c="dimmed">영어 단어를 선택하세요</Text>
          </Paper>

          <Box>
            {currentQuestion.choices.map((choice: string, index: number) => {
              const isSelected = selectedChoice === index;
              const isCorrect = index === currentQuestion.correctIndex;
              const showResult = isAnswered;
              let backgroundColor = 'white';
              if (showResult) {
                if (isCorrect) backgroundColor = '#d3f9d8';
                else if (isSelected && !isCorrect) backgroundColor = '#ffe3e3';
              } else if (isSelected) backgroundColor = '#fff3bf';

              return (
                <button key={index} onClick={() => handleChoiceClick(index)} disabled={isAnswered}
                  style={{ width: '100%', background: backgroundColor, border: '4px solid black', borderRadius: '12px', boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)', fontSize: '1.5rem', fontWeight: 700, padding: '1.5rem 2rem', marginBottom: '1rem', cursor: isAnswered ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { if (!isAnswered) e.currentTarget.style.transform = 'translateY(-4px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <Text size="2rem" fw={900}>{numberSymbols[index]}</Text>
                  <Text size="xl" fw={700} style={{ flex: 1, textAlign: 'left' }}>{choice}</Text>
                  {showResult && isCorrect && <IconCheck size={32} color="#37B24D" stroke={3} />}
                  {showResult && isSelected && !isCorrect && <IconX size={32} color="#FA5252" stroke={3} />}
                </button>
              );
            })}
          </Box>
        </div>
      </Container>
    </Box>
  );
}
