"""Парсинг доступности из текста сообщения.

Строка: "Имя [дата|день_недели|время]..."
  дата       — ДД.ММ (год берётся из base_date)
  день недели — пн вт ср чт пт сб вс (ближайший такой день от base_date)
  время       — с<цифры> / до<цифры> -> time_note "с 15:00" / "до 18:00",
                применяется ко всем датам строки
"""
import re
from datetime import date, timedelta

_WEEKDAYS = {"пн": 0, "вт": 1, "ср": 2, "чт": 3, "пт": 4, "сб": 5, "вс": 6}
_DATE_RE = re.compile(r"(\d{1,2})\.(\d{1,2})$")
_TIME_RE = re.compile(r"(с|до)(\d{1,2})(?::(\d{2}))?$")


def _parse_date(tok: str, base: date):
    m = _DATE_RE.fullmatch(tok)
    if not m:
        return None
    day, month = int(m.group(1)), int(m.group(2))
    try:
        return date(base.year, month, day).isoformat()
    except ValueError:
        return None


def _parse_weekday(tok: str, base: date):
    wd = _WEEKDAYS.get(tok.lower())
    if wd is None:
        return None
    delta = (wd - base.weekday()) % 7  # ближайший такой день, включая сегодня
    return (base + timedelta(days=delta)).isoformat()


def _parse_time(tok: str):
    m = _TIME_RE.fullmatch(tok.lower())
    if not m:
        return None
    prefix, hour, minute = m.group(1), int(m.group(2)), m.group(3) or "00"
    return f"{prefix} {hour}:{minute}"


def _is_structural(tok: str, base: date) -> bool:
    return (_parse_date(tok, base) or _parse_weekday(tok, base) or _parse_time(tok)) is not None


def parse_availability(text: str, base_date: date = None) -> list[dict]:
    base = base_date or date.today()
    result = []

    for line in text.splitlines():
        tokens = line.split()
        # имя — всё до первого структурного токена
        idx = next((i for i, t in enumerate(tokens) if _is_structural(t, base)), None)
        if idx is None:
            continue  # дат нет
        name = " ".join(tokens[:idx]).strip()
        if not name:
            continue  # имени нет

        dates, time_note = [], None
        for t in tokens[idx:]:
            d = _parse_date(t, base) or _parse_weekday(t, base)
            if d:
                dates.append(d)
                continue
            tn = _parse_time(t)
            if tn:
                time_note = tn  # ко всей строке
            # прочие токены игнорируем

        for d in dates:
            result.append({"employee_name": name, "date": d, "time_note": time_note})

    return result


if __name__ == "__main__":
    base = date(2025, 1, 1)  # среда -> детерминированные дни недели

    out = parse_availability("Иван 01.07 02.07 05.07", base)
    assert out == [
        {"employee_name": "Иван", "date": "2025-07-01", "time_note": None},
        {"employee_name": "Иван", "date": "2025-07-02", "time_note": None},
        {"employee_name": "Иван", "date": "2025-07-05", "time_note": None},
    ], out

    assert parse_availability("Петр 03.07 с15:00", base) == [
        {"employee_name": "Петр", "date": "2025-07-03", "time_note": "с 15:00"},
    ]

    assert parse_availability("Маша 01.07 до18:00 04.07", base) == [
        {"employee_name": "Маша", "date": "2025-07-01", "time_note": "до 18:00"},
        {"employee_name": "Маша", "date": "2025-07-04", "time_note": "до 18:00"},
    ]

    # пн/вт от среды 2025-01-01 -> ближайшие 06 и 07 января
    assert parse_availability("Андрей пн вт", base) == [
        {"employee_name": "Андрей", "date": "2025-01-06", "time_note": None},
        {"employee_name": "Андрей", "date": "2025-01-07", "time_note": None},
    ]

    # многословное имя
    assert parse_availability("Анна Мария 01.07", base) == [
        {"employee_name": "Анна Мария", "date": "2025-07-01", "time_note": None},
    ]

    # регистр времени, формат с9:00 / до18
    assert parse_availability("Олег С9:00 01.07", base)[0]["time_note"] == "с 9:00"
    assert parse_availability("Олег до18 01.07", base)[0]["time_note"] == "до 18:00"

    # пропуски: пустая строка, нет имени, нет дат, мусор
    assert parse_availability("", base) == []
    assert parse_availability("01.07 02.07", base) == []          # нет имени
    assert parse_availability("Андрей", base) == []               # нет дат
    assert parse_availability("Иван 99.99", base) == []           # невалидная дата
    assert parse_availability("Сергей 01.07", base)[0]["employee_name"] == "Сергей"  # имя на "с" != время

    print("ok")
