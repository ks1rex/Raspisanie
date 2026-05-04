export interface Role {
  id: string;
  name: string;
  count: number;
}

export interface Workplace {
  id: string;
  name: string;
  roles: [Role, Role]; // Fixed 2 roles as per requirements
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
}

export interface Shift {
  workplaceId: string;
  roleId: string;
  employeeId: string;
  priority?: number;
}

export interface DailySchedule {
  date: string;
  assignments: Shift[];
}
