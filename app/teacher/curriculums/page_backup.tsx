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
    Stack,
    ActionIcon,
    Text,
    Box,
    Select,
    NumberInput,
    Badge,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
    IconPlus,
    IconEdit,
    IconTrash,
    IconArrowUp,
    IconArrowDown,
} from '@tabler/icons-react';

interface CurriculumItem {
    id: string;
    type: 'word' | 'listening';
    title: string;
    daily_amount_type: 'count' | 'section';
    daily_word_count?: number;
    daily_section_amount?: 0.5 | 1 | 2;
    section_start?: string;
    time_limit_seconds: number;
    passing_score: number;
}

interface Curriculum {
    id: string;
    title: string;
    description: string;
    items: CurriculumItem[];
    created_at: string;
}

export default function CurriculumsPage() {
    const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
    const [loading, setLoading] = useState(true);
    const [availableWordbooks, setAvailableWordbooks] = useState<any[]>([]);
    const [availableListeningTests, setAvailableListeningTests] = useState<any[]>([]);
    const [modalOpened, setModalOpened] = useState(false);
    const [itemModalOpened, setItemModalOpened] = useState(false);
    const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null);
    const [editingItem, setEditingItem] = useState<CurriculumItem | null>(null);

    const curriculumForm = useForm({
        initialValues: {
            title: '',
            description: '',
        },
        validate: {
            title: (value) => (!value ? '커리큘럼 제목을 입력해주세요' : null),
        },
    });

    const itemForm = useForm({
        initialValues: {
            type: 'word' as 'word' | 'listening',
            title: '',
            daily_amount_type: 'count' as 'count' | 'section',
            daily_word_count: 50,
            daily_section_amount: 1 as 0.5 | 1 | 2,
            section_start: '',
            time_limit_seconds: 10,
            passing_score: 80,
            word_count: 50,
            section_count: 1,
        },
        validate: {
            title: (value) => (!value ? '학습 항목을 선택해주세요' : null),
        },
    });

    // 사용 가능한 교재 목록 (단어장 + 듣기)
    const availableItems = [
        ...availableWordbooks.map(wb => ({
            value: wb.id,
            label: `${wb.title} (단어장)`,
            type: 'word' as const,
        })),
        ...availableListeningTests.map(lt => ({
            value: lt.id,
            label: `${lt.title} (듣기)`,
            type: 'listening' as const,
        })),
    ];

    // 목업 데이터: 각 교재의 챕터 정보 (나중에 동적으로 로드)
    const availableSections = [
        { minor_unit: '1-1' }, { minor_unit: '1-2' }, { minor_unit: '1-3' },
        { minor_unit: '2-1' }, { minor_unit: '2-2' }, { minor_unit: '2-3' },
    ];

    // 단어장 목록 로드
    const fetchWordbooks = async () => {
        try {
            const response = await fetch('/api/wordbooks');
            if (!response.ok) throw new Error('Failed to fetch wordbooks');
            const data = await response.json();
            setAvailableWordbooks(data.wordbooks || []);
        } catch (error: any) {
            console.error('Failed to fetch wordbooks:', error);
        }
    };

    // 듣기 문제 목록 로드
    const fetchListeningTests = async () => {
        try {
            const response = await fetch('/api/listening-tests');
            if (!response.ok) throw new Error('Failed to fetch listening tests');
            const data = await response.json();
            setAvailableListeningTests(data.listening_tests || []);
        } catch (error: any) {
            console.error('Failed to fetch listening tests:', error);
        }
    };

    // 커리큘럼 목록 로드
    const fetchCurriculums = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/curriculums');
            if (!response.ok) throw new Error('Failed to fetch curriculums');

            const data = await response.json();
            const formattedCurriculums = (data.curriculums || []).map((c: any) => ({
                id: c.id,
                title: c.name,
                description: c.description || '',
                items: [],
                created_at: c.created_at,
            }));
            setCurriculums(formattedCurriculums);
        } catch (error: any) {
            notifications.show({
                title: '오류',
                message: error.message || '커리큘럼 목록을 불러오는데 실패했습니다.',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCurriculums();
        fetchWordbooks();
        fetchListeningTests();
    }, []);

    // 커리큘럼 생성/수정
    const handleCurriculumSubmit = async (values: typeof curriculumForm.values) => {
        try {
            if (selectedCurriculum) {
                const response = await fetch(`/api/curriculums/${selectedCurriculum.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: values.title,
                        description: values.description,
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to update curriculum');
                }

                notifications.show({
                    title: '커리큘럼 수정 완료',
                    message: '커리큘럼이 수정되었습니다.',
                    color: 'green',
                });
            } else {
                const response = await fetch('/api/curriculums', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: values.title,
                        description: values.description,
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to create curriculum');
                }

                notifications.show({
                    title: '커리큘럼 생성 완료',
                    message: '새로운 커리큘럼이 생성되었습니다.',
                    color: 'green',
                });
            }

            setModalOpened(false);
            curriculumForm.reset();
            setSelectedCurriculum(null);
            fetchCurriculums();
        } catch (error: any) {
            notifications.show({
                title: '오류',
                message: error.message || '작업에 실패했습니다.',
                color: 'red',
            });
        }
    };

    // 커리큘럼 삭제
    const handleDeleteCurriculum = async (id: string) => {
        if (!confirm('정말로 이 커리큘럼을 삭제하시겠습니까?')) return;

        try {
            const response = await fetch(`/api/curriculums/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete curriculum');
            }

            notifications.show({
                title: '커리큘럼 삭제 완료',
                message: '커리큘럼이 삭제되었습니다.',
                color: 'red',
            });

            fetchCurriculums();
        } catch (error: any) {
            notifications.show({
                title: '오류',
                message: error.message || '삭제에 실패했습니다.',
                color: 'red',
            });
        }
    };

    // 학습 항목 추가/수정
    const handleItemSubmit = (values: typeof itemForm.values) => {
        if (!selectedCurriculum) return;

        const newItem: CurriculumItem = {
            id: editingItem ? editingItem.id : Date.now().toString(),
            type: values.type,
            title: values.title,
            daily_amount_type: values.daily_amount_type,
            daily_word_count: values.daily_amount_type === 'count' ? values.word_count : undefined,
            daily_section_amount: values.daily_amount_type === 'section' ? values.daily_section_amount : undefined,
            section_start: values.daily_amount_type === 'section' ? values.section_start : undefined,
            time_limit_seconds: values.time_limit_seconds,
            passing_score: values.passing_score,
        };

        const updatedCurriculum = {
            ...selectedCurriculum,
            items: editingItem
                ? selectedCurriculum.items.map((i) =>
                    i.id === editingItem.id ? newItem : i
                )
                : [...selectedCurriculum.items, newItem],
        };

        setCurriculums(
            curriculums.map((c) =>
                c.id === selectedCurriculum.id ? updatedCurriculum : c
            )
        );
        setSelectedCurriculum(updatedCurriculum);
        setItemModalOpened(false);
        itemForm.reset();
        setEditingItem(null);
    };

    // 학습 항목 순서 변경
    const moveItem = (index: number, direction: 'up' | 'down') => {
        if (!selectedCurriculum) return;
        const newItems = [...selectedCurriculum.items];
        if (direction === 'up' && index > 0) {
            [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
        } else if (direction === 'down' && index < newItems.length - 1) {
            [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        }

        const updatedCurriculum = { ...selectedCurriculum, items: newItems };
        setCurriculums(
            curriculums.map((c) =>
                c.id === selectedCurriculum.id ? updatedCurriculum : c
            )
        );
        setSelectedCurriculum(updatedCurriculum);
    };

    // 학습 항목 삭제
    const handleDeleteItem = (itemId: string) => {
        if (!selectedCurriculum) return;
        if (confirm('이 학습 항목을 삭제하시겠습니까?')) {
            const updatedCurriculum = {
                ...selectedCurriculum,
                items: selectedCurriculum.items.filter((i) => i.id !== itemId),
            };
            setCurriculums(
                curriculums.map((c) =>
                    c.id === selectedCurriculum.id ? updatedCurriculum : c
                )
            );
            setSelectedCurriculum(updatedCurriculum);
        }
    };

    return (
        <Container size="xl" py={40}>
            <div className="animate-fade-in">
                <Group justify="space-between" mb={30}>
                    <Box>
                        <Title order={1} style={{ fontWeight: 900, marginBottom: '0.5rem' }}>
                            📅 커리큘럼 관리
                        </Title>
                        <Text c="dimmed" size="lg">
                            학생들에게 적용할 학습 커리큘럼을 관리합니다
                        </Text>
                    </Box>
                    <button
                        onClick={() => {
                            setSelectedCurriculum(null);
                            curriculumForm.reset();
                            setModalOpened(true);
                        }}
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
                        <IconPlus size={20} />
                        새 커리큘럼 만들기
                    </button>
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
                                <Table.Th style={{ fontWeight: 900 }}>커리큘럼명</Table.Th>
                                <Table.Th style={{ fontWeight: 900 }}>설명</Table.Th>
                                <Table.Th style={{ fontWeight: 900 }}>학습 항목 수</Table.Th>
                                <Table.Th style={{ fontWeight: 900 }}>생성일</Table.Th>
                                <Table.Th style={{ textAlign: 'right', fontWeight: 900 }}>관리</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {curriculums.map((curriculum) => (
                                <Table.Tr key={curriculum.id}>
                                    <Table.Td
                                        style={{
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            textDecoration: 'underline',
                                            color: '#2563EB'
                                        }}
                                        onClick={() => setSelectedCurriculum(curriculum)}
                                    >
                                        {curriculum.title}
                                    </Table.Td>
                                    <Table.Td>{curriculum.description}</Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color="yellow"
                                            variant="filled"
                                            size="lg"
                                            radius="xs"
                                            style={{ border: '2px solid black', color: 'black' }}
                                        >
                                            {curriculum.items.length}개
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>{new Date(curriculum.created_at).toLocaleDateString()}</Table.Td>
                                    <Table.Td>
                                        <Group justify="flex-end" gap="xs">
                                            <ActionIcon
                                                variant="filled"
                                                color="gray"
                                                size="lg"
                                                radius={0}
                                                style={{ border: '2px solid black', boxShadow: '2px 2px 0px black' }}
                                                onClick={() => {
                                                    setSelectedCurriculum(curriculum);
                                                    curriculumForm.setValues({
                                                        title: curriculum.title,
                                                        description: curriculum.description,
                                                    });
                                                    setModalOpened(true);
                                                }}
                                            >
                                                <IconEdit size={18} />
                                            </ActionIcon>
                                            <ActionIcon
                                                variant="filled"
                                                color="red"
                                                size="lg"
                                                radius={0}
                                                style={{ border: '2px solid black', boxShadow: '2px 2px 0px black' }}
                                                onClick={() => handleDeleteCurriculum(curriculum.id)}
                                            >
                                                <IconTrash size={18} />
                                            </ActionIcon>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Paper>

                {/* 커리큘럼 상세 정보 */}
                {selectedCurriculum && !modalOpened && (
                    <Paper
                        mt="xl"
                        p="xl"
                        style={{
                            border: '2px solid black',
                            background: '#fff9db',
                            borderRadius: '0px',
                        }}
                    >
                        <Stack gap="lg">
                            <Group justify="space-between">
                                <Box>
                                    <Title order={3} style={{ fontWeight: 900 }}>{selectedCurriculum.title}</Title>
                                    <Text c="dimmed">{selectedCurriculum.description}</Text>
                                </Box>
                                <button
                                    onClick={() => {
                                        setEditingItem(null);
                                        itemForm.reset();
                                        setItemModalOpened(true);
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
                                    항목 추가
                                </button>
                            </Group>

                            <Table>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>순서</Table.Th>
                                        <Table.Th>유형</Table.Th>
                                        <Table.Th>교재명</Table.Th>
                                        <Table.Th>일일 학습량</Table.Th>
                                        <Table.Th>제한 시간</Table.Th>
                                        <Table.Th>합격 기준</Table.Th>
                                        <Table.Th style={{ textAlign: 'right' }}>관리</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {selectedCurriculum.items.map((item, index) => (
                                        <Table.Tr key={item.id}>
                                            <Table.Td>{index + 1}</Table.Td>
                                            <Table.Td>
                                                <Badge
                                                    color={item.type === 'word' ? 'blue' : 'green'}
                                                    variant="filled"
                                                    radius="xs"
                                                    style={{ border: '1px solid black' }}
                                                >
                                                    {item.type === 'word' ? '단어' : '듣기'}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td style={{ fontWeight: 600 }}>{item.title}</Table.Td>
                                            <Table.Td>
                                                {item.daily_amount_type === 'count'
                                                    ? `${item.daily_word_count}문제`
                                                    : `${item.daily_section_amount}소단원 (시작: ${item.section_start})`}
                                            </Table.Td>
                                            <Table.Td>{item.time_limit_seconds}초/문제</Table.Td>
                                            <Table.Td>{item.passing_score}점</Table.Td>
                                            <Table.Td>
                                                <Group justify="flex-end" gap={4}>
                                                    <ActionIcon
                                                        variant="subtle"
                                                        color="dark"
                                                        onClick={() => moveItem(index, 'up')}
                                                        disabled={index === 0}
                                                    >
                                                        <IconArrowUp size={16} />
                                                    </ActionIcon>
                                                    <ActionIcon
                                                        variant="subtle"
                                                        color="dark"
                                                        onClick={() => moveItem(index, 'down')}
                                                        disabled={index === selectedCurriculum.items.length - 1}
                                                    >
                                                        <IconArrowDown size={16} />
                                                    </ActionIcon>
                                                    <ActionIcon
                                                        variant="filled"
                                                        color="gray"
                                                        size="sm"
                                                        radius={0}
                                                        style={{ border: '2px solid black' }}
                                                        onClick={() => {
                                                            setEditingItem(item);
                                                            itemForm.setValues({
                                                                type: item.type,
                                                                title: item.title,
                                                                daily_amount_type: item.daily_amount_type,
                                                                daily_word_count: item.daily_word_count || 50,
                                                                daily_section_amount: item.daily_section_amount || 1,
                                                                section_start: item.section_start || '',
                                                                time_limit_seconds: item.time_limit_seconds,
                                                                passing_score: item.passing_score,
                                                                word_count: item.daily_word_count || 50,
                                                                section_count: 1,
                                                            });
                                                            setItemModalOpened(true);
                                                        }}
                                                    >
                                                        <IconEdit size={14} />
                                                    </ActionIcon>
                                                    <ActionIcon
                                                        variant="filled"
                                                        color="red"
                                                        size="sm"
                                                        radius={0}
                                                        style={{ border: '2px solid black' }}
                                                        onClick={() => handleDeleteItem(item.id)}
                                                    >
                                                        <IconTrash size={14} />
                                                    </ActionIcon>
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Stack>
                    </Paper>
                )}

                {/* 커리큘럼 기본 정보 모달 */}
                <Modal
                    opened={modalOpened}
                    onClose={() => setModalOpened(false)}
                    title="커리큘럼 정보"
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
                    <form onSubmit={curriculumForm.onSubmit(handleCurriculumSubmit)}>
                        <Stack>
                            <TextInput
                                label="커리큘럼 제목"
                                placeholder="예: 중학 1학년 정규반"
                                required
                                {...curriculumForm.getInputProps('title')}
                                styles={{ input: { border: '2px solid black', borderRadius: '0px' } }}
                            />
                            <TextInput
                                label="설명"
                                placeholder="커리큘럼에 대한 설명을 입력하세요"
                                {...curriculumForm.getInputProps('description')}
                                styles={{ input: { border: '2px solid black', borderRadius: '0px' } }}
                            />
                            <Group justify="flex-end" mt="md">
                                <Button
                                    variant="subtle"
                                    color="dark"
                                    onClick={() => setModalOpened(false)}
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
                                    {selectedCurriculum ? '수정하기' : '생성하기'}
                                </button>
                            </Group>
                        </Stack>
                    </form>
                </Modal>

                {/* 학습 항목 추가/수정 모달 */}
                <Modal
                    opened={itemModalOpened}
                    onClose={() => setItemModalOpened(false)}
                    title="학습 항목 설정"
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
                    <form onSubmit={itemForm.onSubmit(handleItemSubmit)}>
                        <Stack gap="md">
                            <Select
                                label="학습 교재 선택"
                                placeholder="교재를 선택하세요"
                                data={availableItems}
                                value={itemForm.values.title}
                                onChange={(value) => {
                                    const selectedItem = availableItems.find(i => i.value === value);
                                    if (selectedItem) {
                                        const cleanTitle = selectedItem.label.replace(/ \(단어장\)| \(듣기\)/g, '');
                                        itemForm.setFieldValue('title', cleanTitle);
                                        itemForm.setFieldValue('type', selectedItem.type as any);
                                    }
                                }}
                                styles={{ input: { border: '2px solid black', borderRadius: '0px' }, dropdown: { border: '2px solid black', borderRadius: '0px' } }}
                            />

                            <Select
                                label="일일 학습량 기준"
                                data={[
                                    { value: 'count', label: '문제 수 기준' },
                                    { value: 'section', label: '소단원 기준' },
                                ]}
                                {...itemForm.getInputProps('daily_amount_type')}
                                styles={{ input: { border: '2px solid black', borderRadius: '0px' }, dropdown: { border: '2px solid black', borderRadius: '0px' } }}
                            />

                            {itemForm.values.daily_amount_type === 'section' && (
                                <>
                                    <Select
                                        label="진도 나갈 소단원 수"
                                        data={[
                                            { value: '0.5', label: '0.5 소단원' },
                                            { value: '1', label: '1 소단원' },
                                            { value: '2', label: '2 소단원' },
                                        ]}
                                        value={itemForm.values.daily_section_amount.toString()}
                                        onChange={(value) =>
                                            itemForm.setFieldValue('daily_section_amount', parseFloat(value!) as 0.5 | 1 | 2)
                                        }
                                        styles={{ input: { border: '2px solid black', borderRadius: '0px' }, dropdown: { border: '2px solid black', borderRadius: '0px' } }}
                                    />
                                    <Select
                                        label="시작 소단원"
                                        data={availableSections.map((s) => ({
                                            value: s.minor_unit,
                                            label: s.minor_unit,
                                        }))}
                                        {...itemForm.getInputProps('section_start')}
                                        styles={{ input: { border: '2px solid black', borderRadius: '0px' }, dropdown: { border: '2px solid black', borderRadius: '0px' } }}
                                    />
                                </>
                            )}

                            <NumberInput
                                label="단어 수"
                                min={1}
                                disabled={itemForm.values.daily_amount_type === 'section'}
                                {...itemForm.getInputProps('word_count')}
                                styles={{ input: { border: '2px solid black', borderRadius: '0px' } }}
                                description={
                                    itemForm.values.daily_amount_type === 'section'
                                        ? '소단원 기준 설정 시 자동 계산됩니다'
                                        : ''
                                }
                            />

                            <NumberInput
                                label="제한 시간 (초)"
                                min={5}
                                max={59}
                                {...itemForm.getInputProps('time_limit_seconds')}
                                styles={{ input: { border: '2px solid black', borderRadius: '0px' } }}
                                description="문항당 제한 시간 (5-59초)"
                            />

                            <NumberInput
                                label="합격 점수 (%)"
                                min={0}
                                max={100}
                                {...itemForm.getInputProps('passing_score')}
                                styles={{ input: { border: '2px solid black', borderRadius: '0px' } }}
                            />

                            <Group justify="flex-end" mt="md">
                                <Button
                                    variant="subtle"
                                    color="dark"
                                    onClick={() => setItemModalOpened(false)}
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
