import io
import numpy as np
from typing import Literal
import librosa

class VoiceGenderDetector:
    """Detects voice gender from audio using multiple methods."""
    
    def __init__(self):
        # Добавили pass, если в будущем здесь понадобится инициализация
        pass
        
    async def detect_gender(self, audio_bytes: bytes, audio_format: str = 'wav') -> Literal['male', 'female', 'child']:
        """
        Detect voice gender from audio file.
        
        Uses combination of:
        1. Spectral analysis (fundamental frequency)
        2. MFCC features / Whisper placeholder
        
        Args:
            audio_bytes: Raw audio data
            audio_format: Audio format (wav, mp3, etc.)
            
        Returns:
            'male', 'female', or 'child'
        """
        try:
            # Метод 1: Спектральный анализ
            gender_by_spectrum = await self._analyze_spectrum(audio_bytes, audio_format)
            
            # ИСПРАВЛЕНО: Добавлен вызов второго метода, чтобы переменная существовала
            gender_by_whisper = await self._analyze_with_whisper(audio_bytes, audio_format)
                                
            # Объединяем результаты
            return self._combine_gender_predictions(gender_by_spectrum, gender_by_whisper)
            
        except Exception as e:
            print(f"Error in gender detection: {e}")
            # Default to female for safer fallback
            return 'female'
    
    async def _analyze_spectrum(self, audio_bytes: bytes, audio_format: str) -> Literal['male', 'female', 'child']:
        """
        Analyze fundamental frequency to determine gender.
        
        Typical F0 ranges:
        - Adult male: 85-180 Hz
        - Adult female: 165-255 Hz
        - Child: 200-300+ Hz
        """
        try:
            # Load audio (используем BytesIO для чтения из памяти)
            y, sr = librosa.load(io.BytesIO(audio_bytes), sr=16000, mono=True)
            
            # Extract fundamental frequency using pyin algorithm
            f0, voiced_flag, voiced_probs = librosa.pyin(
                y,
                fmin=librosa.note_to_hz('C2'),
                fmax=librosa.note_to_hz('C7'),
                sr=sr
            )
            
            # Get median F0 (ignoring unvoiced frames)
            f0_valid = f0[~np.isnan(f0)]
            
            if len(f0_valid) == 0:
                return 'female'  # Default fallback
            
            median_f0 = np.median(f0_valid)
            
            # Classify based on F0
            if median_f0 > 200:
                return 'child'
            elif median_f0 > 165:
                return 'female'
            else:
                return 'male'
                
        except Exception as e:
            print(f"Spectrum analysis error: {e}")
            return 'female'
    
    async def _analyze_with_whisper(self, audio_bytes: bytes, audio_format: str) -> Literal['male', 'female', 'child']:
        """Placeholder for Whisper analysis."""
        try:
            # ИСПРАВЛЕНО: Убран незакрытый тройной докстринг, который ломал синтаксис
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = f'audio.{audio_format}'
            
            # Whisper doesn't directly classify gender
            # This is a placeholder for future enhancement
            return 'female'  # Default
            
        except Exception as e:
            print(f"Whisper analysis error: {e}")
            return 'female'
    
    def _combine_gender_predictions(self, spectrum_gender: str, whisper_gender: str) -> Literal['male', 'female', 'child']:
        """Combine multiple gender detection methods."""
        # Give spectrum analysis more weight as it's more reliable for gender detection
        if spectrum_gender == 'child':
            return 'child'
        return spectrum_gender  # В текущей логике возвращается спектральный пол