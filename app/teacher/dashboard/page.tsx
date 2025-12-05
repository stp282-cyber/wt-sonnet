'use client';

import { Container, Title, Text, Paper, Stack, Button, SimpleGrid, Box } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { IconUsers, IconBook, IconList, IconBell, IconSettings } from '@tabler/icons-react';

export default function TeacherDashboard() {
    const router = useRouter();

    const stats = [
        { title: '학생 관리', desc: 'Manage Students', icon: IconUsers, color: '#FFD43B', href: '/teacher/students' }, // Yellow
        { title: '단어장 관리', desc: 'Manage Wordbooks', icon: IconBook, color: '#74C0FC', href: '/teacher/wordbooks' }, // Blue
        { title: '커리큘럼', desc: 'Manage Curriculum', icon: IconList, color: '#63E6BE', href: '/teacher/curriculums' }, // Green
        { title: '공지/쪽지', desc: 'Notices & Messages', icon: IconBell, color: '#FFA8A8', href: '/teacher/notices' }, // Red
    ];

    return (
        <Container size="xl" py={40}>
            <Stack gap="xl">
                {/* 웰컴 배너 */}
                <Box
                    p="xl"
                    style={{
                        backgroundColor: 'white',
                        border: '3px solid black',
                        boxShadow: '6px 6px 0px black',
                        borderRadius: '0px',
                    }}
                >
                    <Title order={1} mb="sm" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, textTransform: 'uppercase' }}>
                        TEACHER DASHBOARD
                    </Title>
                    <Text size="lg" fw={600}>
                        선생님, 오늘도 힘찬 하루 되세요! 🌟
                    </Text>
                </Box>

                {/* 메뉴 그리드 */}
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
                    {stats.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Paper
                                key={item.title}
                                p="xl"
                                className="neo-card"
                                onClick={() => router.push(item.href)}
                                style={{
                                    backgroundColor: item.color,
                                    border: '3px solid black',
                                    borderRadius: '0px',
                                    boxShadow: '6px 6px 0px black',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    height: '200px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <Box
                                    style={{
                                        width: '50px',
                                        height: '50px',
                                        background: 'white',
                                        border: '3px solid black',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '0px' // Square icons
                                    }}
                                >
                                    <Icon size={28} stroke={2.5} color="black" />
                                </Box>

                                <div>
                                    <Title order={3} style={{ fontWeight: 900 }}>
                                        {item.title}
                                    </Title>
                                    <Text size="sm" fw={600} style={{ opacity: 0.7 }}>
                                        {item.desc}
                                    </Text>
                                </div>
                            </Paper>
                        );
                    })}
                </SimpleGrid>

                {/* 빠른 설정 섹션 */}
                <Box
                    p="xl"
                    style={{
                        backgroundColor: '#F3F0FF', // Light Purple
                        border: '3px solid black',
                        boxShadow: '6px 6px 0px black',
                        marginTop: '2rem'
                    }}
                >
                    <Title order={3} mb="md" fw={900}>QUICK ACTIONS</Title>
                    <Button
                        size="lg"
                        className="neo-button"
                        onClick={() => router.push('/teacher/settings')}
                        leftSection={<IconSettings size={20} />}
                        style={{ backgroundColor: 'white', color: 'black' }}
                    >
                        시스템 설정 바로가기
                    </Button>
                </Box>
            </Stack>
        </Container>
    );
}
