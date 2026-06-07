"use client";

export const playFeedbackSound = (type: 'green' | 'yellow' | 'red') => {
  if (typeof window === "undefined") return;

  const audioMap = {
    green: '/audio/success.mp3',
    yellow: '/audio/warning.mp3',
    red: '/audio/error.mp3'
  };

  const audio = new Audio(audioMap[type]);
  audio.volume = 0.2; // Тихое воспроизведение (20%)
  
  audio.play().catch(err => console.log("Звук пока не загружен или заблокирован:", err));
};