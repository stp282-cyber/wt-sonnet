'use client';

import { useState, useEffect } from 'react';
import {
    Container,
    Title,
    Paper,
    Table,
    Button,
    Group,
    Modal,
    TextInput,
    Textarea,
    NumberInput,
    FileButton,
    Stack,
    ActionIcon,
    Text,
    Box,
    Badge,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
    IconEdit,
    IconTrash,
    IconDownload,
    IconUpload,
    IconHeadphones,
    IconPlayerPlay,
    IconPlus,
} from '@tabler/icons-react';
import * as XLSX from 'xlsx';

interface ListeningQuestion {
    id?: string;
    question_no: number;
    question_text: string;
    choices: string[];
    correct_answer: number;
    script: string;
    major_unit?: string;
    minor_unit?: string;
}

interface ListeningTest {
    id: string;
    title: string;
    question_count: number;
    questions: ListeningQuestion[];
    created_at: string;
}

export default function ListeningPage() {
    const [listeningTests, setListeningTests] = useState<ListeningTest[]>([]);
    const [modalOpened, setModalOpened] = useState(false);
    const [questionModalOpened, setQuestionModalOpened] = useState(false);
    const [selectedTest, setSelectedTest] = useState<ListeningTest | null>(null);
    const [editingQuestion, setEditingQuestion] = useState<ListeningQuestion | null>(null);

    const questionForm = useForm({
        initialValues: {
            question_no: 0,
            question_text: '',
            choice1: '',
            choice2: '',
            choice3: '',
            choice4: '',
            correct_answer: 1,
            script: '',
            major_unit: '',
            minor_unit: '',
        },
        validate: {
            question_text: (value) => (!value ? '문제를 입력해주세요' : null),
            choice1: (value) => (!value ? '보기 1을 입력해주세요' : null),
            choice2: (value) => (!value ? '보기 2를 입력해주세요' : null),
            choice3: (value) => (!value ? '보기 3를 입력해주세요' : null),
            choice4: (value) => (!value ? '보기 4를 입력해주세요' : null),
            script: (value) => (!value ? '스크립트를 입력해주세요' : null),
        },
    });

    const fetchTests = async () => {
        try {
            const response = await fetch('/api/listening');
            if (!response.ok) throw new Error('Failed to fetch tests');
            const data = await response.json();
            // The API returns tests with summarized info.
            // For full questions, we might need a separate fetch or the API sends everything.
            // Let's assume for the main list we use what we get.
            // Looking at the API code, it sends `listeningTests` with `question_count`.
            // It DOES NOT send questions array in the list view.
            // We need to fetch details when selecting a test.
            setListeningTests(data.listeningTests || []);
        } catch (error) {
            console.error('Fetch error:', error);
            notifications.show({
                title: '오류',
                message: '듣기 시험 목록을 불러오는데 실패했습니다.',
                color: 'red',
            });
        }
    };

    useEffect(() => {
        fetchTests();
    }, []);

    // Excel 템플릿 다운로드
    const handleDownloadTemplate = () => {
        const template = [
            {
                'No.': 1,
                '교재명': '중학 듣기',
                '대단원': '1단원',
                '소단원': '1-1',
                '번호': 1,
                '문제': 'What is the man doing?',
                '보기1': 'Reading a book',
                '보기2': 'Watching TV',
                '보기3': 'Cooking dinner',
                '보기4': 'Playing games',
                '정답': 3,
                '스크립트': 'The man is cooking dinner in the kitchen.',
            },
            {
                'No.': 2,
                '교재명': '중학 듣기',
                '대단원': '1단원',
                '소단원': '1-1',
                '번호': 2,
                '문제': 'Where are they going?',
                '보기1': 'To the park',
                '보기2': 'To the library',
                '보기3': 'To the mall',
                '보기4': 'To the school',
                '정답': 1,
                '스크립트': 'They are going to the park to play soccer.',
            },
        ];

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '듣기 템플릿');
        XLSX.writeFile(wb, '듣기문제_템플릿.xlsx');

        notifications.show({
            title: '템플릿 다운로드 완료',
            message: '듣기 문제 템플릿이 다운로드되었습니다.',
            color: 'blue',
        });
    };

    // Excel 파일 업로드
    const handleExcelUpload = (file: File | null) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                const questions = jsonData.map((row: any, index) => ({
                    question_no: row['번호'] || index + 1,
                    question_text: row['문제'] || '',
                    choices: [row['보기1'] || '', row['보기2'] || '', row['보기3'] || '', row['보기4'] || ''],
                    correct_answer: (row['정답'] || 1) - 1,
                    script: row['스크립트'] || '',
                    major_unit: row['대단원'] || '',
                    minor_unit: row['소단원'] || '',
                }));

                const title = (jsonData[0] as any)?.['교재명'] || '새 듣기 시험';

                const response = await fetch('/api/listening', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title,
                        questions,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to create listening test');
                }

                notifications.show({
                    title: 'Excel 업로드 완료',
                    message: `${questions.length}개의 문제가 등록되었습니다.`,
                    color: 'green',
                });

                fetchTests();
            } catch (error) {
                console.error('Upload Error:', error);
                notifications.show({
                    title: 'Excel 업로드 실패',
                    message: '업로드 중 오류가 발생했습니다.',
                    color: 'red',
                });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    // 듣기 시험 Excel 다운로드 (상세 정보 필요)
    const handleDownloadTest = async (testId: string, title: string) => {
        // Need to fetch details first
        try {
            const response = await fetch(`/api/listening/${testId}`);
            // If we don't implement GET by ID yet, this will fail.
            // But for now, let's assume we can or fail gracefully.
            // Correction: The current API structure might not support fetching details by ID at `/api/listening/[id]`.
            // I'll check that next. For now, I'll assume I can't download without questions.
            notifications.show({
                title: '알림',
                message: '시험 상세 조회 기능 구현 후 사용 가능합니다.',
                color: 'orange'
            });
        } catch (e) {
            // ...
        }
    };

    // 듣기 시험 삭제
    const handleDeleteTest = async (test: ListeningTest) => {
        if (confirm(`${test.title}을(를) 삭제하시겠습니까?`)) {
            try {
                const response = await fetch(`/api/listening/${test.id}`, {
                    method: 'DELETE',
                });

                if (!response.ok) throw new Error('Delete failed');

                notifications.show({
                    title: '듣기 시험 삭제 완료',
                    message: `${test.title}이(가) 삭제되었습니다.`,
                    color: 'red',
                });
                fetchTests();
            } catch (error) {
                notifications.show({
                    title: '오류',
                    message: '삭제에 실패했습니다.',
                    color: 'red',
                });
            }
        }
    };

    // 문제 상세 조회 (모달 열기용)
    const handleOpenTest = async (test: ListeningTest) => {
        try {
            const response = await fetch(`/api/listening/${test.id}`);
            if (response.ok) {
                const data = await response.json();
                setSelectedTest(data.listeningTest); // Assume API returns full object
                setModalOpened(true);
            } else {
                // Fallback if API not ready
                console.warn("Could not fetch details, showing summary only");
                setSelectedTest({ ...test, questions: [] });
                setModalOpened(true);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // 문제 추가/수정 (Not fully wired to API yet for individual questions)
    const handleQuestionSubmit = (values: typeof questionForm.values) => {
        // ... existing logic but strictly local for now until API supports granular updates ...
        // Ideally we should update the whole test via PUT.
        notifications.show({ title: '알림', message: '개별 문제 수정 기능은 준비 중입니다.', color: 'orange' });
        setQuestionModalOpened(false);
    };

    return (
        <Container size="xl" py={40}>
            <div className="animate-fade-in">
                <Group justify="space-between" mb={30}>
                    <Box>
                        <Title order={1} style={{ fontWeight: 900, marginBottom: '0.5rem', color: 'white' }}>
                            듣기 문제 관리
                        </Title>
                        <Text c="gray.3" size="lg">
                            듣기 문제 등록, Excel 업로드/다운로드, 개별 문제 수정
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
                                <Table.Th style={{ fontWeight: 900, fontSize: '1.1rem' }}>듣기 시험 제목</Table.Th>
                                <Table.Th style={{ fontWeight: 900, fontSize: '1.1rem' }}>문제 수</Table.Th>
                                <Table.Th style={{ fontWeight: 900, fontSize: '1.1rem' }}>등록일</Table.Th>
                                <Table.Th style={{ fontWeight: 900, fontSize: '1.1rem', textAlign: 'right' }}>
                                    관리
                                </Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {listeningTests.length === 0 ? (
                                <Table.Tr>
                                    <Table.Td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>
                                        <Text size="lg" c="dimmed">
                                            등록된 듣기 시험이 없습니다. Excel 파일을 업로드해주세요.
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            ) : (
                                listeningTests.map((test) => (
                                    <Table.Tr key={test.id}>
                                        <Table.Td
                                            style={{
                                                fontSize: '1rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                color: 'black',
                                            }}
                                            onClick={() => handleOpenTest(test)}
                                        >
                                            {test.title}
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge
                                                color="yellow"
                                                variant="filled"
                                                size="lg"
                                                radius="xs"
                                                style={{ border: '2px solid black', color: 'black' }}
                                            >
                                                {test.question_count}개
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td style={{ fontSize: '1rem' }}>
                                            {new Date(test.created_at).toLocaleDateString('ko-KR')}
                                        </Table.Td>
                                        <Table.Td>
                                            <Group justify="flex-end" gap="xs">
                                                <ActionIcon
                                                    variant="filled"
                                                    color="gray"
                                                    size="lg"
                                                    style={{ border: '2px solid black', borderRadius: '0px', boxShadow: '2px 2px 0px black' }}
                                                    disabled
                                                >
                                                    <IconDownload size={18} />
                                                </ActionIcon>
                                                <ActionIcon
                                                    variant="filled"
                                                    color="red"
                                                    size="lg"
                                                    onClick={() => handleDeleteTest(test)}
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

                {/* 문제 목록 모달 (ReadOnly for now until Detail API is ready) */}
                <Modal
                    opened={modalOpened}
                    onClose={() => setModalOpened(false)}
                    title={
                        <Title order={3} style={{ fontWeight: 900 }}>
                            {selectedTest?.title}
                        </Title>
                    }
                    size="xl"
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
                        <Text size="sm" c="dimmed">
                            현재는 문제 조회만 가능합니다. 개별 수정은 준비 중입니다.
                        </Text>
                        <Table>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>No.</Table.Th>
                                    <Table.Th>문제</Table.Th>
                                    <Table.Th>정답</Table.Th>
                                    <Table.Th>단원</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {selectedTest?.questions?.map((question) => (
                                    <Table.Tr key={question.question_no}>
                                        <Table.Td>{question.question_no}</Table.Td>
                                        <Table.Td style={{ fontWeight: 600 }}>{question.question_text}</Table.Td>
                                        <Table.Td>
                                            <Badge color="green" variant="filled" radius="xs" style={{ border: '1px solid black' }}>
                                                {question.correct_answer + 1}번
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c="dimmed">
                                                {question.major_unit} - {question.minor_unit}
                                            </Text>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Stack>
                </Modal>

                {/* 문제 추가/수정 모달 */}
                <Modal
                    opened={questionModalOpened}
                    onClose={() => setQuestionModalOpened(false)}
                    title={
                        <Title order={4} style={{ fontWeight: 900 }}>
                            {editingQuestion ? '문제 수정' : '문제 추가'}
                        </Title>
                    }
                    size="lg"
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
                    <form onSubmit={questionForm.onSubmit(handleQuestionSubmit)}>
                        <Stack gap="md">
                            <TextInput
                                label="문제"
                                placeholder="What is the man doing?"
                                required
                                {...questionForm.getInputProps('question_text')}
                                styles={{ input: { border: '2px solid black', borderRadius: '0px' } }}
                            />
                            <Group grow>
                                <TextInput
                                    label="대단원"
                                    placeholder="1단원"
                                    {...questionForm.getInputProps('major_unit')}
                                    styles={{ input: { border: '2px solid black', borderRadius: '0px' } }}
                                />
                                <TextInput
                                    label="소단원"
                                    placeholder="1-1"
                                    {...questionForm.getInputProps('minor_unit')}
                                    styles={{ input: { border: '2px solid black', borderRadius: '0px' } }}
                                />
                            </Group>
                            <TextInput
                                label="보기 1"
                                placeholder="Reading a book"
                                required
                                {...questionForm.getInputProps('choice1')}
                                styles={{ input: { border: '2px solid black', borderRadius: '0px' } }}
                            />
                            <TextInput
                                label="보기 2"
                                placeholder="Watching TV"
                                required
                                {...questionForm.getInputProps('choice2')}
                                styles={{ input: { border: '2px solid black', borderRadius: '0px' } }}
                            />
                            <TextInput
                                label="보기 3"
                                placeholder="Cooking dinner"
                                required
                                {...questionForm.getInputProps('choice3')}
                                styles={{ input: { border: '2px solid black', borderRadius: '0px' } }}
                            />
                            <TextInput
                                label="보기 4"
                                placeholder="Playing games"
                                required
                                {...questionForm.getInputProps('choice4')}
                                styles={{ input: { border: '2px solid black', borderRadius: '0px' } }}
                            />
                            <NumberInput
                                label="정답 (1-4)"
                                placeholder="1"
                                required
                                min={1}
                                max={4}
                                {...questionForm.getInputProps('correct_answer')}
                                styles={{ input: { border: '2px solid black', borderRadius: '0px' } }}
                            />
                            <Textarea
                                label="스크립트"
                                placeholder="The man is cooking dinner in the kitchen."
                                required
                                rows={4}
                                {...questionForm.getInputProps('script')}
                                styles={{ input: { border: '2px solid black', borderRadius: '0px' } }}
                            />
                            <Group justify="flex-end" mt="md">
                                <Button
                                    variant="subtle"
                                    color="dark"
                                    onClick={() => setQuestionModalOpened(false)}
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
                                    {editingQuestion ? '수정하기' : '추가하기'}
                                </button>
                            </Group>
                        </Stack>
                    </form>
                </Modal>
            </div>
        </Container>
    );
}
