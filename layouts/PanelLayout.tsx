import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, BookOpen, Timer, GraduationCap, 
  CalendarDays, MessageSquare, BarChart3, Settings, 
  Cpu, Camera, LogOut, Sun, Moon, Bell, Menu, X, ChevronLeft, ChevronRight, Lock, Megaphone
} from 'lucide-react';
import { UserState } from '../types';
import BackgroundGrid from '../components/BackgroundGrid';
import { supabase } from '../lib/supabase';
import { useLekhapora } from '../contexts/LekhaporaContext';

interface PanelLayoutProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
  children: React.ReactNode;
}

const PanelLayout: React.FC<PanelLayoutProps> = ({ userState, onUpdateState, children }) => {
  const { state: contextState, dispatch } = useLekhapora();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  const location = useLocation();
  const navigate = useNavigate();

  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = userState.profile?.role === 'admin';

  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: t('লগইন', 'Login'), path: '/app/dashboard' },
    { id: 'syllabus', icon: <BookOpen size={20} />, label: t('সিলেবাস', 'Syllabus'), path: '/app/syllabus' },
    { id: 'tracker', icon: <Timer size={20} />, label: t('ফোকাস ট্র্যাকার', 'Focus Tracker'), path: '/app/tracker' },
    { id: 'exams', icon: <GraduationCap size={20} />, label: t('টেস্ট ও এক্সাম', 'Exams & Tests'), path: '/app/exams' },
    { id: 'calendar', icon: <CalendarDays size={20} />, label: t('ক্যালেন্ডার', 'Calendar'), path: '/app/calendar' },
    { id: 'ai', icon: <MessageSquare size={20} />, label: t('এআই বন্ধু', 'AI Assistant'), path: '/app/ai' },
    ...(isAdmin ? [{ id: 'cms', icon: <Lock size={20} className="text-orange-500" />, label: 'CMS Dashboard', path: '/app/cms' }] : []),
    { id: 'analytics', icon: <BarChart3 size={20} />, label: t('এনালাইটিক্স', 'Analytics'), path: '/app/analytics' },
    { id: 'ocr', icon: <Camera size={20} />, label: t('স্ক্যানার', 'OCR Scanner'), path: '/app/ocr' },
    { id: 'settings', icon: <Settings size={20} />, label: t('সেটিংস', 'Settings'), path: '/app/settings' },
    { id: 'system', icon: <Cpu size={20} />, label: t('সিস্টেম', 'System'), path: '/app/system' },
  ];

  const currentPanelId = location.pathname.split('/').pop() || 'dashboard';
  const unreadCount = contextState.announcements.length;

  return (
    <div className="h-screen w-full flex bg-brand-bg text-brand-text-p overflow-hidden relative selection:bg-brand-primary/20">
      <BackgroundGrid />

      <aside className={`hidden md:flex flex-col bg-brand-surface/80 backdrop-blur-xl border-r border-brand-text-s/10 transition-all duration-500 z-50 ${isSidebarOpen ? 'w-72 p-6' : 'w-24 p-4'}`}>
        <div className="flex items-center justify-between mb-10">
          <h1 className={`font-black text-brand-primary italic tracking-tight transition-all duration-500 overflow-hidden whitespace-nowrap ${isSidebarOpen ? 'text-2xl opacity-100' : 'text-[0px] opacity-0'}`}>
            LEKHAPORA
          </h1>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 rounded-xl bg-brand-bg/50 text-brand-text-s hover:text-brand-primary transition-all shadow-sm">
            {isSidebarOpen ? <ChevronLeft size={20}/> : <ChevronRight size={20}/>}
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto scrollbar-hide pr-1">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative ${
                currentPanelId === item.id 
                ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20 font-bold' 
                : 'text-brand-text-s hover:bg-brand-bg/50 hover:text-brand-text-p'
              }`}
            >
              <span className={`shrink-0 transition-transform group-hover:scale-110 ${currentPanelId === item.id ? 'scale-110' : ''}`}>
                {item.icon}
              </span>
              <span className={`text-sm tracking-tight transition-all duration-500 ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className={`mt-auto pt-6 border-t border-brand-text-s/10 space-y-4`}>
          <div className={`flex items-center bg-brand-bg/50 rounded-2xl border border-brand-text-s/5 transition-all p-3 ${isSidebarOpen ? 'gap-4' : 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary font-black shrink-0 shadow-inner">
              {userState.profile?.fullName?.[0]}
            </div>
            {isSidebarOpen && (
              <div className="min-w-0">
                <p className="text-xs font-black truncate">{userState.profile?.fullName}</p>
                <p className="text-[9px] uppercase font-bold text-brand-text-s">{userState.profile?.group} {isAdmin ? '• Admin' : ''}</p>
              </div>
            )}
          </div>
          <button onClick={() => setIsDark(!isDark)} className={`w-full flex items-center transition-all p-3 rounded-2xl hover:bg-brand-bg/50 text-brand-text-s ${isSidebarOpen ? 'gap-4 px-4' : 'justify-center'}`}>
            {isDark ? <Sun size={20}/> : <Moon size={20}/>}
            {isSidebarOpen && <span className="text-sm font-bold">{isDark ? t('লাইট মোড', 'Light Mode') : t('ডার্ক মোড', 'Dark Mode')}</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-full relative z-10">
        <header className="h-20 flex items-center justify-between px-6 md:px-10 bg-brand-bg/50 backdrop-blur-md border-b border-brand-text-s/5 shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-brand-text-p"><Menu size={24}/></button>
             <div className="hidden md:block">
                <h2 className="text-sm font-black text-brand-text-s uppercase tracking-[0.2em]">
                  {navItems.find(n => n.id === currentPanelId)?.label}
                </h2>
             </div>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-brand-surface/50 rounded-xl border border-brand-text-s/5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black text-brand-text-s uppercase tracking-widest">{t('লাইভ সিঙ্ক', 'Synced')}</span>
            </div>
            
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 text-brand-text-s hover:text-brand-primary transition-all relative rounded-xl hover:bg-brand-surface"
              >
                 <Bell size={20} />
                 {unreadCount > 0 && (
                   <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-brand-bg animate-pulse"></span>
                 )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute top-12 right-0 w-80 bg-brand-surface border border-brand-text-s/10 rounded-[2rem] shadow-2xl z-[60] overflow-hidden animate-in slide-in-from-top-2 zoom-in-95 origin-top-right">
                  <div className="p-4 border-b border-brand-text-s/5 bg-brand-bg/50 flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-widest text-brand-text-p">Notifications</h3>
                    <span className="text-[10px] font-bold bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-lg">{unreadCount} New</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {contextState.announcements.length === 0 ? (
                      <div className="p-8 text-center text-brand-text-s opacity-50">
                        <Bell size={24} className="mx-auto mb-2" />
                        <p className="text-[10px] font-bold uppercase">No notifications</p>
                      </div>
                    ) : (
                      contextState.announcements.map((ann, i) => (
                        <div key={ann.id || i} className="p-4 border-b border-brand-text-s/5 hover:bg-brand-bg/50 transition-colors flex gap-3">
                           <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${ann.type === 'warning' ? 'bg-orange-500' : ann.type === 'success' ? 'bg-emerald-500' : 'bg-brand-primary'}`} />
                           <div>
                             <h4 className="text-xs font-black text-brand-text-p mb-1">{ann.title}</h4>
                             <p className="text-[10px] font-medium text-brand-text-s leading-relaxed">{ann.message}</p>
                             <p className="text-[8px] font-bold text-brand-text-s/50 uppercase mt-2">Just Now</p>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="max-w-7xl mx-auto p-4 md:p-10 pb-32 md:pb-12">
            {children}
          </div>
        </div>
      </main>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsMobileMenuOpen(false)}>
           <div className="w-72 h-full bg-brand-surface p-6 flex flex-col animate-in slide-in-from-left duration-500" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-10">
                 <h1 className="font-black text-brand-primary text-2xl italic tracking-tight">LEKHAPORA</h1>
                 <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-brand-text-s"><X/></button>
              </div>
              <nav className="flex-1 space-y-2 overflow-y-auto">
                {navItems.map(item => (
                  <Link key={item.id} to={item.path} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold ${currentPanelId === item.id ? 'bg-brand-primary text-white' : 'text-brand-text-s hover:bg-brand-bg'}`}>
                    {item.icon} <span className="text-sm">{item.label}</span>
                  </Link>
                ))}
              </nav>
              <div className="pt-6 mt-auto border-t border-brand-text-s/10">
                 <button onClick={() => supabase.auth.signOut()} className="w-full py-4 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest"><LogOut size={18}/> {t('লগ আউট', 'Logout')}</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PanelLayout;