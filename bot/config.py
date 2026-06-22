import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

BOT_TOKEN = os.environ["BOT_TOKEN"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
# ADMIN_IDS="111,222" -> {111, 222}
ADMIN_IDS = {int(x) for x in os.getenv("ADMIN_IDS", "").replace(" ", "").split(",") if x}
# Секрет для POST /notify. Пусто -> эндпоинт отключён (всегда 401), а не падение при старте.
NOTIFY_SECRET = os.getenv("NOTIFY_SECRET", "")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
