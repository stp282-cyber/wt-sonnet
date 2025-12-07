'use client';

import { MantineProvider, createTheme, MantineColorsTuple } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import './globals.css';
import { useState } from 'react';

// Bold & Vivid Color Palette
const brandBlue: MantineColorsTuple = [
  '#E0E7FF', '#C7D2FE', '#A5B4FC', '#818CF8', '#6366F1',
  '#4F46E5', '#4338CA', '#3730A3', '#312E81', '#1E1B4B'
];

const theme = createTheme({
  primaryColor: 'brandBlue',
  fontFamily: 'Montserrat, Pretendard, sans-serif',
  headings: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: '900',
  },
  defaultRadius: 'md',
  shadows: {
    xs: '2px 2px 0px 0px #000000',
    sm: '4px 4px 0px 0px #000000',
    md: '6px 6px 0px 0px #000000',
    lg: '8px 8px 0px 0px #000000',
    xl: '12px 12px 0px 0px #000000',
  },
  colors: {
    brandBlue,
  },
  other: {
    borderWidth: '3px',
  },
  components: {
    Button: {
      defaultProps: {
        size: 'lg',
        radius: 'md',
        fw: 800,
      },
      styles: (theme: any) => ({
        root: {
          border: '3px solid #000000',
          boxShadow: '4px 4px 0px 0px #000000',
          transition: 'all 0.1s ease',
          textTransform: 'uppercase',
          '&:active': {
            transform: 'translate(4px, 4px)',
            boxShadow: '0px 0px 0px 0px #000000',
          },
          '&:hover': {
            transform: 'translate(-2px, -2px)',
            boxShadow: '6px 6px 0px 0px #000000',
          }
        },
      }),
    },
    Paper: {
      styles: (theme: any) => ({
        root: {
          border: '3px solid #000000',
          boxShadow: '6px 6px 0px 0px #000000',
        }
      })
    },
    TextInput: {
      styles: (theme: any) => ({
        input: {
          border: '3px solid #000000',
          fontWeight: 600,
          '&:focus': {
            borderColor: '#000000',
            boxShadow: '4px 4px 0px 0px #000000',
            backgroundColor: '#FFFBE6',
          }
        },
        label: {
          fontWeight: 700,
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          fontSize: '0.9rem',
        }
      })
    },
    PasswordInput: {
      styles: (theme: any) => ({
        input: {
          border: '3px solid #000000',
          fontWeight: 600,
          '&:focus': {
            borderColor: '#000000',
            boxShadow: '4px 4px 0px 0px #000000',
            backgroundColor: '#FFFBE6',
          }
        },
        label: {
          fontWeight: 700,
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          fontSize: '0.9rem',
        }
      })
    }
  }
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet" />
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
