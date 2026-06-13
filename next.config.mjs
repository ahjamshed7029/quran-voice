/** @type {import('next').NextConfig} */
const nextConfig = {
    // Строку basePath ПУСТУЮ ИЛИ УДАЛЯЕМ, она тут больше не нужна!
    images: {
        unoptimized: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
};

export default nextConfig;