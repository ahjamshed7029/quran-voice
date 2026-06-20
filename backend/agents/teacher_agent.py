import os
import logging
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Initialize OpenAI client with OpenRouter base URL
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

PERSONAS = {
    "Хасан": (
        "Ты — Хасан, терпеливый и структурированный учитель арабского языка и Корана. "
        "Твой тон подбадривающий, спокойный и академичный. Говори четко и кратко. "
    ),
    "Аиша": (
        "Ты — Аиша, теплая, энергичная и очень интерактивная преподавательница. "
        "Твой тон дружелюбный и разговорный. Сосредоточься на практическом общении и исправлении ошибок. "
    )
}

FORCED_INSTRUCTION = (
    "Никогда не использовать Markdown-разметку, списки и спецсимволы (звездочки, решетки). "
    "Выдавать только чистый текст для озвучивания. "
    "Не используй приветствия, если это не начало разговора. "
    "Отвечай кратко, 1-2 предложения. "
    "Используй 'Субханаллах' как похвалу за правильное чтение. "
    "Используй 'Машааллах' при небольших ошибках или чтобы подбодрить. "
    "Используй 'Аллаху Акбар' при серьезных ошибках или чтобы подчеркнуть величие аята."
)

def teacher_response(student_text: str, student_type: str = "man", stage: str = "greeting", current_ayah: int = 1, mentor_name: str = "Хасан") -> dict:
    """
    Основная логика ответа учителя.
    """
    persona_prompt = PERSONAS.get(mentor_name, PERSONAS["Хасан"])
    system_prompt = f"{persona_prompt} {FORCED_INSTRUCTION} Текущий этап: {stage}. Аят: {current_ayah}."

    try:
        response = client.chat.completions.create(
            model="google/gemini-2.0-flash-exp:free",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": student_text}
            ],
            temperature=0.7,
            max_tokens=200
        )
        
        text_response = response.choices[0].message.content.strip()
        
        if not text_response:
            logger.warning("Empty response from AI, using fallback.")
            text_response = "Я задумался. Повтори пожалуйста еще раз."
            
        print(f"AI Response: {text_response}")
        
        # Simple stage transition logic for demonstration
        next_stage = stage
        if any(word in student_text.lower() for word in ["начать", "старт", "готова", "готов"]):
            next_stage = "quran_practice"

        # Set color based on keywords in response
        screen_color = "green"
        if "Аллаху Акбар" in text_response:
            screen_color = "red"
        elif "Машааллах" in text_response:
            screen_color = "yellow"
        elif "Субханаллах" in text_response:
            screen_color = "green"

        return {
            "text_response": text_response,
            "next_stage": next_stage,
            "next_ayah": current_ayah,
            "screen_color": screen_color
        }
    except Exception as e:
        logger.error(f"Error calling OpenRouter: {e}")
        return {
            "text_response": "Прости, я не расслышал. Повтори пожалуйста.",
            "next_stage": stage,
            "next_ayah": current_ayah,
            "screen_color": "yellow"
        }