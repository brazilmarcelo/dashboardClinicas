
import React from 'react';
import type { View } from '../App';
import { DashboardIcon, BellIcon, CalendarIcon, UsersIcon } from '../constants';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const NAV_ITEMS: { view: View; icon: React.ReactNode; label: string }[] = [
  { view: 'dashboard',    icon: <DashboardIcon className="w-5 h-5" />, label: 'Visão Geral' },
  { view: 'disparos',     icon: <BellIcon className="w-5 h-5" />,      label: 'Disparos' },
  { view: 'agendamentos', icon: <CalendarIcon className="w-5 h-5" />,  label: 'Agendamentos' },
  { view: 'pacientes',    icon: <UsersIcon className="w-5 h-5" />,     label: 'Pacientes' },
];

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-150 ${
      isActive
        ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
        : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent'
    }`}
  >
    <span className={isActive ? 'text-violet-400' : 'text-gray-500'}>{icon}</span>
    <span className="ml-3">{label}</span>
    {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isSidebarOpen, setIsSidebarOpen }) => {
  const handleNavigation = (view: View) => {
    setCurrentView(view);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />
      {/* Sidebar sempre escura — identidade da marca */}
      <aside className={`absolute md:relative z-40 flex flex-col w-64 h-full bg-[#0d1220] border-r border-white/5 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>

        {/* Logo + Cliente */}
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/50 shrink-0">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-none">Aiude</h1>
              <p className="text-[10px] text-violet-400 font-medium mt-0.5">Painel de IA</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
            <span className="text-xs">🌸</span>
            <div>
              <p className="text-xs font-semibold text-gray-200 leading-none">Rosas do Parto</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Clínica</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <NavItem
              key={item.view}
              icon={item.icon}
              label={item.label}
              isActive={currentView === item.view}
              onClick={() => handleNavigation(item.view)}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-xs text-emerald-400 font-medium">IA Online</span>
          </div>
        </div>
      </aside>
    </>
  );
};
