
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
    { id: 'ai', icon: <Bot size={20} />, label: t('বন্ধুর চ্যাট', 'Buddy Chat') },
    { id: 'settings', icon: <Settings size={20} />, label: t('সেটিংস', 'Settings') },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors selection:bg-emerald-100">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-8">
        <div className="mb-10">
          <h1 className="text-2xl font-black bg-gradient-to-br from-emerald-600 to-teal-400 bg-clip-text text-transparent italic">
            HSC TRACKER
          </h1>
        </div>
        
        <nav className="flex-1 space-y-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
                activeTab === item.id 
                  ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 font-bold' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 space-y-4">
           <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
             <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black text-lg">
               {userProfile.fullName[0]}
             </div>
             <div className="min-w-0">
               <p className="text-sm font-bold truncate">{userProfile.fullName}</p>
               <p className="text-[10px] uppercase font-black text-slate-400">{userProfile.group}</p>
             </div>
           </div>
           <button onClick={toggleTheme} className="w-full flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl text-slate-400 transition-all">
             {isDark ? <Sun size={20} /> : <Moon size={20} />}
             <span className="text-sm font-bold">{isDark ? t('লাইট', 'Light') : t('ডার্ক', 'Dark')} {t('মোড', 'Mode')}</span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 md:hidden">
          <h1 className="font-black text-emerald-600 italic">HSC TRACKER</h1>
          <div className="flex gap-2">
            <button onClick={toggleTheme} className="p-2 text-slate-400">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>

        {/* Mobile Nav */}
        <nav className="md:hidden flex items-center justify-around bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-4 pb-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center p-2 transition-all ${
                activeTab === item.id ? 'text-emerald-500 scale-110' : 'text-slate-300'
              }`}
            >
              {item.icon}
              <span className="text-[10px] mt-1 font-bold">{item.label}</span>
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
};
