import os
import random
import base64
import uvicorn
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

from agents.gemini_agent import transcribe_audio
from agents.teacher_agent import teacher_response
# from agents.tts_agent import generate_voice_bytes (Удалено, теперь используется async версия)

app = FastAPI()

# 2. ИСПРАВЛЕНИЕ БЭКЕНДА (FastAPI & CORS):
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "https://localhost",
        "capacitor://localhost",
        "http://192.168.76.70:3000",
        "http://192.168.76.70:8100", # Ionic/Capacitor dev server
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/agent/talk")
async def talk_endpoint(
    audio: UploadFile = File(...),
    student_type: str = Form("man"),
    stage: str = Form("greeting"),
    current_ayah: int = Form(1),
    mentor_name: str = Form("Хасан")
):
    temp_filename = f"temp_{random.randint(1000, 9999)}_{audio.filename or 'audio.webm'}"
    
    try:
        # 1. Save audio to temp file
        content = await audio.read()
        if not content:
            return {"error": "Empty audio file received"}
            
        with open(temp_filename, "wb") as buffer:
            buffer.write(content)

        # 2. STT (Speech to Text)
        print(f"--- Transcribing {temp_filename} ---")
        student_text = transcribe_audio(temp_filename)
        print(f"Heard: {student_text}")

        # If nothing was heard, return a gentle prompt
        if not student_text or len(student_text.strip()) < 2:
            text_to_say = "Я вас не расслышал. Можете повторить?"
            from agents.tts_agent import generate_tts
            audio_bytes = await generate_tts(text_to_say)
            audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
            return {
                "student_heard": "",
                "text_response": text_to_say,
                "screen_color": "yellow",
                "stage": stage,
                "current_ayah": current_ayah,
                "mentor_name": mentor_name,
                "audio_response_base64": audio_base64
            }

        # 3. AI Teacher Logic
        ai_response = teacher_response(
            student_text=student_text,
            student_type=student_type,
            stage=stage,
            current_ayah=current_ayah,
            mentor_name=mentor_name
        )

        text_to_say = ai_response.get("text_response", "Я не уверен, что сказать.")

        # 4. TTS (Text to Speech)
        print(f"--- Generating voice for: {text_to_say} ---")
        try:
            from agents.tts_agent import generate_tts
            audio_bytes = await generate_tts(text_to_say)
            audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
        except Exception as tts_err:
            print(f"TTS Error: {tts_err}")
            audio_base64 = "" # Fallback to browser TTS

        return {
            "student_heard": student_text,
            "text_response": text_to_say,
            "screen_color": ai_response.get("screen_color", "green"),
            "stage": ai_response.get("next_stage", stage),
            "current_ayah": ai_response.get("next_ayah", current_ayah),
            "mentor_name": mentor_name,
            "audio_response_base64": audio_base64
        }

    except Exception as e:
        print(f"Backend Error: {e}")
        return {
            "error": str(e),
            "student_heard": "ошибка",
            "text_response": "Прости, у меня технические сложности. Повтори пожалуйста.",
            "audio_response_base64": ""
        }
        
    finally:
        # 5. Cleanup
        if os.path.exists(temp_filename):
            try:
                os.remove(temp_filename)
            except:
                pass

@app.post("/api/agent/welcome")
async def welcome_endpoint():
    text_to_say = "Ассаляму алейкум! Я ваш учитель Корана. Как вас зовут или как я могу к вам обращаться?"
    try:
        from agents.tts_agent import generate_tts
        audio_bytes = await generate_tts(text_to_say)
        audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
    except Exception as e:
        print(f"Welcome TTS Error: {e}")
        audio_base64 = ""
        
    return {
        "text_response": text_to_say,
        "audio_response_base64": audio_base64,
        "stage": "greeting",
        "mentor_name": "Хасан"
    }

@app.get("/")
def root():
    return {"status": "working", "ip": "192.168.76.70"}

if __name__ == "__main__":
    import os
    # Читаем порт из системы (Render передает его автоматически), иначе берем 8000
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)