import { Workplace, Employee, Availability, DailySchedule, Shift, Role } from '../types';
import { differenceInDays, parseISO, format, addDays } from 'date-fns';

export function generateSchedule(
  workplaces: Workplace[],
  employees: Employee[],
  availabilities: Availability[],
  startDate: string,
  endDate: string
): DailySchedule[] {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const daysCount = differenceInDays(end, start) + 1;
  const schedule: DailySchedule[] = [];

  const employeeShiftsCount: Record<string, number> = {};
  employees.forEach((e) => (employeeShiftsCount[e.id] = 0));

  const priorityLevels = [
    { skill: 1, emp: 1 },
    { skill: 1, emp: 2 },
    { skill: 1, emp: 3 },
    { skill: 2, emp: 1 },
    { skill: 2, emp: 2 },
    { skill: 2, emp: 3 },
    { skill: 3, emp: 1 },
    { skill: 3, emp: 2 },
    { skill: 3, emp: 3 },
  ];

  for (let i = 0; i < daysCount; i++) {
    const currentDate = format(addDays(start, i), 'yyyy-MM-dd');
    const dayAssignments: Shift[] = [];
    const availableTodayIds = availabilities
      .filter((a) => a.date === currentDate)
      .map((a) => a.employeeId);
    const assignedToday = new Set<string>();

    priorityLevels.forEach((level) => {
      workplaces.forEach((wp: Workplace) => {
        wp.roles.forEach((role: Role) => {
          const currentlyAssignedCount = dayAssignments.filter(
            (a) => a.workplaceId === wp.id && a.roleId === role.id
          ).length;

          for (let c = currentlyAssignedCount; c < role.count; c++) {
            const candidates = employees
              .filter((emp) => {
                if (assignedToday.has(emp.id)) return false;
                if (!availableTodayIds.includes(emp.id)) return false;
                
                const empPriority = emp.priority || 1;
                if (empPriority !== level.emp) return false;

                const skill = emp.skills.find(
                  (s) => s.workplaceId === wp.id && s.roleId === role.id
                );
                return skill?.priority === level.skill;
              })
              .sort(
                (a, b) => employeeShiftsCount[a.id] - employeeShiftsCount[b.id]
              );

            if (candidates.length > 0) {
              const selected = candidates[0];
              dayAssignments.push({
                workplaceId: wp.id,
                roleId: role.id,
                employeeId: selected.id,
                priority: level.skill,
              });
              assignedToday.add(selected.id);
              employeeShiftsCount[selected.id]++;
            } else {
              break;
            }
          }
        });
      });
    });

    schedule.push({
      date: currentDate,
      assignments: dayAssignments,
    });
  }

  return schedule;
}
