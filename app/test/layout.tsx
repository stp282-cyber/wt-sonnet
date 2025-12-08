'use client';

import { Box } from '@mantine/core';
import { SpotlightEffect } from '@/components/ui/SpotlightEffect';

export default function TestLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Box
            style={{
                backgroundColor: '#0F172A', // Slate 900 - Deep Dark Blue
                minHeight: '100vh',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <SpotlightEffect
                spotlightColor="rgba(139, 92, 246, 0.25)" // Light accent color for the spotlight
                size={600}
                className="z-0" // Ensure it stays behind
            />

            <Box style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
                {children}
            </Box>
        </Box>
    );
}
