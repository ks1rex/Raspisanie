import os
import sys
import glob
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print(
        "DATABASE_URL не задан.\n"
        "Перейди на supabase.com → твой проект → Settings → Database →\n"
        "Connection string → URI → скопируй и вставь в .env как DATABASE_URL"
    )
    sys.exit(1)

import psycopg2  # noqa: E402  (импорт после проверки URL — чтобы инструкция печаталась без psycopg2)

MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), "migrations")


def main():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True  # ponytail: каждая миграция коммитится сразу; транзакция на файл — если понадобится откат
    cur = conn.cursor()

    cur.execute(
        "CREATE TABLE IF NOT EXISTS migrations "
        "(id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, applied_at TIMESTAMPTZ DEFAULT NOW())"
    )
    cur.execute("SELECT name FROM migrations")
    applied = {row[0] for row in cur.fetchall()}

    for path in sorted(glob.glob(os.path.join(MIGRATIONS_DIR, "*.sql"))):
        name = os.path.basename(path)
        if name in applied:
            print(f"− пропущено (уже применено): {name}")
            continue
        with open(path, encoding="utf-8") as f:
            cur.execute(f.read())
        cur.execute("INSERT INTO migrations (name) VALUES (%s)", (name,))
        print(f"✓ применено: {name}")

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
