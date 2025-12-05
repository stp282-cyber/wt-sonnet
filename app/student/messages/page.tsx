'use client';

import { useState } from 'react';
import { Container, Title, Paper, Text, Box, Group, Stack, TextInput, Textarea, ScrollArea } from '@mantine/core';
import { IconSend, IconUser } from '@tabler/icons-react';

interface Message {
    id: string;
    sender: 'teacher' | 'student';
    content: string;
    timestamp: string;
}

export default function StudentMessagesPage() {
    const [newMessage, setNewMessage] = useState('');

    // 샘플 메시지 데이터
    const messages: Message[] = [
        {
            id: '1',
            sender: 'teacher',
            content: '안녕하세요! 이번 주 학습 잘 진행되고 있나요?',
            timestamp: '2024-01-15 10:30',
        },
        {
            id: '2',
            sender: 'student',
            content: '네 선생님! 열심히 하고 있어요 😊',
            timestamp: '2024-01-15 14:20',
        },
        {
            id: '3',
            sender: 'teacher',
            content: '좋아요! 오늘 타이핑 시험 점수가 95점이네요. 정말 잘했어요!',
            timestamp: '2024-01-15 15:00',
        },
        {
            id: '4',
            sender: 'student',
            content: '감사합니다! 다음에는 100점 받을게요!',
            timestamp: '2024-01-15 15:10',
        },
    ];

    const handleSend = () => {
        if (newMessage.trim()) {
            // 메시지 전송 로직 (추후 구현)
            console.log('전송:', newMessage);
            setNewMessage('');
        }
    };

    return (
        <Container size="md" py={40}>
            <div className="animate-fade-in">
                {/* 페이지 헤더 */}
                <Box mb={30}>
                    <Title order={1} style={{ fontWeight: 900, marginBottom: '0.5rem' }}>
                        💬 쪽지함
                    </Title>
                    <Text size="lg" c="dimmed">
                        선생님과 대화하세요
                    </Text>
                </Box>

                {/* 메시지 영역 */}
                <Paper
                    p="xl"
                    style={{
                        border: '4px solid black',
                        background: 'white',
                        boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
                        height: '600px',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {/* 대화 상대 정보 */}
                    <Box
                        mb="md"
                        pb="md"
                        style={{
                            borderBottom: '3px solid black',
                        }}
                    >
                        <Group>
                            <Box
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '50%',
                                    background: '#7950f2',
                                    border: '3px solid black',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <IconUser size={28} color="white" />
                            </Box>
                            <div>
                                <Text fw={900} size="lg">
                                    김선생님
                                </Text>
                                <Text size="sm" c="dimmed">
                                    담당 선생님
                                </Text>
                            </div>
                        </Group>
                    </Box>

                    {/* 메시지 목록 */}
                    <ScrollArea style={{ flex: 1 }} mb="md">
                        <Stack gap="md">
                            {messages.map((message) => (
                                <Box
                                    key={message.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: message.sender === 'student' ? 'flex-end' : 'flex-start',
                                    }}
                                >
                                    <Paper
                                        p="md"
                                        style={{
                                            maxWidth: '70%',
                                            border: '3px solid black',
                                            background: message.sender === 'student' ? '#FFD93D' : '#F1F3F5',
                                            borderRadius: message.sender === 'student' ? '20px 20px 0 20px' : '20px 20px 20px 0',
                                        }}
                                    >
                                        <Text fw={600}>{message.content}</Text>
                                        <Text size="xs" c="dimmed" mt="xs" ta="right">
                                            {message.timestamp}
                                        </Text>
                                    </Paper>
                                </Box>
                            ))}
                        </Stack>
                    </ScrollArea>

                    {/* 메시지 입력 */}
                    <Group gap="sm">
                        <Textarea
                            placeholder="메시지를 입력하세요..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            styles={{
                                input: {
                                    border: '3px solid black',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    padding: '1rem',
                                },
                            }}
                            style={{ flex: 1 }}
                            rows={2}
                        />
                        <button
                            onClick={handleSend}
                            style={{
                                background: '#7950f2',
                                color: 'white',
                                border: '3px solid black',
                                borderRadius: '12px',
                                boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                                padding: '1rem 1.5rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontWeight: 700,
                                height: '100%',
                            }}
                        >
                            <IconSend size={20} />
                            전송
                        </button>
                    </Group>
                </Paper>
            </div>
        </Container>
    );
}
