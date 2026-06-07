"use client";

// 1. Описываем для TypeScript, что наш компонент обязан принимать параметр isAnimating
interface VoiceWaveProps {
  isAnimating: boolean;
}

// 2. Передаем этот параметр в функцию компонента
export default function VoiceWave({ isAnimating }: VoiceWaveProps) {
  return (
    <div className="flex items-center gap-1 justify-center h-20">
      {/* Рисуем 4 пульсирующие линии голосовой волны */}
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className={`w-1 bg-teal-400 rounded-full transition-all duration-300 ${
            isAnimating ? 'animate-pulse h-12' : 'h-3 bg-white/20'
          }`}
          style={{
            // Делаем небольшую задержку анимации для каждой линии, чтобы волна шла «волнами»
            animationDelay: isAnimating ? `${i * 0.15}s` : '0s'
          }}
        />
      ))}
    </div>
  );
}