import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

// 1. Метаданные (наше новое название Siraj)
export const metadata: Metadata = {
  title: 'Siraj — Quran Voice Coach',
  description: 'Путеводный светильник в ночи',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192.png',
  },
  manifest: '/manifest.json'
};

// 2. Главный компонент разметки
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <div className="min-h-screen bg-midnight text-soft">
          {children}
        </div>
      </body>
    </html>
  );
}