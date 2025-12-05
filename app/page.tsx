'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Box,
  Stack,
  Group,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
    },
    validate: {
      username: (value) => (!value ? '아이디를 입력해주세요' : null),
      password: (value) => (!value ? '비밀번호를 입력해주세요' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      console.log('로그인 시도:', values);

      localStorage.setItem('user', JSON.stringify({
        username: values.username,
        role: 'teacher',
      }));

      notifications.show({
        title: '로그인 성공! 🎉',
        message: '환영합니다!',
        color: 'teal',
      });

      router.push('/teacher/dashboard');
    } catch (error) {
      notifications.show({
        title: '로그인 실패',
        message: '아이디 또는 비밀번호를 확인해주세요',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #12c2e9 0%, #c471ed 50%, #f64f59 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 배경 장식 요소들 */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: '#FFD93D',
          border: '5px solid black',
          boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.3)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          right: '15%',
          width: '80px',
          height: '80px',
          background: '#FF6B9D',
          border: '5px solid black',
          transform: 'rotate(45deg)',
          boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.3)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '20%',
          right: '20%',
          fontSize: '4rem',
          filter: 'drop-shadow(4px 4px 0px rgba(0, 0, 0, 0.3))',
        }}
      >
        ⭐
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '15%',
          fontSize: '3rem',
          filter: 'drop-shadow(4px 4px 0px rgba(0, 0, 0, 0.3))',
        }}
      >
        🎯
      </div>

      <Box style={{ maxWidth: '500px', width: '100%', zIndex: 1 }}>
        <div className="animate-bounce-in">
          {/* 로고 영역 */}
          <Box
            style={{
              textAlign: 'center',
              marginBottom: '2rem',
            }}
          >
            <Box
              style={{
                display: 'inline-block',
                background: '#FFD93D',
                border: '6px solid black',
                borderRadius: '20px',
                padding: '1.5rem 2rem',
                boxShadow: '10px 10px 0px rgba(0, 0, 0, 0.4)',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>📚</div>
              <Title
                order={1}
                style={{
                  fontWeight: 900,
                  fontSize: '2.5rem',
                  color: 'black',
                  margin: 0,
                }}
              >
                Eastern-WordTest
              </Title>
            </Box>
            <Text
              size="xl"
              style={{
                color: 'white',
                fontWeight: 700,
                textShadow: '3px 3px 0px rgba(0, 0, 0, 0.3)',
                fontSize: '1.3rem',
              }}
            >
              재미있게 공부하고 실력 UP! 🚀
            </Text>
          </Box>

          {/* 로그인 폼 */}
          <Paper
            p={40}
            radius="xl"
            style={{
              border: '6px solid black',
              boxShadow: '12px 12px 0px 0px rgba(0, 0, 0, 1)',
              background: 'white',
            }}
          >
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="xl">
                {/* 아이디 입력 */}
                <Box>
                  <Group gap="xs" mb={10}>
                    <Text
                      size="lg"
                      fw={900}
                      style={{
                        color: '#7950f2',
                        fontSize: '1.1rem',
                      }}
                    >
                      👤 아이디
                    </Text>
                  </Group>
                  <TextInput
                    placeholder="한글 이름 또는 아이디"
                    size="xl"
                    required
                    {...form.getInputProps('username')}
                    styles={{
                      input: {
                        border: '4px solid black',
                        fontSize: '1.2rem',
                        padding: '1.8rem 1.2rem',
                        borderRadius: '12px',
                        boxShadow: '5px 5px 0px 0px rgba(0, 0, 0, 0.2)',
                        transition: 'all 0.2s ease',
                        backgroundColor: '#f8f9fa',
                        '&:focus': {
                          boxShadow: '7px 7px 0px 0px #FFD93D',
                          transform: 'translate(-2px, -2px)',
                          backgroundColor: 'white',
                        },
                      },
                    }}
                  />
                </Box>

                {/* 비밀번호 입력 */}
                <Box>
                  <Group gap="xs" mb={10}>
                    <Text
                      size="lg"
                      fw={900}
                      style={{
                        color: '#7950f2',
                        fontSize: '1.1rem',
                      }}
                    >
                      🔒 비밀번호
                    </Text>
                  </Group>
                  <PasswordInput
                    placeholder="비밀번호를 입력하세요"
                    size="xl"
                    required
                    {...form.getInputProps('password')}
                    styles={{
                      input: {
                        border: '4px solid black',
                        fontSize: '1.2rem',
                        padding: '1.8rem 1.2rem',
                        borderRadius: '12px',
                        boxShadow: '5px 5px 0px 0px rgba(0, 0, 0, 0.2)',
                        transition: 'all 0.2s ease',
                        backgroundColor: '#f8f9fa',
                        '&:focus': {
                          boxShadow: '7px 7px 0px 0px #FF6B9D',
                          transform: 'translate(-2px, -2px)',
                          backgroundColor: 'white',
                        },
                      },
                    }}
                  />
                </Box>

                {/* 로그인 버튼 */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: '#FFD93D',
                    color: 'black',
                    border: '5px solid black',
                    borderRadius: '15px',
                    boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
                    fontSize: '1.5rem',
                    fontWeight: 900,
                    padding: '2rem',
                    marginTop: '1rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    opacity: loading ? 0.6 : 1,
                  }}
                  onMouseDown={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translate(8px, 8px)';
                      e.currentTarget.style.boxShadow = '0px 0px 0px 0px rgba(0, 0, 0, 1)';
                    }
                  }}
                  onMouseUp={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translate(0px, 0px)';
                      e.currentTarget.style.boxShadow = '8px 8px 0px 0px rgba(0, 0, 0, 1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translate(0px, 0px)';
                      e.currentTarget.style.boxShadow = '8px 8px 0px 0px rgba(0, 0, 0, 1)';
                    }
                  }}
                >
                  {loading ? '로그인 중...' : '로그인 시작! 🚀'}
                </button>
              </Stack>
            </form>

            {/* 하단 정보 */}
            <Box mt={30}>
              <Group justify="center" gap="xs" mb={15}>
                <Box
                  style={{
                    background: '#FFD93D',
                    border: '3px solid black',
                    borderRadius: '10px',
                    padding: '0.5rem 1rem',
                  }}
                >
                  <Text fw={700} size="sm">
                    📱 모바일 OK
                  </Text>
                </Box>
                <Box
                  style={{
                    background: '#FF6B9D',
                    border: '3px solid black',
                    borderRadius: '10px',
                    padding: '0.5rem 1rem',
                  }}
                >
                  <Text fw={700} size="sm" c="white">
                    🇰🇷 한글 입력
                  </Text>
                </Box>
                <Box
                  style={{
                    background: '#4ECDC4',
                    border: '3px solid black',
                    borderRadius: '10px',
                    padding: '0.5rem 1rem',
                  }}
                >
                  <Text fw={700} size="sm" c="white">
                    ⚡ 빠른 학습
                  </Text>
                </Box>
              </Group>
            </Box>
          </Paper>

          {/* 하단 장식 카드들 */}
          <Group justify="center" mt={30} gap="md">
            <Paper
              p="lg"
              style={{
                border: '4px solid black',
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '15px',
                boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.4)',
              }}
            >
              <Text fw={900} size="lg" ta="center">
                ✨ 재미있는<br />학습
              </Text>
            </Paper>
            <Paper
              p="lg"
              style={{
                border: '4px solid black',
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '15px',
                boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.4)',
              }}
            >
              <Text fw={900} size="lg" ta="center">
                🎯 실력<br />향상
              </Text>
            </Paper>
            <Paper
              p="lg"
              style={{
                border: '4px solid black',
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '15px',
                boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.4)',
              }}
            >
              <Text fw={900} size="lg" ta="center">
                🏆 높은<br />성취감
              </Text>
            </Paper>
          </Group>
        </div>
      </Box>
    </Box>
  );
}
