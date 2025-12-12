
'use client';

import { useState, useEffect } from 'react';
import { Title, Card, Text, Group, Badge, Button, Grid, Stack, Loader, ActionIcon, Tooltip, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconRefresh } from '@tabler/icons-react';
import dayjs from 'dayjs';

interface Assignment {
    id: string; // Unique key
    curriculum_name: string;
    item_id: string;
    item_title: string;
    status: 'completed' | 'pending';
    score?: number;
    curriculum_item_id: string; // For API calls
    scheduled_date?: string;
    is_past_due?: boolean;
}

interface StudentStatus {
    student_id: string;
    student_name: string;
    class_name: string;
    assignments: Assignment[];
}

export default function LearningStatusPage() {
    const [data, setData] = useState<StudentStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [selectedClass, setSelectedClass] = useState<string | null>('All');

    const filteredData = selectedClass && selectedClass !== 'All'
        ? data.filter(d => d.class_name === selectedClass)
        : data;

    const fetchData = async () => {
        setLoading(true);
        try {
            console.log('[Learning Status Page] Fetching data for date:', date);
            const res = await fetch(`/api/teacher/learning-status?date=${date}`);
            const json = await res.json();

            console.log('[Learning Status Page] API Response:', json);

            if (json.error) {
                console.error('[Learning Status Page] API Error:', json.error, json.details);
                notifications.show({
                    title: 'API Error',
                    message: json.details || json.error,
                    color: 'red',
                    autoClose: false,
                });
                setData([]);
                return;
            }

            if (json.data) {
                console.log(`[Learning Status Page] Loaded ${json.data.length} students`);
                setData(json.data);
            } else {
                console.warn('[Learning Status Page] No data in response');
                setData([]);
            }
        } catch (error) {
            console.error('[Learning Status Page] Fetch error:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to load learning status: ' + (error as Error).message,
                color: 'red',
                autoClose: false,
            });
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [date]);

    const handleForceComplete = async (studentId: string, itemId: string, scheduledDate: string) => {
        if (!confirm('Mark as completed?')) return;

        try {
            const res = await fetch('/api/teacher/today-assignments', { // Re-using existing POST endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: studentId,
                    curriculum_item_id: itemId,
                    scheduled_date: scheduledDate // Correctly pass the assignment date
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error('[Force Complete] Server Error:', errorData);
                throw new Error(errorData.error || 'Failed');
            }

            notifications.show({
                title: 'Success',
                message: 'Marked as completed',
                color: 'green',
            });

            fetchData(); // Refresh

        } catch (error) {
            console.error('[Force Complete] Error:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to update status',
                color: 'red',
            });
        }
    };

    return (
        <Stack p="md" gap="lg">
            <Group justify="space-between">
                <Title order={2} c="white">Student Learning Status</Title>
                <Button
                    leftSection={<IconRefresh size={16} />}
                    variant="light"
                    onClick={fetchData}
                    loading={loading}
                >
                    Refresh
                </Button>
            </Group>

            {/* Filters */}
            <Group>
                <Select
                    label="Class"
                    placeholder="Filter by class"
                    data={['All', ...Array.from(new Set(data.map(s => s.class_name))).sort()]}
                    value={selectedClass}
                    onChange={setSelectedClass}
                    searchable
                    clearable
                    styles={{
                        label: { color: 'white' }
                    }}
                />
            </Group>

            <Text c="gray.3" size="sm">Date: {date}</Text>

            {loading ? (
                <Loader />
            ) : (
                <Grid>
                    {filteredData.map((student) => (
                        <Grid.Col key={student.student_id} span={{ base: 12, md: 6, lg: 4 }}>
                            <Card shadow="sm" padding="lg" radius="md" withBorder>
                                <Group justify="space-between" mb="xs">
                                    <Text fw={500}>{student.student_name}</Text>
                                    <Badge color="blue" variant="light">
                                        {student.class_name}
                                    </Badge>
                                </Group>

                                <Stack gap="sm">
                                    {student.assignments.length === 0 ? (
                                        <Text c="dimmed" fs="italic" size="sm">No assignments for today</Text>
                                    ) : (
                                        student.assignments.map((assignment) => (
                                            <Card
                                                key={assignment.id}
                                                withBorder
                                                padding="sm"
                                                radius="sm"
                                                style={{
                                                    borderColor: assignment.is_past_due ? '#FF6B6B' : undefined,
                                                    background: assignment.is_past_due ? 'rgba(255, 107, 107, 0.05)' : undefined
                                                }}
                                            >
                                                <Group justify="space-between" align="start" wrap="nowrap">
                                                    <Stack gap={2} style={{ flex: 1 }}>
                                                        <Group gap={5}>
                                                            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                                                {assignment.curriculum_name}
                                                            </Text>
                                                            {assignment.is_past_due && (
                                                                <Badge color="red" size="xs" variant="filled">
                                                                    Past Due: {assignment.scheduled_date}
                                                                </Badge>
                                                            )}
                                                        </Group>
                                                        <Text size="sm" lineClamp={2}>
                                                            {assignment.item_title}
                                                        </Text>
                                                    </Stack>

                                                    <Group gap="xs">
                                                        {assignment.status === 'completed' ? (
                                                            <Badge color="green" variant="filled">Done</Badge>
                                                        ) : (
                                                            <Tooltip label="Force Complete">
                                                                <ActionIcon
                                                                    color="gray"
                                                                    variant="light"
                                                                    onClick={() => handleForceComplete(
                                                                        student.student_id,
                                                                        assignment.curriculum_item_id,
                                                                        assignment.scheduled_date || date // Pass specific assignment date or current view date
                                                                    )}
                                                                >
                                                                    <IconCheck size={16} />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        )}
                                                    </Group>
                                                </Group>
                                            </Card>
                                        ))
                                    )}
                                </Stack>
                            </Card>
                        </Grid.Col>
                    ))}
                </Grid>
            )}
        </Stack>
    );
}
