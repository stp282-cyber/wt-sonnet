'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Container,
    Title,
    Paper,
    Text,
    Group,
    Stack,
    Badge,
    Button,
    Box,
    Loader,
    Center,
    Modal,
    NumberInput,
    Select,
    Checkbox,
    Switch,
    ActionIcon,
    SimpleGrid,
} from '@mantine/core';
import { DateInput, DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconSettings, IconRefresh, IconCalendar, IconTrash } from '@tabler/icons-react';
import { StudentCurriculum, CurriculumItem, Section, ScheduleItem, DAY_MAP } from '@/types/curriculum';
import { getWeekDays, getAllSectionsForCurriculum, getScheduleForDate, calculateStartDateForProgress } from '@/lib/curriculumUtils';

interface Student {
    id: string;
    full_name: string;
    username: string;
    classes?: {
        id: string;
        name: string;
    } | null;
}

export default function StudentSchedulePage() {
    const params = useParams();
    const router = useRouter();
    const [student, setStudent] = useState<Student | null>(null);
    const [curriculums, setCurriculums] = useState<StudentCurriculum[]>([]);
    const [loading, setLoading] = useState(true);
    // 초기 날짜 설정: 토/일이면 다음주 월요일로 설정
    const [searchStartDate, setSearchStartDate] = useState<Date>(() => {
        const d = new Date();
        const day = d.getDay();
        if (day === 0) d.setDate(d.getDate() + 1); // 일 -> 월
        if (day === 6) d.setDate(d.getDate() + 2); // 토 -> 월
        return d;
    });

    // Modals State
    const [activeModal, setActiveModal] = useState<'settings' | 'progress' | 'schedule' | 'delete' | null>(null);
    const [selectedCurriculum, setSelectedCurriculum] = useState<StudentCurriculum | null>(null);

    // Settings Form State
    const [settingsForm, setSettingsForm] = useState({
        passing_score: 80,
        time_limit_seconds: 20,
        daily_amount: 20,
        daily_amount_type: 'count',
        test_type: 'multiple_choice'
    });

    // Progress Form State
    const [progressForm, setProgressForm] = useState({
        current_item_id: '',
        current_progress: 1,
        effective_date: new Date()
    });

    // Schedule Form State
    const [scheduleForm, setScheduleForm] = useState({
        study_days: [] as string[],
        breaks: [] as { start_date: string; end_date: string; reason?: string }[],
        newBreak: [null, null] as [Date | null, Date | null]
    });

    const fetchStudentData = async () => {
        if (!params.student_id) return;
        try {
            const response = await fetch(`/api/student-curriculums/student/${params.student_id}`);
            if (!response.ok) throw new Error('Failed to fetch data');

            const data = await response.json();
            setStudent(data.student);
            setCurriculums(data.curriculums || []);
        } catch (error) {
            console.error(error);
            notifications.show({
                title: '오류',
                message: '데이터를 불러오는데 실패했습니다.',
                color: 'red'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudentData();
    }, [params.student_id]);

    // Handlers
    const openSettingsModal = (curr: StudentCurriculum) => {
        setSelectedCurriculum(curr);
        const item = curr.curriculum_items[0];
        const override = curr.setting_overrides;

        const type = (override?.daily_amount_type as any)
            ?? item?.daily_amount_type
            ?? 'count';

        let amount = override?.daily_amount;
        if (!amount) {
            if (type === 'section') {
                amount = item?.daily_amount ?? 1;
            } else {
                amount = item?.daily_word_count ?? item?.daily_amount ?? 20;
            }
        } else {
            // Safety check for legacy data
            if (type === 'section' && amount > 5) {
                amount = 1;
            }
        }

        setSettingsForm({
            passing_score: override?.passing_score ?? item?.passing_score ?? 80,
            time_limit_seconds: override?.time_limit_seconds ?? item?.time_limit_seconds ?? 20,
            daily_amount: amount,
            daily_amount_type: type,
            test_type: override?.test_type ?? item?.test_type ?? 'multiple_choice'
        });
        setActiveModal('settings');
    };

    const openProgressModal = (curr: StudentCurriculum) => {
        setSelectedCurriculum(curr);
        setProgressForm({
            current_item_id: curr.current_item_id || curr.curriculum_items[0]?.id || '',
            current_progress: curr.current_progress || 1,
            effective_date: new Date() // Open with "Today" as default
        });
        setActiveModal('progress');
    };

    const openScheduleModal = (curr: StudentCurriculum) => {
        setSelectedCurriculum(curr);
        let days: string[] = [];
        if (typeof curr.study_days === 'string') {
            try { days = JSON.parse(curr.study_days.replace(/'/g, '"')); } catch (e) { }
        } else if (Array.isArray(curr.study_days)) {
            days = curr.study_days;
        }
        setScheduleForm({
            study_days: days,
            breaks: curr.breaks || [],
            newBreak: [null, null]
        });
        setActiveModal('schedule');
    };

    const openDeleteModal = (curr: StudentCurriculum) => {
        setSelectedCurriculum(curr);
        setActiveModal('delete');
    };

    const handleSaveSettings = async () => {
        if (!selectedCurriculum) return;
        try {
            const res = await fetch(`/api/student-curriculums/${selectedCurriculum.id}/settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ setting_overrides: settingsForm })
            });
            if (!res.ok) throw new Error('Failed to update settings');
            notifications.show({ title: '성공', message: '학습 설정이 저장되었습니다.', color: 'green' });
            setActiveModal(null);
            fetchStudentData();
        } catch (error) {
            notifications.show({ title: '오류', message: '설정 저장 실패', color: 'red' });
        }
    };

    const handleSaveProgress = async () => {
        if (!selectedCurriculum) return;

        // 변경된 진도(및 시작 기준일)에 맞춰 StartDate 재계산
        const newStartDate = calculateStartDateForProgress(
            selectedCurriculum,
            progressForm.current_progress,
            progressForm.effective_date // 사용자가 선택한 "학습 재개 시작일"
        );

        try {
            const res = await fetch(`/api/student-curriculums/${selectedCurriculum.id}/progress`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_item_id: progressForm.current_item_id,
                    current_progress: progressForm.current_progress,
                    start_date: newStartDate
                })
            });
            if (!res.ok) throw new Error('Failed to update progress');
            notifications.show({ title: '성공', message: '수업 진도가 변경되었습니다.', color: 'green' });
            setActiveModal(null);
            fetchStudentData();
        } catch (error) {
            notifications.show({ title: '오류', message: '진도 변경 실패', color: 'red' });
        }
    };

    const handleSaveSchedule = async () => {
        if (!selectedCurriculum) return;
        try {
            const res = await fetch(`/api/student-curriculums/${selectedCurriculum.id}/schedule`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    study_days: scheduleForm.study_days,
                    breaks: scheduleForm.breaks
                })
            });
            if (!res.ok) throw new Error('Failed to update schedule');
            notifications.show({ title: '성공', message: '학습 일정이 변경되었습니다.', color: 'green' });
            setActiveModal(null);
            fetchStudentData();
        } catch (error) {
            notifications.show({ title: '오류', message: '일정 변경 실패', color: 'red' });
        }
    };

    const handleDeleteCurriculum = async () => {
        if (!selectedCurriculum) return;
        try {
            const res = await fetch(`/api/student-curriculums/${selectedCurriculum.id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete');
            notifications.show({ title: '성공', message: '커리큘럼이 삭제되었습니다.', color: 'green' });
            setActiveModal(null);
            fetchStudentData();
        } catch (error) {
            notifications.show({ title: '오류', message: '삭제 실패', color: 'red' });
        }
    };

    if (loading) {
        return (
            <Container size="xl" py={40}>
                <Center style={{ minHeight: '60vh' }}>
                    <Loader size="xl" color="yellow" type="dots" />
                </Center>
            </Container>
        );
    }

    if (!student) {
        return (
            <Container size="xl" py={40}>
                <Center style={{ minHeight: '60vh' }}>
                    <Text>학생 정보를 찾을 수 없습니다.</Text>
                </Center>
            </Container>
        );
    }

    const weeksToRender = [0, 1, 2, 3];

    return (
        <Container size="xl" py={40}>
            {/* 상단 헤더 */}
            <Group justify="space-between" mb="xl">
                <Group>
                    <Title order={2} style={{ fontWeight: 900 }}>수업일지</Title>
                    <Badge size="lg" color="yellow" variant="filled" radius="xs" style={{ border: '2px solid black', color: 'black' }}>
                        {student.full_name}
                    </Badge>
                    <Badge size="lg" color="gray" variant="filled" radius="xs" style={{ border: '2px solid black' }}>
                        {student.classes?.name || '반 없음'}
                    </Badge>
                </Group>
                <Group>
                    <Stack gap={0} visibleFrom="sm">
                        <Text fw={700} size="xs" ta="right">검색시작일</Text>
                        <DateInput
                            value={searchStartDate}
                            onChange={(date) => date && setSearchStartDate(date)}
                            valueFormat="YYYY-MM-DD"
                            size="sm"
                            styles={{
                                input: {
                                    fontWeight: 'bold',
                                    border: '2px solid black',
                                    borderRadius: '0px',
                                    width: '140px'
                                }
                            }}
                        />
                    </Stack>
                    {/* Mobile Date Input */}
                    <Box hiddenFrom="sm">
                        <DateInput
                            value={searchStartDate}
                            onChange={(date) => date && setSearchStartDate(date)}
                            valueFormat="MM.DD"
                            size="sm"
                            styles={{
                                input: {
                                    fontWeight: 'bold',
                                    border: '2px solid black',
                                    borderRadius: '0px',
                                    width: '80px',
                                    textAlign: 'center'
                                }
                            }}
                        />
                    </Box>

                    <Button
                        variant="outline"
                        color="dark"
                        leftSection={<IconArrowLeft size={16} />}
                        onClick={() => router.back()}
                        style={{ border: '2px solid black', borderRadius: '0px' }}
                    >
                        뒤로가기
                    </Button>
                </Group>
            </Group>

            {/* 주차별 테이블 */}
            <Stack gap={30}>
                {weeksToRender.map((weekOffset) => {
                    const weekDays = getWeekDays(searchStartDate, weekOffset);
                    const weekLabel = weekOffset === 0 ? "이번주" : weekOffset === 1 ? "다음주" : `${weekOffset}주 후`;

                    return (
                        <Box key={weekOffset}>
                            <Text fw={900} size="lg" mb="xs">{weekLabel}</Text>

                            {/* 공통 헤더 (요일/날짜) - PC만 표시 */}
                            <Box visibleFrom="md" style={{ display: 'flex', marginBottom: -3 }}>
                                <Box style={{ width: '200px', minWidth: '200px' }} />
                                <Box style={{
                                    flex: 1,
                                    display: 'flex',
                                    border: '3px solid black',
                                    background: '#FFD93D'
                                }}>
                                    {weekDays.map((day, idx) => (
                                        <Box key={idx} style={{
                                            flex: 1,
                                            padding: '8px',
                                            borderRight: idx < 4 ? '2px solid black' : 'none',
                                            textAlign: 'center'
                                        }}>
                                            <Text fw={900} size="lg">{day.dayOfWeek}</Text>
                                            <Text size="xs" fw={700}>{day.date}</Text>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>

                            {curriculums.map((curr) => (
                                <Paper key={curr.id} mb="md" style={{ border: '3px solid black', borderRadius: '0px', overflow: 'hidden' }}>
                                    <Box style={{ display: 'flex', flexDirection: 'column' }} mod={{ desktop: true }}>
                                        <style jsx global>{`
                                            @media (min-width: 62em) {
                                                [data-desktop] { flex-direction: row !important; }
                                            }
                                        `}</style>
                                        {/* 좌측 커리큘럼 정보 */}
                                        <Box style={{
                                            width: '100%',
                                            background: 'white',
                                            padding: '16px',
                                            borderBottom: '3px solid black'
                                        }} mod={{ desktop: true }}>
                                            <style jsx global>{`
                                                @media (min-width: 62em) {
                                                    [data-desktop] { 
                                                        width: 200px !important;
                                                        min-width: 200px !important;
                                                        border-right: 3px solid black !important;
                                                        border-bottom: none !important;
                                                    }
                                                }
                                            `}</style>
                                            <Text fw={900} size="md" mb="xs" style={{ lineHeight: 1.2 }}>
                                                {curr.curriculums.name}
                                            </Text>
                                            <Text size="xs" c="dimmed" mb="md">
                                                시작일: {curr.start_date}
                                            </Text>

                                            <Stack gap={6}>
                                                <Button
                                                    size="xs"
                                                    variant="outline"
                                                    color="dark"
                                                    fullWidth
                                                    leftSection={<IconSettings size={14} />}
                                                    style={{ border: '2px solid black', borderRadius: '0px' }}
                                                    onClick={() => openSettingsModal(curr)}
                                                >
                                                    학습 설정
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    variant="outline"
                                                    color="green"
                                                    fullWidth
                                                    leftSection={<IconRefresh size={14} />}
                                                    style={{ border: '2px solid black', borderRadius: '0px' }}
                                                    onClick={() => openProgressModal(curr)}
                                                >
                                                    수업 진도 변경
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    variant="outline"
                                                    color="blue"
                                                    fullWidth
                                                    leftSection={<IconCalendar size={14} />}
                                                    style={{ border: '2px solid black', borderRadius: '0px' }}
                                                    onClick={() => openScheduleModal(curr)}
                                                >
                                                    학습 일정 변경
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    variant="filled"
                                                    color="red"
                                                    fullWidth
                                                    leftSection={<IconTrash size={14} />}
                                                    style={{ border: '2px solid black', borderRadius: '0px' }}
                                                    onClick={() => openDeleteModal(curr)}
                                                >
                                                    커리큘럼 삭제
                                                </Button>
                                            </Stack>
                                        </Box>

                                        {/* 우측 달력 영역 */}
                                        <Box style={{ flex: 1, display: 'flex', flexDirection: 'column' }} mod={{ desktop: true }}>
                                            <style jsx global>{`
                                                @media (min-width: 62em) {
                                                    [data-desktop] { flex-direction: row !important; }
                                                }
                                            `}</style>
                                            {weekDays.map((day, idx) => {
                                                const schedule = getScheduleForDate(curr, day.date);

                                                return (
                                                    <Box
                                                        key={idx}
                                                        style={{
                                                            flex: 1,
                                                            borderBottom: idx < 4 ? '2px solid black' : 'none',
                                                            display: 'flex',
                                                            flexDirection: 'column'
                                                        }}
                                                        mod={{ desktop: true }}
                                                    >
                                                        <style jsx global>{`
                                                            @media (min-width: 62em) {
                                                                [data-desktop] { 
                                                                    border-right: ${idx < 4 ? '2px solid black' : 'none'} !important;
                                                                    border-bottom: none !important;
                                                                }
                                                            }
                                                        `}</style>

                                                        {/* Mobile Day Header */}
                                                        <Box hiddenFrom="md" p="xs" bg="#FFD93D" style={{ borderBottom: '2px solid black' }}>
                                                            <Group justify="space-between">
                                                                <Text fw={900}>{day.dayOfWeek}</Text>
                                                                <Text size="sm" fw={700}>{day.date}</Text>
                                                            </Group>
                                                        </Box>

                                                        {/* 학습 내용 */}
                                                        <Box style={{
                                                            padding: '10px',
                                                            flex: 1,
                                                            background: schedule?.status === 'today' ? '#fff9db' : 'white'
                                                        }}>
                                                            {schedule ? (
                                                                <Stack gap={4}>
                                                                    <Text fw={700} size="sm" lineClamp={2}>
                                                                        {schedule.itemTitle}
                                                                    </Text>

                                                                    <Group gap={4}>
                                                                        <Text size="xs" c="dimmed">대단원:</Text>
                                                                        <Text size="xs" fw={600}>{schedule.majorUnit}</Text>
                                                                    </Group>

                                                                    <Group gap={4}>
                                                                        <Text size="xs" c="dimmed">소단원:</Text>
                                                                        <Text size="xs" fw={600}>{schedule.minorUnit}</Text>
                                                                    </Group>

                                                                    <Group gap={4}>
                                                                        <Text size="xs" c="dimmed">단원명:</Text>
                                                                        <Text size="xs" fw={600}>{schedule.unitName}</Text>
                                                                    </Group>

                                                                    <Box style={{
                                                                        background: '#FFF9DB',
                                                                        padding: '6px',
                                                                        marginTop: '4px',
                                                                        border: '1px solid #FFD93D',
                                                                        borderRadius: '4px'
                                                                    }}>
                                                                        <Text size="xs" fw={700} ta="center">진도 범위</Text>
                                                                        <Text size="xs" ta="center">{schedule.progressRange}</Text>
                                                                    </Box>

                                                                    <Group justify="space-between" mt={4} visibleFrom="md"> {/* Mobile hides duplicate date */}
                                                                        <Text size="xs" c="dimmed">{day.date}</Text>
                                                                        <Badge size="sm" color="yellow" variant="filled" radius="xs" style={{ border: '1px solid black', color: 'black' }}>
                                                                            {schedule.wordCount}개
                                                                        </Badge>
                                                                    </Group>
                                                                    <Group justify="flex-end" mt={4} hiddenFrom="md">
                                                                        <Badge size="sm" color="yellow" variant="filled" radius="xs" style={{ border: '1px solid black', color: 'black' }}>
                                                                            {schedule.wordCount}개
                                                                        </Badge>
                                                                    </Group>
                                                                </Stack>
                                                            ) : (
                                                                <Center style={{ height: '100%', minHeight: '80px' }}>
                                                                    <Text size="xs" c="dimmed">-</Text>
                                                                </Center>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    </Box>
                                </Paper>
                            ))}

                            {curriculums.length === 0 && (
                                <Paper p="xl" style={{ border: '2px solid black', borderRadius: '0px', textAlign: 'center' }}>
                                    <Text c="dimmed">등록된 커리큘럼이 없습니다.</Text>
                                </Paper>
                            )}
                        </Box>
                    );
                })}
            </Stack>

            {/* 학습 설정 모달 */}
            <Modal opened={activeModal === 'settings'} onClose={() => setActiveModal(null)} title="학습 설정 변경" centered>
                <Stack>
                    <Select
                        label="시험 방식"
                        data={[
                            { value: 'multiple_choice', label: '객관식' },
                            { value: 'subjective', label: '주관식' },
                            { value: 'scramble', label: '단어 스크램블' } // 실제 지원 타입 확인 필요
                        ]}
                        value={settingsForm.test_type}
                        onChange={(val) => setSettingsForm({ ...settingsForm, test_type: val || 'multiple_choice' })}
                    />
                    <NumberInput
                        label="합격 기준 점수"
                        value={settingsForm.passing_score}
                        onChange={(val) => setSettingsForm({ ...settingsForm, passing_score: Number(val) })}
                        min={0} max={100}
                    />
                    <NumberInput
                        label="시험 제한 시간 (초)"
                        value={settingsForm.time_limit_seconds}
                        onChange={(val) => setSettingsForm({ ...settingsForm, time_limit_seconds: Number(val) })}
                        min={10}
                    />
                    <Select
                        label="일일 학습량 기준"
                        data={[
                            { value: 'count', label: '단어 수 기준' },
                            { value: 'section', label: '소단원 기준' }
                        ]}
                        value={settingsForm.daily_amount_type}
                        onChange={(val: any) => {
                            const newType = val || 'count';
                            // Reset amount to default when type changes
                            const newAmount = newType === 'section' ? 1 : 20;
                            setSettingsForm({
                                ...settingsForm,
                                daily_amount_type: newType,
                                daily_amount: newAmount
                            });
                        }}
                    />
                    <NumberInput
                        label="일일 학습량 (단어/문제 수)"
                        description={settingsForm.daily_amount_type === 'count' ? '하루에 학습할 단어 개수' : '하루에 학습할 소단원 개수'}
                        value={settingsForm.daily_amount}
                        onChange={(val) => setSettingsForm({ ...settingsForm, daily_amount: Number(val) })}
                        min={1}
                    />
                    <Button onClick={handleSaveSettings} color="yellow" variant="filled" fullWidth mt="md">
                        저장하기
                    </Button>
                </Stack>
            </Modal>

            {/* 진도 변경 모달 */}
            <Modal opened={activeModal === 'progress'} onClose={() => setActiveModal(null)} title="수업 진도 변경" centered>
                <Stack>
                    <Text size="sm" c="dimmed" mb="xs">
                        특정 날짜부터 학습을 재개하거나, 현재 진도를 수정할 수 있습니다. <br />
                        지정한 날짜에 해당 진도가 시작되도록 전체 일정이 재조정됩니다.
                    </Text>
                    <DateInput
                        label="학습 재개 시작일"
                        description="이 날짜부터 설정한 진도로 학습이 시작됩니다."
                        value={progressForm.effective_date}
                        onChange={(val) => setProgressForm({ ...progressForm, effective_date: val || new Date() })}
                        valueFormat="YYYY-MM-DD"
                        minDate={new Date(2000, 0, 1)}
                    />
                    <Select
                        label="현재 단어장/학습항목"
                        data={selectedCurriculum?.curriculum_items.map(item => ({
                            value: item.id,
                            label: `${item.sequence}. ${item.item_details?.title || '제목 없음'}`
                        })) || []}
                        value={progressForm.current_item_id}
                        onChange={(val) => setProgressForm({ ...progressForm, current_item_id: val || '' })}
                    />
                    <NumberInput
                        label="시작 단어/문제 번호"
                        description="예: 21번 단어부터 시작하려면 21 입력"
                        value={progressForm.current_progress}
                        onChange={(val) => setProgressForm({ ...progressForm, current_progress: Number(val) })}
                        min={1}
                    />
                    <Button onClick={handleSaveProgress} color="green" variant="filled" fullWidth mt="md">
                        변경 저장 및 스케줄 재설정
                    </Button>
                </Stack>
            </Modal>

            {/* 일정 변경 모달 */}
            <Modal opened={activeModal === 'schedule'} onClose={() => setActiveModal(null)} title="학습 일정 변경" centered size="lg">
                <Stack>
                    <Box>
                        <Text fw={700} mb="xs">학습 요일 선택</Text>
                        <Group>
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                <Checkbox
                                    key={day}
                                    label={day}
                                    checked={scheduleForm.study_days.includes(day)}
                                    onChange={(event) => {
                                        const checked = event.currentTarget.checked;
                                        setScheduleForm(prev => ({
                                            ...prev,
                                            study_days: checked
                                                ? [...prev.study_days, day]
                                                : prev.study_days.filter(d => d !== day)
                                        }));
                                    }}
                                />
                            ))}
                        </Group>
                    </Box>

                    <Box>
                        <Text fw={700} mb="xs">공강/방학 기간 설정 (기간 내 학습 일정 뒤로 밀림)</Text>
                        <Stack gap="xs">
                            {scheduleForm.breaks.map((brk, idx) => (
                                <Group key={idx} justify="space-between" style={{ border: '1px solid #eee', padding: '8px', borderRadius: '4px' }}>
                                    <Text size="sm">{brk.start_date} ~ {brk.end_date} ({brk.reason || 'Schedules pushed'})</Text>
                                    <ActionIcon color="red" variant="subtle" onClick={() => {
                                        setScheduleForm(prev => ({
                                            ...prev,
                                            breaks: prev.breaks.filter((_, i) => i !== idx)
                                        }));
                                    }}>
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                </Group>
                            ))}
                        </Stack>

                        <Group align="flex-end" mt="sm">
                            <DatePickerInput
                                type="range"
                                label="새로운 공강 기간 추가"
                                placeholder="날짜 선택"
                                value={scheduleForm.newBreak}
                                onChange={(val) => setScheduleForm(prev => ({ ...prev, newBreak: val }))}
                                style={{ flex: 1 }}
                            />
                            <Button variant="outline" onClick={() => {
                                const [start, end] = scheduleForm.newBreak;
                                if (start && end) {
                                    const formatDate = (d: Date) => {
                                        const year = d.getFullYear();
                                        const month = String(d.getMonth() + 1).padStart(2, '0');
                                        const day = String(d.getDate()).padStart(2, '0');
                                        return `${year}-${month}-${day}`;
                                    };
                                    setScheduleForm(prev => ({
                                        ...prev,
                                        breaks: [...prev.breaks, {
                                            start_date: formatDate(start),
                                            end_date: formatDate(end),
                                            reason: 'Holiday'
                                        }],
                                        newBreak: [null, null]
                                    }));
                                }
                            }}>추가</Button>
                        </Group>
                    </Box>

                    <Button onClick={handleSaveSchedule} color="blue" variant="filled" fullWidth mt="md">
                        일정 변경 저장
                    </Button>
                </Stack>
            </Modal>

            {/* 삭제 확인 모달 */}
            <Modal opened={activeModal === 'delete'} onClose={() => setActiveModal(null)} title="커리큘럼 삭제" centered>
                <Text size="sm" mb="lg">
                    정말로 이 학생의 커리큘럼을 삭제하시겠습니까? <br />
                    이 작업은 되돌릴 수 없으며 모든 학습 기록이 삭제될 수 있습니다.
                </Text>
                <Group justify="flex-end">
                    <Button variant="default" onClick={() => setActiveModal(null)}>취소</Button>
                    <Button color="red" onClick={handleDeleteCurriculum}>삭제하기</Button>
                </Group>
            </Modal>
        </Container>
    );
}
