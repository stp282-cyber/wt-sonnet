'use client';

import { useState, useEffect } from 'react';
import {
    Container,
    Title,
    Paper,
    Button,
    Group,
    Modal,
    TextInput,
    Stack,
    ActionIcon,
    Text,
    Box,
    Select,
    Textarea,
    NumberInput,
    Grid,
    Badge,
    FileInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
    IconPlus,
    IconEdit,
    IconTrash,
    IconCopy,
    IconArrowUp,
    IconArrowDown,
    IconDownload,
    IconUpload,
} from '@tabler/icons-react';
import {
    calculateWordCountBySection,
    getAvailableSections,
    exportCurriculumToJSON,
    importCurriculumFromJSON,
    type WordbookSection,
} from '@/lib/utils/curriculumUtils';

interface CurriculumItem {
    id: string;
    sequence: number;
    item_type: 'wordbook' | 'listening';
    item_id: string;
    item_name: string;
    test_type: 'typing' | 'scramble' | 'multiple_choice';
    daily_amount_type: 'section' | 'word_count';
    daily_section_amount?: 0.5 | 1 | 2;
    section_start?: string;
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
            items: [],
            created_at: '2024-01-01',
        },
    ]);

    // 단어장 목록 (실제로는 단어장 관리 페이지에서 가져옴)
    const [wordbooks] = useState([
        { value: '1', label: '중학 영단어 1000' },
        { value: '2', label: 'CHAPTER 5: TRAVEL ESSENTIALS' },
        { value: '3', label: 'CHAPTER 3: FAMILY MEMBERS' },
    ]);

    // 듣기 시험 목록
    const [listeningTests] = useState([
        { value: '1', label: '기초 듣기 1' },
        { value: '2', label: '중급 듣기 2' },
    ]);

    const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null);
    const [modalOpened, setModalOpened] = useState(false);
    const [itemModalOpened, setItemModalOpened] = useState(false);
    const [editingCurriculum, setEditingCurriculum] = useState<Curriculum | null>(null);
    const [availableSections, setAvailableSections] = useState<WordbookSection[]>([]);

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
            item_id: '',
            item_name: '',
            test_type: 'typing' as 'typing' | 'scramble' | 'multiple_choice',
            daily_amount_type: 'section' as 'section' | 'word_count',
            daily_section_amount: 1 as 0.5 | 1 | 2,
            section_start: '',
            word_count: 0,
            time_limit_seconds: 20,
            passing_score: 80,
        },
        validate: {
            item_id: (value) => (!value ? '단어장/듣기 시험을 선택해주세요' : null),
        },
    });

    // 단어장/듣기 선택 시 이름 자동 설정
    useEffect(() => {
        if (itemForm.values.item_id) {
            const selectedList = itemForm.values.item_type === 'wordbook' ? wordbooks : listeningTests;
            const selected = selectedList.find(item => item.value === itemForm.values.item_id);
            if (selected) {
                itemForm.setFieldValue('item_name', selected.label);
            }
        }
    }, [itemForm.values.item_id, itemForm.values.item_type]);

    // 단어장 선택 시 소단원 목록 로드
    useEffect(() => {
        if (itemForm.values.item_id && itemForm.values.item_type === 'wordbook') {
            const sections = getAvailableSections(itemForm.values.item_id);
            setAvailableSections(sections);
            if (sections.length > 0) {
                itemForm.setFieldValue('section_start', sections[0].minor_unit);
            }
        }
    }, [itemForm.values.item_id, itemForm.values.item_type]);

    // 일일 학습량 변경 시 단어 수 자동 계산
    useEffect(() => {
        if (
            itemForm.values.daily_amount_type === 'section' &&
            itemForm.values.section_start &&
            availableSections.length > 0
        ) {
            try {
                const wordCount = calculateWordCountBySection(
                    availableSections,
                    itemForm.values.section_start,
                    itemForm.values.daily_section_amount
                );
                itemForm.setFieldValue('word_count', wordCount);
            } catch (error) {
                console.error(error);
            }
        }
    }, [
        itemForm.values.daily_amount_type,
        itemForm.values.daily_section_amount,
        itemForm.values.section_start,
        availableSections,
    ]);

    const handleSubmit = (values: typeof curriculumForm.values) => {
        if (editingCurriculum) {
            setCurriculums(
                curriculums.map((c) =>
                    c.id === editingCurriculum.id ? { ...c, ...values } : c
                )
            );
            if (selectedCurriculum?.id === editingCurriculum.id) {
                setSelectedCurriculum({ ...selectedCurriculum, ...values });
            }
            notifications.show({
                title: '커리큘럼 수정 완료',
                message: `${values.name} 커리큘럼이 수정되었습니다.`,
                color: 'blue',
            });
        } else {
            const newCurriculum: Curriculum = {
                id: Date.now().toString(),
                name: values.name,
                description: values.description,
                items: [],
                created_at: new Date().toISOString(),
            };
            setCurriculums([...curriculums, newCurriculum]);
            setSelectedCurriculum(newCurriculum);
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
            if (selectedCurriculum?.id === curriculum.id) {
                setSelectedCurriculum(null);
            }
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

    const handleBackup = (curriculum: Curriculum) => {
        exportCurriculumToJSON(curriculum);
        notifications.show({
            title: '백업 완료',
            message: `${curriculum.name} 백업 파일이 다운로드되었습니다.`,
            color: 'blue',
        });
    };

    const handleRestore = async (file: File | null) => {
        if (!file) return;

        try {
            const restoredData = await importCurriculumFromJSON(file);
            const newCurriculum: Curriculum = {
                id: Date.now().toString(),
                name: `${restoredData.name} (복원)`,
                description: restoredData.description,
                items: restoredData.items,
                created_at: new Date().toISOString(),
            };
            setCurriculums([...curriculums, newCurriculum]);
            notifications.show({
                title: '복원 완료',
                message: `${restoredData.name} 커리큘럼이 복원되었습니다.`,
                color: 'green',
            });
        } catch (error: any) {
            notifications.show({
                title: '복원 실패',
                message: error.message,
                color: 'red',
            });
        }
    };

    const handleAddItem = (values: typeof itemForm.values) => {
        if (!selectedCurriculum) return;

        const newItem: CurriculumItem = {
            id: Date.now().toString(),
            sequence: selectedCurriculum.items.length + 1,
            ...values,
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

    const handleMoveItem = (index: number, direction: 'up' | 'down') => {
        if (!selectedCurriculum) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= selectedCurriculum.items.length) return;

        const newItems = [...selectedCurriculum.items];
        [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
        newItems.forEach((item, idx) => {
            item.sequence = idx + 1;
        });

        const updatedCurriculum = {
            ...selectedCurriculum,
            items: newItems,
        };

        setCurriculums(
            curriculums.map((c) => (c.id === selectedCurriculum.id ? updatedCurriculum : c))
        );
        setSelectedCurriculum(updatedCurriculum);
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
                            커리큘럼 생성 및 단어장 순서 관리
                        </Text>
                    </Box>
                    <Group>
                        <FileInput
                            placeholder="백업 파일 복원"
                            accept=".json"
                            onChange={handleRestore}
                            leftSection={<IconUpload size={20} />}
                            styles={{
                                input: {
                                    border: '4px solid black',
                                    background: '#4ECDC4',
                                    color: 'white',
                                    fontWeight: 900,
                                },
                            }}
                        />
                        <button
                            onClick={() => {
                                setEditingCurriculum(null);
                                curriculumForm.reset();
                                setModalOpened(true);
                            }}
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
                </Group>

                <Grid>
                    {/* 왼쪽: 커리큘럼 목록 */}
                    <Grid.Col span={4}>
                        <Paper
                            p="lg"
                            radius="lg"
                            className="neo-card"
                            style={{
                                border: '4px solid black',
                                background: 'white',
                                minHeight: '600px',
                            }}
                        >
                            <Title order={3} mb="md" style={{ fontWeight: 900 }}>
                                커리큘럼 목록
                            </Title>
                            <Stack gap="sm">
                                {curriculums.map((curriculum) => (
                                    <Paper
                                        key={curriculum.id}
                                        p="md"
                                        style={{
                                            border: '3px solid black',
                                            background:
                                                selectedCurriculum?.id === curriculum.id ? '#f5f0ff' : 'white',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                        onClick={() => setSelectedCurriculum(curriculum)}
                                    >
                                        <Group justify="space-between" mb="xs">
                                            <Text fw={700}>{curriculum.name}</Text>
                                            <Badge color="violet">{curriculum.items.length}개</Badge>
                                        </Group>
                                        <Text size="sm" c="dimmed" lineClamp={2}>
                                            {curriculum.description}
                                        </Text>
                                        <Group gap="xs" mt="sm">
                                            <ActionIcon
                                                variant="filled"
                                                color="teal"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCopy(curriculum);
                                                }}
                                            >
                                                <IconCopy size={14} />
                                            </ActionIcon>
                                            <ActionIcon
                                                variant="filled"
                                                color="blue"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingCurriculum(curriculum);
                                                    curriculumForm.setValues({
                                                        name: curriculum.name,
                                                        description: curriculum.description,
                                                    });
                                                    setModalOpened(true);
                                                }}
                                            >
                                                <IconEdit size={14} />
                                            </ActionIcon>
                                            <ActionIcon
                                                variant="filled"
                                                color="cyan"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleBackup(curriculum);
                                                }}
                                            >
                                                <IconDownload size={14} />
                                            </ActionIcon>
                                            <ActionIcon
                                                variant="filled"
                                                color="red"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(curriculum);
                                                }}
                                            >
                                                <IconTrash size={14} />
                                            </ActionIcon>
                                        </Group>
                                    </Paper>
                                ))}
                            </Stack>
                        </Paper>
                    </Grid.Col>

                    {/* 오른쪽: 선택된 커리큘럼 상세 */}
                    <Grid.Col span={8}>
                        {selectedCurriculum ? (
                            <Paper
                                p="xl"
                                radius="lg"
                                className="neo-card"
                                style={{
                                    border: '4px solid black',
                                    background: '#f5f0ff',
                                }}
                            >
                                <Group justify="space-between" mb="lg">
                                    <Box>
                                        <Title order={2} style={{ fontWeight: 900 }}>
                                            {selectedCurriculum.name}
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
                                            border: '4px solid black',
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
                                        단어장 추가
                                    </button>
                                </Group>

                                <Title order={4} mb="md" style={{ fontWeight: 900 }}>
                                    학습 경로 ({selectedCurriculum.items.length}단계)
                                </Title>

                                <Stack gap="md">
                                    {selectedCurriculum.items.length === 0 ? (
                                        <Paper p="xl" style={{ border: '3px dashed #ccc', textAlign: 'center' }}>
                                            <Text c="dimmed">
                                                단어장을 추가하여 학습 경로를 구성하세요.
                                            </Text>
                                        </Paper>
                                    ) : (
                                        selectedCurriculum.items.map((item, index) => (
                                            <Paper
                                                key={item.id}
                                                p="md"
                                                style={{
                                                    border: '3px solid black',
                                                    background: 'white',
                                                }}
                                            >
                                                <Group justify="space-between" mb="sm">
                                                    <Group>
                                                        <Badge size="lg" color="violet">
                                                            {item.sequence}
                                                        </Badge>
                                                        <Text fw={700} size="lg">
                                                            {item.item_name}
                                                        </Text>
                                                    </Group>
                                                    <Group gap="xs">
                                                        <ActionIcon
                                                            variant="filled"
                                                            color="blue"
                                                            onClick={() => handleMoveItem(index, 'up')}
                                                            disabled={index === 0}
                                                        >
                                                            <IconArrowUp size={18} />
                                                        </ActionIcon>
                                                        <ActionIcon
                                                            variant="filled"
                                                            color="blue"
                                                            onClick={() => handleMoveItem(index, 'down')}
                                                            disabled={index === selectedCurriculum.items.length - 1}
                                                        >
                                                            <IconArrowDown size={18} />
                                                        </ActionIcon>
                                                        <ActionIcon
                                                            variant="filled"
                                                            color="red"
                                                            onClick={() => handleDeleteItem(item.id)}
                                                        >
                                                            <IconTrash size={18} />
                                                        </ActionIcon>
                                                    </Group>
                                                </Group>

                                                <Grid>
                                                    <Grid.Col span={3}>
                                                        <Text size="xs" c="dimmed" mb={5}>
                                                            시험 방식
                                                        </Text>
                                                        <Badge color="violet" size="lg">
                                                            {item.test_type === 'typing'
                                                                ? '영어 타자'
                                                                : item.test_type === 'scramble'
                                                                    ? '문장 섞기'
                                                                    : '4지선다'}
                                                        </Badge>
                                                    </Grid.Col>
                                                    <Grid.Col span={3}>
                                                        <Text size="xs" c="dimmed" mb={5}>
                                                            일일 학습량
                                                        </Text>
                                                        <Text fw={700}>
                                                            {item.daily_amount_type === 'section'
                                                                ? `${item.daily_section_amount} 소단원`
                                                                : '수동 설정'}
                                                        </Text>
                                                    </Grid.Col>
                                                    <Grid.Col span={2}>
                                                        <Text size="xs" c="dimmed" mb={5}>
                                                            단어 수
                                                        </Text>
                                                        <Text fw={700}>{item.word_count}개</Text>
                                                    </Grid.Col>
                                                    <Grid.Col span={2}>
                                                        <Text size="xs" c="dimmed" mb={5}>
                                                            제한 시간
                                                        </Text>
                                                        <Text fw={700}>{item.time_limit_seconds}초</Text>
                                                    </Grid.Col>
                                                    <Grid.Col span={2}>
                                                        <Text size="xs" c="dimmed" mb={5}>
                                                            통과 점수
                                                        </Text>
                                                        <Text fw={700}>{item.passing_score}%</Text>
                                                    </Grid.Col>
                                                </Grid>
                                            </Paper>
                                        ))
                                    )}
                                </Stack>

                                {/* 진행 방식 안내 */}
                                <Paper
                                    p="md"
                                    mt="xl"
                                    style={{
                                        border: '3px solid #FFD93D',
                                        background: '#FFFBEB',
                                    }}
                                >
                                    <Title order={5} mb="sm" style={{ fontWeight: 900 }}>
                                        💡 진행 방식
                                    </Title>
                                    <Stack gap="xs">
                                        <Text size="sm">• 학생들은 순서대로 단어장을 학습합니다.</Text>
                                        <Text size="sm">• 현재 단어장을 통과해야 다음 단어장이 열립니다.</Text>
                                        <Text size="sm">• 각 단계별로 다른 시험 방식을 설정할 수 있습니다.</Text>
                                    </Stack>
                                </Paper>
                            </Paper>
                        ) : (
                            <Paper
                                p="xl"
                                radius="lg"
                                style={{
                                    border: '4px dashed #ccc',
                                    textAlign: 'center',
                                    minHeight: '600px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Box>
                                    <Text size="xl" c="dimmed" mb="md">
                                        왼쪽에서 커리큘럼을 선택하세요
                                    </Text>
                                    <Text c="dimmed">또는 새 커리큘럼을 생성하세요</Text>
                                </Box>
                            </Paper>
                        )}
                    </Grid.Col>
                </Grid>

                {/* 커리큘럼 생성/수정 모달 */}
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
                            단어장 추가
                        </Title>
                    }
                    size="lg"
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

                            <Select
                                label="단어장/듣기 시험 이름"
                                placeholder="선택하세요"
                                required
                                searchable
                                data={itemForm.values.item_type === 'wordbook' ? wordbooks : listeningTests}
                                {...itemForm.getInputProps('item_id')}
                                styles={{ input: { border: '3px solid black' } }}
                            />

                            <Select
                                label="시험 방식"
                                data={[
                                    { value: 'typing', label: '영어 타자 (Typing)' },
                                    { value: 'scramble', label: '문장 섞기 (Scramble)' },
                                    { value: 'multiple_choice', label: '4지선다 (Multiple Choice)' },
                                ]}
                                {...itemForm.getInputProps('test_type')}
                                styles={{ input: { border: '3px solid black' } }}
                            />

                            <Select
                                label="일일 학습량 설정 방식"
                                data={[
                                    { value: 'section', label: '소단원 기준' },
                                    { value: 'word_count', label: '단어 수 기준' },
                                ]}
                                {...itemForm.getInputProps('daily_amount_type')}
                                styles={{ input: { border: '3px solid black' } }}
                            />

                            {itemForm.values.daily_amount_type === 'section' && (
                                <>
                                    <Select
                                        label="일일 학습량 (소단원)"
                                        data={[
                                            { value: '0.5', label: '0.5 소단원' },
                                            { value: '1', label: '1 소단원' },
                                            { value: '2', label: '2 소단원' },
                                        ]}
                                        value={itemForm.values.daily_section_amount.toString()}
                                        onChange={(value) =>
                                            itemForm.setFieldValue('daily_section_amount', parseFloat(value!) as 0.5 | 1 | 2)
                                        }
                                        styles={{ input: { border: '3px solid black' } }}
                                    />
                                    <Select
                                        label="시작 소단원"
                                        data={availableSections.map((s) => ({
                                            value: s.minor_unit,
                                            label: s.minor_unit,
                                        }))}
                                        {...itemForm.getInputProps('section_start')}
                                        styles={{ input: { border: '3px solid black' } }}
                                    />
                                </>
                            )}

                            <NumberInput
                                label="단어 수"
                                min={1}
                                disabled={itemForm.values.daily_amount_type === 'section'}
                                {...itemForm.getInputProps('word_count')}
                                styles={{ input: { border: '3px solid black' } }}
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
                                styles={{ input: { border: '3px solid black' } }}
                                description="문항당 제한 시간 (5-59초)"
                            />

                            <NumberInput
                                label="합격 점수 (%)"
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
