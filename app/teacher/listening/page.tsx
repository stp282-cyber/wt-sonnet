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
    const [listeningTests, setListeningTests] = useState<ListeningTest[]>([
        {
            id: '1',
            title: '중학 듣기 평가 1',
            question_count: 10,
            questions: [
                {
                    id: '1',
                    question_no: 1,
                    question_text: 'What is the man doing?',
                    choices: ['Reading a book', 'Watching TV', 'Cooking dinner', 'Playing games'],
                    correct_answer: 2,
                    script: 'The man is cooking dinner in the kitchen.',
                    major_unit: '1단원',
                    minor_unit: '1-1',
                },
            ],
            created_at: '2024-01-01',
        },
    ]);

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
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                const questions: ListeningQuestion[] = jsonData.map((row: any, index) => ({
                    question_no: row['번호'] || index + 1,
                    question_text: row['문제'] || '',
                    choices: [row['보기1'] || '', row['보기2'] || '', row['보기3'] || '', row['보기4'] || ''],
                    correct_answer: (row['정답'] || 1) - 1,
                    script: row['스크립트'] || '',
                    major_unit: row['대단원'] || '',
                    minor_unit: row['소단원'] || '',
                }));

                const newTest: ListeningTest = {
                    id: Date.now().toString(),
                    title: (jsonData[0] as any)?.['교재명'] || '새 듣기 시험',
                    question_count: questions.length,
                    questions: questions,
                    created_at: new Date().toISOString(),
                };

                setListeningTests([...listeningTests, newTest]);

                // localStorage에 저장
                localStorage.setItem('listeningTests', JSON.stringify([...listeningTests, newTest]));

                notifications.show({
                    title: 'Excel 업로드 완료',
                    message: `${questions.length}개의 문제가 등록되었습니다.`,
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

    // 듣기 시험 Excel 다운로드
    const handleDownloadTest = (test: ListeningTest) => {
        const data = test.questions.map((q) => ({
            'No.': q.question_no,
            '교재명': test.title,
            '대단원': q.major_unit || '',
            '소단원': q.minor_unit || '',
            '번호': q.question_no,
            '문제': q.question_text,
            '보기1': q.choices[0],
            '보기2': q.choices[1],
            '보기3': q.choices[2],
            '보기4': q.choices[3],
            '정답': q.correct_answer + 1,
            '스크립트': q.script,
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, test.title);
        XLSX.writeFile(wb, `${test.title}.xlsx`);

        notifications.show({
            title: '다운로드 완료',
            message: `${test.title}이(가) 다운로드되었습니다.`,
            color: 'blue',
        });
    };

    // 듣기 시험 삭제
    const handleDeleteTest = (test: ListeningTest) => {
        if (confirm(`${test.title}을(를) 삭제하시겠습니까?`)) {
            setListeningTests(listeningTests.filter((t) => t.id !== test.id));
            notifications.show({
                title: '듣기 시험 삭제 완료',
                message: `${test.title}이(가) 삭제되었습니다.`,
                color: 'red',
            });
        }
    };

    // 문제 추가/수정
    const handleQuestionSubmit = (values: typeof questionForm.values) => {
        if (!selectedTest) return;

        const updatedTest = { ...selectedTest };
        const choices = [values.choice1, values.choice2, values.choice3, values.choice4];

        if (editingQuestion) {
            // 수정
            updatedTest.questions = updatedTest.questions.map((q) =>
                q.question_no === editingQuestion.question_no
                    ? {
                        ...q,
                        question_text: values.question_text,
                        choices,
                        correct_answer: values.correct_answer - 1,
                        script: values.script,
                        major_unit: values.major_unit,
                        minor_unit: values.minor_unit,
                    }
                    : q
            );
        } else {
            // 추가
            const newQuestion: ListeningQuestion = {
                question_no: updatedTest.questions.length + 1,
                question_text: values.question_text,
                choices,
                correct_answer: values.correct_answer - 1,
                script: values.script,
                major_unit: values.major_unit,
                minor_unit: values.minor_unit,
            };
            updatedTest.questions.push(newQuestion);
        }

        updatedTest.question_count = updatedTest.questions.length;

        setListeningTests(listeningTests.map((t) => (t.id === selectedTest.id ? updatedTest : t)));
        setSelectedTest(updatedTest);
        setQuestionModalOpened(false);
        questionForm.reset();

        notifications.show({
            title: editingQuestion ? '문제 수정 완료' : '문제 추가 완료',
            message: `문제가 ${editingQuestion ? '수정' : '추가'}되었습니다.`,
            color: 'green',
        });
    };

    return (
        <Container size="xl" py={40}>
            <div className="animate-fade-in">
                <Group justify="space-between" mb={30}>
                    <Box>
                        <Title order={1} style={{ fontWeight: 900, marginBottom: '0.5rem' }}>
                            듣기 문제 관리
                        </Title>
                        <Text c="dimmed" size="lg">
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
                                            onClick={() => {
                                                setSelectedTest(test);
                                                setModalOpened(true);
                                            }}
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
                                                    onClick={() => handleDownloadTest(test)}
                                                    style={{ border: '2px solid black', borderRadius: '0px', boxShadow: '2px 2px 0px black' }}
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

                {/* 문제 목록 모달 */}
                <Modal
                    opened={modalOpened}
                    onClose={() => setModalOpened(false)}
                    title={
                        <Title order={3} style={{ fontWeight: 900 }}>
                            🎧 {selectedTest?.title}
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
                        <Group justify="space-between">
                            <Text size="lg" fw={700}>
                                총 {selectedTest?.question_count}개의 문제
                            </Text>
                            <button
                                onClick={() => {
                                    setEditingQuestion(null);
                                    questionForm.reset();
                                    setQuestionModalOpened(true);
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
                                문제 추가
                            </button>
                        </Group>

                        <Table>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>No.</Table.Th>
                                    <Table.Th>문제</Table.Th>
                                    <Table.Th>정답</Table.Th>
                                    <Table.Th>단원</Table.Th>
                                    <Table.Th style={{ textAlign: 'right' }}>관리</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {selectedTest?.questions.map((question) => (
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
                                        <Table.Td>
                                            <Group justify="flex-end">
                                                <ActionIcon
                                                    variant="filled"
                                                    color="gray"
                                                    size="sm"
                                                    radius={0}
                                                    style={{ border: '2px solid black' }}
                                                    onClick={() => {
                                                        setEditingQuestion(question);
                                                        questionForm.setValues({
                                                            question_no: question.question_no,
                                                            question_text: question.question_text,
                                                            choice1: question.choices[0],
                                                            choice2: question.choices[1],
                                                            choice3: question.choices[2],
                                                            choice4: question.choices[3],
                                                            correct_answer: question.correct_answer + 1,
                                                            script: question.script,
                                                            major_unit: question.major_unit || '',
                                                            minor_unit: question.minor_unit || '',
                                                        });
                                                        setQuestionModalOpened(true);
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
