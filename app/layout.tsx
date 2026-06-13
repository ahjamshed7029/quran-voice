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