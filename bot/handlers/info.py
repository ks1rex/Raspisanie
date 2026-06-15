"""Просмотр данных."""
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

from services.db import db


async def employees(update: Update, context: ContextTypes.DEFAULT_TYPE):
    emps = await db.get_employees()
    wps = await db.get_workplaces()
    # id -> имена, чтобы развернуть навыки сотрудника
    wp_name = {w["id"]: w["name"] for w in wps}
    role_name = {r["id"]: r["name"] for w in wps for r in w.get("roles", [])}

    lines = []
    for e in emps:
        lines.append(f'👤 {e["name"]} [П{e["priority"]}]')
        for s in e.get("skills", []):
            wn = wp_name.get(s["workplace_id"], "?")
            rn = role_name.get(s["role_id"], "?")
            lines.append(f'  • {wn} / {rn} [С{s["priority"]}]')
    await update.message.reply_text("\n".join(lines) or "Нет сотрудников.")


async def workplaces(update: Update, context: ContextTypes.DEFAULT_TYPE):
    lines = []
    for w in await db.get_workplaces():
        lines.append(f'🏢 {w["name"]}')
        for r in w.get("roles", []):
            lines.append(f'  • {r["name"]} — {r["count"]} чел.')
    await update.message.reply_text("\n".join(lines) or "Нет мест работы.")


def register(app: Application):
    app.add_handler(CommandHandler("employees", employees))
    app.add_handler(CommandHandler("workplaces", workplaces))
