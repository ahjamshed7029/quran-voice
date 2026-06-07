'use client';

import { useState, useEffect, useRef } from 'react';



export default function AutonomousAITutor() {
  const [apiUrl, setApiUrl] = useState("https://cuddly-doodles-switch.loca.lt");
  const [isActivated, setIsActivated] = useState(false);
  const [screenColor, setScreenColor] = useState('red');
  const [debugMessage, setDebugMessage] = useState('Нажмите кнопку для старта');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const savedUrl = localStorage.getItem('quran_voice_api_url');
    if (savedUrl) setApiUrl(savedUrl);
  }, []);

  const saveApiUrl = (url) => {
    setApiUrl(url);
    localStorage.setItem('quran_voice_api_url', url);
    setIsSettingsOpen(false);
  };

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const isWebRecorder = useRef(true); // Track if we're using web MediaRecorder or Capacitor plugin

  const silenceTimerRef = useRef(null);
  const audioResponseRef = useRef(null);

  const stageRef = useRef('greeting');
  const mentorNameRef = useRef('Хасан');
  const currentAyahRef = useRef(1);

  // Initialize permissions
  useEffect(() => {
    const initPermissions = async () => {
      if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform()) {
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
    clearTimeout(silenceTimerRef.current);

    silenceTimerRef.current = setTimeout(async () => {
      setDebugMessage('Тайм-аут: ничего не слышно');
      await stopRecordingFlow();
      aiSpeak('Я не слышу тебя. Скажи что-нибудь, я внимательно слушаю.');
    }, 15000); 
  };

  const aiSpeak = (text, audioBase64 = null, callback = null) => {
    setDebugMessage(`Ответ: ${text}`);

    if (audioBase64) {
      const audioUrl = `data:audio/mp3;base64,${audioBase64}`;
      if (audioResponseRef.current) {
        audioResponseRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioResponseRef.current = audio;

      audio.onplay = () => {
        setScreenColor('green');
      };

      audio.onended = () => {
        setScreenColor('blue');
        startRecordingFlow();
        resetSilenceTimer();
        if (callback) callback();
      };

      audio.play().catch(err => {
        console.error("Audio play failed, falling back to Web Speech:", err);
        fallbackSpeak(text, callback);
      });
      return;
    }

    fallbackSpeak(text, callback);
  };

  const fallbackSpeak = (text, callback) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.error("Web Speech API not supported");
      setScreenColor('blue');
      startRecordingFlow();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    
    utterance.onstart = () => setScreenColor('green');
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
        // CAPACITOR NATIVE RECORDING
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

      // WEB STANDARDS RECORDING
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
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current.mimeType });
          await sendAudioToBackend(audioBlob);
        };
      }

      if (mediaRecorderRef.current.state === 'inactive') {
        mediaRecorderRef.current.start();
      }
    } catch (err) {
      console.error('Start recording error:', err);
      setScreenColor('yellow');
      setDebugMessage('Ошибка микрофона: ' + (err?.message || 'неизвестно'));
    }
  };

  const stopRecordingFlow = async () => {
    clearTimeout(silenceTimerRef.current);
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

  const sendAudioToBackend = async (audioBlob) => {
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
        data.audio_response_base64
      );

    } catch (error) {
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
      // Запрашиваем приветственное аудио от бэкенда при старте, чтобы не зависеть от телефона
      const response = await fetch(`${apiUrl}/api/agent/welcome`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        aiSpeak(data.text_response, data.audio_response_base64);
      } else {
        // Если специального эндпоинта нет, просто включаем логику
        aiSpeak('Ассаляму алейкум. Назовите имя учителя.');
      }
    } catch (err) {
      console.error('Initialization error:', err);
      // Если бэкенд недоступен, стартуем локально в режиме ожидания
      aiSpeak('Ассаляму алейкум.');
    }
  };

  useEffect(() => {
    return () => {
      clearTimeout(silenceTimerRef.current);
      if (audioResponseRef.current) {
        audioResponseRef.current.pause();
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden select-none p-6">

      <div className="absolute top-6 text-center text-[10px] font-mono text-zinc-500 bg-zinc-950 px-3 py-1 rounded border border-zinc-900 flex items-center gap-2">
        {debugMessage}
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="ml-2 text-zinc-700 hover:text-zinc-400"
        >
          ⚙️
        </button>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-full max-w-sm">
            <h2 className="text-emerald-400 text-lg mb-4">Настройки сервера</h2>
            <input 
              type="text" 
              defaultValue={apiUrl}
              id="api_input"
              className="w-full bg-black border border-zinc-800 p-3 rounded mb-4 text-zinc-300 font-mono text-sm"
              placeholder="https://your-tunnel.loca.lt"
            />
            <div className="flex gap-2">
              <button 
                onClick={() => saveApiUrl(document.getElementById('api_input').value)}
                className="flex-1 bg-emerald-600 p-3 rounded active:scale-95"
              >
                Сохранить
              </button>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="flex-1 bg-zinc-800 p-3 rounded active:scale-95"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {!isActivated ? (
        <button
          onClick={handleFirstTapStart}
          className="px-12 py-6 bg-zinc-900 text-emerald-400 border border-emerald-800/30 rounded-full text-xl font-medium tracking-widest active:scale-95 transition-all shadow-[0_0_40px_rgba(16,185,129,0.1)]"
        >
          НАЧАТЬ ОБУЧЕНИЕ
        </button>
      ) : (
        <div
          onTouchStart={stopRecordingFlow}
          onClick={stopRecordingFlow}
          className={`w-64 h-64 rounded-full border-4 transition-all duration-700 cursor-pointer flex items-center justify-center ${screenColor === 'green'
              ? 'bg-emerald-600 border-emerald-400 shadow-[0_0_90px_rgba(16,185,129,0.6)]'
              : screenColor === 'yellow'
                ? 'bg-amber-500 border-amber-300 shadow-[0_0_80px_rgba(245,158,11,0.5)]'
                : screenColor === 'blue'
                  ? 'bg-blue-600 border-blue-400 animate-pulse shadow-[0_0_95px_rgba(37,99,235,0.6)]'
                  : 'bg-rose-600 border-rose-400 shadow-[0_0_70px_rgba(225,29,72,0.4)]'
            }`}
        >
          {screenColor === 'red' && (
            <span className="text-white/20 text-xs animate-pulse">Запуск...</span>
          )}
        </div>
      )}
    </main>
  );
}