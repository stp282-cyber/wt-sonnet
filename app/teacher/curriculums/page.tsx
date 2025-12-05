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
    Badge,
    Select,
    Textarea,
    NumberInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
    IconPlus,
    IconEdit,
    IconTrash,
    IconList,
    IconCopy,
} from '@tabler/icons-react';

interface CurriculumItem {
    id: string;
    sequence: number;
    item_type: 'wordbook' | 'listening';
    item_name: string;
    test_type: 'typing' | 'scramble' | 'multiple_choice';
    word_count: number;
    time_limit_seconds: number;
    passing_score: number;
}

interface Curriculum {
    id: string;
    name: string;
    description: string;
    items: CurriculumItem[];
    created_at: string;
}

export default function CurriculumsPage() {
    const [curriculums, setCurriculums] = useState<Curriculum[]>([
        {
            id: '1',
            name: '초급 영어 과정',
            description: '기초 영단어부터 시작하는 초급 과정',
            items: [
                {
                    id: '1',
                    sequence: 1,
                    item_type: 'wordbook',
                    item_name: '중학 영단어 1000',
                    test_type: 'typing',
                    word_count: 50,
                    time_limit_seconds: 20,
                    passing_score: 80,
                },
            ],
            created_at: '2024-01-01',
        },
    ]);

    const [modalOpened, setModalOpened] = useState(false);
    const [itemModalOpened, setItemModalOpened] = useState(false);
    const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null);
    const [editingCurriculum, setEditingCurriculum] = useState<Curriculum | null>(null);

    const curriculumForm = useForm({
        initialValues: {
            name: '',
            description: '',
        },
        validate: {
            name: (value) => (!value ? '커리큘럼 이름을 입력해주세요' : null),
        },
    });

    const itemForm = useForm({
        initialValues: {
            item_type: 'wordbook' as 'wordbook' | 'listening',
            item_name: '',
            test_type: 'typing' as 'typing' | 'scramble' | 'multiple_choice',
            word_count: 50,
            time_limit_seconds: 20,
            passing_score: 80,
        },
        validate: {
            item_name: (value) => (!value ? '단어장/듣기 시험을 선택해주세요' : null),
        },
    });

    const handleOpenModal = (curriculum?: Curriculum) => {
        if (curriculum) {
            setEditingCurriculum(curriculum);
            curriculumForm.setValues({
                name: curriculum.name,
                description: curriculum.description,
            });
        } else {
            setEditingCurriculum(null);
            curriculumForm.reset();
        }
        setModalOpened(true);
    };

    const handleSubmit = (values: typeof curriculumForm.values) => {
        if (editingCurriculum) {
            // 수정
            setCurriculums(
                curriculums.map((c) =>
                    c.id === editingCurriculum.id ? { ...c, ...values } : c
                )
            );
            notifications.show({
                title: '커리큘럼 수정 완료',
                message: `${values.name} 커리큘럼이 수정되었습니다.`,
                color: 'blue',
            });
        } else {
            // 추가
            const newCurriculum: Curriculum = {
                id: Date.now().toString(),
                name: values.name,
                description: values.description,
                items: [],
                created_at: new Date().toISOString(),
            };
            setCurriculums([...curriculums, newCurriculum]);
            notifications.show({
                title: '커리큘럼 생성 완료',
                message: `${values.name} 커리큘럼이 생성되었습니다.`,
                color: 'green',
            });
        }
        setModalOpened(false);
        curriculumForm.reset();
    };

    const handleDelete = (curriculum: Curriculum) => {
        if (confirm(`${curriculum.name} 커리큘럼을 삭제하시겠습니까?`)) {
            setCurriculums(curriculums.filter((c) => c.id !== curriculum.id));
            notifications.show({
                title: '커리큘럼 삭제 완료',
                message: `${curriculum.name} 커리큘럼이 삭제되었습니다.`,
                color: 'red',
            });
        }
    };

    const handleCopy = (curriculum: Curriculum) => {
        const copiedCurriculum: Curriculum = {
            ...curriculum,
            id: Date.now().toString(),
            name: `${curriculum.name} (복사본)`,
            created_at: new Date().toISOString(),
        };
        setCurriculums([...curriculums, copiedCurriculum]);
        notifications.show({
            title: '커리큘럼 복사 완료',
            message: `${curriculum.name}이(가) 복사되었습니다.`,
            color: 'green',
        });
    };

    const handleAddItem = (values: typeof itemForm.values) => {
        if (!selectedCurriculum) return;

        const newItem: CurriculumItem = {
            id: Date.now().toString(),
            sequence: selectedCurriculum.items.length + 1,
            item_type: values.item_type,
            item_name: values.item_name,
            test_type: values.test_type,
            word_count: values.word_count,
            time_limit_seconds: values.time_limit_seconds,
            passing_score: values.passing_score,
        };

        const updatedCurriculum = {
            ...selectedCurriculum,
            items: [...selectedCurriculum.items, newItem],
        };

        setCurriculums(
            curriculums.map((c) => (c.id === selectedCurriculum.id ? updatedCurriculum : c))
        );
        setSelectedCurriculum(updatedCurriculum);
        setItemModalOpened(false);
        itemForm.reset();

        notifications.show({
            title: '항목 추가 완료',
            message: `${values.item_name}이(가) 추가되었습니다.`,
            color: 'green',
        });
    };

    const handleDeleteItem = (itemId: string) => {
        if (!selectedCurriculum) return;

        const updatedCurriculum = {
            ...selectedCurriculum,
            items: selectedCurriculum.items
                .filter((item) => item.id !== itemId)
                .map((item, index) => ({ ...item, sequence: index + 1 })),
        };

        setCurriculums(
            curriculums.map((c) => (c.id === selectedCurriculum.id ? updatedCurriculum : c))
        );
        setSelectedCurriculum(updatedCurriculum);

        notifications.show({
            title: '항목 삭제 완료',
            message: '항목이 삭제되었습니다.',
            color: 'red',
        });
    };

    return (
        <Container size="xl" py={40}>
            <div className="animate-fade-in">
                <Group justify="space-between" mb={30}>
                    <Box>
                        <Title order={1} style={{ fontWeight: 900, marginBottom: '0.5rem' }}>
                            📋 커리큘럼 관리
                        </Title>
                        <Text c="dimmed" size="lg">
                            커리큘럼 템플릿 생성 및 단어장 추가
                        </Text>
                    </Box>
                    <button
                        onClick={() => handleOpenModal()}
                        style={{
                            background: '#FFD93D',
                            color: 'black',
                            border: '4px solid black',
                            borderRadius: '12px',
                            boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                            fontSize: '1.1rem',
                            fontWeight: 900,
                            padding: '1rem 2rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}
                    >
                        <IconPlus size={24} />
                        커리큘럼 생성
                    </button>
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
                                <Table.Th style={{ fontWeight: 900, fontSize: '1.1rem' }}>커리큘럼명</Table.Th>
                                <Table.Th style={{ fontWeight: 900, fontSize: '1.1rem' }}>설명</Table.Th>
                                <Table.Th style={{ fontWeight: 900, fontSize: '1.1rem' }}>항목 수</Table.Th>
                                <Table.Th style={{ fontWeight: 900, fontSize: '1.1rem' }}>생성일</Table.Th>
                                <Table.Th style={{ fontWeight: 900, fontSize: '1.1rem', textAlign: 'right' }}>
                                    관리
                                </Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {curriculums.length === 0 ? (
                                <Table.Tr>
                                    <Table.Td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>
                                        <Text size="lg" c="dimmed">
                                            등록된 커리큘럼이 없습니다. 커리큘럼을 생성해주세요.
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            ) : (
                                curriculums.map((curriculum) => (
                                    <Table.Tr key={curriculum.id}>
                                        <Table.Td
                                            style={{
                                                fontSize: '1rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                color: '#7950f2',
                                            }}
                                            onClick={() => {
                                                setSelectedCurriculum(curriculum);
                                            }}
                                        >
                                            📚 {curriculum.name}
                                        </Table.Td>
                                        <Table.Td style={{ fontSize: '0.9rem' }}>{curriculum.description}</Table.Td>
                                        <Table.Td>
                                            <Badge
                                                color="violet"
                                                variant="filled"
                                                size="lg"
                                                style={{ border: '2px solid black' }}
                                            >
                                                {curriculum.items.length}개
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td style={{ fontSize: '1rem' }}>
                                            {new Date(curriculum.created_at).toLocaleDateString('ko-KR')}
                                        </Table.Td>
                                        <Table.Td>
                                            <Group justify="flex-end" gap="xs">
                                                <ActionIcon
                                                    variant="filled"
                                                    color="teal"
                                                    size="lg"
                                                    onClick={() => handleCopy(curriculum)}
                                                    style={{ border: '2px solid black' }}
                                                >
                                                    <IconCopy size={18} />
                                                </ActionIcon>
                                                <ActionIcon
                                                    variant="filled"
                                                    color="blue"
                                                    size="lg"
                                                    onClick={() => handleOpenModal(curriculum)}
                                                    style={{ border: '2px solid black' }}
                                                >
                                                    <IconEdit size={18} />
                                                </ActionIcon>
                                                <ActionIcon
                                                    variant="filled"
                                                    color="red"
                                                    size="lg"
                                                    onClick={() => handleDelete(curriculum)}
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

                {/* 선택된 커리큘럼 상세 */}
                {selectedCurriculum && (
                    <Paper
                        p="xl"
                        radius="lg"
                        mt="xl"
                        className="neo-card animate-slide-in-right"
                        style={{
                            border: '4px solid black',
                            background: '#f5f0ff',
                        }}
                    >
                        <Group justify="space-between" mb="lg">
                            <Box>
                                <Title order={3} style={{ fontWeight: 900 }}>
                                    📚 {selectedCurriculum.name}
                                </Title>
                                <Text c="dimmed" mt={5}>
                                    {selectedCurriculum.description}
                                </Text>
                            </Box>
                            <button
                                onClick={() => {
                                    itemForm.reset();
                                    setItemModalOpened(true);
                                }}
                                style={{
                                    background: '#4ECDC4',
                                    color: 'white',
                                    border: '3px solid black',
                                    borderRadius: '10px',
                                    boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    padding: '0.75rem 1.5rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                }}
                            >
                                <IconPlus size={20} />
                                항목 추가
                            </button>
                        </Group>

                        <Table>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>순서</Table.Th>
                                    <Table.Th>유형</Table.Th>
                                    <Table.Th>이름</Table.Th>
                                    <Table.Th>시험 방식</Table.Th>
                                    <Table.Th>단어 수</Table.Th>
                                    <Table.Th>제한 시간</Table.Th>
                                    <Table.Th>합격 점수</Table.Th>
                                    <Table.Th style={{ textAlign: 'right' }}>관리</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {selectedCurriculum.items.length === 0 ? (
                                    <Table.Tr>
                                        <Table.Td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                                            <Text c="dimmed">항목을 추가해주세요.</Text>
                                        </Table.Td>
                                    </Table.Tr>
                                ) : (
                                    selectedCurriculum.items.map((item) => (
                                        <Table.Tr key={item.id}>
                                            <Table.Td>
                                                <Badge color="gray" variant="filled">
                                                    {item.sequence}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge color={item.item_type === 'wordbook' ? 'blue' : 'orange'}>
                                                    {item.item_type === 'wordbook' ? '단어장' : '듣기'}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td style={{ fontWeight: 600 }}>{item.item_name}</Table.Td>
                                            <Table.Td>
                                                <Badge color="violet">
                                                    {item.test_type === 'typing'
                                                        ? '타이핑'
                                                        : item.test_type === 'scramble'
                                                            ? '문장섞기'
                                                            : '4지선다'}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>{item.word_count}개</Table.Td>
                                            <Table.Td>{item.time_limit_seconds}초</Table.Td>
                                            <Table.Td>{item.passing_score}점</Table.Td>
                                            <Table.Td>
                                                <Group justify="flex-end">
                                                    <ActionIcon
                                                        variant="filled"
                                                        color="red"
                                                        size="sm"
                                                        onClick={() => handleDeleteItem(item.id)}
                                                    >
                                                        <IconTrash size={14} />
                                                    </ActionIcon>
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))
                                )}
                            </Table.Tbody>
                        </Table>
                    </Paper>
                )}

                {/* 커리큘럼 추가/수정 모달 */}
                <Modal
                    opened={modalOpened}
                    onClose={() => setModalOpened(false)}
                    title={
                        <Title order={3} style={{ fontWeight: 900 }}>
                            {editingCurriculum ? '커리큘럼 수정' : '새 커리큘럼 생성'}
                        </Title>
                    }
                    size="md"
                    styles={{
                        content: {
                            border: '4px solid black',
                            borderRadius: '15px',
                        },
                    }}
                >
                    <form onSubmit={curriculumForm.onSubmit(handleSubmit)}>
                        <Stack gap="md">
                            <TextInput
                                label="커리큘럼 이름"
                                placeholder="초급 영어 과정"
                                required
                                {...curriculumForm.getInputProps('name')}
                                styles={{ input: { border: '3px solid black' } }}
                            />
                            <Textarea
                                label="설명"
                                placeholder="커리큘럼 설명을 입력하세요"
                                rows={3}
                                {...curriculumForm.getInputProps('description')}
                                styles={{ input: { border: '3px solid black' } }}
                            />
                            <Group justify="flex-end" mt="md">
                                <Button variant="outline" onClick={() => setModalOpened(false)}>
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
                                    {editingCurriculum ? '수정하기' : '생성하기'}
                                </button>
                            </Group>
                        </Stack>
                    </form>
                </Modal>

                {/* 항목 추가 모달 */}
                <Modal
                    opened={itemModalOpened}
                    onClose={() => setItemModalOpened(false)}
                    title={
                        <Title order={4} style={{ fontWeight: 900 }}>
                            커리큘럼 항목 추가
                        </Title>
                    }
                    size="md"
                >
                    <form onSubmit={itemForm.onSubmit(handleAddItem)}>
                        <Stack gap="md">
                            <Select
                                label="유형"
                                data={[
                                    { value: 'wordbook', label: '단어장' },
                                    { value: 'listening', label: '듣기 시험' },
                                ]}
                                {...itemForm.getInputProps('item_type')}
                                styles={{ input: { border: '3px solid black' } }}
                            />
                            <TextInput
                                label="단어장/듣기 시험 이름"
                                placeholder="중학 영단어 1000"
                                required
                                {...itemForm.getInputProps('item_name')}
                                styles={{ input: { border: '3px solid black' } }}
                            />
                            <Select
                                label="시험 방식"
                                data={[
                                    { value: 'typing', label: '타이핑' },
                                    { value: 'scramble', label: '문장 섞기' },
                                    { value: 'multiple_choice', label: '4지선다' },
                                ]}
                                {...itemForm.getInputProps('test_type')}
                                styles={{ input: { border: '3px solid black' } }}
                            />
                            <NumberInput
                                label="단어 수"
                                min={1}
                                {...itemForm.getInputProps('word_count')}
                                styles={{ input: { border: '3px solid black' } }}
                            />
                            <NumberInput
                                label="제한 시간 (초)"
                                min={5}
                                max={60}
                                {...itemForm.getInputProps('time_limit_seconds')}
                                styles={{ input: { border: '3px solid black' } }}
                            />
                            <NumberInput
                                label="합격 점수"
                                min={0}
                                max={100}
                                {...itemForm.getInputProps('passing_score')}
                                styles={{ input: { border: '3px solid black' } }}
                            />
                            <Group justify="flex-end" mt="md">
                                <Button variant="outline" onClick={() => setItemModalOpened(false)}>
                                    취소
                                </Button>
                                <button
                                    type="submit"
                                    style={{
                                        background: '#4ECDC4',
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
                                    추가하기
                                </button>
                            </Group>
                        </Stack>
                    </form>
                </Modal>
            </div>
        </Container>
    );
}
