"use client";

export const speakText = (text: string, lang: string = "ar-SA") => {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    console.warn("Browser TTS не поддерживается в этом браузере.");
    return;
  }

  // Останавливаем прошлую озвучку, если она идет
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Устанавливаем язык (например, ar-SA для арабского текста Корана)
  utterance.lang = lang; 
  utterance.rate = 0.9;  // Чуть замедлим для четкости произношения

  // Находим подходящий голос в системе (необязательно, но улучшает качество)
  const voices = window.speechSynthesis.getVoices();
  const targetVoice = voices.find(v => v.lang.startsWith(lang));
  if (targetVoice) {
    utterance.voice = targetVoice;
  }

  window.speechSynthesis.speak(utterance);
};
export const playFeedbackSound = (type: 'green' | 'yellow' | 'red') => {
  if (typeof window === "undefined") return;

  const audioMap = {
    green: '/audio/success.mp3',
    yellow: '/audio/warning.mp3',
    red: '/audio/error.mp3'
  };

  const audio = new Audio(audioMap[type]);
  audio.volume = 0.2; // Делаем звук очень тихим (20% от максимальной громкости)
  
  audio.play().catch(err => console.log("Ошибка воспроизведения звука:", err));
};