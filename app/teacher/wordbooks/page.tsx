'use client';

import { useState, useEffect, useMemo } from 'react';
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
    Badge,
    FileButton,
    Select,
    ScrollArea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
    IconEdit,
    IconTrash,
    IconDownload,
    IconUpload,
    IconFileSpreadsheet,
    IconPlus,
    IconSearch,
    IconFilter,
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
    const [wordbooks, setWordbooks] = useState<Wordbook[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpened, setModalOpened] = useState(false);
    const [wordModalOpened, setWordModalOpened] = useState(false);
    const [selectedWordbook, setSelectedWordbook] = useState<Wordbook | null>(null);
    const [editingWord, setEditingWord] = useState<Word | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMajorUnit, setSelectedMajorUnit] = useState<string | null>(null);
    const [selectedMinorUnit, setSelectedMinorUnit] = useState<string | null>(null);

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

    // 단어장 목록 로드
    const fetchWordbooks = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/wordbooks');
            if (!response.ok) throw new Error('Failed to fetch wordbooks');

            const data = await response.json();

            // 각 단어장의 상세 정보 로드 (단어 포함)
            const wordbooksWithWords = await Promise.all(
                (data.wordbooks || []).map(async (wb: any) => {
                    const detailResponse = await fetch(`/api/wordbooks/${wb.id}`);
                    if (detailResponse.ok) {
                        const detailData = await detailResponse.json();
                        return detailData.wordbook;
                    }
                    return wb;
                })
            );

            setWordbooks(wordbooksWithWords);
        } catch (error: any) {
            notifications.show({
                title: '오류',
                message: error.message || '단어장 목록을 불러오는데 실패했습니다.',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWordbooks();
    }, []);

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
    const handleExcelUpload = async (file: File | null) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
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

                const title = (jsonData[0] as any)?.['교재명'] || '새 단어장';

                // API로 단어장 생성
                const response = await fetch('/api/wordbooks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, words }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to create wordbook');
                }

                notifications.show({
                    title: 'Excel 업로드 완료',
                    message: `${words.length}개의 단어가 등록되었습니다.`,
                    color: 'green',
                });

                fetchWordbooks(); // 목록 새로고침
            } catch (error: any) {
                notifications.show({
                    title: 'Excel 업로드 실패',
                    message: error.message || 'Excel 파일 형식을 확인해주세요.',
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
    const handleDeleteWordbook = async (wordbook: Wordbook) => {
        if (!confirm(`${wordbook.title}을(를) 삭제하시겠습니까?`)) return;

        try {
            const response = await fetch(`/api/wordbooks/${wordbook.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete wordbook');
            }

            notifications.show({
                title: '단어장 삭제 완료',
                message: `${wordbook.title}이(가) 삭제되었습니다.`,
                color: 'red',
            });

            // 모달 닫기
            setModalOpened(false);
            setSelectedWordbook(null);

            fetchWordbooks(); // 목록 새로고침
        } catch (error: any) {
            notifications.show({
                title: '오류',
                message: error.message || '삭제에 실패했습니다.',
                color: 'red',
            });
        }
    };

    // 단어 추가/수정
    const handleWordSubmit = async (values: typeof wordForm.values) => {
        if (!selectedWordbook) return;

        try {
            const updatedWords = editingWord
                ? selectedWordbook.words.map((w) => (w.no === editingWord.no ? { ...values } : w))
                : [...selectedWordbook.words, { ...values, no: selectedWordbook.words.length + 1 }];

            // API로 단어장 수정
            const response = await fetch(`/api/wordbooks/${selectedWordbook.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ words: updatedWords }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update wordbook');
            }

            notifications.show({
                title: editingWord ? '단어 수정 완료' : '단어 추가 완료',
                message: `${values.english}이(가) ${editingWord ? '수정' : '추가'}되었습니다.`,
                color: 'green',
            });

            setWordModalOpened(false);
            wordForm.reset();
            fetchWordbooks(); // 목록 새로고침

            // 선택된 단어장 업데이트
            const detailResponse = await fetch(`/api/wordbooks/${selectedWordbook.id}`);
            if (detailResponse.ok) {
                const detailData = await detailResponse.json();
                setSelectedWordbook(detailData.wordbook);
            }
        } catch (error: any) {
            notifications.show({
                title: '오류',
                message: error.message || '작업에 실패했습니다.',
                color: 'red',
            });
        }
    };

    // 대단원 목록 추출
    const majorUnits = useMemo(() => {
        if (!selectedWordbook) return [];
        const units = new Set(
            selectedWordbook.words
                .map(w => w.major_unit)
                .filter(unit => unit && unit.trim() !== '')
        );
        return Array.from(units).sort();
    }, [selectedWordbook]);

    // 소단원 목록 추출 (선택된 대단원에 따라)
    const minorUnits = useMemo(() => {
        if (!selectedWordbook) return [];
        const filtered = selectedMajorUnit
            ? selectedWordbook.words.filter(w => w.major_unit === selectedMajorUnit)
            : selectedWordbook.words;
        const units = new Set(
            filtered
                .map(w => w.minor_unit)
                .filter(unit => unit && unit.trim() !== '')
        );
        return Array.from(units).sort();
    }, [selectedWordbook, selectedMajorUnit]);

    // 필터링 및 검색된 단어 목록
    const filteredWords = useMemo(() => {
        if (!selectedWordbook) return [];

        let filtered = [...selectedWordbook.words];

        // 대단원 필터
        if (selectedMajorUnit) {
            filtered = filtered.filter(w => w.major_unit === selectedMajorUnit);
        }

        // 소단원 필터
        if (selectedMinorUnit) {
            filtered = filtered.filter(w => w.minor_unit === selectedMinorUnit);
        }

        // 검색어 필터
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(w =>
                w.english.toLowerCase().includes(query) ||
                w.korean.toLowerCase().includes(query) ||
                w.major_unit?.toLowerCase().includes(query) ||
                w.minor_unit?.toLowerCase().includes(query) ||
                w.unit_name?.toLowerCase().includes(query)
            );
        }

        // 번호순으로 정렬
        return filtered.sort((a, b) => a.no - b.no);
    }, [selectedWordbook, selectedMajorUnit, selectedMinorUnit, searchQuery]);

    return (
        <Container size="xl" py={40}>
            <div className="animate-fade-in">
                <Group justify="space-between" mb={30}>
                    <Box>
                        <Title order={1} style={{ fontWeight: 900, marginBottom: '0.5rem' }}>
                            단어장 관리
                        </Title>
                        <Text c="dimmed" size="lg">
                            단어장 등록, Excel 업로드/다운로드, 개별 단어 수정
                        </Text>
                    </Box>
                    <Group>
                        <button
                            onClick={handleDownloadTemplate}
                            style={{
                                background: '#FFFFFF',
                                color: 'black',
                                border: '2px solid black',
                                borderRadius: '0px',
                                boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
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
                        <FileButton onChange={handleExcelUpload} accept=".xlsx,.xls">
                            {(props) => (
                                <button
                                    {...props}
                                    style={{
                                        background: '#FFD93D',
                                        color: 'black',
                                        border: '2px solid black',
                                        borderRadius: '0px',
                                        boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                                        fontSize: '1rem',
                                        fontWeight: 900,
                                        padding: '1rem 1.5rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                    }}
                                >
                                    <IconUpload size={20} />
                                    Excel 파일 선택
                                </button>
                            )}
                        </FileButton>
                    </Group>
                </Group>

                <Paper
                    p="xl"
                    className="neo-card"
                    style={{
                        border: '2px solid black',
                        borderRadius: '0px',
                        background: 'white',
                    }}
                >
                    <Table highlightOnHover>
                        <Table.Thead>
                            <Table.Tr style={{ borderBottom: '2px solid black' }}>
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
                                                color: 'black',
                                            }}
                                            onClick={() => {
                                                setSelectedWordbook(wordbook);
                                                setModalOpened(true);
                                            }}
                                        >
                                            {wordbook.title}
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge
                                                color="yellow"
                                                variant="filled"
                                                size="lg"
                                                radius="xs"
                                                style={{ border: '2px solid black', color: 'black' }}
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
                                                    color="gray"
                                                    size="lg"
                                                    onClick={() => handleDownloadWordbook(wordbook)}
                                                    style={{ border: '2px solid black', borderRadius: '0px', boxShadow: '2px 2px 0px black' }}
                                                >
                                                    <IconDownload size={18} />
                                                </ActionIcon>
                                                <ActionIcon
                                                    variant="filled"
                                                    color="red"
                                                    size="lg"
                                                    onClick={() => handleDeleteWordbook(wordbook)}
                                                    style={{ border: '2px solid black', borderRadius: '0px', boxShadow: '2px 2px 0px black' }}
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
                    onClose={() => {
                        setModalOpened(false);
                        setSearchQuery('');
                        setSelectedMajorUnit(null);
                        setSelectedMinorUnit(null);
                    }}
                    title={
                        <Title order={3} style={{ fontWeight: 900 }}>
                            {selectedWordbook?.title}
                        </Title>
                    }
                    size="95%"
                    radius={0}
                    styles={{
                        content: {
                            border: '2px solid black',
                            borderRadius: '0px',
                            boxShadow: '8px 8px 0px black',
                        },
                        header: {
                            backgroundColor: '#FFD93D',
                            borderBottom: '2px solid black',
                        }
                    }}
                >
                    <Stack gap="md">
                        {/* 상단 통계 및 버튼 */}
                        <Group justify="space-between">
                            <Box>
                                <Text size="lg" fw={700}>
                                    총 {selectedWordbook?.word_count}개의 단어
                                </Text>
                                <Text size="sm" c="dimmed">
                                    필터링된 단어: {filteredWords.length}개
                                </Text>
                            </Box>
                            <Group>
                                <button
                                    onClick={() => {
                                        if (selectedWordbook) {
                                            handleDeleteWordbook(selectedWordbook);
                                        }
                                    }}
                                    style={{
                                        background: '#FF6B6B',
                                        color: 'white',
                                        border: '2px solid black',
                                        borderRadius: '0px',
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
                                    <IconTrash size={16} />
                                    단어장 삭제
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingWord(null);
                                        wordForm.reset();
                                        setWordModalOpened(true);
                                    }}
                                    style={{
                                        background: '#FFD93D',
                                        color: 'black',
                                        border: '2px solid black',
                                        borderRadius: '0px',
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
                        </Group>

                        {/* 검색 및 필터 */}
                        <Paper p="md" style={{ border: '2px solid black', borderRadius: '0px', background: '#f8f9fa' }}>
                            <Stack gap="sm">
                                <Group grow>
                                    <TextInput
                                        placeholder="영어, 한글, 단원명으로 검색..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        leftSection={<IconSearch size={16} />}
                                        styles={{
                                            input: {
                                                border: '2px solid black',
                                                borderRadius: '0px',
                                            }
                                        }}
                                    />
                                </Group>
                                <Group grow>
                                    <Select
                                        placeholder="대단원 선택"
                                        value={selectedMajorUnit}
                                        onChange={(value) => {
                                            setSelectedMajorUnit(value);
                                            setSelectedMinorUnit(null);
                                        }}
                                        data={majorUnits.map(unit => ({ value: unit || '', label: unit || '미지정' }))}
                                        clearable
                                        leftSection={<IconFilter size={16} />}
                                        styles={{
                                            input: {
                                                border: '2px solid black',
                                                borderRadius: '0px',
                                            }
                                        }}
                                    />
                                    <Select
                                        placeholder="소단원 선택"
                                        value={selectedMinorUnit}
                                        onChange={setSelectedMinorUnit}
                                        data={minorUnits.map(unit => ({ value: unit || '', label: unit || '미지정' }))}
                                        clearable
                                        disabled={!selectedMajorUnit}
                                        leftSection={<IconFilter size={16} />}
                                        styles={{
                                            input: {
                                                border: '2px solid black',
                                                borderRadius: '0px',
                                            }
                                        }}
                                    />
                                    {(searchQuery || selectedMajorUnit || selectedMinorUnit) && (
                                        <Button
                                            variant="outline"
                                            color="dark"
                                            onClick={() => {
                                                setSearchQuery('');
                                                setSelectedMajorUnit(null);
                                                setSelectedMinorUnit(null);
                                            }}
                                            radius={0}
                                            style={{ border: '2px solid black' }}
                                        >
                                            필터 초기화
                                        </Button>
                                    )}
                                </Group>
                            </Stack>
                        </Paper>

                        {/* 단어 테이블 */}
                        <ScrollArea h={500}>
                            <Table highlightOnHover>
                                <Table.Thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                                    <Table.Tr style={{ borderBottom: '2px solid black' }}>
                                        <Table.Th style={{ fontWeight: 900 }}>번호</Table.Th>
                                        <Table.Th style={{ fontWeight: 900 }}>교재명</Table.Th>
                                        <Table.Th style={{ fontWeight: 900 }}>대단원</Table.Th>
                                        <Table.Th style={{ fontWeight: 900 }}>소단원</Table.Th>
                                        <Table.Th style={{ fontWeight: 900 }}>단원명</Table.Th>
                                        <Table.Th style={{ fontWeight: 900 }}>영어</Table.Th>
                                        <Table.Th style={{ fontWeight: 900 }}>한글</Table.Th>
                                        <Table.Th style={{ fontWeight: 900, textAlign: 'right' }}>관리</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {filteredWords.length === 0 ? (
                                        <Table.Tr>
                                            <Table.Td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                                                <Text c="dimmed">
                                                    {searchQuery || selectedMajorUnit || selectedMinorUnit
                                                        ? '검색 결과가 없습니다.'
                                                        : '등록된 단어가 없습니다.'}
                                                </Text>
                                            </Table.Td>
                                        </Table.Tr>
                                    ) : (
                                        filteredWords.map((word) => (
                                            <Table.Tr key={word.no}>
                                                <Table.Td>{word.no}</Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" c="dimmed">
                                                        {selectedWordbook?.title}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Badge
                                                        color="blue"
                                                        variant="light"
                                                        radius="xs"
                                                        style={{ border: '1px solid black' }}
                                                    >
                                                        {word.major_unit || '-'}
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Badge
                                                        color="cyan"
                                                        variant="light"
                                                        radius="xs"
                                                        style={{ border: '1px solid black' }}
                                                    >
                                                        {word.minor_unit || '-'}
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm">
                                                        {word.unit_name || '-'}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td style={{ fontWeight: 600 }}>{word.english}</Table.Td>
                                                <Table.Td>{word.korean}</Table.Td>
                                                <Table.Td>
                                                    <Group justify="flex-end">
                                                        <ActionIcon
                                                            variant="filled"
                                                            color="gray"
                                                            size="sm"
                                                            radius={0}
                                                            style={{ border: '2px solid black' }}
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
                                        ))
                                    )}
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>
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
                    radius={0}
                    styles={{
                        content: {
                            border: '2px solid black',
                            borderRadius: '0px',
                            boxShadow: '8px 8px 0px black',
                        },
                        header: {
                            borderBottom: '2px solid black',
                        }
                    }}
                >
                    <form onSubmit={wordForm.onSubmit(handleWordSubmit)}>
                        <Stack gap="md">
                            <TextInput
                                label="영어 단어"
                                placeholder="apple"
                                required
                                {...wordForm.getInputProps('english')}
                                styles={{ input: { border: '2px solid black', borderRadius: '0px' } }}
                            />
                            <TextInput
                                label="한글 뜻"
                                placeholder="사과"
                                required
                                {...wordForm.getInputProps('korean')}
                                styles={{ input: { border: '2px solid black', borderRadius: '0px' } }}
                            />
                            <TextInput
                                label="대단원"
                                placeholder="1단원"
                                {...wordForm.getInputProps('major_unit')}
                                styles={{ input: { border: '2px solid black', borderRadius: '0px' } }}
                            />
                            <TextInput
                                label="소단원"
                                placeholder="1-1"
                                {...wordForm.getInputProps('minor_unit')}
                                styles={{ input: { border: '2px solid black', borderRadius: '0px' } }}
                            />
                            <TextInput
                                label="단원명"
                                placeholder="과일"
                                {...wordForm.getInputProps('unit_name')}
                                styles={{ input: { border: '2px solid black', borderRadius: '0px' } }}
                            />
                            <Group justify="flex-end" mt="md">
                                <Button
                                    variant="subtle"
                                    color="dark"
                                    onClick={() => setWordModalOpened(false)}
                                    radius={0}
                                >
                                    취소
                                </Button>
                                <button
                                    type="submit"
                                    style={{
                                        background: '#FFD93D',
                                        color: 'black',
                                        border: '2px solid black',
                                        borderRadius: '0px',
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
