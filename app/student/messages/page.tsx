'use client';

import { useState, useEffect, useRef } from 'react';
import { Container, Title, Paper, Text, Box, Group, Stack, TextInput, Textarea, ScrollArea, Avatar, Loader, Badge, Select } from '@mantine/core';
import { IconSend, IconUser } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface Message {
    id: string;
    sender_id: string;
    recipient_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
    sender: {
        id: string;
        username: string;
        full_name: string;
    };
    recipient: {
        id: string;
        username: string;
        full_name: string;
    };
}

interface User {
    id: string;
    username: string;
    full_name: string;
    role: string;
}

export default function StudentMessagesPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [teachers, setTeachers] = useState<User[]>([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
    const scrollViewport = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setCurrentUser(user);
            fetchTeachers(user.academy_id);
        } else {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (currentUser) {
            fetchMessages();
            // 주기적으로 메시지 갱신 (폴링)
            const interval = setInterval(fetchMessages, 10000);
            return () => clearInterval(interval);
        }
    }, [currentUser]);

    useEffect(() => {
        if (scrollViewport.current) {
            scrollViewport.current.scrollTo({ top: scrollViewport.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    const fetchTeachers = async (academyId: string) => {
        try {
            const response = await fetch(`/api/users?role=teacher&academy_id=${academyId}`);
            if (response.ok) {
                const data = await response.json();
                setTeachers(data.users || []);
                if (data.users.length > 0) {
                    setSelectedTeacherId(data.users[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch teachers:', error);
        }
    };

    const fetchMessages = async () => {
        if (!currentUser) return;
        try {
            // 현재는 모든 메시지를 가져옴. 추후 대화 상대별 필터링 UI가 필요할 수 있음.
            const response = await fetch(`/api/messages?user_id=${currentUser.id}`);
            if (!response.ok) throw new Error('Failed to fetch messages');

            const data = await response.json();
            // 날짜순 정렬 (오래된 게 위로)
            const sortedMessages = (data.messages || []).sort((a: Message, b: Message) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            setMessages(sortedMessages);
        } catch (error: any) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim() || !currentUser || !selectedTeacherId) return;

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender_id: currentUser.id,
                    recipient_id: selectedTeacherId,
                    content: newMessage,
                }),
            });

            if (!response.ok) throw new Error('Failed to send message');

            setNewMessage('');
            fetchMessages(); // 메시지 목록 갱신
        } catch (error: any) {
            notifications.show({
                title: '전송 실패',
                message: error.message || '메시지를 보내지 못했습니다.',
                color: 'red',
            });
        }
    };

    const filteredMessages = messages;

    return (
        <Container size="md" py="xl">
            <Group justify="space-between" mb="lg">
                <Title order={2} style={{ color: 'white' }}>쪽지함</Title>
            </Group>

            {/* 메시지 영역 */}
            <Paper
                p="xl"
                style={{
                    border: '2px solid black',
                    background: 'white',
                    boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
                    height: '600px',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 0,
                }}
            >
                {/* 대화 상대 정보 */}
                <Box
                    mb="md"
                    pb="md"
                    style={{
                        borderBottom: '2px solid black',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}
                >
                    <Box
                        style={{
                            width: '50px',
                            height: '50px',
                            background: 'black',
                            border: '2px solid black',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 0,
                            color: 'white'
                        }}
                    >
                        <IconUser size={28} />
                    </Box>
                    <div>
                        <Select
                            placeholder="선생님을 선택하세요"
                            data={teachers.map(t => ({ value: t.id, label: t.full_name }))}
                            value={selectedTeacherId}
                            onChange={setSelectedTeacherId}
                            allowDeselect={false}
                            styles={{
                                input: { border: '2px solid black', borderRadius: '0px', height: '40px' },
                                wrapper: { marginBottom: '0px' }
                            }}
                        />
                        <Text size="sm" c="dimmed">
                            담당 선생님
                        </Text>
                    </div>
                </Box >

                {/* 메시지 목록 */}
                < ScrollArea style={{ flex: 1 }} mb="md" viewportRef={scrollViewport} >
                    <Stack gap="md">
                        {filteredMessages.length === 0 ? (
                            <Text c="dimmed" ta="center" py="xl">대화 내역이 없습니다.</Text>
                        ) : (
                            filteredMessages.map((message) => {
                                const isMe = message.sender_id === currentUser?.id;
                                return (
                                    <Box
                                        key={message.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: isMe ? 'flex-end' : 'flex-start',
                                        }}
                                    >
                                        <Paper
                                            p="md"
                                            style={{
                                                maxWidth: '70%',
                                                border: '2px solid black',
                                                background: isMe ? '#FFD93D' : '#F1F3F5',
                                                borderRadius: 0,
                                                boxShadow: '4px 4px 0px black',
                                            }}
                                        >
                                            <Text fw={600} c="black">{message.content}</Text>
                                            <Text size="xs" c="dimmed" mt="xs" ta="right">
                                                {new Date(message.created_at).toLocaleString()}
                                            </Text>
                                        </Paper>
                                    </Box>
                                );
                            })
                        )}
                    </Stack>
                </ScrollArea >

                {/* 메시지 입력 */}
                < Group gap="sm" >
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
                                border: '2px solid black',
                                borderRadius: '0px',
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
                            background: 'black',
                            color: 'white',
                            border: '2px solid black',
                            borderRadius: '0px',
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
                </Group >
            </Paper >
        </Container >
    );
}
