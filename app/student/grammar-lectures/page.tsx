'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Container, Title, Group, Paper, Stack,
    Accordion, Text, Box, LoadingOverlay, Grid, AspectRatio
} from '@mantine/core';
import { IconVideo, IconPlayerPlay } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { GrammarBook, GrammarSection } from '@/types/grammar';

// Helper to extract video ID from various YouTube URL formats
const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export default function StudentGrammarPage() {
    const searchParams = useSearchParams();
    const targetBookId = searchParams.get('bookId');

    const [books, setBooks] = useState<GrammarBook[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedSection, setSelectedSection] = useState<GrammarSection | null>(null);

    useEffect(() => {
        fetchLectures();
    }, []);

    const fetchLectures = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/grammar');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setBooks(data.filter((b: GrammarBook) => b.isVisible !== false));
                } else if (data.books) {
                    setBooks(data.books.filter((b: GrammarBook) => b.isVisible !== false));
                } else {
                    setBooks([]);
                }
            } else {
                notifications.show({ title: '오류', message: '데이터를 불러오지 못했습니다.', color: 'red' });
            }
        } catch (e) {
            console.error(e);
            notifications.show({ title: '오류', message: '데이터 로딩 중 오류 발생', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container fluid p="lg" style={{ color: 'white', height: '100%', overflow: 'hidden' }}>
            <LoadingOverlay visible={loading} />

            <Grid gutter="md">
                {/* Left: Navigation (Books & Chapters) */}
                <Grid.Col span={{ base: 12, md: 3 }}>
                    <Paper
                        p="md"
                        style={{
                            backgroundColor: '#1E293B',
                            borderColor: '#334155',
                            height: 'calc(100vh - 120px)',
                            overflowY: 'auto'
                        }}
                        withBorder
                    >
                        <Group mb="lg">
                            <IconVideo size={28} color="#3B82F6" />
                            <Title order={3} style={{ color: 'white' }}>나의 강의실</Title>
                        </Group>

                        <Stack gap="md">
                            {books.map((book) => (
                                <Accordion
                                    key={book.id}
                                    variant="separated"
                                    radius="md"
                                    style={{ borderRadius: '8px' }}
                                    defaultValue={targetBookId === book.id ? book.id : undefined}
                                >
                                    <Accordion.Item value={book.id} style={{ backgroundColor: '#0F172A', border: '1px solid #334155' }}>
                                        <Accordion.Control>
                                            <Text fw={700} c="yellow.4">{book.title}</Text>
                                        </Accordion.Control>
                                        <Accordion.Panel>
                                            <Stack gap="xs">
                                                {book.chapters.map((chapter) => (
                                                    <Box key={chapter.id}>
                                                        <Text size="sm" fw={600} c="gray.4" mb={4} pl={4}>
                                                            {chapter.title}
                                                        </Text>
                                                        {chapter.sections.length > 0 ? (
                                                            <Stack gap={4}>
                                                                {chapter.sections.map((section) => (
                                                                    <Box
                                                                        key={section.id}
                                                                        onClick={() => setSelectedSection(section)}
                                                                        style={{
                                                                            padding: '8px 12px',
                                                                            cursor: 'pointer',
                                                                            borderRadius: '4px',
                                                                            backgroundColor: selectedSection?.id === section.id ? '#3B82F6' : 'transparent',
                                                                            transition: 'all 0.2s',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '8px'
                                                                        }}
                                                                        className="hover:bg-slate-700"
                                                                    >
                                                                        <IconPlayerPlay size={14} color={selectedSection?.id === section.id ? 'white' : '#94A3B8'} />
                                                                        <Text
                                                                            size="sm"
                                                                            c={selectedSection?.id === section.id ? 'white' : 'gray.3'}
                                                                            style={{ flex: 1 }}
                                                                        >
                                                                            {section.title}
                                                                        </Text>
                                                                    </Box>
                                                                ))}
                                                            </Stack>
                                                        ) : (
                                                            <Text size="xs" c="dimmed" pl={8}>강의 없음</Text>
                                                        )}
                                                        <Box mt={8} />
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Accordion.Panel>
                                    </Accordion.Item>
                                </Accordion>
                            ))}
                            {books.length === 0 && !loading && (
                                <Text c="dimmed" ta="center" size="sm">등록된 강의가 없습니다.</Text>
                            )}
                        </Stack>
                    </Paper>
                </Grid.Col>

                {/* Right: Video Player */}
                <Grid.Col span={{ base: 12, md: 9 }}>
                    <Paper
                        p="md"
                        style={{
                            backgroundColor: '#0F172A',
                            borderColor: '#334155',
                            height: 'calc(100vh - 120px)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflowY: 'auto'
                        }}
                        withBorder
                    >
                        {selectedSection ? (
                            <Stack h="100%">
                                <Title order={3} c="white">{selectedSection.title}</Title>
                                {selectedSection.youtubeUrl ? (
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <AspectRatio ratio={16 / 9}>
                                            <iframe
                                                src={`https://www.youtube.com/embed/${getYoutubeId(selectedSection.youtubeUrl)}?modestbranding=1&rel=0`}
                                                title="YouTube video player"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                style={{ borderRadius: '8px', border: '2px solid #334155' }}
                                            />
                                        </AspectRatio>
                                    </div>
                                ) : (
                                    <Box style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Text c="dimmed">동영상 링크가 없습니다.</Text>
                                    </Box>
                                )}
                            </Stack>
                        ) : (
                            <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                                <IconVideo size={64} color="gray" />
                                <Text mt="md" size="lg" c="dimmed">왼쪽 목록에서 강의를 선택하세요</Text>
                            </Box>
                        )}
                    </Paper>
                </Grid.Col>
            </Grid>
        </Container>
    );
}
