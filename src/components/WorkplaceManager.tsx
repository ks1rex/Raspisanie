import React, { useState } from 'react';
import { Workplace, Role } from '../types';
import { Plus, Trash2, Edit3, Download, Upload } from 'lucide-react';

interface Props {
  workplaces: Workplace[];
  setWorkplaces: (wps: Workplace[]) => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export const WorkplaceManager: React.FC<Props> = ({ workplaces, setWorkplaces, onExport, onImport }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [roles, setRoles] = useState<Role[]>([{ id: crypto.randomUUID(), name: 'Роль 1', count: 1 }]);

  const resetForm = () => {
    setName('');
    setRoles([{ id: crypto.randomUUID(), name: 'Роль 1', count: 1 }]);
    setIsAdding(false);
    setEditingId(null);
  };

  const addRole = () =>
    setRoles([...roles, { id: crypto.randomUUID(), name: '', count: 1 }]);
  const updateRole = (id: string, patch: Partial<Role>) =>
    setRoles(roles.map(r => (r.id === id ? { ...r, ...patch } : r)));
  const removeRole = (id: string) => setRoles(roles.filter(r => r.id !== id));

  const canSave = !!name && roles.every(r => r.name.trim() !== '');

  const handleSave = () => {
    if (editingId) {
      setWorkplaces(workplaces.map(wp =>
        wp.id === editingId ? { ...wp, name, roles } : wp
      ));
    } else {
      setWorkplaces([...workplaces, { id: crypto.randomUUID(), name, roles }]);
    }
    resetForm();
  };

  const handleEdit = (wp: Workplace) => {
    setEditingId(wp.id);
    setName(wp.name);
    setRoles(wp.roles.map(r => ({ ...r }))); // сохраняем существующие id
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    setWorkplaces(workplaces.filter(wp => wp.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Места работы</h2>
          <p className="text-gray-500">Настройте локации и роли для каждой смены</p>
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
              <Plus className="w-4 h-4" /> Добавить место
            </button>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название места</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Напр. Склад А"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((role, i) => (
              <div key={role.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-semibold text-gray-700">Роль {i + 1}</h4>
                  {roles.length > 1 && (
                    <button
                      onClick={() => removeRole(role.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Название</label>
                  <input
                    type="text"
                    value={role.name}
                    onChange={(e) => updateRole(role.id, { name: e.target.value })}
                    className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Количество человек</label>
                  <input
                    type="number"
                    min="1"
                    value={role.count}
                    onChange={(e) => updateRole(role.id, { count: parseInt(e.target.value) || 1 })}
                    className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addRole}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <Plus className="w-4 h-4" /> Добавить роль
          </button>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              {editingId ? 'Сохранить изменения' : 'Создать'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workplaces.map((wp) => (
          <div key={wp.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-800">{wp.name}</h3>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(wp)}
                  className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(wp.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {wp.roles.map((role) => (
                <div key={role.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-sm font-medium text-gray-600">{role.name}</span>
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    {role.count} чел.
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {workplaces.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center bg-white border border-dashed border-gray-300 rounded-xl">
            <p className="text-gray-400">Нет добавленных мест работы</p>
          </div>
        )}
      </div>
    </div>
  );
};
