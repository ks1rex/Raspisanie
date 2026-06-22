import asyncio
import logging
import os
import sys
import threading

from flask import Flask, request, jsonify
from flask_cors import CORS
from telegram.ext import Application

from config import BOT_TOKEN, NOTIFY_SECRET
from handlers import admin, schedule, info
from handlers.notify import notify_schedule

logging.basicConfig(
    level=logging.INFO,
    stream=sys.stdout,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
log = logging.getLogger("bot")
logging.getLogger("werkzeug").setLevel(logging.WARNING)  # не спамим stdout каждым health-пингом

flask_app = Flask(__name__)
CORS(flask_app)  # разрешает все origins


@flask_app.route('/health', methods=['GET'])
def health():
    return 'OK', 200


@flask_app.route('/notify', methods=['POST'])
def notify():
    auth = request.headers.get('Authorization', '')
    if not NOTIFY_SECRET or auth != f'Bearer {NOTIFY_SECRET}':
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json(silent=True)
    if not data or 'text' not in data:
        return jsonify({'error': 'No text'}), 400

    text = data['text']
    try:
        asyncio.run(notify_schedule(text))
    except Exception:
        log.error("notify_schedule упал", exc_info=True)
        return jsonify({'error': 'Internal error'}), 500

    return jsonify({'ok': True}), 200


def run_flask():
    port = int(os.environ.get('PORT', 8080))
    flask_app.run(host='0.0.0.0', port=port)


def main():
    app = Application.builder().token(BOT_TOKEN).build()
    admin.register(app)
    schedule.register(app)
    info.register(app)
    threading.Thread(target=run_flask, daemon=True).start()
    log.info("Bot started, polling…")
    app.run_polling()


if __name__ == "__main__":
    main()
