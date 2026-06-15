import logging
import sys

from telegram.ext import Application

from config import BOT_TOKEN
from handlers import admin, schedule, info

logging.basicConfig(
    level=logging.INFO,
    stream=sys.stdout,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
log = logging.getLogger("bot")


def main():
    app = Application.builder().token(BOT_TOKEN).build()
    admin.register(app)
    schedule.register(app)
    info.register(app)
    log.info("Bot started, polling…")
    app.run_polling()


if __name__ == "__main__":
    main()
