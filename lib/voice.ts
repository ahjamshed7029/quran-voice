export type VoiceCommand =
  | 'start lesson'
  | 'repeat'
  | 'next verse'
  | 'slower'
  | 'translate'
  | 'continue'
  | 'pause';

const normalizeCommand = (text: string) => text.toLowerCase().trim();

export function parseVoiceCommand(text: string): VoiceCommand | null {
  const normalized = normalizeCommand(text);

  if (normalized.includes('start')) return 'start lesson';
  if (normalized.includes('repeat')) return 'repeat';
  if (normalized.includes('next')) return 'next verse';
  if (normalized.includes('slow') || normalized.includes('slower')) return 'slower';
  if (normalized.includes('translate')) return 'translate';
  if (normalized.includes('continue')) return 'continue';
  if (normalized.includes('pause') || normalized.includes('stop')) return 'pause';
  return null;
}

export function speakText(message: string, lang = 'en-US') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = lang;
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function startSpeechRecognition(onCommand: (command: VoiceCommand) => void, onError: (message: string) => void) {
  if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    onError('Speech recognition is not supported in this browser.');
    return null;
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;

  type SpeechRecognitionEventLike = {
    results: SpeechRecognitionResultList;
  };

  recognition.onresult = (event: SpeechRecognitionEventLike) => {
    const transcript = event.results[0]?.[0]?.transcript || '';
    const command = parseVoiceCommand(transcript);
    if (command) onCommand(command);
    else onError('Sorry, I did not understand that command.');
  };

  recognition.onerror = () => {
    onError('Voice recognition encountered an issue. Try again or switch to a quieter environment.');
  };

  recognition.start();
  return recognition;
}
