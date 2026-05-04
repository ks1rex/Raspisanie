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

  for (let i = 0; i < daysCount; i++) {
    const currentDate = format(addDays(start, i), 'yyyy-MM-dd');
    const dayAssignments: Shift[] = [];
    const availableTodayIds = availabilities
      .filter((a) => a.date === currentDate)
      .map((a) => a.employeeId);
    const assignedToday = new Set<string>();

    // 1. Prepare all slots for the day
    interface Slot {
      workplaceId: string;
      roleId: string;
      slotIndex: number;
    }
    
    let openSlots: Slot[] = [];
    workplaces.forEach(wp => {
      wp.roles.forEach(role => {
        for (let c = 0; c < role.count; c++) {
          openSlots.push({ workplaceId: wp.id, roleId: role.id, slotIndex: c });
        }
      });
    });

    // 2. Greedy approach with "Least Constrained Slot First"
    // This ensures that slots that are hard to fill get priority.
    while (openSlots.length > 0) {
      // For each slot, find potential candidates
      const slotCandidates = openSlots.map(slot => {
        const candidates = employees
          .filter(emp => {
            if (assignedToday.has(emp.id)) return false;
            if (!availableTodayIds.includes(emp.id)) return false;
            return emp.skills.some(s => s.workplaceId === slot.workplaceId && s.roleId === slot.roleId);
          })
          .map(emp => {
            const skill = emp.skills.find(s => s.workplaceId === slot.workplaceId && s.roleId === slot.roleId)!;
            return { emp, skillPriority: skill.priority, empPriority: emp.priority || 1 };
          });
        return { slot, candidates };
      });

      // Filter out slots that cannot be filled at all
      const fillableSlots = slotCandidates.filter(sc => sc.candidates.length > 0);
      
      if (fillableSlots.length === 0) break;

      // Sort slots by number of candidates (fewest first)
      // This is the key to Maximum Coverage.
      fillableSlots.sort((a, b) => a.candidates.length - b.candidates.length);

      // Take the most constrained slot
      const target = fillableSlots[0];
      
      // Sort candidates for this slot based on priorities and balancing
      target.candidates.sort((a, b) => {
        // 1. Skill Priority (P1 > P2 > P3)
        if (a.skillPriority !== b.skillPriority) return a.skillPriority - b.skillPriority;
        // 2. Employee Priority (A1 > A2 > A3)
        if (a.empPriority !== b.empPriority) return a.empPriority - b.empPriority;
        // 3. Balance (fewer shifts first)
        return employeeShiftsCount[a.emp.id] - employeeShiftsCount[b.emp.id];
      });

      const selected = target.candidates[0];
      
      // Assign
      dayAssignments.push({
        workplaceId: target.slot.workplaceId,
        roleId: target.slot.roleId,
        employeeId: selected.emp.id,
        priority: selected.skillPriority
      });

      assignedToday.add(selected.emp.id);
      employeeShiftsCount[selected.emp.id]++;
      
      // Remove this slot from openSlots
      openSlots = openSlots.filter(s => s !== target.slot);
    }

    schedule.push({
      date: currentDate,
      assignments: dayAssignments,
    });
  }

  return schedule;
}
