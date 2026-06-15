import React, { useState } from 'react';
import { Employee, Availability } from '../types';
import { format, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Check, X, Clock } from 'lucide-react';

interface Props {
  employees: Employee[];
  availabilities: Availability[];
  setAvailabilities: (a: Availability[]) => void;
}

export const AvailabilityManager: React.FC<Props> = ({ employees, availabilities, setAvailabilities }) => {
  const next14Days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  // Ключ ячейки, у которой открыт input времени
  const [editing, setEditing] = useState<string | null>(null);
  const cellKey = (employeeId: string, dateStr: string) => `${employeeId}|${dateStr}`;

  const toggleAvailability = (employeeId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const index = availabilities.findIndex(a => a.employeeId === employeeId && a.date === dateStr);

    if (index > -1) {
      setAvailabilities(availabilities.filter((_, i) => i !== index));
    } else {
      setAvailabilities([...availabilities, { employeeId, date: dateStr }]);
    }
  };

  const updateTimeNote = (employeeId: string, date: string, timeNote: string) => {
    const note = timeNote.trim();
    setAvailabilities(availabilities.map(a =>
      a.employeeId === employeeId && a.date === date
        ? { ...a, timeNote: note || undefined }
        : a
    ));
  };

  const getAvailability = (employeeId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availabilities.find(a => a.employeeId === employeeId && a.date === dateStr);
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
                    const avail = getAvailability(emp.id, day);
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const key = cellKey(emp.id, dateStr);
                    const isEditing = editing === key;

                    if (!avail) {
                      return (
                        <td key={day.toISOString()} className="p-2 text-center">
                          <button
                            onClick={() => toggleAvailability(emp.id, day)}
                            className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-all bg-red-50 text-red-300 border border-red-100 hover:border-red-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      );
                    }

                    return (
                      <td key={day.toISOString()} className="p-2 text-center">
                        <div className="relative w-16 mx-auto">
                          <div
                            onClick={() => toggleAvailability(emp.id, day)}
                            className="min-h-10 py-1 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all bg-green-100 text-green-600 border-2 border-green-500"
                          >
                            <Check className="w-5 h-5" />
                            {avail.timeNote && (
                              <span className="text-[10px] leading-tight font-medium mt-0.5">{avail.timeNote}</span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditing(isEditing ? null : key);
                            }}
                            title="Указать время"
                            className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-white border border-green-400 text-green-600 hover:bg-green-50"
                          >
                            <Clock className="w-3 h-3" />
                          </button>
                          {isEditing && (
                            <input
                              autoFocus
                              defaultValue={avail.timeNote || ''}
                              placeholder="с 09:00"
                              onClick={(e) => e.stopPropagation()}
                              onBlur={(e) => {
                                updateTimeNote(emp.id, dateStr, e.target.value);
                                setEditing(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                              }}
                              className="absolute top-full mt-1 left-1/2 -translate-x-1/2 w-20 z-20 border border-gray-300 rounded px-1.5 py-1 text-xs text-gray-700"
                            />
                          )}
                        </div>
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
