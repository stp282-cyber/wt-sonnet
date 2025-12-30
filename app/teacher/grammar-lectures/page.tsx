'use client';

import { useState, useEffect } from 'react';
import {
    Container, Title, Button, Group, TextInput, Paper, Stack,
    Accordion, ActionIcon, Text, Box, LoadingOverlay, Badge
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconPlus, IconTrash, IconDeviceFloppy, IconVideo, IconEdit, IconCheck, IconX, IconMenu2, IconEye, IconEyeOff } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { v4 as uuidv4 } from 'uuid';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GrammarBook, GrammarChapter, GrammarSection } from '@/types/grammar';

export default function TeacherGrammarPage() {
    const [books, setBooks] = useState<GrammarBook[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Initial load
    useEffect(() => {
        fetchLectures();
    }, []);

    const fetchLectures = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/grammar');
            if (res.ok) {
                const data = await res.json();
                // data might be { books: [...] } or just [...] depend on saved structure
                // API route returns `data.content`. If we saved { books: [] }, it returns { books: [] }.
                // If we saved [], it returns [].
                // Let's normalize it.
                if (Array.isArray(data)) {
                    setBooks(data);
                } else if (data.books) {
                    setBooks(data.books);
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

    const saveLectures = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/grammar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ books }), // Save wrapped in object
            });
            if (res.ok) {
                notifications.show({ title: '성공', message: '저장되었습니다.', color: 'green' });
            } else {
                notifications.show({ title: '실패', message: '저장 실패', color: 'red' });
            }
        } catch (e) {
            console.error(e);
            notifications.show({ title: '오류', message: '저장 중 오류 발생', color: 'red' });
        } finally {
            setSaving(false);
        }
    };

    // Helper to add book
    const addBook = () => {
        const title = prompt('새 교재 이름을 입력하세요:');
        if (title) {
            setBooks([...books, { id: uuidv4(), title, chapters: [] }]);
        }
    };

    // Helper to delete book
    const deleteBook = (bookId: string) => {
        if (confirm('정말 이 교재를 삭제하시겠습니까?')) {
            setBooks(books.filter(b => b.id !== bookId));
        }
    };

    // Helper to add chapter
    const addChapter = (bookId: string) => {
        const title = prompt('새 대단원(Chapter) 이름을 입력하세요:');
        if (title) {
            setBooks(books.map(b => {
                if (b.id === bookId) {
                    return { ...b, chapters: [...b.chapters, { id: uuidv4(), title, sections: [] }] };
                }
                return b;
            }));
        }
    };

    // Helper to delete chapter
    const deleteChapter = (bookId: string, chapterId: string) => {
        if (confirm('이 단원을 삭제하시겠습니까?')) {
            setBooks(books.map(b => {
                if (b.id === bookId) {
                    return { ...b, chapters: b.chapters.filter(c => c.id !== chapterId) };
                }
                return b;
            }));
        }
    };

    // Helper to add section (lecture)
    const addSection = (bookId: string, chapterId: string) => {
        setBooks(books.map(b => {
            if (b.id === bookId) {
                return {
                    ...b,
                    chapters: b.chapters.map(c => {
                        if (c.id === chapterId) {
                            return {
                                ...c,
                                sections: [...c.sections, { id: uuidv4(), title: '새 강의', youtubeUrl: '' }]
                            };
                        }
                        return c;
                    })
                };
            }
            return b;
        }));
    };

    // Helper to update section
    const updateSection = (bookId: string, chapterId: string, sectionId: string, field: 'title' | 'youtubeUrl', value: string) => {
        setBooks(books.map(b => {
            if (b.id === bookId) {
                return {
                    ...b,
                    chapters: b.chapters.map(c => {
                        if (c.id === chapterId) {
                            return {
                                ...c,
                                sections: c.sections.map(s => {
                                    if (s.id === sectionId) {
                                        return { ...s, [field]: value };
                                    }
                                    return s;
                                })
                            };
                        }
                        return c;
                    })
                };
            }
            return b;
        }));
    };

    // Helper to delete section
    const deleteSection = (bookId: string, chapterId: string, sectionId: string) => {
        setBooks(books.map(b => {
            if (b.id === bookId) {
                return {
                    ...b,
                    chapters: b.chapters.map(c => {
                        if (c.id === chapterId) {
                            return {
                                ...c,
                                sections: c.sections.filter(s => s.id !== sectionId)
                            };
                        }
                        return c;
                    })
                };
            }
            return b;
        }));
    };

    // Helper to toggle book visibility
    const toggleBookVisibility = (bookId: string) => {
        setBooks(books.map(b => {
            if (b.id === bookId) {
                // If isVisible is undefined, treat it as true (default), so toggling makes it false
                const currentVisibility = b.isVisible !== false;
                return { ...b, isVisible: !currentVisibility };
            }
            return b;
        }));
    };

    const updateBookTitle = (bookId: string, newTitle: string) => {
        setBooks(prevBooks => prevBooks.map(book => {
            if (book.id !== bookId) return book;
            return { ...book, title: newTitle };
        }));
    };

    const updateChapterTitle = (bookId: string, chapterId: string, newTitle: string) => {
        setBooks(prevBooks => prevBooks.map(book => {
            if (book.id !== bookId) return book;
            return {
                ...book,
                chapters: book.chapters.map(chapter =>
                    chapter.id === chapterId ? { ...chapter, title: newTitle } : chapter
                )
            };
        }));
    };

    const onDragEnd = ({ source, destination, type }: DropResult) => {
        if (!destination) return;
        // Optimization: if dropped in the same place
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        // Handle Book Reordering
        if (type === 'BOOK') {
            setBooks(prevBooks => {
                const newBooks = Array.from(prevBooks);
                const [movedBook] = newBooks.splice(source.index, 1);
                newBooks.splice(destination.index, 0, movedBook);
                return newBooks;
            });
            return;
        }

        // Only allow reordering within the same chapter for now (using chapter.id as droppableId)
        if (source.droppableId !== destination.droppableId) return;

        const chapterId = source.droppableId;

        setBooks(prevBooks => prevBooks.map(book => {
            // Find if this book contains the chapter
            const chapterIndex = book.chapters.findIndex(c => c.id === chapterId);
            if (chapterIndex === -1) return book;

            const chapter = book.chapters[chapterIndex];
            const newSections = Array.from(chapter.sections);
            const [moved] = newSections.splice(source.index, 1);
            newSections.splice(destination.index, 0, moved);

            const newChapters = [...book.chapters];
            newChapters[chapterIndex] = { ...chapter, sections: newSections };

            return { ...book, chapters: newChapters };
        }));
    };

    return (
        <Container fluid p="lg" style={{ color: 'white' }}>
            <LoadingOverlay visible={loading} />
            <Group justify="space-between" mb="xl">
                <Group>
                    <IconVideo size={32} color="#FACC15" />
                    <Title order={2} style={{ color: 'white' }}>강의 콘텐츠 관리</Title>
                </Group>
                <Group>
                    <Button leftSection={<IconPlus size={16} />} onClick={addBook} variant="light" color="yellow">
                        교재 추가
                    </Button>
                    <Button
                        leftSection={<IconDeviceFloppy size={16} />}
                        onClick={saveLectures}
                        loading={saving}
                        color="green"
                    >
                        저장하기
                    </Button>
                </Group>
            </Group>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="books-root" type="BOOK">
                    {(provided) => (
                        <Stack gap="lg" ref={provided.innerRef} {...provided.droppableProps}>
                            {books.map((book, index) => (
                                <Draggable key={book.id} draggableId={book.id} index={index}>
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.draggableProps}>
                                            <Paper
                                                p="md"
                                                style={{
                                                    backgroundColor: '#1E293B',
                                                    borderColor: '#334155',
                                                    opacity: book.isVisible === false ? 0.6 : 1
                                                }}
                                                withBorder
                                            >
                                                <Group justify="space-between" mb="md">
                                                    <Group>
                                                        <div {...provided.dragHandleProps} style={{ display: 'flex', alignItems: 'center', cursor: 'grab' }}>
                                                            <IconMenu2 size={20} color="gray" />
                                                        </div>
                                                        <TextInput
                                                            variant="unstyled"
                                                            value={book.title}
                                                            onChange={(e) => updateBookTitle(book.id, e.target.value)}
                                                            styles={{
                                                                input: {
                                                                    fontSize: '1.25rem', // Text size="lg" equivalent approx
                                                                    fontWeight: 700,
                                                                    color: book.isVisible === false ? "var(--mantine-color-gray-5)" : "var(--mantine-color-yellow-4)"
                                                                }
                                                            }}
                                                        />
                                                        {book.isVisible === false && <Badge color="gray">비공개</Badge>}
                                                    </Group>
                                                    <Group>
                                                        <ActionIcon
                                                            variant="subtle"
                                                            color={book.isVisible === false ? "gray" : "blue"}
                                                            onClick={() => toggleBookVisibility(book.id)}
                                                            title={book.isVisible === false ? "노출 켜기" : "노출 끄기"}
                                                        >
                                                            {book.isVisible === false ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                                                        </ActionIcon>
                                                        <Button size="xs" variant="subtle" onClick={() => addChapter(book.id)}>+ 단원 추가</Button>
                                                        <ActionIcon color="red" variant="subtle" onClick={() => deleteBook(book.id)}>
                                                            <IconTrash size={16} />
                                                        </ActionIcon>
                                                    </Group>
                                                </Group>

                                                <Accordion variant="separated" radius="md">
                                                    {book.chapters.map((chapter) => (
                                                        <Accordion.Item key={chapter.id} value={chapter.id} style={{ backgroundColor: '#0F172A' }}>
                                                            <Accordion.Control>
                                                                <Group justify="space-between">
                                                                    <TextInput
                                                                        variant="unstyled"
                                                                        value={chapter.title}
                                                                        onChange={(e) => updateChapterTitle(book.id, chapter.id, e.target.value)}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        styles={{ input: { color: 'white', fontWeight: 600, fontSize: '1rem' } }}
                                                                    />
                                                                    <ActionIcon component="div" role="button" color="red" variant="subtle" onClick={(e) => { e.stopPropagation(); deleteChapter(book.id, chapter.id); }}>
                                                                        <IconTrash size={14} />
                                                                    </ActionIcon>
                                                                </Group>
                                                            </Accordion.Control>
                                                            <Accordion.Panel>
                                                                <Stack>
                                                                    {chapter.sections.length === 0 && <Text c="dimmed" size="sm" ta="center">강의가 없습니다. 아래 버튼을 눌러 추가하세요.</Text>}
                                                                    <Droppable droppableId={chapter.id} type="SECTION">
                                                                        {(provided) => (
                                                                            <div ref={provided.innerRef} {...provided.droppableProps}>
                                                                                {chapter.sections.map((section, index) => (
                                                                                    <Draggable key={section.id} draggableId={section.id} index={index}>
                                                                                        {(provided) => (
                                                                                            <div
                                                                                                ref={provided.innerRef}
                                                                                                {...provided.draggableProps}
                                                                                            >
                                                                                                <Group align="center" grow mb="xs">
                                                                                                    <div {...provided.dragHandleProps} style={{ display: 'flex', alignItems: 'center', cursor: 'grab' }}>
                                                                                                        <IconMenu2 size={16} color="gray" />
                                                                                                    </div>
                                                                                                    <TextInput
                                                                                                        placeholder="강의 제목 (예: 1강 - 명사)"
                                                                                                        value={section.title}
                                                                                                        onChange={(e) => updateSection(book.id, chapter.id, section.id, 'title', e.target.value)}
                                                                                                        styles={{ input: { backgroundColor: '#334155', color: 'white', border: 'none' } }}
                                                                                                    />
                                                                                                    <TextInput
                                                                                                        placeholder="유튜브 URL (예: https://youtu.be/...)"
                                                                                                        value={section.youtubeUrl}
                                                                                                        onChange={(e) => updateSection(book.id, chapter.id, section.id, 'youtubeUrl', e.target.value)}
                                                                                                        styles={{ input: { backgroundColor: '#334155', color: 'white', border: 'none' } }}
                                                                                                    />
                                                                                                    <ActionIcon color="red" variant="subtle" onClick={() => deleteSection(book.id, chapter.id, section.id)} style={{ flexGrow: 0 }}>
                                                                                                        <IconX size={16} />
                                                                                                    </ActionIcon>
                                                                                                </Group>
                                                                                            </div>
                                                                                        )}
                                                                                    </Draggable>
                                                                                ))}
                                                                                {provided.placeholder}
                                                                            </div>
                                                                        )}
                                                                    </Droppable>
                                                                    <Button variant="outline" size="xs" onClick={() => addSection(book.id, chapter.id)} fullWidth style={{ borderColor: '#334155', color: '#94A3B8' }}>
                                                                        + 강의 추가
                                                                    </Button>
                                                                </Stack>
                                                            </Accordion.Panel>
                                                        </Accordion.Item>
                                                    ))}
                                                </Accordion>
                                            </Paper>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                            {books.length === 0 && (
                                <Text c="dimmed" ta="center" py="xl">등록된 교재가 없습니다. '교재 추가' 버튼을 눌러보세요.</Text>
                            )}
                        </Stack>
                    )}
                </Droppable>
            </DragDropContext>
        </Container>
    );
}
