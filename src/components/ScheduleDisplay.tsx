import React from 'react';
import { DailySchedule, Workplace, Employee } from '../types';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Briefcase, User, FileText, Copy } from 'lucide-react';
import { buildScheduleText } from '../utils/scheduleText';

interface Props {
  schedule: DailySchedule[];
  workplaces: Workplace[];
  employees: Employee[];
}

export const ScheduleDisplay: React.FC<Props> = ({ schedule, workplaces, employees }) => {
  const buildText = () => buildScheduleText(schedule, workplaces, employees);

  const exportToText = () => {
    const blob = new Blob([buildText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule_${format(new Date(), 'yyyy-MM-dd')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(buildText()).then(() => {
      alert('Текст скопирован в буфер обмена');
    });
  };

  if (schedule.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
        <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full">
          <Briefcase className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">График еще не создан</h3>
        <p className="text-gray-500 max-w-xs mx-auto">Нажмите кнопку "Создать график" в боковом меню, чтобы сгенерировать расписание на основе доступности</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Сгенерированный график</h2>
          <p className="text-gray-500">Оптимизированное расписание на 14 дней</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Copy className="w-4 h-4" />
            Копировать текст
          </button>
          <button 
            onClick={exportToText}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" />
            Скачать .txt
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {schedule.map((day) => (
          <div key={day.date} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">
                {format(parseISO(day.date), 'd MMMM yyyy (EEEE)', { locale: ru })}
              </h3>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                {day.assignments.length} смен(ы)
              </span>
            </div>
            
            <div className="divide-y divide-gray-100">
              {workplaces.map((wp) => {
                const wpAssignments = day.assignments.filter(a => a.workplaceId === wp.id);
                if (wpAssignments.length === 0) return null;

                return (
                  <div key={wp.id} className="p-6">
                    <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4">{wp.name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {wp.roles.map((role) => {
                        const roleAssignments = wpAssignments.filter(a => a.roleId === role.id);
                        return (
                          <div key={role.id} className="space-y-2">
                            <p className="text-xs font-medium text-gray-500">{role.name}</p>
                            <div className="space-y-2">
                              {roleAssignments.map((assignment, idx) => {
                                const employee = employees.find(e => e.id === assignment.employeeId);
                                return (
                                  <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100 transition-colors hover:border-indigo-200">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-white rounded-full border border-gray-200 flex items-center justify-center text-indigo-500">
                                        <User className="w-4 h-4" />
                                      </div>
                                      <span className="font-semibold text-gray-700">
                                        {employee?.name || 'Не назначен'}
                                        {employee && assignment.timeNote && ` (${assignment.timeNote})`}
                                      </span>
                                    </div>
                                    {assignment.priority && (
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                        assignment.priority === 1 ? 'bg-green-100 text-green-600' :
                                        assignment.priority === 2 ? 'bg-yellow-100 text-yellow-600' :
                                        'bg-red-100 text-red-600'
                                      }`}>
                                        P{assignment.priority}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                              {roleAssignments.length < role.count && (
                                <div className="p-3 border border-dashed border-red-200 bg-red-50 rounded-lg text-red-500 text-sm italic">
                                  Недостаточно сотрудников ({roleAssignments.length}/{role.count})
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
