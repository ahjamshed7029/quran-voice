import type { VoiceCommand } from './voice';

export type AITeacherState = {
  currentSurah: number;
  currentVerse: number;
  language: 'en' | 'ru' | 'uz';
  lastCommand?: VoiceCommand;
};

const responses: Record<string, string> = {
  welcome: 'Welcome. When you are ready, say start lesson to begin with a gentle verse.',
  repeat: 'I will repeat the verse slowly and clearly. Listen carefully and relax.',
  next: 'Moving to the next verse now, step by step with soft guidance.',
  slower: 'I will slow the pace. Take your time and feel comfortable.',
  translate: 'I am sharing the translation in the selected language so it is easy to follow.',
  continue: 'Continuing the lesson in a calm, steady rhythm.',
  pause: 'Pausing for now. When you are ready, say continue to resume.'
};

export function getTeacherResponse(command: VoiceCommand, state: AITeacherState) {
  const base = responses[command] ?? 'I am here to support you while you learn.';
  return `${base} ${command === 'start lesson' ? 'Let us begin with a short verse and gentle reflection.' : ''}`;
}

export function getWelcomeMessage(language: AITeacherState['language']) {
  const messages: Record<AITeacherState['language'], string> = {
    en: 'Hello. I am your calm Quran teacher. Say start lesson when you are ready.',
    ru: 'Здравствуйте. Я ваш спокойный учитель Корана. Скажите "начать урок", когда будете готовы.',
    uz: 'Salom. Men sizning tinch Qur’on o’qituvchingizman. Tayyor bo’lsangiz, "darsni boshlang" deb ayting.'
  };
  return messages[language] ?? messages.en;
}
