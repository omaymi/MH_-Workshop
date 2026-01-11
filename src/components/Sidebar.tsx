import React from 'react';
import { Calendar, LayoutDashboard, Users, DoorOpen, BookOpen, Settings, LogOut } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
    { id: 'schedule', label: 'Emploi du Temps', icon: Calendar },
    { id: 'teachers', label: 'Professeurs', icon: Users },
    { id: 'rooms', label: 'Salles', icon: DoorOpen },
    { id: 'courses', label: 'Cours', icon: BookOpen },
  ];

  return (
    <div className="h-screen w-80 bg-[#2D1B12] text-[#F5E6D3] flex flex-col shadow-2xl fixed left-0 top-0 z-50 font-sans">
      {/* Logo Section */}
      <div className="p-8 border-b border-[#4A3428] flex flex-col items-center gap-4 text-center">
        <div className="w-48 h-48 flex items-center justify-center overflow-hidden p-1">
          <img
            src="/fst_logo.png"
            alt="FST Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-wider text-[#F5E6D3]">FSTM</h1>
          <p className="text-sm text-[#D4A373] font-medium mt-1">Planning System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                ? 'bg-[#8B5E3C] text-white shadow-lg shadow-black/20'
                : 'text-[#D4A373] hover:bg-[#4A3428] hover:text-[#F5E6D3]'
                }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#D4A373] group-hover:text-[#F5E6D3]'}`} />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#F5E6D3]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-[#4A3428]">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#D4A373] hover:bg-[#4A3428] hover:text-[#F5E6D3] transition-all">
          <Settings className="w-5 h-5" />
          <span className="font-medium">Paramètres</span>
        </button>
        <div className="mt-4 pt-4 border-t border-[#4A3428] flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#8B5E3C] to-[#6D4C41] flex items-center justify-center text-white font-bold border border-[#4A3428]">
            A
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#F5E6D3]">Admin</p>
            <p className="text-xs text-[#D4A373]">admin@fst.edu</p>
          </div>
          <LogOut className="w-4 h-4 text-[#D4A373] hover:text-[#F5E6D3] cursor-pointer" />
        </div>
      </div>
    </div>
  );
}
