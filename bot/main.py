import asyncio
import json
import logging
import os
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

from telegram.ext import Application

from config import BOT_TOKEN, NOTIFY_SECRET
from handlers import admin, schedule, info
from handlers.notify import notify_schedule


class _Health(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"OK")

    def do_POST(self):
        if self.path != "/notify":
            self.send_response(404)
            self.end_headers()
            return

        if not NOTIFY_SECRET or self.headers.get("Authorization") != f"Bearer {NOTIFY_SECRET}":
            self.send_response(401)
            self.end_headers()
            return

        length = int(self.headers.get("Content-Length", 0))
        try:
            payload = json.loads(self.rfile.read(length) or b"{}")
            text = payload["text"]
        except (json.JSONDecodeError, KeyError):
            self.send_response(400)
            self.end_headers()
            return

        try:
            asyncio.run(notify_schedule(text))
        except Exception:
            log.error("notify_schedule упал", exc_info=True)
            self.send_response(500)
            self.end_headers()
            return

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
