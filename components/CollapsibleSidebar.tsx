import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';
import { UserProfile, Language } from '../types';

interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
}

interface CollapsibleSidebarProps {
  userProfile: UserProfile;
  activeTab: string;
  onTabChange: (tab: any) => void;
  language: Language;
  isDark: boolean;
  toggleTheme: () => void;
  navItems: NavItem[];
}

export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  userProfile,
  activeTab,
  onTabChange,
  language,
  isDark,
  toggleTheme,
  navItems
}) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebar-expanded');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const t = (bn: string, en: string) => language === 'bn' ? bn : en;

  // Auto-collapse on smaller desktop/tablet screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsExpanded(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar-expanded', JSON.stringify(isExpanded));
  }, [isExpanded]);

  return (
    <aside 
      className={`relative z-20 hidden md:flex flex-col bg-brand-surface/90 backdrop-blur-md border-r border-brand-text-s/10 transition-all duration-300 ease-in-out shrink-0 overflow-hidden ${
        isExpanded ? 'w-64 p-6' : 'w-20 p-4'
      }`}
    >
      {/* Sidebar Header / Logo */}
      <div className={`mb-10 flex items-center ${isExpanded ? 'justify-between' : 'justify-center'}`}>
        <h1 className={`font-black bg-gradient-to-br from-brand-primary to-brand-secondary bg-clip-text text-transparent italic transition-all duration-300 ${
          isExpanded ? 'text-2xl opacity-100' : 'text-xs opacity-0 hidden'
        }`}>
          HSC TRACKER
        </h1>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-2 rounded-xl bg-brand-bg/50 text-brand-text-s hover:text-brand-primary hover:bg-brand-primary/10 transition-all ${!isExpanded && 'rotate-180'}`}
        >
          {isExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>
      
      {/* Navigation Items */}
      <nav className="flex-1 space-y-2 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            title={!isExpanded ? item.label : ''}
            className={`w-full flex items-center transition-all duration-300 rounded-2xl group ${
              isExpanded ? 'px-4 py-3 gap-4' : 'justify-center py-3'
            } ${
              activeTab === item.id 
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 font-bold' 
                : 'text-brand-text-s hover:bg-brand-bg/50 hover:text-brand-text-p'
            }`}
          >
            <span className={`shrink-0 transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
              {item.icon}
            </span>
            {isExpanded && (
              <span className="text-sm truncate animate-in fade-in slide-in-from-left-2 duration-300">
                {item.label}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="mt-auto pt-6 space-y-4">
         <div className={`flex items-center bg-brand-bg/50 rounded-2xl border border-brand-text-s/10 transition-all duration-300 ${
           isExpanded ? 'p-3 gap-3' : 'p-2 justify-center'
         }`}>
           <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white font-black text-lg shrink-0 shadow-inner">
             {userProfile.fullName?.[0] || 'U'}
           </div>
           {isExpanded && (
             <div className="min-w-0 animate-in fade-in duration-500">
               <p className="text-xs font-bold truncate leading-none mb-1">{userProfile.fullName}</p>
               <p className="text-[9px] uppercase font-black text-brand-text-s leading-none">{userProfile.group}</p>
             </div>
           )}
         </div>

         <button 
           onClick={toggleTheme} 
           className={`w-full flex items-center hover:bg-brand-bg/50 rounded-2xl text-brand-text-s transition-all duration-300 ${
             isExpanded ? 'px-4 py-3 gap-4' : 'justify-center py-3'
           }`}
         >
           {isDark ? <Sun size={20} /> : <Moon size={20} />}
           {isExpanded && (
             <span className="text-sm font-bold animate-in fade-in duration-500">
               {isDark ? t('লাইট', 'Light') : t('ডার্ক', 'Dark')}
             </span>
           )}
         </button>
      </div>
    </aside>
  );
};