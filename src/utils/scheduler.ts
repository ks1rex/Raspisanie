import { Workplace, Employee, Availability, DailySchedule, Shift } from '../types';
import { differenceInDays, parseISO, format, addDays } from 'date-fns';

// Меньше = лучше. Три категории, см. правила выбора кандидата.
export function getCandidateScore(empPriority: number, skillPriority: number): number {
  const emp12 = empPriority === 1 || empPriority === 2;
  // Категория 1: emp 1/2, skill 1/2 — emp важнее skill
  if (emp12 && (skillPriority === 1 || skillPriority === 2)) {
    return (empPriority - 1) * 2 + (skillPriority - 1); // 0..3
  }
  // Категория 2: emp 1/2, skill 3 — по emp
  if (emp12) {
    return 10 + (empPriority - 1); // 10..11
  }
  // Категория 3: emp 3, любой skill — по skill
  return 20 + (skillPriority - 1); // 20..22
}

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

    // 2. Greedy approach with "First-Fail" heuristics
    while (openSlots.length > 0) {
      // For each open slot, find potential candidates
      const slotCandidates = openSlots.map(slot => {
        const candidates = employees
          .filter(emp => {
            if (assignedToday.has(emp.id)) return false;
            if (!availableTodayIds.includes(emp.id)) return false;
            return emp.skills.some(s => s.workplaceId === slot.workplaceId && s.roleId === slot.roleId);
          })
          .map(emp => {
            const skill = emp.skills.find(s => s.workplaceId === slot.workplaceId && s.roleId === slot.roleId)!;
            const empPriority = emp.priority || 1;
            return {
              emp,
              skillPriority: skill.priority,
              empPriority,
              score: getCandidateScore(empPriority, skill.priority)
            };
          });
        return { slot, candidates };
      });

      const fillableSlots = slotCandidates.filter(sc => sc.candidates.length > 0);
      if (fillableSlots.length === 0) break;

      // Pick the MOST CONSTRAINED SLOT (the one with fewest candidates)
      fillableSlots.sort((a, b) => a.candidates.length - b.candidates.length);
      const target = fillableSlots[0];
      
      // Pick the BEST CANDIDATE for this slot: by score, then fewer shifts
      target.candidates.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        return employeeShiftsCount[a.emp.id] - employeeShiftsCount[b.emp.id];
      });

      const selected = target.candidates[0];
      const note = availabilities.find(
        a => a.employeeId === selected.emp.id && a.date === currentDate
      )?.timeNote;

      // Assign
      dayAssignments.push({
        workplaceId: target.slot.workplaceId,
        roleId: target.slot.roleId,
        employeeId: selected.emp.id,
        priority: selected.skillPriority,
        ...(note ? { timeNote: note } : {})
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
