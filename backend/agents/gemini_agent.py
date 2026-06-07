import os
import google.generativeai as genai
from dotenv import load_dotenv
import logging

# Load environment variables from both possible locations
load_dotenv()
load_dotenv(".env.local")

logger = logging.getLogger(__name__)

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
else:
    logger.error("GEMINI_API_KEY not found in environment variables!")

def transcribe_audio(audio_path):
    """
    Transcribes audio using Google Gemini 1.5 Flash.
    This is much more robust than local Whisper and doesn't require FFmpeg.
    """
    if not api_key:
        return "Ошибка: API ключ Gemini не настроен."

    try:
        # 1. Upload to Gemini Cloud
        print(f"--- Transcribing with Gemini: {audio_path} ---")
        audio_file = genai.upload_file(path=audio_path)
        
        # 2. Generate transcription
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        # We ask Gemini to be a pure transcription engine
        prompt = (
            "Transcribe the following audio accurately. "
            "If it's in Arabic (like Quranic recitation), transcribe the Arabic text. "
            "If it's in Russian or English, transcribe that. "
            "Return ONLY the transcribed text without any comments or formatting."
        )
        
        response = model.generate_content([prompt, audio_file])
        
        # 3. Cleanup cloud file
        audio_file.delete()
        
        transcription = response.text.strip()
        print(f"Heard: {transcription}")
        return transcription

    except Exception as e:
        print(f"Transcription Error (Gemini): {e}")
        return ""