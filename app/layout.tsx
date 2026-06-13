import React, { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Siraj — Quran Voice Coach',
  description: 'Guiding Light',
  icons: {
    apple: '/icons/icon-192.png',
  },
  manifest: '/manifest.json',
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