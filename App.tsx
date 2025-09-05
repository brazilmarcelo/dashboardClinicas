
import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AppointmentsView } from './components/AppointmentsView';
import { MessagesView } from './components/MessagesView';
import { CopilotView } from './components/CopilotView';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { MenuIcon, XIcon } from './constants';

export type View = 'dashboard' | 'appointments' | 'messages' | 'copilot';
export type Theme = 'light' | 'dark';

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
      case 'dashboard':
        return <Dashboard />;
      case 'appointments':
        return <AppointmentsView />;
      case 'messages':
        return <MessagesView />;
      case 'copilot':
        return <CopilotView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={`flex h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-sans`}>
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex justify-between items-center p-4 bg-content-light dark:bg-content-dark border-b border-gray-200 dark:border-gray-700">
           <button 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
             className="md:hidden text-gray-500 dark:text-gray-400"
           >
             {isSidebarOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
           </button>
           <h1 className="text-xl font-bold text-primary-light hidden md:block">Painel de Atendimento IA</h1>
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
