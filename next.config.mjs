/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',       // Включает статический экспорт в папку out
  trailingSlash: true,    // Обязательно для правильных путей в Capacitor
  images: {
    unoptimized: true,    // Отключает серверную оптимизацию картинок
  },
};

export default nextConfig;