import { DailySchedule, Workplace, Employee } from '../types';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

export function buildScheduleText(
  schedule: DailySchedule[],
  workplaces: Workplace[],
  employees: Employee[]
): string {
  return workplaces.map((wp) => {
    const lines = schedule.map((day) => {
      const dayName = format(parseISO(day.date), 'EEEEEE', { locale: ru });
      const cap = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      const names = day.assignments
        .filter(a => a.workplaceId === wp.id)
        .map(a => {
          const name = employees.find(e => e.id === a.employeeId)?.name;
          return name ? (a.timeNote ? `${name} (${a.timeNote})` : name) : null;
        })
        .filter(Boolean)
        .join(', ');
      return names ? `${cap}: ${names}\n` : '';
    }).join('');
    return `${wp.name}\n${lines}`;
  }).join('\n');
}
