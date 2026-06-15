import sys
import asyncio
import functools

from config import supabase


def _safe(default):
    """Любая ошибка метода -> stderr + дефолт (None/False/[]), бот не падает."""
    def deco(fn):
        @functools.wraps(fn)
        async def wrapper(*args, **kwargs):
            try:
                return await fn(*args, **kwargs)
            except Exception as e:
                print(f"[db] {fn.__name__}: {e}", file=sys.stderr)
                return default
        return wrapper
    return deco


async def _exec(query):
    # supabase-py 2.7.4 синхронный — .execute() в треде, чтобы не блокировать event loop
    return await asyncio.to_thread(query.execute)


def _flatten_skills(skill_rows):
    """skills(*, roles(workplace_id)) -> [{role_id, workplace_id, priority}]."""
    return [
        {
            "role_id": s["role_id"],
            "workplace_id": (s.get("roles") or {}).get("workplace_id"),
            "priority": s["priority"],
        }
        for s in skill_rows
    ]


class Database:
    # ---------- Workplaces ----------
    @_safe([])
    async def get_workplaces(self) -> list[dict]:
        res = await _exec(supabase.table("workplaces").select("*, roles(*)"))
        return res.data

    @_safe(None)
    async def add_workplace(self, name: str) -> dict:
        res = await _exec(supabase.table("workplaces").insert({"name": name}))
        return res.data[0] if res.data else None

    @_safe(None)
    async def add_role(self, workplace_id: str, name: str, count: int) -> dict:
        res = await _exec(supabase.table("roles").insert(
            {"workplace_id": workplace_id, "name": name, "count": count}))
        return res.data[0] if res.data else None

    # ---------- Employees ----------
    @_safe([])
    async def get_employees(self) -> list[dict]:
        res = await _exec(supabase.table("employees").select(
            "*, skills(priority, role_id, roles(workplace_id))"))
        for emp in res.data:
            emp["skills"] = _flatten_skills(emp.get("skills", []))
        return res.data

    @_safe(None)
    async def add_employee(self, name: str, priority: int) -> dict:
        res = await _exec(supabase.table("employees").insert(
            {"name": name, "priority": priority}))
        return res.data[0] if res.data else None

    @_safe(False)
    async def update_employee_priority(self, name: str, priority: int) -> bool:
        res = await _exec(supabase.table("employees")
                          .update({"priority": priority}).eq("name", name))
        return bool(res.data)

    # ---------- Skills ----------
    @_safe(False)
    async def set_skill(self, employee_name: str, workplace_name: str, role_name: str, priority: int) -> bool:
        emp = await _exec(supabase.table("employees").select("id").eq("name", employee_name).limit(1))
        wp = await _exec(supabase.table("workplaces").select("id").eq("name", workplace_name).limit(1))
        if not emp.data or not wp.data:
            return False
        # роль однозначна внутри места: UNIQUE(workplace_id, name)
        role = await _exec(supabase.table("roles").select("id")
                           .eq("name", role_name).eq("workplace_id", wp.data[0]["id"]).limit(1))
        if not role.data:
            return False
        await _exec(supabase.table("skills").upsert(
            {"employee_id": emp.data[0]["id"], "role_id": role.data[0]["id"], "priority": priority},
            on_conflict="employee_id,role_id"))
        return True

    # ---------- Для генерации расписания ----------
    @_safe({"workplaces": [], "employees": []})
    async def get_full_data(self) -> dict:
        return {
            "workplaces": await self.get_workplaces(),
            "employees": await self.get_employees(),
        }


db = Database()


if __name__ == "__main__":
    # ponytail: самопроверка единственной нетривиальной логики — сплющивание скиллов
    sample = [{"role_id": "r1", "priority": 2, "roles": {"workplace_id": "w1"}},
              {"role_id": "r2", "priority": 1, "roles": None}]
    assert _flatten_skills(sample) == [
        {"role_id": "r1", "workplace_id": "w1", "priority": 2},
        {"role_id": "r2", "workplace_id": None, "priority": 1},
    ]
    print("ok")
