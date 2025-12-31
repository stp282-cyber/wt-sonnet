'use client';

import { useState, useEffect } from 'react';
import { Title, Text, Box, Group } from '@mantine/core';
import { motion } from 'framer-motion';

export default function StudentGreeting() {
    const [studentName, setStudentName] = useState('Student');

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setStudentName(user.full_name || user.name || 'Student');
            } catch (e) {
                console.error('Error parsing user', e);
            }
        }
    }, []);

    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: '3rem', position: 'relative', zIndex: 10 }}
        >
            <Group justify="space-between" align="flex-end">
                <Box>
                    <Text
                        size="xl"
                        fw={700}
                        style={{ color: '#94A3B8', fontFamily: "'Montserrat', sans-serif", letterSpacing: '1px' }}
                    >
                        WELCOME BACK,
                    </Text>
                    <Title
                        order={1}
                        style={{
                            color: 'white',
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: '3rem',
                            fontWeight: 900,
                            lineHeight: 1.1,
                            letterSpacing: '-1px'
                        }}
                    >
                        <span style={{ color: '#FACC15', fontStyle: 'italic' }}>{studentName}</span> 님
                    </Title>
                </Box>
                <Box
                    style={{
                        padding: '0.5rem 1rem',
                        border: '2px solid rgba(255,255,255,0.2)',
                        borderRadius: '999px',
                        background: 'rgba(255,255,255,0.05)',
                    }}
                >
                    <Text size="sm" c="gray.3" fw={600}>오늘도 즐거운 영어 학습 되세요!</Text>
                </Box>
            </Group>
        </motion.div>
    );
}
