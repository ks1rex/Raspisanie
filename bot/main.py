import logging
import os
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

from telegram.ext import Application

from config import BOT_TOKEN
from handlers import admin, schedule, info


class _Health(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"OK")

    def log_message(self, *args):  # не спамим stdout каждым health-пингом
        pass


def _serve_health():
    port = int(os.getenv("PORT", "8080"))
    HTTPServer(("", port), _Health).serve_forever()

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
    threading.Thread(target=_serve_health, daemon=True).start()
    log.info("Bot started, polling…")
    app.run_polling()


if __name__ == "__main__":
    main()
