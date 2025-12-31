'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Title, Text, Box, Stack, TextInput, PasswordInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { motion } from 'framer-motion';
import { SpotlightEffect } from '@/components/ui/SpotlightEffect';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
    },
    validate: {
      username: (value) => (!value ? 'USERNAME IS REQUIRED!' : null),
      password: (value) => (!value ? 'PASSWORD IS REQUIRED!' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: values.username, password: values.password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login Failed');
      }

      const { user } = await response.json();
      localStorage.setItem('user', JSON.stringify(user));

      notifications.show({
        title: 'WELCOME!',
        message: `Let's start learning, ${user.full_name}!`,
        color: 'blue',
        styles: {
          root: { border: '3px solid black', boxShadow: '4px 4px 0px 0px black' }
        }
      });

      if (user.role === 'teacher' || user.role === 'super_admin') {
        router.push('/teacher/dashboard');
      } else if (user.role === 'student') {
        router.push('/student/home'); // [UX] Moved to static home page for lighter DB load
      }
    } catch (error: any) {
      notifications.show({
        title: 'OOPS!',
        message: error.message || 'Check your info again.',
        color: 'red',
        styles: {
          root: { border: '3px solid black', boxShadow: '4px 4px 0px 0px black' }
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: '#0F172A', // Slate 900 - Dark Background
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Removed the dot pattern for a cleaner spotlight canvas, or make it very subtle
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Spotlight Effect - Purple/Blue Glow */}
      <SpotlightEffect spotlightColor="rgba(139, 92, 246, 0.25)" size={500} />

      {/* Decorative Geometric Shapes (Absolute Positioned) */}
      {/* Top Left Circle - Yellow */}
      <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: '#FACC15', // Mustard Yellow
          border: '4px solid white', // Changed border to white for dark mode contrast
          boxShadow: '0 0 20px rgba(250, 204, 21, 0.4)', // Changed shadow to glow
          zIndex: 1,
        }}
      />

      {/* Bottom Right Square - Purple (Rotated) */}
      <motion.div
        animate={{ rotate: [15, 25, 15] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '8%',
          width: '140px',
          height: '140px',
          background: '#A855F7', // Vivid Purple
          border: '4px solid white',
          boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
          zIndex: 1,
        }}
      />

      {/* Shapes - Pink Circle (Left Bottom) */}
      <motion.div
        animate={{ x: [0, 20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          bottom: '30%',
          left: '-5%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: '#F9A8D4', // Pink
          border: '4px solid white',
          opacity: 0.8,
          zIndex: 1,
        }}
      />

      {/* Main Content Container */}
      <Box style={{ zIndex: 10, width: '100%', maxWidth: '460px', padding: '20px' }}>

        {/* Brand Header */}
        <Box style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Title
              order={1}
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 900,
                fontSize: '3.5rem',
                letterSpacing: '-2px',
                color: 'white', // Changed to white
                lineHeight: 0.9,
                textShadow: '0 0 10px rgba(255,255,255,0.5)',
                marginBottom: '0.5rem',
                fontStyle: 'italic',
              }}
            >
              WORD<span style={{ color: '#60A5FA' }}>TEST</span>
            </Title>
            <Box
              style={{
                background: 'white',
                color: 'black',
                display: 'inline-block',
                padding: '0.25rem 1rem',
                transform: 'rotate(-2deg)',
                boxShadow: '4px 4px 0px 0px #FACC15'
              }}
            >
              <Text fw={800} size="sm" style={{ letterSpacing: '2px' }}>PREMIUM LEARNING PLATFORM</Text>
            </Box>
          </motion.div>
        </Box>

        {/* Login Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
        >
          <Box
            className="neo-card"
            style={{
              padding: '2.5rem',
              backgroundColor: 'white', // Keep card white for contrast
              border: '4px solid white', // White border matching the theme
              // Removed the hard shadow for a more "glowy" feel or keep precise brutalist shadow? 
              // Let's keep the brutalist shadow but maybe color it differently or keep black?
              // On dark bg, black shadow might be lost. Let's make it a colored shadow or kept black if visible.
              // Actually, black shadow on #0F172A is visible but subtle.
              // Let's try a vibrant shadow to pop.
              boxShadow: '8px 8px 0px 0px #3B82F6', // Blue shadow
              borderRadius: '0px',
            }}
          >
            <Stack gap="xl">
              <Box style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <Title order={2} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: '1.8rem', color: 'black' }}>
                  환영합니다!
                </Title>
                <Text c="dimmed" fw={600} size="sm">
                  학습을 시작하려면 로그인하세요
                </Text>
              </Box>

              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="lg">
                  <TextInput
                    label="아이디"
                    placeholder="아이디를 입력하세요"
                    size="lg"
                    required
                    {...form.getInputProps('username')}
                    styles={{
                      input: {
                        height: '56px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        border: '3px solid black',
                        borderRadius: '0px',
                        boxShadow: '4px 4px 0px 0px rgba(0,0,0,0.1)',
                        '&:focus': {
                          boxShadow: '6px 6px 0px 0px black',
                          transform: 'translate(-2px, -2px)',
                        }
                      },
                      label: { fontWeight: 800, fontFamily: "'Montserrat', sans-serif", color: 'black' }
                    }}
                  />

                  <PasswordInput
                    label="비밀번호"
                    placeholder="비밀번호를 입력하세요"
                    size="lg"
                    required
                    {...form.getInputProps('password')}
                    styles={{
                      input: {
                        height: '56px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        border: '3px solid black',
                        borderRadius: '0px',
                        boxShadow: '4px 4px 0px 0px rgba(0,0,0,0.1)',
                        '&:focus': {
                          boxShadow: '6px 6px 0px 0px black',
                          transform: 'translate(-2px, -2px)',
                        }
                      },
                      label: { fontWeight: 800, fontFamily: "'Montserrat', sans-serif", color: 'black' }
                    }}
                  />

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02, x: -2, y: -2, boxShadow: '6px 6px 0px 0px black' }}
                    whileTap={{ scale: 0.98, x: 2, y: 2, boxShadow: '0px 0px 0px 0px black' }}
                    style={{
                      width: '100%',
                      padding: '1.2rem',
                      background: '#2563EB', // Blue
                      color: 'white',
                      border: '3px solid black',
                      fontSize: '1.2rem',
                      fontWeight: 900,
                      fontFamily: "'Montserrat', sans-serif",
                      cursor: loading ? 'not-allowed' : 'pointer',
                      marginTop: '1rem',
                      boxShadow: '4px 4px 0px 0px black',
                      transition: 'background 0.2s',
                    }}
                  >
                    {loading ? '로그인 중...' : '로그인 →'}
                  </motion.button>
                </Stack>
              </form>

              <Box style={{ borderTop: '2px solid #E5E7EB', paddingTop: '1.5rem', textAlign: 'center' }}>
                <Text size="sm" fw={700} c="dimmed">
                  <Text component="span" c="blue" fw={900} style={{ cursor: 'pointer' }}>
                    이스턴영어공부방
                  </Text>
                </Text>
              </Box>
            </Stack>
          </Box>
        </motion.div>
      </Box>

      {/* Footer Copyright */}
      <Text
        style={{
          position: 'absolute',
          bottom: '20px',
          width: '100%',
          textAlign: 'center',
          opacity: 0.5,
          fontWeight: 700,
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          color: 'white', // White text for footer
        }}
      >
        © 2025 WordTest Academy.
      </Text>
    </Box>
  );
}
