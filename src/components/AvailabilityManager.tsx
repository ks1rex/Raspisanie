import React from 'react';
import { Employee, Availability } from '../types';
import { format, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Check, X } from 'lucide-react';

interface Props {
  employees: Employee[];
  availabilities: Availability[];
  setAvailabilities: (a: Availability[]) => void;
}

export const AvailabilityManager: React.FC<Props> = ({ employees, availabilities, setAvailabilities }) => {
  const next14Days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  const toggleAvailability = (employeeId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const index = availabilities.findIndex(a => a.employeeId === employeeId && a.date === dateStr);

    if (index > -1) {
      setAvailabilities(availabilities.filter((_, i) => i !== index));
    } else {
      setAvailabilities([...availabilities, { employeeId, date: dateStr }]);
    }
  };

  const isAvailable = (employeeId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availabilities.some(a => a.employeeId === employeeId && a.date === dateStr);
  };

  if (employees.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
        <p className="text-gray-500 font-medium">Сначала добавьте сотрудников</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Доступность сотрудников</h2>
        <p className="text-gray-500">Отметьте дни, когда сотрудники готовы выйти на работу</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 text-sm font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10 w-48">Сотрудник</th>
                {next14Days.map((day) => (
                  <th key={day.toISOString()} className="p-4 text-center min-w-[80px]">
                    <div className="text-xs uppercase text-gray-400 font-bold">{format(day, 'EEE', { locale: ru })}</div>
                    <div className="text-lg font-bold text-gray-700">{format(day, 'd')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-700 sticky left-0 bg-white border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    {emp.name}
                  </td>
                  {next14Days.map((day) => {
                    const active = isAvailable(emp.id, day);
                    return (
                      <td key={day.toISOString()} className="p-2 text-center">
                        <button
                          onClick={() => toggleAvailability(emp.id, day)}
                          className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-all ${
                            active 
                              ? 'bg-green-100 text-green-600 border-2 border-green-500' 
                              : 'bg-red-50 text-red-300 border border-red-100 hover:border-red-300'
                          }`}
                        >
                          {active ? <Check className="w-5 h-5" /> : <X className="w-4 h-4" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-500"></div>
          <span className="text-gray-600">Доступен</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-50 border border-red-100"></div>
          <span className="text-gray-600">Недоступен</span>
        </div>
      </div>
    </div>
  );
};
