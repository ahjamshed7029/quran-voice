<<<<<<< HEAD
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Quran Voice Coach',
  description: 'A calm voice-first Quran learning PWA designed for blind, disabled, and beginner learners.',
  icons: {
    icon: '/quran-voice/icons/icon-192.png'
  },
  manifest: '/quran-voice/manifest.json'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-midnight text-soft">
      <body>
        <div className="min-h-screen bg-midnight text-soft">{children}</div>
      </body>
    </html>
  );
}
=======
import React from 'react';

// 1. Метаданные (наше новое название Siraj)
export const metadata = {
    title: 'Siraj — Quran Voice Coach',
    description: 'Путеводный светильник в ночи',
    icons: {
        icon: '/quran-voice/favicon.ico',
        apple: '/quran-voice/icon-192.png',
    },
};

// 2. САМЫЙ ВАЖНЫЙ МОМЕНТ: Компонент должен иметь "export default"
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ru">
            <body>
                {children}
            </body>
        </html>
    );
}
>>>>>>> gh-pages
