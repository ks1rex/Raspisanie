FROM python:3.12-slim

WORKDIR /app

# Контекст сборки — корень репо (Render, dockerfilePath: ./bot/Dockerfile)
COPY bot/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY bot/ .

# Сначала миграции, затем бот
CMD python migrate.py && python main.py
