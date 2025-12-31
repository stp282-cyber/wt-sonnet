'use client';

import { useState, useEffect } from 'react';
import {
    Container, Title, Button, Group, TextInput, Paper, Stack,
    Accordion, ActionIcon, Text, Box, LoadingOverlay, Badge, Collapse, Tooltip
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
    IconPlus, IconTrash, IconDeviceFloppy, IconVideo, IconEdit, IconCheck, IconX,
    IconMenu2, IconEye, IconEyeOff, IconChevronDown, IconChevronRight,
    IconArrowUp, IconArrowDown, IconRowInsertTop
} from '@tabler/icons-react';
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
            const res = await fetch('/api/books');
            if (res.ok) {
                const data = await res.json();
                // Map to GrammarBook format, chapters empty initially
                const mappedBooks = data.map((b: any) => ({
                    id: b.id,
                    title: b.title,
                    isVisible: b.is_visible,
                    chapters: [],
                    isLoaded: false,
                    isExpanded: false
                }));
                setBooks(mappedBooks);
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

    const fetchBookDetails = async (bookId: string) => {
        try {
            const res = await fetch(`/api/books/${bookId}`);
            if (res.ok) {
                const data = await res.json();
                const chapters = data.content?.chapters || [];
                setBooks(prev => prev.map(b =>
                    b.id === bookId ? { ...b, chapters, isLoaded: true } : b
                ));
            }
        } catch (e) {
            console.error('Error fetching book details:', e);
            notifications.show({ title: '오류', message: '상세 내용을 불러오지 못했습니다.', color: 'red' });
        }
    };

    const saveLectures = async () => {
        setSaving(true);
        let errorCount = 0;

        try {
            // Save each book individually (sequence + content if loaded)
            // Use Promise.all to do it in parallel
            await Promise.all(books.map(async (book, index) => {
                const payload: any = {
                    id: book.id,
                    title: book.title,
                    is_visible: book.isVisible,
                    sequence: index
                };

                // Only send content if it was loaded (modified or fetched)
                // If not loaded, we don't send content -> API won't update it (keeps existing)
                if (book.isLoaded) {
                    payload.content = { chapters: book.chapters };
                }

                // 1. Try UPDATE (PUT)
                // Note: If the book is new (created on client), PUT might fail if row doesn't exist?
                // My API PUT implementation expects row to exist.
                // So for new books, we must use POST.
                // However, we don't easily know which is new without tracking.
                // Strategy: Try PUT. If 404, try POST.

                let res = await fetch(`/api/books/${book.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.status === 404 || res.status === 400) { // Assuming 404 for not found
                    // 2. Fallback to CREATE (POST)
                    res = await fetch('/api/books', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                }

                if (!res.ok) {
                    errorCount++;
                    console.error(`Failed to save book ${book.title}`);
                }
            }));

            if (errorCount === 0) {
                notifications.show({ title: '저장 완료', message: '모든 변경사항이 저장되었습니다.', color: 'green' });
            } else {
                notifications.show({ title: '일부 저장 실패', message: `${errorCount}개의 교재 저장 중 문제가 발생했습니다.`, color: 'orange' });
            }
        } catch (e) {
            console.error(e);
            notifications.show({ title: '오류', message: '저장 중 치명적 오류 발생', color: 'red' });
        } finally {
            setSaving(false);
        }
    };

    const addBook = () => {
        // Create new book locally
        // It is effectively "Loaded" because it's empty and we hold the truth
        setBooks([...books, {
            id: uuidv4(),
            title: '새 교재',
            chapters: [],
            isVisible: true,
            isExpanded: true,
            isLoaded: true // Important: Mark as loaded so we save its empty content
        }]);
    };

    const deleteBook = async (bookId: string) => {
        if (!confirm('정말 삭제하시겠습니까? 포함된 모든 강의가 삭제됩니다.')) return;

        // Optimistic update
        setBooks(books.filter(b => b.id !== bookId));

        // Delete from server immediately? 
        // Or wait for Save?
        // Existing logic was "Save" button commits everything.
        // But here, if I remove from list, my "Save loop" won't see it to delete it.
        // So I MUST delete from server immediately OR track deleted IDs.
        // Let's delete immediately for simplicity and consistency with Row-per-Book.

        try {
            await fetch(`/api/books/${bookId}`, { method: 'DELETE' });
            notifications.show({ title: '삭제 완료', message: '교재가 삭제되었습니다.', color: 'blue' });
        } catch (e) {
            console.error(e);
            notifications.show({ title: '오류', message: '삭제 실패 (저장되지 않은 새 교재였을 수 있습니다)', color: 'orange' });
        }
    };

    const toggleBookVisibility = (bookId: string) => {
        setBooks(books.map(b => b.id === bookId ? { ...b, isVisible: !(b.isVisible === false) } : b));
    };

    const toggleBookExpansion = (bookId: string) => {
        setBooks(prev => {
            const target = prev.find(b => b.id === bookId);
            if (target && !target.isExpanded && !target.isLoaded) {
                // Trigger Lazy Load
                fetchBookDetails(bookId);
            }
            return prev.map(b => b.id === bookId ? { ...b, isExpanded: !b.isExpanded } : b);
        });
    };

    const addChapter = (bookId: string) => {
        setBooks(books.map(b => {
            if (b.id !== bookId) return b;
            return {
                ...b,
                chapters: [...b.chapters, {
                    id: uuidv4(),
                    title: '새 단원',
                    sections: []
                }]
            };
        }));
    };

    const deleteChapter = (bookId: string, chapterId: string) => {
        if (confirm('이 단원을 삭제하시겠습니까?')) {
            setBooks(books.map(b => {
                if (b.id !== bookId) return b;
                return {
                    ...b,
                    chapters: b.chapters.filter(c => c.id !== chapterId)
                };
            }));
        }
    };

    const addSection = (bookId: string, chapterId: string, index?: number) => {
        setBooks(books.map(b => {
            if (b.id !== bookId) return b;
            return {
                ...b,
                chapters: b.chapters.map(c => {
                    if (c.id !== chapterId) return c;

                    const newSection = {
                        id: uuidv4(),
                        title: '새 강의',
                        youtubeUrl: ''
                    };

                    const newSections = [...c.sections];
                    if (index !== undefined) {
                        newSections.splice(index, 0, newSection);
                    } else {
                        newSections.push(newSection);
                    }

                    return {
                        ...c,
                        sections: newSections
                    };
                })
            };
        }));
    };

    const updateSection = (bookId: string, chapterId: string, sectionId: string, field: keyof GrammarSection, value: string) => {
        setBooks(books.map(b => {
            if (b.id !== bookId) return b;
            return {
                ...b,
                chapters: b.chapters.map(c => {
                    if (c.id !== chapterId) return c;
                    return {
                        ...c,
                        sections: c.sections.map(s => {
                            if (s.id !== sectionId) return s;
                            return { ...s, [field]: value };
                        })
                    };
                })
            };
        }));
    };

    const moveSection = (bookId: string, chapterId: string, sectionIndex: number, direction: 'up' | 'down') => {
        setBooks(books.map(b => {
            if (b.id !== bookId) return b;
            return {
                ...b,
                chapters: b.chapters.map(c => {
                    if (c.id !== chapterId) return c;

                    const newSections = [...c.sections];
                    const targetIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;

                    if (targetIndex < 0 || targetIndex >= newSections.length) return c;

                    const [moved] = newSections.splice(sectionIndex, 1);
                    newSections.splice(targetIndex, 0, moved);

                    return { ...c, sections: newSections };
                })
            };
        }));
    };

    const deleteSection = (bookId: string, chapterId: string, sectionId: string) => {
        if (confirm('이 강의를 삭제하시겠습니까?')) {
            setBooks(books.map(b => {
                if (b.id !== bookId) return b;
                return {
                    ...b,
                    chapters: b.chapters.map(c => {
                        if (c.id !== chapterId) return c;
                        return {
                            ...c,
                            sections: c.sections.filter(s => s.id !== sectionId)
                        };
                    })
                };
            }));
        }
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

        // Handle Section Reordering
        if (type === 'SECTION') {
            // Only allow reordering within the same chapter for now
            if (source.droppableId !== destination.droppableId) return;

            const chapterId = source.droppableId;

            setBooks(prevBooks => prevBooks.map(book => {
                const chapterIndex = book.chapters.findIndex(c => c.id === chapterId);
                if (chapterIndex === -1) return book;

                const chapter = book.chapters[chapterIndex];
                const newSections = [...chapter.sections];
                const [moved] = newSections.splice(source.index, 1);
                newSections.splice(destination.index, 0, moved);

                const newChapters = [...book.chapters];
                newChapters[chapterIndex] = { ...chapter, sections: newSections };

                return { ...book, chapters: newChapters };
            }));
        }
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
                                                        <div {...provided.dragHandleProps} style={{ display: 'flex', alignItems: 'center', cursor: 'grab', marginRight: '8px' }}>
                                                            <IconMenu2 size={20} color="gray" />
                                                        </div>
                                                        <ActionIcon
                                                            variant="subtle"
                                                            color="gray"
                                                            onClick={() => toggleBookExpansion(book.id)}
                                                        >
                                                            {book.isExpanded ? <IconChevronDown size={20} /> : <IconChevronRight size={20} />}
                                                        </ActionIcon>
                                                        <TextInput
                                                            variant="unstyled"
                                                            value={book.title}
                                                            onChange={(e) => updateBookTitle(book.id, e.target.value)}
                                                            onClick={(e) => e.stopPropagation()} // Keep editing focus
                                                            styles={{
                                                                input: {
                                                                    fontSize: '1.25rem',
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

                                                <Collapse in={book.isExpanded || false}>
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
                                                                                                        <Group gap={4} style={{ flexGrow: 0 }}>
                                                                                                            <Tooltip label="이 위치에 강의 추가">
                                                                                                                <ActionIcon variant="subtle" color="teal" onClick={() => addSection(book.id, chapter.id, index)}>
                                                                                                                    <IconRowInsertTop size={16} />
                                                                                                                </ActionIcon>
                                                                                                            </Tooltip>
                                                                                                            <ActionIcon
                                                                                                                variant="subtle"
                                                                                                                color="gray"
                                                                                                                disabled={index === 0}
                                                                                                                onClick={() => moveSection(book.id, chapter.id, index, 'up')}
                                                                                                                title="위로 이동"
                                                                                                            >
                                                                                                                <IconArrowUp size={16} />
                                                                                                            </ActionIcon>
                                                                                                            <ActionIcon
                                                                                                                variant="subtle"
                                                                                                                color="gray"
                                                                                                                disabled={index === chapter.sections.length - 1}
                                                                                                                onClick={() => moveSection(book.id, chapter.id, index, 'down')}
                                                                                                                title="아래로 이동"
                                                                                                            >
                                                                                                                <IconArrowDown size={16} />
                                                                                                            </ActionIcon>
                                                                                                            <ActionIcon color="red" variant="subtle" onClick={() => deleteSection(book.id, chapter.id, section.id)}>
                                                                                                                <IconX size={16} />
                                                                                                            </ActionIcon>
                                                                                                        </Group>
                                                                                                    </Group>
                                                                                                </div>
                                                                                            )}
                                                                                        </Draggable>
                                                                                    ))}
                                                                                    {provided.placeholder}
                                                                                </div>
                                                                            )}
                                                                        </Droppable>
                                                                        <Button variant="outline" size="xs" mt="sm" onClick={() => addSection(book.id, chapter.id)} leftSection={<IconPlus size={14} />}>
                                                                            강의 추가 (맨 아래)
                                                                        </Button>
                                                                    </Stack>
                                                                </Accordion.Panel>
                                                            </Accordion.Item>
                                                        ))}
                                                    </Accordion>
                                                </Collapse>
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
