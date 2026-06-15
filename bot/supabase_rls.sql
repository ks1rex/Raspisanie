-- Доступ к БД для публичного anon-ключа (фронтенд пишет/читает напрямую).
-- Личный инструмент: политики «разрешить всё». Применять опционально —
-- если RLS выключен, anon и так имеет полный доступ (дефолтные гранты Supabase).

-- На всякий случай явные гранты (UUID PK, секвенций у этих таблиц нет)
grant all on workplaces, roles, employees, skills to anon, authenticated;

-- Вариант A: RLS включён, но политики разрешают всё для anon/authenticated
alter table workplaces enable row level security;
alter table roles      enable row level security;
alter table employees  enable row level security;
alter table skills     enable row level security;

create policy "open workplaces" on workplaces for all to anon, authenticated using (true) with check (true);
create policy "open roles"      on roles      for all to anon, authenticated using (true) with check (true);
create policy "open employees"  on employees  for all to anon, authenticated using (true) with check (true);
create policy "open skills"     on skills     for all to anon, authenticated using (true) with check (true);

-- Вариант B (попроще): вообще без RLS — раскомментировать и не применять блок выше
-- alter table workplaces disable row level security;
-- alter table roles      disable row level security;
-- alter table employees  disable row level security;
-- alter table skills     disable row level security;
