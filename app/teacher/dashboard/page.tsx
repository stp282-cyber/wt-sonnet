'use client';

import { Container, Title, Text, Paper, Stack, Button } from '@mantine/core';
import { useRouter } from 'next/navigation';

export default function TeacherDashboard() {
    const router = useRouter();

    return (
        <Container size="xl" py={40}>
            <div className="animate-fade-in">
                <Title order={1} mb={30} style={{ fontWeight: 900 }}>
                    선생님 대시보드 👨‍🏫
                </Title>

                <Stack gap="lg">
                    <Paper
                        p="xl"
                        className="neo-card animate-slide-in-left"
                        style={{
                            backgroundColor: '#f5f0ff',
                        }}
                    >
                        <Title order={2} mb="md">
                            환영합니다!
                        </Title>
                        <Text size="lg">
                            영어 단어 시험 사이트 Phase 1 구축이 완료되었습니다.
                        </Text>
                    </Paper>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                        <Paper
                            p="lg"
                            className="neo-card animate-bounce-in"
                            style={{
                                backgroundColor: '#e5dbff',
                                cursor: 'pointer',
                            }}
                            onClick={() => router.push('/teacher/students')}
                        >
                            <Title order={3} mb="sm">
                                👥 학생 관리
                            </Title>
                            <Text>학생 등록 및 관리</Text>
                        </Paper>

                        <Paper
                            p="lg"
                            className="neo-card animate-bounce-in"
                            style={{
                                backgroundColor: '#d0bfff',
                                cursor: 'pointer',
                                animationDelay: '0.1s',
                            }}
                            onClick={() => router.push('/teacher/wordbooks')}
                        >
                            <Title order={3} mb="sm">
                                📚 단어장 관리
                            </Title>
                            <Text>단어장 등록 및 수정</Text>
                        </Paper>

                        <Paper
                            p="lg"
                            className="neo-card animate-bounce-in"
                            style={{
                                backgroundColor: '#b197fc',
                                cursor: 'pointer',
                                animationDelay: '0.2s',
                            }}
                            onClick={() => router.push('/teacher/curriculums')}
                        >
                            <Title order={3} mb="sm">
                                📋 커리큘럼 관리
                            </Title>
                            <Text>커리큘럼 생성 및 관리</Text>
                        </Paper>

                        <Paper
                            p="lg"
                            className="neo-card animate-bounce-in"
                            style={{
                                backgroundColor: '#9775fa',
                                cursor: 'pointer',
                                animationDelay: '0.3s',
                            }}
                            onClick={() => router.push('/teacher/notices')}
                        >
                            <Title order={3} mb="sm">
                                📢 공지/쪽지
                            </Title>
                            <Text>공지사항 및 쪽지 관리</Text>
                        </Paper>
                    </div>

                    <Button
                        size="lg"
                        variant="outline"
                        className="neo-button"
                        onClick={() => router.push('/')}
                        style={{
                            borderColor: 'black',
                            color: 'black',
                        }}
                    >
                        로그아웃
                    </Button>
                </Stack>
            </div>
        </Container>
    );
}
