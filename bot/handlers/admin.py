"""Команды управления данными — только для ADMIN_IDS."""
import functools

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

from config import ADMIN_IDS
from services.db import db


def is_admin(update: Update) -> bool:
    return update.effective_user is not None and update.effective_user.id in ADMIN_IDS


def admin_only(fn):
    @functools.wraps(fn)
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE):
        if not is_admin(update):
            return await update.message.reply_text("⛔ Только для администраторов.")
        return await fn(update, context)
    return wrapper


def _pipe(context: ContextTypes.DEFAULT_TYPE) -> list[str]:
    return [p.strip() for p in " ".join(context.args).split("|")]


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Бот расписания.\n"
        "/add_employee Имя приоритет\n/add_workplace Название\n"
        "/add_role Место | Роль | Кол-во\n/set_skill Имя | Место | Роль | Приоритет\n"
        "/employees /workplaces /schedule"
    )


async def whoami(update: Update, context: ContextTypes.DEFAULT_TYPE):
    role = "админ" if is_admin(update) else "пользователь"
    await update.message.reply_text(f"Ваш id: {update.effective_user.id} ({role})")


@admin_only
async def add_employee(update: Update, context: ContextTypes.DEFAULT_TYPE):
    args = context.args
    if len(args) < 2 or not args[-1].isdigit() or int(args[-1]) not in (1, 2, 3):
        return await update.message.reply_text("Использование: /add_employee Имя приоритет (1, 2 или 3)")
    priority = int(args[-1])
    name = " ".join(args[:-1])
    emp = await db.add_employee(name, priority)
    if emp is None:  # уже есть (name UNIQUE) — обновляем приоритет
        if not await db.update_employee_priority(name, priority):
            return await update.message.reply_text("❌ Не удалось добавить сотрудника")
    await update.message.reply_text(f"✅ Сотрудник {name} добавлен (приоритет {priority})")


@admin_only
async def add_workplace(update: Update, context: ContextTypes.DEFAULT_TYPE):
    name = " ".join(context.args).strip().strip('"').strip()
    if not name:
        return await update.message.reply_text("Использование: /add_workplace Название")
    if await db.add_workplace(name) is None:
        return await update.message.reply_text("❌ Не удалось добавить место")
    await update.message.reply_text("✅ Место работы добавлено")


@admin_only
async def add_role(update: Update, context: ContextTypes.DEFAULT_TYPE):
    parts = _pipe(context)
    if len(parts) != 3 or not parts[2].isdigit():
        return await update.message.reply_text("Использование: /add_role Место | Роль | Количество")
    place, role, count = parts[0], parts[1], int(parts[2])
    wp = next((w for w in await db.get_workplaces() if w["name"] == place), None)
    if wp is None:
        return await update.message.reply_text(f"❌ Место «{place}» не найдено")
    if await db.add_role(wp["id"], role, count) is None:
        return await update.message.reply_text("❌ Не удалось добавить роль")
    await update.message.reply_text("✅ Роль добавлена")


@admin_only
async def set_skill(update: Update, context: ContextTypes.DEFAULT_TYPE):
    parts = _pipe(context)
    if len(parts) != 4 or not parts[3].isdigit() or int(parts[3]) not in (1, 2, 3):
        return await update.message.reply_text("Использование: /set_skill Имя | Место | Роль | Приоритет (1, 2 или 3)")
    name, place, role, priority = parts[0], parts[1], parts[2], int(parts[3])
    if not await db.set_skill(name, place, role, priority):
        return await update.message.reply_text("❌ Сотрудник, место или роль не найдены")
    await update.message.reply_text(f"✅ Навык установлен: {name} → {role} (П{priority})")


def register(app: Application):
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("whoami", whoami))
    app.add_handler(CommandHandler("add_employee", add_employee))
    app.add_handler(CommandHandler("add_workplace", add_workplace))
    app.add_handler(CommandHandler("add_role", add_role))
    app.add_handler(CommandHandler("set_skill", set_skill))
