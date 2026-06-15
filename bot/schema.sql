-- Схема для бота расписания. Запустить в Supabase → SQL Editor.
-- roles/skills хранятся как jsonb (сохраняют ключи как в TS: workplaceId/roleId/count).
-- Бот ходит под service_role, поэтому RLS не настраиваем (ключ его обходит).
-- ponytail: добавить RLS-политики, когда появится доступ под anon-ключом.

create table if not exists workplaces (
  id   text primary key,
  name text not null,
  roles jsonb not null default '[]'  -- [{ "id", "name", "count" }]
);

create table if not exists employees (
  id       text primary key,
  name     text not null,
  priority int  not null default 1,
  skills   jsonb not null default '[]'  -- [{ "workplaceId", "roleId", "priority" }]
);

create table if not exists availabilities (
  id          bigint generated always as identity primary key,
  employee_id text not null references employees(id) on delete cascade,
  date        date not null,
  time_note   text,
  unique (employee_id, date)
);
