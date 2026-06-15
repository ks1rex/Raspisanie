export interface Role {
  id: string;
  name: string;
  count: number;
}

export interface Workplace {
  id: string;
  name: string;
  roles: Role[];
}

export interface Skill {
  workplaceId: string;
  roleId: string;
  priority: number; // 1 (High), 2 (Medium), 3 (Low)
}

export interface Employee {
  id: string;
  name: string;
  skills: Skill[];
  priority: number; // 1 (Max shifts), 2 (Medium), 3 (Min shifts)
}

export interface Availability {
  employeeId: string;
  date: string; // ISO string (YYYY-MM-DD)
  timeNote?: string; // напр. "с 15:00", "до 18:00"
}

export interface Shift {
  workplaceId: string;
  roleId: string;
  employeeId: string;
  priority?: number;
  timeNote?: string; // копируется из Availability при генерации
}

export interface DailySchedule {
  date: string;
  assignments: Shift[];
}
