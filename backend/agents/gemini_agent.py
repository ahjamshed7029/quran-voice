import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Настройка API ключа (ключ должен быть добавлен в переменные среды на Render)
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def transcribe_audio(file_path: str) -> str:
    """
    Распознавание речи через официальное облачное API Google Gemini.
    Работает мгновенно, весит 0 мегабайт на сервере.
    """
    try:
        if not os.path.exists(file_path):
            print(f"Ошибка: Файл {file_path} не найден.")
            return ""

        print("Загрузка аудио в Google Gemini API...")
        # Загружаем файл в облачное хранилище Gemini
        audio_file = genai.upload_file(path=file_path)
        
        # Используем быструю и легкую модель для обработки аудио
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        print("Распознавание речи...")
        response = model.generate_content([
            audio_file, 
            "Пожалуйста, напиши точный текст, который ты слышишь в этом аудиофайле. "
            "Если это арабский язык (чтение Корана), запиши арабским текстом. "
            "Обрати особое внимание на фразы: 'Субханаллах', 'Машааллах', 'Аллаху Акбар', "
            "они должны быть распознаны корректно на русском или арабском в зависимости от контекста. "
            "Не пиши никаких лишних комментариев, только то, что услышал."
        ])
        
        # Удаляем файл из облака после обработки
        audio_file.delete()
        
        return response.text.strip() if response.text else ""
        
    except Exception as e:
        print(f"Ошибка при распознавании через Gemini API: {e}")
        return ""