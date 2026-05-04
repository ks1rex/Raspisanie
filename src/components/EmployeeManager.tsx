import React, { useState } from 'react';
import { Employee, Workplace, Skill } from '../types';
import { Trash2, Edit3, UserPlus, Download, Upload } from 'lucide-react';

interface Props {
  employees: Employee[];
  setEmployees: (emps: Employee[]) => void;
  workplaces: Workplace[];
  onExport: () => void;
  onImport: (file: File) => void;
}

export const EmployeeManager: React.FC<Props> = ({ employees, setEmployees, workplaces, onExport, onImport }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [priority, setPriority] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);

  const resetForm = () => {
    setName('');
    setPriority(1);
    setSelectedSkills([]);
    setIsAdding(false);
    setEditingId(null);
  };

  const toggleSkill = (workplaceId: string, roleId: string, priority: number = 1) => {
    const existingIndex = selectedSkills.findIndex(s => s.workplaceId === workplaceId && s.roleId === roleId);
    
    if (existingIndex > -1) {
      const existing = selectedSkills[existingIndex];
      if (existing.priority === priority) {
        // Remove if clicking same priority
        setSelectedSkills(selectedSkills.filter((_, i) => i !== existingIndex));
      } else {
        // Update priority if clicking different priority
        const newSkills = [...selectedSkills];
        newSkills[existingIndex] = { ...newSkills[existingIndex], priority };
        setSelectedSkills(newSkills);
      }
    } else {
      setSelectedSkills([...selectedSkills, { workplaceId, roleId, priority }]);
    }
  };

  const handleSave = () => {
    if (editingId) {
      setEmployees(employees.map(emp => 
        emp.id === editingId ? { ...emp, name, skills: selectedSkills, priority } : emp
      ));
    } else {
      setEmployees([...employees, { id: crypto.randomUUID(), name, skills: selectedSkills, priority }]);
    }
    resetForm();
  };

  const handleEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setName(emp.name);
    setPriority(emp.priority || 1);
    setSelectedSkills(emp.skills);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    setEmployees(employees.filter(emp => emp.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Сотрудники</h2>
          <p className="text-gray-500">Управляйте базой сотрудников и их навыками</p>
        </div>
        {!isAdding && (
          <div className="flex gap-2">
            <button
              onClick={onExport}
              title="Скачать JSON"
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <Download className="w-5 h-5" />
            </button>
            <label className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 cursor-pointer">
              <Upload className="w-5 h-5" />
              <input 
                type="file" 
                className="hidden" 
                accept=".json"
                onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} 
              />
            </label>
            <button
              onClick={() => setIsAdding(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" /> Добавить сотрудника
            </button>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Имя сотрудника</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="ФИО или никнейм"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Приоритет сотрудника (активность)</label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value={1}>1 - Максимум смен (Основной)</option>
                <option value={2}>2 - Средне (Подработка)</option>
                <option value={3}>3 - Минимум (Только если некого ставить)</option>
              </select>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Навыки (какие роли может выполнять)</h4>
            <div className="space-y-4">
              {workplaces.map(wp => (
                <div key={wp.id} className="border border-gray-100 rounded-lg p-3">
                  <p className="text-sm font-bold text-gray-600 mb-2">{wp.name}</p>
                  <div className="flex gap-4">
                    {wp.roles.map(role => {
                      const skill = selectedSkills.find(s => s.workplaceId === wp.id && s.roleId === role.id);
                      return (
                        <div key={role.id} className="flex flex-col gap-1">
                          <span className="text-[10px] text-gray-400 font-bold uppercase">{role.name}</span>
                          <div className="flex gap-1">
                            {[1, 2, 3].map(p => (
                              <button
                                key={p}
                                onClick={() => toggleSkill(wp.id, role.id, p)}
                                className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-all border ${
                                  skill?.priority === p
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                    : 'bg-white border-gray-200 text-gray-400 hover:border-indigo-300'
                                }`}
                                title={`Приоритет ${p}`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button onClick={resetForm} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={!name}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {editingId ? 'Обновить' : 'Добавить'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map(emp => (
          <div key={emp.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm group">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-bold text-gray-800">{emp.name}</h3>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(emp)} className="p-1.5 text-gray-400 hover:text-indigo-600">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(emp.id)} className="p-1.5 text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {emp.skills.length > 0 ? (
                emp.skills.map((s, idx) => {
                  const wp = workplaces.find(w => w.id === s.workplaceId);
                  const role = wp?.roles.find(r => r.id === s.roleId);
                  const pColors: Record<number, string> = { 1: 'bg-green-100 text-green-700', 2: 'bg-yellow-100 text-yellow-700', 3: 'bg-red-100 text-red-700' };
                  return (
                    <span key={idx} className={`${pColors[s.priority] || 'bg-gray-100'} text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider flex items-center gap-1`}>
                      <span className="opacity-50">P{s.priority}</span> {wp?.name}: {role?.name}
                    </span>
                  );
                })
              ) : (
                <span className="text-xs text-gray-400 italic">Нет навыков</span>
              )}
            </div>
          </div>
        ))}
        {employees.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center bg-white border border-dashed border-gray-300 rounded-xl">
            <p className="text-gray-400">Список сотрудников пуст</p>
          </div>
        )}
      </div>
    </div>
  );
};
