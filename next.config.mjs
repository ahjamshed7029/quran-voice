/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    basePath: '/quran-voice',
    images: {
        unoptimized: true, // Это спасет от возможных ошибок с картинками на GitHub Pages
    },
};

export default nextConfig;