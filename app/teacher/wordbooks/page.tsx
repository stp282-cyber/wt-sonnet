'use client';

import { useState } from 'react';
import {
    Container,
    Title,
    Paper,
    Table,
    Button,
    Group,
    Modal,
    TextInput,
    Stack,
    ActionIcon,
    Text,
    Box,
    FileInput,
    Badge,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
    IconPlus,
    IconEdit,
    IconTrash,
    IconDownload,
    IconUpload,
    IconFileSpreadsheet,
} from '@tabler/icons-react';
import * as XLSX from 'xlsx';

interface Word {
    no: number;
    english: string;
    korean: string;
    major_unit?: string;
    minor_unit?: string;
    unit_name?: string;
}

interface Wordbook {
    id: string;
    title: string;
    word_count: number;
    words: Word[];
    created_at: string;
}

export default function WordbooksPage() {
    const [wordbooks, setWordbooks] = useState<Wordbook[]>([
        {
            id: '1',
            title: '중학 영단어 1000',
            word_count: 50,
            words: [
                { no: 1, english: 'apple', korean: '사과', major_unit: '1단원', minor_unit: '1-1', unit_name: '과일' },
                { no: 2, english: 'banana', korean: '바나나', major_unit: '1단원', minor_unit: '1-1', unit_name: '과일' },
            ],
            created_at: '2024-01-01',
        },
    ]);

    const [modalOpened, setModalOpened] = useState(false);
    const [wordModalOpened, setWordModalOpened] = useState(false);
    const [selectedWordbook, setSelectedWordbook] = useState<Wordbook | null>(null);
    const [editingWord, setEditingWord] = useState<Word | null>(null);

    const wordbookForm = useForm({
        initialValues: {
            title: '',
        },
        validate: {
            title: (value) => (!value ? '단어장 제목을 입력해주세요' : null),
        },
    });

    const wordForm = useForm({
        initialValues: {
            no: 0,
            english: '',
            korean: '',
            major_unit: '',
            minor_unit: '',
            unit_name: '',
        },
        validate: {
            english: (value) => (!value ? '영어 단어를 입력해주세요' : null),
            korean: (value) => (!value ? '한글 뜻을 입력해주세요' : null),
        },
    });

    // Excel 템플릿 다운로드
    const handleDownloadTemplate = () => {
        const template = [
            {
                'No.': 1,
                '교재명': '중학 영단어',
                '대단원': '1단원',
                '소단원': '1-1',
                '단원명': '과일',
                '번호': 1,
                '영어': 'apple',
                '한글': '사과',
            },
            {
                'No.': 2,
                '교재명': '중학 영단어',
                '대단원': '1단원',
                '소단원': '1-1',
                '단원명': '과일',
                '번호': 2,
                '영어': 'banana',
                '한글': '바나나',
            },
        ];

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '단어장 템플릿');
        XLSX.writeFile(wb, '단어장_템플릿.xlsx');

        notifications.show({
            title: '템플릿 다운로드 완료',
            message: '단어장 템플릿이 다운로드되었습니다.',
            color: 'blue',
        });
    };

    // Excel 파일 업로드
    const handleExcelUpload = (file: File | null) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                const words: Word[] = jsonData.map((row: any, index) => ({
                    no: row['번호'] || index + 1,
                    english: row['영어'] || '',
                    korean: row['한글'] || '',
                    major_unit: row['대단원'] || '',
                    minor_unit: row['소단원'] || '',
                    unit_name: row['단원명'] || '',
                }));

                const newWordbook: Wordbook = {
                    id: Date.now().toString(),
                    title: jsonData[0]?.['교재명'] || '새 단어장',
                    word_count: words.length,
                    words: words,
                    created_at: new Date().toISOString(),
                };

                setWordbooks([...wordbooks, newWordbook]);

                notifications.show({
                    title: 'Excel 업로드 완료',
                    message: `${words.length}개의 단어가 등록되었습니다.`,
                    color: 'green',
                });
            } catch (error) {
                notifications.show({
                    title: 'Excel 업로드 실패',
                    message: 'Excel 파일 형식을 확인해주세요.',
                    color: 'red',
                });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    // 단어장 Excel 다운로드
    const handleDownloadWordbook = (wordbook: Wordbook) => {
        const data = wordbook.words.map((word) => ({
            'No.': word.no,
            '교재명': wordbook.title,
            '대단원': word.major_unit || '',
            '소단원': word.minor_unit || '',
            '단원명': word.unit_name || '',
            '번호': word.no,
            '영어': word.english,
            '한글': word.korean,
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, wordbook.title);
        XLSX.writeFile(wb, `${wordbook.title}.xlsx`);

        notifications.show({
            title: '다운로드 완료',
            message: `${wordbook.title}이(가) 다운로드되었습니다.`,
            color: 'blue',
        });
    };

    // 단어장 삭제
    const handleDeleteWordbook = (wordbook: Wordbook) => {
        if (confirm(`${wordbook.title}을(를) 삭제하시겠습니까?`)) {
            setWordbooks(wordbooks.filter((w) => w.id !== wordbook.id));
            notifications.show({
                title: '단어장 삭제 완료',
                message: `${wordbook.title}이(가) 삭제되었습니다.`,
                color: 'red',
            });
        }
    };

    // 단어 추가/수정
    const handleWordSubmit = (values: typeof wordForm.values) => {
        if (!selectedWordbook) return;

        const updatedWordbook = { ...selectedWordbook };

        if (editingWord) {
            // 수정
            updatedWordbook.words = updatedWordbook.words.map((w) =>
                w.no === editingWord.no ? { ...values } : w
            );
        } else {
            // 추가
            const newWord: Word = {
                ...values,
                no: updatedWordbook.words.length + 1,
            };
            updatedWordbook.words.push(newWord);
        }

        updatedWordbook.word_count = updatedWordbook.words.length;

        setWordbooks(wordbooks.map((w) => (w.id === selectedWordbook.id ? updatedWordbook : w)));
        setSelectedWordbook(updatedWordbook);
        setWordModalOpened(false);
        wordForm.reset();

        notifications.show({
            title: editingWord ? '단어 수정 완료' : '단어 추가 완료',
            message: `${values.english}이(가) ${editingWord ? '수정' : '추가'}되었습니다.`,
            color: 'green',
        });
    };

    return (
        <Container size="xl" py={40}>
            <div className="animate-fade-in">
                <Group justify="space-between" mb={30}>
                    <Box>
                        <Title order={1} style={{ fontWeight: 900, marginBottom: '0.5rem' }}>
                            📚 단어장 관리
                        </Title>
                        <Text c="dimmed" size="lg">
                            단어장 등록, Excel 업로드/다운로드, 개별 단어 수정
                        </Text>
                    </Box>
                    <Group>
                        <button
                            onClick={handleDownloadTemplate}
                            style={{
                                background: '#4ECDC4',
                                color: 'white',
                                border: '4px solid black',
                                borderRadius: '12px',
                                boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                                fontSize: '1rem',
                                fontWeight: 900,
                                padding: '1rem 1.5rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                            }}
                        >
                            <IconDownload size={20} />
                            템플릿 다운로드
                        </button>
                        <FileInput
                            placeholder="Excel 파일 선택"
                            accept=".xlsx,.xls"
                            onChange={handleExcelUpload}
                            styles={{
                                input: {
                                    border: '4px solid black',
                                    background: '#FF6B9D',
                                    color: 'white',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                },
                            }}
                            leftSection={<IconUpload size={20} />}
                        />
                    </Group>
                </Group>

                <Paper
                    p="xl"
                    radius="lg"
                    className="neo-card"
                    style={{
                        border: '4px solid black',
                        background: 'white',
                    }}
                >
                    <Table highlightOnHover>
                        <Table.Thead>
                            <Table.Tr style={{ borderBottom: '3px solid black' }}>
                                <Table.Th style={{ fontWeight: 900, fontSize: '1.1rem' }}>단어장 제목</Table.Th>
                                <Table.Th style={{ fontWeight: 900, fontSize: '1.1rem' }}>단어 수</Table.Th>
                                <Table.Th style={{ fontWeight: 900, fontSize: '1.1rem' }}>등록일</Table.Th>
                                <Table.Th style={{ fontWeight: 900, fontSize: '1.1rem', textAlign: 'right' }}>
                                    관리
                                </Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {wordbooks.length === 0 ? (
                                <Table.Tr>
                                    <Table.Td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>
                                        <Text size="lg" c="dimmed">
                                            등록된 단어장이 없습니다. Excel 파일을 업로드해주세요.
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            ) : (
                                wordbooks.map((wordbook) => (
                                    <Table.Tr key={wordbook.id}>
                                        <Table.Td
                                            style={{
                                                fontSize: '1rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                color: '#7950f2',
                                            }}
                                            onClick={() => {
                                                setSelectedWordbook(wordbook);
                                                setModalOpened(true);
                                            }}
                                        >
                                            📖 {wordbook.title}
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge
                                                color="violet"
                                                variant="filled"
                                                size="lg"
                                                style={{ border: '2px solid black' }}
                                            >
                                                {wordbook.word_count}개
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td style={{ fontSize: '1rem' }}>
                                            {new Date(wordbook.created_at).toLocaleDateString('ko-KR')}
                                        </Table.Td>
                                        <Table.Td>
                                            <Group justify="flex-end" gap="xs">
                                                <ActionIcon
                                                    variant="filled"
                                                    color="blue"
                                                    size="lg"
                                                    onClick={() => handleDownloadWordbook(wordbook)}
                                                    style={{ border: '2px solid black' }}
                                                >
                                                    <IconDownload size={18} />
                                                </ActionIcon>
                                                <ActionIcon
                                                    variant="filled"
                                                    color="red"
                                                    size="lg"
                                                    onClick={() => handleDeleteWordbook(wordbook)}
                                                    style={{ border: '2px solid black' }}
                                                >
                                                    <IconTrash size={18} />
                                                </ActionIcon>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))
                            )}
                        </Table.Tbody>
                    </Table>
                </Paper>

                {/* 단어 목록 모달 */}
                <Modal
                    opened={modalOpened}
                    onClose={() => setModalOpened(false)}
                    title={
                        <Title order={3} style={{ fontWeight: 900 }}>
                            📖 {selectedWordbook?.title}
                        </Title>
                    }
                    size="xl"
                    styles={{
                        content: {
                            border: '4px solid black',
                            borderRadius: '15px',
                        },
                    }}
                >
                    <Stack gap="md">
                        <Group justify="space-between">
                            <Text size="lg" fw={700}>
                                총 {selectedWordbook?.word_count}개의 단어
                            </Text>
                            <button
                                onClick={() => {
                                    setEditingWord(null);
                                    wordForm.reset();
                                    setWordModalOpened(true);
                                }}
                                style={{
                                    background: '#FFD93D',
                                    color: 'black',
                                    border: '3px solid black',
                                    borderRadius: '8px',
                                    boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    padding: '0.5rem 1rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                }}
                            >
                                <IconPlus size={16} />
                                단어 추가
                            </button>
                        </Group>

                        <Table>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>No.</Table.Th>
                                    <Table.Th>영어</Table.Th>
                                    <Table.Th>한글</Table.Th>
                                    <Table.Th>단원</Table.Th>
                                    <Table.Th style={{ textAlign: 'right' }}>관리</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {selectedWordbook?.words.map((word) => (
                                    <Table.Tr key={word.no}>
                                        <Table.Td>{word.no}</Table.Td>
                                        <Table.Td style={{ fontWeight: 600 }}>{word.english}</Table.Td>
                                        <Table.Td>{word.korean}</Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c="dimmed">
                                                {word.major_unit} - {word.minor_unit}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group justify="flex-end">
                                                <ActionIcon
                                                    variant="filled"
                                                    color="blue"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditingWord(word);
                                                        wordForm.setValues(word);
                                                        setWordModalOpened(true);
                                                    }}
                                                >
                                                    <IconEdit size={14} />
                                                </ActionIcon>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Stack>
                </Modal>

                {/* 단어 추가/수정 모달 */}
                <Modal
                    opened={wordModalOpened}
                    onClose={() => setWordModalOpened(false)}
                    title={
                        <Title order={4} style={{ fontWeight: 900 }}>
                            {editingWord ? '단어 수정' : '단어 추가'}
                        </Title>
                    }
                    size="md"
                >
                    <form onSubmit={wordForm.onSubmit(handleWordSubmit)}>
                        <Stack gap="md">
                            <TextInput
                                label="영어 단어"
                                placeholder="apple"
                                required
                                {...wordForm.getInputProps('english')}
                                styles={{ input: { border: '3px solid black' } }}
                            />
                            <TextInput
                                label="한글 뜻"
                                placeholder="사과"
                                required
                                {...wordForm.getInputProps('korean')}
                                styles={{ input: { border: '3px solid black' } }}
                            />
                            <TextInput
                                label="대단원"
                                placeholder="1단원"
                                {...wordForm.getInputProps('major_unit')}
                                styles={{ input: { border: '3px solid black' } }}
                            />
                            <TextInput
                                label="소단원"
                                placeholder="1-1"
                                {...wordForm.getInputProps('minor_unit')}
                                styles={{ input: { border: '3px solid black' } }}
                            />
                            <TextInput
                                label="단원명"
                                placeholder="과일"
                                {...wordForm.getInputProps('unit_name')}
                                styles={{ input: { border: '3px solid black' } }}
                            />
                            <Group justify="flex-end" mt="md">
                                <Button variant="outline" onClick={() => setWordModalOpened(false)}>
                                    취소
                                </Button>
                                <button
                                    type="submit"
                                    style={{
                                        background: '#7950f2',
                                        color: 'white',
                                        border: '3px solid black',
                                        borderRadius: '8px',
                                        boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        padding: '0.75rem 1.5rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {editingWord ? '수정하기' : '추가하기'}
                                </button>
                            </Group>
                        </Stack>
                    </form>
                </Modal>
            </div>
        </Container>
    );
}
