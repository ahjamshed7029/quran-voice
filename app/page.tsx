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
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioResponseRef = useRef<HTMLAudioElement | null>(null);

  const stageRef = useRef('greeting');
  const mentorNameRef = useRef('Хасан');
  const currentAyahRef = useRef(1);

  const resetSilenceTimer = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    silenceTimerRef.current = setTimeout(async () => {
      setDebugMessage('Тайм-аут: ничего не слышно');
      await stopRecordingFlow();
      aiSpeak('Я не слышу тебя. Скажи что-нибудь.', null, 'yellow');
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
      startRecordingFlow();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';

    utterance.onstart = () => setScreenColor(preferredColor);
    utterance.onend = () => {
      startRecordingFlow();
      resetSilenceTimer();
      if (callback) callback();
    };
    utterance.onerror = (err) => {
      console.error("SpeechSynthesis error:", err);
      startRecordingFlow();
    };

    window.speechSynthesis.speak(utterance);
  };

  const startRecordingFlow = async () => {
    setDebugMessage('Слушаю вас...');
    setScreenColor('green'); // User requested Green for listening/correct

    try {
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

      audioChunksRef.current = [];
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

    formData.append('audio', audioBlob, `student_voice.${extension}`);
    formData.append('stage', stageRef.current);
    formData.append('mentor_name', mentorNameRef.current);
    formData.append('current_ayah', String(currentAyahRef.current));

    try {
      setDebugMessage('Отправка на сервер...');

      const response = await fetch(`${apiUrl}/api/agent/talk`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      stageRef.current = data.stage || stageRef.current;
      currentAyahRef.current = data.current_ayah || currentAyahRef.current;
      if (data.mentor_name) mentorNameRef.current = data.mentor_name;

      setDebugMessage(`Расслышано: "${data.student_heard || 'не распознано'}"`);

      aiSpeak(
        data.text_response || 'Получено пустое сообщение.',
        data.audio_response_base64,
        data.screen_color || 'green'
      );

    } catch (error: any) {
      console.error(error);
      setScreenColor('yellow');
      setDebugMessage(`Ошибка сервера: ${error?.message || 'не удалось подключиться'}`);

      setTimeout(() => {
        startRecordingFlow();
        resetSilenceTimer();
      }, 3000);
    }
  };

  const handleFirstTapStart = async () => {
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
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                window.location.reload();
              }
            };
          }
        };
      });
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (audioResponseRef.current) audioResponseRef.current.pause();
    };
  }, []);

  return (
    <div className="bg-[#0b0f19] text-[#e5e7eb] min-h-screen flex flex-col items-center justify-center p-6 select-none overflow-hidden relative font-sans">
      
      {/* HUD: Debug & Settings */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
        <div className="text-[10px] font-mono text-zinc-500 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 max-w-[200px] truncate">
          {debugMessage}
        </div>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 border border-white/5 text-lg hover:text-white transition-all active:scale-90"
        >
          ⚙️
        </button>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-6">
          <div className="bg-[#1a1f2e] border border-white/10 p-8 rounded-[2rem] w-full max-w-sm shadow-2xl">
            <h2 className="text-[#e5c158] text-xl font-semibold mb-6">Настройки сервера</h2>
            <input
              type="text"
              defaultValue={apiUrl}
              id="api_input"
              className="w-full bg-black/50 border border-white/10 p-4 rounded-xl mb-6 text-soft font-mono text-sm focus:border-[#e5c158]/50 outline-none transition-all"
              placeholder="https://your-api.com"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const input = document.getElementById('api_input') as HTMLInputElement;
                  saveApiUrl(input.value);
                }}
                className="flex-1 bg-[#e5c158] text-black font-bold p-4 rounded-xl active:scale-95 transition-all"
              >
                Сохранить
              </button>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="flex-1 bg-white/5 text-soft p-4 rounded-xl active:scale-95 transition-all hover:bg-white/10"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero: Splash Screen */}
      {!isActivated && (
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-1000">
          <div className="relative w-64 h-64 md:w-80 md:h-80 mb-10">
            <Image
              src="/icons/logo.png"
              alt="Siraj Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-5xl font-black tracking-[0.3em] mb-3 text-[#e5c158]">SIRAJ</h1>
          <p className="text-zinc-500 italic mb-16 text-lg tracking-widest">سراج — ПУТЕВОДНЫЙ СВЕТ</p>

          <button
            onClick={handleFirstTapStart}
            className="group relative px-16 py-6 bg-transparent border border-[#e5c158]/30 rounded-full text-[#e5c158] text-xl font-bold tracking-[0.2em] overflow-hidden transition-all hover:border-[#e5c158] hover:shadow-[0_0_30px_rgba(229,193,88,0.2)] active:scale-95"
          >
            <div className="absolute inset-0 bg-[#e5c158]/5 group-hover:bg-[#e5c158]/10 transition-colors" />
            НАЧАТЬ ОБУЧЕНИЕ
          </button>
        </div>
      )}

      {/* Main: Interactive Pulse */}
      {isActivated && (
        <div className="flex flex-col items-center animate-in fade-in zoom-in slide-in-from-bottom-12 duration-700">
          <div
            onClick={stopRecordingFlow}
            className={`w-72 h-72 md:w-80 md:h-80 rounded-full border-4 transition-all duration-700 cursor-pointer flex items-center justify-center relative ${
              screenColor === 'green'
                ? 'bg-emerald-500/10 border-emerald-400 shadow-[0_0_120px_rgba(52,211,153,0.3)] animate-pulse-slow'
                : screenColor === 'yellow'
                  ? 'bg-amber-500/10 border-amber-300 shadow-[0_0_100px_rgba(251,191,36,0.3)]'
                  : screenColor === 'red'
                    ? 'bg-rose-500/10 border-rose-400 shadow-[0_0_120px_rgba(244,63,94,0.3)]'
                    : 'bg-blue-500/10 border-blue-400 shadow-[0_0_100px_rgba(96,165,250,0.2)]'
            }`}
          >
            {/* Inner pulsing indicator for listening */}
            {screenColor === 'green' && debugMessage === 'Слушаю вас...' && (
              <div className="absolute inset-0 rounded-full border-4 border-emerald-400/20 animate-ping-slow" />
            )}

            {/* Icon/Content inside circle */}
            <div className="flex flex-col items-center">
              {screenColor === 'green' && (
                <div className="flex gap-1.5 mb-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-1.5 h-10 bg-emerald-400 rounded-full animate-wave" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              )}
              {screenColor === 'red' && <span className="text-rose-400 text-4xl mb-2">●</span>}
              {screenColor === 'yellow' && <span className="text-amber-300 text-4xl mb-2">○</span>}
              
              <span className={`text-[10px] font-bold tracking-[0.3em] uppercase ${
                screenColor === 'green' ? 'text-emerald-400' : 
                screenColor === 'yellow' ? 'text-amber-300' : 
                screenColor === 'red' ? 'text-rose-400' : 'text-blue-400'
              }`}>
                {debugMessage === 'Слушаю вас...' ? 'СЛУШАЮ' : 
                 debugMessage.startsWith('Ответ:') ? 'УЧИТЕЛЬ' : 'ЖДУ...'}
              </span>
            </div>
          </div>

          <button 
             onClick={stopRecordingFlow}
             className="mt-20 text-zinc-500 font-light tracking-[0.2em] text-sm uppercase hover:text-[#e5c158] transition-colors"
          >
            {debugMessage === 'Обработка голоса...' ? 'ДУМАЮ...' : 'НАЖМИТЕ, ЧТОБЫ ОТВЕТИТЬ'}
          </button>
        </div>
      )}

      <style jsx global>{`
        @keyframes wave {
          0%, 100% { height: 16px; opacity: 0.5; }
          50% { height: 40px; opacity: 1; }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .animate-wave { animation: wave 1.2s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-ping-slow { animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
      `}</style>
    </div>
  );
}
