FROM python:3.12-slim

WORKDIR /app

# Контекст сборки — папка bot/
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Сначала миграции, затем бот
CMD python migrate.py && python main.py
