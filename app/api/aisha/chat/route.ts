import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    const cleanMessage = message.toLowerCase().trim();

    // Дефолтный ответ
    let replyText = "Я внимательно слушаю тебя. Скажи, какую суру ты хочешь разобрать?";

    // Симуляция логики: если пользователь здоровается
    if (cleanMessage.includes("привет") || cleanMessage.includes("салам") || cleanMessage.includes("ассалам")) {
      replyText = "Ассалому алейкум! Я твой голосовой наставник. Какую суру начнем учить сегодня?";
    } 
    // Симуляция голосовых команд
    else if (cleanMessage.includes("повтори") || cleanMessage.includes("repeat")) {
      replyText = "Хорошо, давай повторим этот аят еще раз. Слушай внимательно.";
    } 
    else if (cleanMessage.includes("дальше") || cleanMessage.includes("следующий") || cleanMessage.includes("next")) {
      replyText = "Отлично справляешься. Переходим к следующему аяту суры.";
    } 
    else if (cleanMessage.includes("перевод") || cleanMessage.includes("translate")) {
      replyText = "Смысл этого аята заключается в том, что Милостивый Господь всегда близок к Своим рабам.";
    }
    // Симуляция выбора наставника по кодовым словам (для тестов пола)
    else if (cleanMessage.includes("хасан")) {
      replyText = "Да, я твой учитель Хасан. Готов продолжить урок, брат.";
    }
    else if (cleanMessage.includes("аиша")) {
      replyText = "Да, я твоя учительница Аиша. Давай продолжим наше обучение, дорогая.";
    }

    // Возвращаем JSON, который твой фронтенд (page.tsx) легко прочитает и озвучит
    return NextResponse.json({ text: replyText });

  } catch (error) {
    console.error("Ошибка симулятора:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}