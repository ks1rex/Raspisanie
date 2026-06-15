CREATE TABLE IF NOT EXISTS workplaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workplace_id UUID REFERENCES workplaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  UNIQUE(workplace_id, name)
);

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  priority INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 1,
  UNIQUE(employee_id, role_id)
);

CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);
