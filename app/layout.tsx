import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Quran Voice Coach',
  description: 'A calm voice-first Quran learning PWA designed for blind, disabled, and beginner learners.',
  icons: {
    icon: '/quran-voice/icons/maskable_icon_x192.png'
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