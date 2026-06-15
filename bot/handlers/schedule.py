"""Генерация расписания через диалог: бот просит доступность, парсит ответ."""
import logging
from datetime import date

from telegram import Update
from telegram.ext import (
    Application, CommandHandler, MessageHandler, ConversationHandler, ContextTypes, filters,
)

from handlers.admin import is_admin
from services.db import db
from services.parser import parse_availability
from services.scheduler import generate_schedule

logger = logging.getLogger(__name__)

RECEIVE = 0  # единственное состояние: ждём текст доступности после /schedule

_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]

PROMPT = (
    "Введи доступность в формате:\n"
    "Имя дата1 дата2\n"
    "Имя с15:00 дата1\n"
    "Пример:\n"
    "Иван 01.07 02.07\n"
    "Петр с15:00 01.07 03.07"
)


def _format(schedule: list[dict], data: dict) -> str:
    # вместимость места = сумма role.count
    cap = {wp["name"]: sum(r.get("count", 1) for r in wp.get("roles", []))
           for wp in data.get("workplaces", [])}

    blocks = []
    for wp in data.get("workplaces", []):
        name = wp["name"]
        lines = [name]
        for day in schedule:
            dn = _DAYS[date.fromisoformat(day["date"]).weekday()]
            assigns = [a for a in day["assignments"] if a["workplace_name"] == name]
            people = [
                f'{a["employee_name"]} ({a["time_note"]})' if a["time_note"] else a["employee_name"]
                for a in assigns
            ]
            expected, filled = cap.get(name, 0), len(assigns)
            if filled < expected:
                warn = f"⚠️ Недостаточно сотрудников ({filled}/{expected})"
                body = f'{", ".join(people)} {warn}'.strip() if people else warn
            else:
                body = ", ".join(people)
            lines.append(f"{dn}: {body}")
        blocks.append("\n".join(lines))
    return "\n\n".join(blocks)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update):
        await update.message.reply_text("⛔ Только для администраторов.")
        return ConversationHandler.END
    await update.message.reply_text(PROMPT)
    return RECEIVE


async def receive(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        availabilities = parse_availability(update.message.text)
        logger.info(f"Parsed availability: {availabilities}")
        if not availabilities:
            await update.message.reply_text(
                "⚠️ Не удалось распознать доступность.\n"
                "Проверь формат:\nИван 16.06 17.06\nПетр с15:00 16.06"
            )
            return ConversationHandler.END

        data = await db.get_full_data()
        logger.info(f"DB data: workplaces={len(data.get('workplaces', []))}, "
                    f"employees={len(data.get('employees', []))}")
        if not data.get('workplaces') or not data.get('employees'):
            await update.message.reply_text("⚠️ В базе нет данных. Добавь места и сотрудников.")
            return ConversationHandler.END

        schedule = generate_schedule(data, availabilities)
        logger.info(f"Schedule result: {schedule}")
        if not schedule:
            await update.message.reply_text("⚠️ Расписание пустое — никто не доступен в указанные дни.")
            return ConversationHandler.END

        await update.message.reply_text(_format(schedule, data))
        return ConversationHandler.END
    except Exception as e:
        logger.error(f"Schedule error: {e}", exc_info=True)
        await update.message.reply_text(f"❌ Ошибка: {e}")
        return ConversationHandler.END


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Отменено.")
    return ConversationHandler.END


def register(app: Application):
    app.add_handler(ConversationHandler(
        entry_points=[CommandHandler("schedule", start)],
        states={RECEIVE: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive)]},
        fallbacks=[CommandHandler("cancel", cancel)],
    ))
