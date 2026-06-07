import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#071021',
        graphite: '#1c2433',
        soft: '#e8edf6',
        teal: '#3de0d8',
        surface: '#121926'
      },
      boxShadow: {
        glow: '0 20px 50px rgba(16, 30, 60, 0.25)'
      },
      animation: {
        pulseWave: 'pulseWave 2.8s ease-in-out infinite'
      },
      keyframes: {
        pulseWave: {
          '0%, 100%': { opacity: '0.35', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.18)' }
        }
      }
    }
  },
  plugins: []
};

export default config;
