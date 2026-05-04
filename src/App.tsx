import React, { useState, useEffect } from 'react';
import { Workplace, Employee, Availability, DailySchedule } from './types';
import { WorkplaceManager } from './components/WorkplaceManager';
import { EmployeeManager } from './components/EmployeeManager';
import { AvailabilityManager } from './components/AvailabilityManager';
import { ScheduleDisplay } from './components/ScheduleDisplay';
import { LayoutDashboard, Users, CalendarDays, Settings2, Sparkles, Menu, X } from 'lucide-react';
import { generateSchedule } from './utils/scheduler';
import { format, addDays } from 'date-fns';

const LOCAL_STORAGE_KEY = 'scheduler_app_data';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'setup' | 'employees' | 'availability' | 'schedule'>('setup');
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [schedule, setSchedule] = useState<DailySchedule[]>([]);

  // Load from localStorage
  useEffect(() => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        setWorkplaces(parsed.workplaces || []);
        setEmployees(parsed.employees || []);
        setAvailabilities(parsed.availabilities || []);
      } catch (e) {
        console.error('Failed to load data', e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      workplaces,
      employees,
      availabilities
    }));
  }, [workplaces, employees, availabilities]);

  const handleGenerate = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const nextWeek = format(addDays(new Date(), 14), 'yyyy-MM-dd');
    const newSchedule = generateSchedule(workplaces, employees, availabilities, today, nextWeek);
    setSchedule(newSchedule);
    setActiveTab('schedule');
  };

  const exportData = (type: 'workplaces' | 'employees') => {
    const data = type === 'workplaces' ? workplaces : employees;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  const importData = (type: 'workplaces' | 'employees', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (type === 'workplaces') setWorkplaces(json);
        else setEmployees(json);
      } catch (err) {
        alert('Ошибка при чтении файла');
      }
    };
    reader.readAsText(file);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
          <Sparkles className="w-6 h-6" />
          ShiftMaster
        </h1>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar / Overlay Navigation */}
      <nav className={`
        fixed inset-0 z-40 transition-transform transform md:translate-x-0 md:static md:inset-auto md:w-64 bg-white border-r border-gray-200 flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-100 hidden md:block">
          <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            ShiftMaster
          </h1>
        </div>
        
        <div className="flex-1 p-4 space-y-2 mt-16 md:mt-0">
          <button
            onClick={() => { setActiveTab('setup'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'setup' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Settings2 className="w-5 h-5" />
            Настройка мест
          </button>
          <button
            onClick={() => { setActiveTab('employees'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'employees' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users className="w-5 h-5" />
            Сотрудники
          </button>
          <button
            onClick={() => { setActiveTab('availability'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'availability' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <CalendarDays className="w-5 h-5" />
            Доступность
          </button>
          <button
            onClick={() => { setActiveTab('schedule'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'schedule' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Расписание
          </button>
        </div>

        <div className="p-4 border-t border-gray-100 space-y-2 mb-4 md:mb-0">
          <button
            onClick={() => { handleGenerate(); setIsSidebarOpen(false); }}
            disabled={workplaces.length === 0 || employees.length === 0}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            Создать график
          </button>
          <button
            onClick={() => {
              if (confirm('Вы уверены, что хотите очистить все данные?')) {
                setWorkplaces([]);
                setEmployees([]);
                setAvailabilities([]);
                setSchedule([]);
                localStorage.removeItem(LOCAL_STORAGE_KEY);
              }
            }}
            className="w-full text-gray-400 hover:text-red-500 py-2 text-xs transition-colors"
          >
            Очистить все данные
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'setup' && (
            <WorkplaceManager 
              workplaces={workplaces} 
              setWorkplaces={setWorkplaces} 
              onExport={() => exportData('workplaces')}
              onImport={(file) => importData('workplaces', file)}
            />
          )}
          {activeTab === 'employees' && (
            <EmployeeManager 
              employees={employees} 
              setEmployees={setEmployees} 
              workplaces={workplaces} 
              onExport={() => exportData('employees')}
              onImport={(file) => importData('employees', file)}
            />
          )}
          {activeTab === 'availability' && (
            <AvailabilityManager 
              employees={employees} 
              availabilities={availabilities} 
              setAvailabilities={setAvailabilities} 
            />
          )}
          {activeTab === 'schedule' && (
            <ScheduleDisplay 
              schedule={schedule} 
              workplaces={workplaces} 
              employees={employees} 
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
