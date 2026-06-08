import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  output: 'export',
  trailingSlash: true,

  basePath: '/quran-voice',
};

export default withPWA(nextConfig);