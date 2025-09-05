
import React from 'react';
import type { View } from '../App';
import { DashboardIcon, CalendarIcon, MessageIcon } from '../constants';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-primary-dark text-white shadow-lg'
        : 'text-gray-300 hover:bg-primary-dark/50 hover:text-white'
    }`}
  >
    {icon}
    <span className="ml-4">{label}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isSidebarOpen, setIsSidebarOpen }) => {
  const handleNavigation = (view: View) => {
    setCurrentView(view);
    if(window.innerWidth < 768) { // md breakpoint
        setIsSidebarOpen(false);
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>
      <aside className={`absolute md:relative z-40 flex flex-col w-64 h-full bg-primary-dark text-white transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex items-center justify-center h-20 border-b border-primary-dark/50">
          <h1 className="text-2xl font-bold tracking-wider">Aiude</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavItem
            icon={<DashboardIcon className="w-6 h-6" />}
            label="Dashboard"
            isActive={currentView === 'dashboard'}
            onClick={() => handleNavigation('dashboard')}
          />
          <NavItem
            icon={<CalendarIcon className="w-6 h-6" />}
            label="Agendamentos"
            isActive={currentView === 'appointments'}
            onClick={() => handleNavigation('appointments')}
          />
          <NavItem
            icon={<MessageIcon className="w-6 h-6" />}
            label="Mensagens"
            isActive={currentView === 'messages'}
            onClick={() => handleNavigation('messages')}
          />
        </nav>
        <div className="p-4 text-xs text-center text-gray-400">
          © {new Date().getFullYear()} Aiude
        </div>
      </aside>
    </>
  );
};