/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    basePath: '/quran-voice',
    assetPrefix: '/quran-voice',
    images: {
        unoptimized: true,
    },
};

export default nextConfig;