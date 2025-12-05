'use client';

import { MantineProvider, createTheme, MantineColorsTuple } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './globals.css';
import { useState } from 'react';

// 네오브루탈리즘 컬러 팔레트
const violet: MantineColorsTuple = [
  '#f5f0ff',
  '#e5dbff',
  '#d0bfff',
  '#b197fc',
  '#9775fa',
  '#845ef7',
  '#7950f2',
  '#7048e8',
  '#6741d9',
  '#5f3dc4'
];

const theme = createTheme({
  primaryColor: 'violet',
  fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
  headings: {
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
    fontWeight: '700',
  },
  defaultRadius: 'md',
  shadows: {
    xs: '2px 2px 0px 0px rgba(0, 0, 0, 1)',
    sm: '3px 3px 0px 0px rgba(0, 0, 0, 1)',
    md: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
    lg: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
    xl: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
  },
  colors: {
    violet,
  },
  other: {
    borderWidth: '3px',
  },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1분
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <MantineProvider theme={theme}>
            <Notifications position="top-right" />
            {children}
          </MantineProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
