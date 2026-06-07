"""
Teacher persona and system prompt management.
"""
from typing import Literal
from dataclasses import dataclass

@dataclass
class TeacherConfig:
    """Configuration for a teacher persona."""
    name: str  # Display name
    gender: Literal['male', 'female']
    system_prompt: str
    status_text: str
    voice_id: str  # ElevenLabs or OpenAI voice ID
    language: str  # ISO 639-1 code


class TeacherService:
    """Manages teacher personas based on student voice gender."""
    
    # Teacher configurations
    AISHA = TeacherConfig(
        name="Учительница Аиша",
        gender="female",
        system_prompt="""Ты — Аиша, добрая и спокойная учительница Корана. Твоя роль:
- Преподавать Коран с нежностью и терпением
- Помнить прогресс ученика в текущем уроке
- Излагать аяты медленно и чётко
- Дать перевод на выбранном языке
- Приспосабливаться к темпу ученика
- Предлагать короткие размышления после каждого аята

Стиль общения: мягкий, поддерживающий, спокойный голос учительницы.
Язык: русский.""",
        status_text="Аиша слушает...",
        voice_id="sophia",  # ElevenLabs voice
        language="ru"
    )
    
    HASAN = TeacherConfig(
        name="Учитель Хасан",
        gender="male",
        system_prompt="""Ты — Хасан, почтенный и опытный учитель Корана. Твоя роль:
- Преподавать Коран с достоинством и мудростью
- Помнить прогресс ученика в текущем уроке
- Излагать аяты размеренно и выразительно
- Дать перевод на выбранном языке
- Приспосабливаться к темпу ученика
- Предлагать глубокие размышления после каждого аята

Стиль общения: глубокий, авторитетный, спокойный голос учителя.
Язык: русский.""",
        status_text="Хасан слушает...",
        voice_id="adam",  # ElevenLabs voice (deep, male)
        language="ru"
    )
    
    # For young learners - female voice
    CHILD_TEACHER = TeacherConfig(
        name="Учительница Фаарах",
        gender="female",
        system_prompt="""Ты — Фаарах, весёлая и понимающая учительница Корана для детей. Твоя роль:
- Преподавать Коран в весёлой и лёгкой форме
- Помнить прогресс ученика
- Излагать аяты очень медленно и утрированно чётко
- Использовать простой язык
- Поощрять ученика часто
- Использовать образные сравнения из детской жизни

Стиль общения: весёлый, поддерживающий, игривый голос.
Язык: русский.""",
        status_text="Фаарах слушает...",
        voice_id="bella",  # ElevenLabs voice (younger female)
        language="ru"
    )
    
    @classmethod
    def get_teacher_by_gender(cls, gender: Literal['male', 'female', 'child']) -> TeacherConfig:
        """Select teacher based on student's voice gender."""
        if gender == 'male':
            return cls.HASAN
        elif gender == 'child':
            return cls.CHILD_TEACHER
        else:  # female or default
            return cls.AISHA
    
    @classmethod
    def get_all_teachers(cls) -> dict[str, TeacherConfig]:
        """Get all available teachers."""
        return {
            'aisha': cls.AISHA,
            'hasan': cls.HASAN,
            'farrah': cls.CHILD_TEACHER,
        }
    
    @classmethod
    def get_system_prompt(cls, gender: Literal['male', 'female', 'child']) -> str:
        """Get system prompt for the selected teacher."""
        teacher = cls.get_teacher_by_gender(gender)
        return teacher.system_prompt
    
    @classmethod
    def get_agent_name(cls, gender: Literal['male', 'female', 'child']) -> str:
        """Get display name for the selected teacher."""
        teacher = cls.get_teacher_by_gender(gender)
        return teacher.name
    
    @classmethod
    def get_status_text(cls, gender: Literal['male', 'female', 'child']) -> str:
        """Get status text for the selected teacher."""
        teacher = cls.get_teacher_by_gender(gender)
        return teacher.status_text
    
    @classmethod
    def get_voice_id(cls, gender: Literal['male', 'female', 'child']) -> str:
        """Get ElevenLabs voice ID for the selected teacher."""
        teacher = cls.get_teacher_by_gender(gender)
        return teacher.voice_id
