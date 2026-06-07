import os
import uuid
import edge_tts
import asyncio
import tempfile

# Для учителя Хасана отлично подходит Дмитрий, либо можешь использовать Светлану для Аиши
VOICE = "ru-RU-DmitryNeural" 

async def generate_tts(text: str) -> bytes:
    """
    Генерирует аудио из текста с помощью Edge TTS.
    Работает без конфликтов файлов как на Windows (локально), так и на Linux (на хостинге).
    """
    # 1. Генерируем уникальное имя файла во временной папке ОС
    unique_filename = f"tts_{uuid.uuid4().hex}.mp3"
    temp_path = os.path.join(tempfile.gettempdir(), unique_filename)

    try:
        # 2. Инициализируем генератор речи
        communicate = edge_tts.Communicate(text=text, voice=VOICE)
        
        # 3. Сохраняем аудио во временный файл
        await communicate.save(temp_path)
        
        # 4. Читаем байты готового файла
        with open(temp_path, "rb") as f:
            audio_bytes = f.read()
            
        return audio_bytes

    except Exception as e:
        print(f"Ошибка в TTS агенете: {e}")
        raise e

    finally:
        # 5. Жестко удаляем временный файл, чтобы не забивать память сервера
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as e:
                print(f"Не удалось удалить временный файл {temp_path}: {e}")