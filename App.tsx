
import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DisparosView } from './components/DisparosView';
import { AppointmentsView } from './components/AppointmentsView';
import { PacientesView } from './components/PacientesView';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { MenuIcon, XIcon } from './constants';

export type View = 'dashboard' | 'disparos' | 'agendamentos' | 'pacientes';
export type Theme = 'light' | 'dark';

const VIEW_TITLES: Record<View, string> = {
  dashboard: 'Visão Geral',
  disparos: 'Disparos',
  agendamentos: 'Agendamentos',
  pacientes: 'Pacientes',
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [theme, setTheme] = useState<Theme>('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  React.useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':    return <Dashboard />;
      case 'disparos':     return <DisparosView />;
      case 'agendamentos': return <AppointmentsView />;
      case 'pacientes':    return <PacientesView />;
      default:             return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-background-dark text-slate-900 dark:text-text-dark font-sans">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex justify-between items-center px-6 py-4 bg-white dark:bg-content-dark border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white"
            >
              {isSidebarOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
            <h1 className="text-lg font-semibold text-slate-800 dark:text-white hidden md:block">
              {VIEW_TITLES[currentView]}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 dark:text-gray-500 hidden sm:block">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
