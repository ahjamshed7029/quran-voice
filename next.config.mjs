/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export', // Обязательно для GitHub Pages
    basePath: '/quran-voice',
    assetPrefix: '/quran-voice',
    images: {
        unoptimized: true, // GitHub Pages не поддерживает оптимизацию картинок Next.js
    },
};

export default nextConfig;