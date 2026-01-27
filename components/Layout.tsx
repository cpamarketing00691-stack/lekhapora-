
import React, { useEffect } from 'react';
import { UserProfile, Language } from '../types';
import { Home, Timer, BookOpen, Bot, Sun, Moon, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  userProfile: UserProfile;
  activeTab: string;
  onTabChange: (tab: any) => void;
  language: Language;
}

export const Layout: React.FC<LayoutProps> = ({ children, userProfile, activeTab, onTabChange, language }) => {
  const [isDark, setIsDark] = React.useState(() => localStorage.getItem('theme') === 'dark');

  const t = (bn: string, en: string) => language === 'bn' ? bn : en;

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      document.body.classList.add('dark');
      document.body.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      document.body.classList.add('light');
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const navItems = [
    { id: 'dashboard', icon: <Home size={20} />, label: t('হোম', 'Home') },
    { id: 'tracker', icon: <Timer size={20} />, label: t('ফোকাস', 'Focus') },
    { id: 'syllabus', icon: <BookOpen size={20} />, label: t('সিলেবাস', 'Syllabus') },
    { id: 'ai', icon: <Bot size={20} />, label: t('Buddy', 'Buddy') },
    { id: 'settings', icon: <Settings size={20} />, label: t('সেটিংস', 'Settings') },
  ];

  return (
    <div className="min-h-full flex flex-col md:flex-row bg-brand-bg text-brand-text-p transition-colors selection:bg-brand-primary/20 overflow-hidden h-full">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-brand-surface border-r border-brand-text-s/10 p-8 transition-colors shrink-0">
        <div className="mb-10">
          <h1 className="text-2xl font-black bg-gradient-to-br from-brand-primary to-brand-secondary bg-clip-text text-transparent italic tracking-tight">
            HSC TRACKER
          </h1>
        </div>
        
        <nav className="flex-1 space-y-2 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 font-bold' 
                  : 'hover:bg-brand-bg/50 text-brand-text-s hover:text-brand-text-p'
              }`}
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 space-y-3">
           <div className="flex items-center gap-3 p-4 bg-brand-bg/50 rounded-2xl border border-brand-text-s/10 overflow-hidden">
             <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white font-black text-lg shrink-0">
               {userProfile.fullName?.[0] || 'U'}
             </div>
             <div className="min-w-0">
               <p className="text-sm font-bold truncate leading-none mb-1">{userProfile.fullName}</p>
               <p className="text-[10px] uppercase font-black text-brand-text-s leading-none">{userProfile.group}</p>
             </div>
           </div>
           <button onClick={toggleTheme} className="w-full flex items-center gap-4 px-5 py-3 hover:bg-brand-bg/50 rounded-xl text-brand-text-s transition-all">
             {isDark ? <Sun size={20} /> : <Moon size={20} />}
             <span className="text-xs font-bold uppercase tracking-widest">{isDark ? t('লাইট', 'Light') : t('ডার্ক', 'Dark')}</span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 bg-brand-surface/80 backdrop-blur-md border-b border-brand-text-s/10 md:hidden sticky top-0 z-50 transition-colors safe-pt">
          <h1 className="font-black text-brand-primary italic tracking-tight text-base">HSC TRACKER</h1>
          <div className="flex gap-1 items-center">
            <button onClick={toggleTheme} className="p-2 text-brand-text-s hover:text-brand-text-p transition-colors active:scale-90">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-black text-xs">
              {userProfile.fullName?.[0] || 'U'}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8 md:py-10 pb-32 md:pb-12 scroll-smooth scrollbar-hide">
          <div className="max-w-5xl mx-auto h-full">
            {children}
          </div>
        </div>

        {/* Mobile Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around bg-brand-surface/95 backdrop-blur-xl border-t border-brand-text-s/10 px-2 sm:px-4 pt-2.5 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgb(0,0,0,0.05)] transition-colors">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-1.5 p-1 transition-all active:scale-95 flex-1 min-w-0 ${
                activeTab === item.id ? 'text-brand-primary' : 'text-brand-text-s'
              }`}
            >
              <div className={`transition-all flex items-center justify-center w-full max-w-[56px] h-10 rounded-2xl ${activeTab === item.id ? 'bg-brand-primary/10' : ''}`}>
                {React.cloneElement(item.icon as React.ReactElement<any>, { size: 20 })}
              </div>
              <span className="text-[9px] font-black uppercase tracking-tight leading-none text-center truncate w-full px-1">{item.label}</span>
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
};
