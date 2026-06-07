import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'quran-voice-pwa',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: "#ffffff",
      showSpinner: true,
      spinnerColor: "#4f46e5",
    },
    StatusBar: {
      style: 'dark',
    },
  },
  backgroundColor: '#ffffff',
};

export default config;
