"""Порт алгоритма расписания из src/utils/scheduler.ts под нормализованные данные.

data — db.get_full_data(): {"workplaces": [...roles...], "employees": [...skills...]}
availabilities — parse_availability(): [{"employee_name", "date", "time_note"}]
Матчинг сотрудника со слотом — по skill.role_id == role.id.
"""


def get_score(emp_priority: int, skill_priority: int) -> int:
    # Категория 1: empP 1-2, skillP 1-2 -> лучшие (0-11)
    if emp_priority <= 2 and skill_priority <= 2:
        return (emp_priority - 1) * 10 + (skill_priority - 1)
    # Категория 2: empP 1-2, skillP 3 -> средние (100-110)
    elif emp_priority <= 2:
        return 100 + (emp_priority - 1) * 10
    # Категория 3: empP 3 -> последние (200-220)
    else:
        return 200 + (skill_priority - 1) * 10


def generate_schedule(data: dict, availabilities: list[dict]) -> list[dict]:
    workplaces = data.get("workplaces", [])
    employees = data.get("employees", [])
    emp_by_name = {e["name"]: e for e in employees}

    dates = sorted({a["date"] for a in availabilities})
    # (name, date) -> time_note
    note_by = {(a["employee_name"], a["date"]): a.get("time_note") for a in availabilities}
    names_by_date = {}
    for a in availabilities:
        names_by_date.setdefault(a["date"], set()).add(a["employee_name"])

    shifts_count = {e["name"]: 0 for e in employees}
    schedule = []

    for day in dates:
        available = names_by_date.get(day, set()) & emp_by_name.keys()
        assigned = set()
        day_assignments = []

        open_slots = [
            {"wp": wp, "role": role}
            for wp in workplaces
            for role in wp.get("roles", [])
            for _ in range(role.get("count", 1))
        ]

        while open_slots:
            slot_candidates = []
            for slot in open_slots:
                role_id = slot["role"]["id"]
                cands = []
                for name in available:
                    if name in assigned:
                        continue
                    emp = emp_by_name[name]
                    skill = next((s for s in emp.get("skills", []) if s["role_id"] == role_id), None)
                    if not skill:
                        continue
                    emp_priority = emp.get("priority") or 1
                    cands.append({
                        "name": name,
                        "score": get_score(emp_priority, skill["priority"]),
                    })
                if cands:
                    slot_candidates.append({"slot": slot, "candidates": cands})

            if not slot_candidates:
                break

            # most-constrained slot first
            target = min(slot_candidates, key=lambda sc: len(sc["candidates"]))
            # лучший: меньший score, при равенстве — меньше смен за период
            best = min(target["candidates"], key=lambda c: (c["score"], shifts_count[c["name"]]))

            slot = target["slot"]
            day_assignments.append({
                "workplace_name": slot["wp"]["name"],
                "role_name": slot["role"]["name"],
                "employee_name": best["name"],
                "time_note": note_by.get((best["name"], day)),
                "score": best["score"],
            })

            assigned.add(best["name"])
            shifts_count[best["name"]] += 1
            open_slots.remove(slot)

        schedule.append({"date": day, "assignments": day_assignments})

    return schedule


if __name__ == "__main__":
    # категории строго упорядочены
    assert get_score(1, 1) < get_score(2, 2) < get_score(1, 3) < get_score(3, 1) < get_score(3, 3)

    data = {
        "workplaces": [{"id": "w1", "name": "Склад А", "roles": [
            {"id": "r1", "name": "Грузчик", "count": 1, "workplace_id": "w1"},
            {"id": "r2", "name": "Кладовщик", "count": 1, "workplace_id": "w1"},
        ]}],
        "employees": [
            {"id": "e1", "name": "Иван", "priority": 1, "skills": [
                {"role_id": "r1", "workplace_id": "w1", "priority": 1},
                {"role_id": "r2", "workplace_id": "w1", "priority": 1}]},
            {"id": "e2", "name": "Петр", "priority": 3, "skills": [
                {"role_id": "r1", "workplace_id": "w1", "priority": 1}]},
        ],
    }
    avail = [
        {"employee_name": "Иван", "date": "2025-07-01", "time_note": "с 15:00"},
        {"employee_name": "Петр", "date": "2025-07-01", "time_note": None},
    ]
    out = generate_schedule(data, avail)
    assert len(out) == 1 and out[0]["date"] == "2025-07-01"
    a = out[0]["assignments"]
    assert len(a) == 2  # оба слота закрыты

    # most-constrained: r2 (только Иван) -> Иван; r1 -> Петр. Один сотрудник = один слот.
    by_role = {x["role_name"]: x for x in a}
    assert by_role["Кладовщик"]["employee_name"] == "Иван"
    assert by_role["Кладовщик"]["time_note"] == "с 15:00"  # note скопирован
    assert by_role["Кладовщик"]["score"] == 0
    assert by_role["Грузчик"]["employee_name"] == "Петр"
    assert {x["employee_name"] for x in a} == {"Иван", "Петр"}  # без дублей

    print("ok")
