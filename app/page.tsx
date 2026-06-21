'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export default function Home() {
  const [apiUrl, setApiUrl] = useState("https://quran-voice.onrender.com");
  const [isActivated, setIsActivated] = useState(false);
  const [screenColor, setScreenColor] = useState('red');
  const [debugMessage, setDebugMessage] = useState('Нажмите кнопку для старта');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const savedUrl = localStorage.getItem('quran_voice_api_url');
    if (savedUrl) setApiUrl(savedUrl);
  }, []);

  const saveApiUrl = (url: string) => {
    setApiUrl(url);
    localStorage.setItem('quran_voice_api_url', url);
    setIsSettingsOpen(false);
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isWebRecorder = useRef(true);

  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioResponseRef = useRef<HTMLAudioElement | null>(null);

  const stageRef = useRef('greeting');
  const mentorNameRef = useRef('Хасан');
  const currentAyahRef = useRef(1);

  // Initialize permissions
  useEffect(() => {
    const initPermissions = async () => {
      if (typeof window !== 'undefined' && (window as any).Capacitor && (window as any).Capacitor.isNativePlatform()) {
        try {
          const { VoiceRecorder } = await import('capacitor-voice-recorder');
          const result = await VoiceRecorder.requestAudioRecordingPermission();
          console.log('VoiceRecorder permission:', result.value);
          isWebRecorder.current = false;
        } catch (e) {
          console.error('VoiceRecorder init error:', e);
          isWebRecorder.current = true;
        }
      }
    };
    initPermissions();
  }, []);

  const resetSilenceTimer = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    silenceTimerRef.current = setTimeout(async () => {
      setDebugMessage('Тайм-аут: ничего не слышно');
      await stopRecordingFlow();
      aiSpeak('Я не слышу тебя. Скажи что-нибудь.');
    }, 15000);
  };

  const aiSpeak = (text: string, audioBase64: string | null = null, preferredColor: string = 'green', callback: (() => void) | null = null) => {
    setDebugMessage(`Ответ: ${text}`);

    if (audioBase64) {
      const audioUrl = `data:audio/mp3;base64,${audioBase64}`;
      if (audioResponseRef.current) {
        audioResponseRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioResponseRef.current = audio;

      audio.onplay = () => {
        setScreenColor(preferredColor);
      };

      audio.onended = () => {
        setScreenColor('blue');
        startRecordingFlow();
        resetSilenceTimer();
        if (callback) callback();
      };

      audio.play().catch(err => {
        console.error("Audio play failed, falling back to Web Speech:", err);
        fallbackSpeak(text, preferredColor, callback);
      });
      return;
    }

    fallbackSpeak(text, preferredColor, callback);
  };

  const fallbackSpeak = (text: string, preferredColor: string = 'green', callback: (() => void) | null = null) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.error("Web Speech API not supported");
      setScreenColor('blue');
      startRecordingFlow();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';

    utterance.onstart = () => setScreenColor(preferredColor);
    utterance.onend = () => {
      setScreenColor('blue');
      startRecordingFlow();
      resetSilenceTimer();
      if (callback) callback();
    };
    utterance.onerror = (err) => {
      console.error("SpeechSynthesis error:", err);
      setScreenColor('blue');
      startRecordingFlow();
    };

    window.speechSynthesis.speak(utterance);
  };

  const startRecordingFlow = async () => {
    setDebugMessage('Слушаю вас...');
    setScreenColor('blue');

    try {
      if (!isWebRecorder.current) {
        const { VoiceRecorder } = await import('capacitor-voice-recorder');
        const isSelected = await VoiceRecorder.canDeviceVoiceRecord();
        if (isSelected.value) {
          const status = await VoiceRecorder.getCurrentStatus();
          if (status.status === 'NONE' || status.status === 'STOPPED') {
            await VoiceRecorder.startRecording();
          }
        }
        return;
      }

      audioChunksRef.current = [];
      if (!mediaRecorderRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          if (audioChunksRef.current.length === 0) {
            console.log('No audio data captured');
            return;
          }
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType });
          await sendAudioToBackend(audioBlob);
        };
      }

      if (mediaRecorderRef.current.state === 'inactive') {
        mediaRecorderRef.current.start();
      }
    } catch (err: any) {
      console.error('Start recording error:', err);
      setScreenColor('yellow');
      setDebugMessage('Ошибка микрофона: ' + (err?.message || 'неизвестно'));
    }
  };

  const stopRecordingFlow = async () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setDebugMessage('Обработка голоса...');

    try {
      if (!isWebRecorder.current) {
        const { VoiceRecorder } = await import('capacitor-voice-recorder');
        const status = await VoiceRecorder.getCurrentStatus();
        if (status.status === 'RECORDING') {
          const result = await VoiceRecorder.stopRecording();
          if (result.value && result.value.recordDataBase64) {
            const audioBlob = await (await fetch(`data:${result.value.mimeType};base64,${result.value.recordDataBase64}`)).blob();
            await sendAudioToBackend(audioBlob);
          }
        }
        return;
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    } catch (err) {
      console.error('Stop recording error:', err);
    }
  };

  const sendAudioToBackend = async (audioBlob: Blob) => {
    const formData = new FormData();

    let extension = 'webm';
    if (audioBlob.type.includes('mp4')) extension = 'mp4';
    else if (audioBlob.type.includes('aac')) extension = 'aac';
    else if (audioBlob.type.includes('wav')) extension = 'wav';
    else if (audioBlob.type.includes('ogg')) extension = 'ogg';

    formData.append(
      'audio',
      audioBlob,
      `student_voice.${extension}`
    );

    formData.append('stage', stageRef.current);
    formData.append('mentor_name', mentorNameRef.current);
    formData.append(
      'current_ayah',
      String(currentAyahRef.current)
    );

    try {
      setDebugMessage('Отправка на сервер...');

      const response = await fetch(
        `${apiUrl}/api/agent/talk`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      console.log('Ответ сервера:', data);

      stageRef.current = data.stage || stageRef.current;
      currentAyahRef.current =
        data.current_ayah || currentAyahRef.current;

      if (data.mentor_name) {
        mentorNameRef.current = data.mentor_name;
      }

      setDebugMessage(
        `Расслышано: "${data.student_heard || 'не распознано'}"`
      );

      aiSpeak(
        data.text_response || 'Я получил сообщение, но ответ пуст.',
        data.audio_response_base64,
        data.screen_color || 'green'
      );

    } catch (error: any) {
      console.error(error);

      setScreenColor('yellow');

      setDebugMessage(
        `Ошибка сервера: ${error?.message || 'не удалось подключиться'}`
      );

      setTimeout(() => {
        setScreenColor('blue');
        startRecordingFlow();
        resetSilenceTimer();
      }, 3000);
    }
  };

  const handleFirstTapStart = async () => {
    console.log('Start button clicked');
    setDebugMessage('Запуск приветствия...');
    setIsActivated(true);

    try {
      const response = await fetch(`${apiUrl}/api/agent/welcome`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        aiSpeak(data.text_response, data.audio_response_base64);
      } else {
        aiSpeak('Ассаляму алейкум. Назовите имя учителя.');
      }
    } catch (err) {
      console.error('Initialization error:', err);
      aiSpeak('Ассаляму алейкум.');
    }
  };

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  window.location.reload();
                }
              }
            };
          }
        };
      });
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (audioResponseRef.current) {
        audioResponseRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="bg-midnight text-soft min-h-screen flex flex-col items-center justify-center p-6 select-none overflow-hidden relative font-sans">

      {/* Settings & Debug Info */}
      <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
        <div className="text-[10px] font-mono text-zinc-500 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/5 max-w-[150px] truncate">
          {debugMessage}
        </div>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 border border-white/5 text-lg hover:text-white transition-colors active:scale-95"
        >
          ⚙️
        </button>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-graphite border border-white/10 p-8 rounded-3xl w-full max-w-sm shadow-2xl">
            <h2 className="text-teal text-xl font-medium mb-6">Настройки сервера</h2>
            <input
              type="text"
              defaultValue={apiUrl}
              id="api_input"
              className="w-full bg-midnight border border-white/10 p-4 rounded-xl mb-6 text-soft font-mono text-sm focus:border-teal/50 outline-none transition-all"
              placeholder="https://your-tunnel.loca.lt"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const input = document.getElementById('api_input') as HTMLInputElement;
                  saveApiUrl(input.value);
                }}
                className="flex-1 bg-teal text-midnight font-bold p-4 rounded-xl active:scale-95 transition-transform"
              >
                Сохранить
              </button>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="flex-1 bg-white/5 text-soft p-4 rounded-xl active:scale-95 transition-transform hover:bg-white/10"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content (Splash/Logo) */}
      {!isActivated && (
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-1000 max-w-full">
          <div className="relative w-[280px] h-[280px] md:w-[320px] md:h-[320px] mb-8">
            <Image
              src="/icons/logo.png"
              alt="Siraj Logo"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <h1 className="text-4xl font-bold tracking-[0.2em] mb-2 text-[#e5c158]">SIRAJ</h1>
          <p className="text-zinc-500 italic mb-12">سراج — Путеводный свет</p>

          <button
            onClick={handleFirstTapStart}
            className="group relative px-12 py-5 bg-transparent border border-[#e5c158]/40 rounded-full text-[#e5c158] text-xl font-medium tracking-widest overflow-hidden transition-all hover:border-[#e5c158] active:scale-95 shadow-[0_0_50px_rgba(229,193,88,0.1)] z-10"
          >
            <div className="absolute inset-0 bg-[#e5c158]/5 group-hover:bg-[#e5c158]/10 transition-colors" />
            НАЧАТЬ ОБУЧЕНИЕ
          </button>
        </div>
      )}

      {/* Active State UI */}
      {isActivated && (
        <div className="flex flex-col items-center animate-in fade-in zoom-in slide-in-from-bottom-10 duration-700">

          {debugMessage === 'Обработка голоса...' ? (
            <div className="flex gap-6 h-72 items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500 shadow-[0_0_30px_rgba(52,211,153,0.6)] animate-pulse" />
              <div className="w-12 h-12 rounded-full bg-amber-500 shadow-[0_0_30px_rgba(251,191,36,0.6)] animate-pulse [animation-delay:0.2s]" />
              <div className="w-12 h-12 rounded-full bg-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.6)] animate-pulse [animation-delay:0.4s]" />
            </div>
          ) : (
            <div
              onClick={stopRecordingFlow}
              className={`w-72 h-72 rounded-full border-4 transition-all duration-700 cursor-pointer flex items-center justify-center relative ${screenColor === 'green'
                  ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_120px_rgba(52,211,153,0.4)]'
                  : screenColor === 'yellow'
                    ? 'bg-amber-500/20 border-amber-300 shadow-[0_0_100px_rgba(251,191,36,0.4)]'
                    : screenColor === 'blue'
                      ? 'bg-blue-500/20 border-blue-400 shadow-[0_0_120px_rgba(96,165,250,0.4)]'
                      : 'bg-rose-500/20 border-rose-400 shadow-[0_0_100px_rgba(244,63,94,0.3)]'
                }`}
            >
              {screenColor === 'blue' && (
                <div className="absolute inset-0 rounded-full border-4 border-blue-400/30 animate-ping" />
              )}

              {screenColor === 'red' && (
                <span className="text-white/40 text-xs tracking-widest uppercase animate-pulse">Инициализация</span>
              )}

              {screenColor === 'blue' && (
                <div className="flex flex-col items-center">
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-1.5 h-8 bg-blue-400 rounded-full animate-wave" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                  <span className="text-blue-400 text-xs font-bold tracking-widest uppercase">Слушаю вас</span>
                </div>
              )}

              {screenColor === 'green' && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                  <span className="text-emerald-400 text-xs font-bold tracking-widest uppercase">Говорю ответ</span>
                </div>
              )}

              {screenColor === 'yellow' && (
                <span className="text-amber-300 text-xs font-bold tracking-widest uppercase">Ошибка сети</span>
              )}
            </div>
          )}

          <p className="mt-16 text-zinc-500 font-light tracking-widest text-sm uppercase text-center min-h-[1.5em]">
            {debugMessage === 'Обработка голоса...'
              ? 'Думаю...'
              : screenColor === 'blue'
                ? 'Говорите сейчас'
                : screenColor === 'green'
                  ? 'Слушайте учителя'
                  : 'Нажмите на круг'}
          </p>
        </div>
      )}

      <style jsx global>{`
        @keyframes wave {
          0%, 100% { height: 20px; }
          50% { height: 40px; }
        }
        .animate-wave {
          animation: wave 1s ease-in-out infinite;
        }
      `}</style>

    </div>
  );
}
