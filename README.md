# Raspisanie

Генератор рабочих расписаний: React-приложение (`src/`) + Telegram-бот (`bot/`).

## Telegram Bot

Бот в `bot/` принимает доступность сотрудников и генерирует расписание тем же алгоритмом, что и веб-версия.

### Запуск локально

```bash
cd bot
cp .env.example .env      # заполнить значения (см. ниже)
pip install -r requirements.txt
python main.py
```

### Переменные окружения

| Переменная | Где взять |
|---|---|
| `BOT_TOKEN` | токен от [@BotFather](https://t.me/BotFather) |
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_KEY` | Supabase → Project Settings → API → `service_role` |
| `ADMIN_IDS` | telegram user_id админов через запятую (узнать — команда `/whoami`) |
| `DATABASE_URL` | Supabase → Settings → Database → Connection string → URI (только для `migrate.py`) |

### Миграции БД

```bash
python migrate.py   # применяет bot/migrations/*.sql, пропуская уже применённые
```

### Деплой на Render

`bot/render.yaml` описывает worker-сервис на Docker (`bot/Dockerfile`).

1. Запушить репозиторий на GitHub.
2. Render → **New → Blueprint**, указать репозиторий. Render подхватит `render.yaml`.
3. Задать значения env-переменных (все помечены `sync: false` — вводятся вручную в дашборде).
4. Deploy — бот стартует через `python main.py` и работает в режиме polling.
