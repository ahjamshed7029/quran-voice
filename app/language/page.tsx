'use client';

import { useEffect, useRef, useState } from 'react';

export default function LanguagePage() {
  const [statusText, setStatusText] = useState('Запуск Аиши...');
  const [isListening, setIsListening] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Воспроизведение аудио-файла, который прислал бэкенд (ИИ)
  const playAudioResponse = (audioUrl: string) => {
    return new Promise<void>((resolve) => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onended = () => {
        currentAudioRef.current = null;
        resolve();
      };

      audio.play().catch(err => {
        console.error("Ошибка воспроизведения аудио:", err);
        resolve();
      });
    });
  };

  // Стартовое приветствие (Запрос к бэкенду)
  const welcomeUser = async () => {
    try {
      setStatusText('Аиша подключается...');
      // Бэкенд сам проверит IP/гео локацию и вернет приветствие на нужном языке в виде аудио
      const response = await fetch('/api/aisha/welcome', { method: 'POST' });
      const data = await response.json();
      
      setStatusText(data.statusText || 'Аиша готова к общению');
      await playAudioResponse(data.audioUrl);
      
      // После приветствия автоматически включаем микрофон
      startListening();
    } catch (error) {
      console.error(error);
      setStatusText("Не удалось связаться с Аишой.");
    }
  };

  // Запись ответа ученика
  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setIsListening(false);
        setStatusText('Аиша слушает и думает...');
        
        // Отправляем запись и ждем аудио-ответ
        await sendAudioToAishaServer(audioBlob);
      };

      // Кнопки "Стоп" нет, поэтому останавливаем запись, когда пользователь сам делает паузу 
      // (В идеале перенести VAD на бэкенд, но для базового теста можно оставить ручную остановку по клику на экран)
      mediaRecorderRef.current.start();
      setIsListening(true);
      setStatusText('Слушаю вас... Нажмите на экран, когда закончите говорить');

    } catch (err) {
      console.error("Ошибка микрофона:", err);
      setStatusText("Разрешите доступ к микрофону");
    }
  };

  // Остановка записи вручную (для незрячих: коснулся экрана в любом месте — запись завершилась)
  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      // Выключаем треки микрофона
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  // Отправка голоса на сервер ИИ
  const sendAudioToAishaServer = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      // Отправляем аудио на твой бэкенд
      const response = await fetch('/api/aisha/chat', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      // Бэкенд возвращает статус на родном языке юзера и ссылку на аудиофайл его речи
      setStatusText(data.statusText); 
      await playAudioResponse(data.audioUrl);

      // После того как ИИ договорил, автоматически снова открываем микрофон для ответа ученика
      startListening();

    } catch (error) {
      console.error(error);
      setStatusText("Ошибка связи. Попробуйте еще раз.");
    }
  };

  useEffect(() => {
    welcomeUser();

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
    };
  }, []);

  return (
    <main 
      className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-6 select-none cursor-pointer"
      onClick={() => {
        if (isListening) {
          // Если слушает — клик останавливает запись и отправляет на сервер
          stopListening();
        } else if (!currentAudioRef.current) {
          // Если ИИ молчит и микрофон закрыт — клик начинает запись снова
          startListening();
        }
      }}
    >
      <div className="text-center space-y-8">
        
        {/* Пульсирующий индикатор Аиши */}
        <div className="flex items-center justify-center h-24">
          <div className={`rounded-full bg-emerald-500 transition-all duration-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] ${
            isListening ? 'w-20 h-20 animate-pulse bg-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.6)]' : 'w-12 h-12'
          }`}></div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-light text-emerald-400 tracking-wider">
            Учитель Аиша
          </h1>
          <p className="text-lg text-zinc-300 max-w-sm mx-auto font-light leading-relaxed">
            {statusText}
          </p>
        </div>

      </div>
    </main>
  );
}