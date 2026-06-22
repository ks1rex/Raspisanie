"""Рассылка готового расписания админам — дергается из HTTP POST /notify."""
import logging

from telegram import Bot

from config import ADMIN_IDS, BOT_TOKEN

logger = logging.getLogger(__name__)


async def notify_schedule(schedule_text: str):
    async with Bot(token=BOT_TOKEN) as bot:
        for admin_id in ADMIN_IDS:
            try:
                await bot.send_message(chat_id=admin_id, text=schedule_text)
            except Exception:
                logger.error(f"Не удалось отправить расписание админу {admin_id}", exc_info=True)
