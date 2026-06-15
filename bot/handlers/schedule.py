"""Генерация расписания через диалог: бот просит доступность, парсит ответ."""
from datetime import date

from telegram import Update
from telegram.ext import (
    Application, CommandHandler, MessageHandler, ConversationHandler, ContextTypes, filters,
)

from handlers.admin import is_admin
from services.db import db
from services.parser import parse_availability
from services.scheduler import generate_schedule

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
    availabilities = parse_availability(update.message.text)
    if not availabilities:
        await update.message.reply_text("Не распознал доступность. Попробуй ещё раз или /cancel.")
        return RECEIVE
    data = await db.get_full_data()
    schedule = generate_schedule(data, availabilities)
    await update.message.reply_text(_format(schedule, data) or "Нет данных.")
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
