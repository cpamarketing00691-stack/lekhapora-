import React, { useMemo, useState, useEffect } from 'react';
import { UserState, Subject, Task, TaskSource, Reminder } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { TrendingUp, Activity, History, BookOpen, Clock, X, GraduationCap, ListTodo, Plus, Trash2, CheckCircle, Circle, Sparkles, PlayCircle, Flame, Target, Info, ChevronRight, Bell, BellOff, Calendar, AlertCircle, RefreshCw, Loader2, Download, ChevronLeft, LayoutGrid, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
  onTriggerTest: (subjectId: string, chapterId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userState, onUpdateState, onTriggerTest }) => {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  
  const [newTask, setNewTask] = useState({ 
    name: '', 
    source: TaskSource.PERSONAL,
    subjectId: '',
    chapterId: ''
  });

  const [newReminder, setNewReminder] = useState({
    title: '',
    time: '',
    repeatType: 'none' as 'none' | 'daily' | 'weekly'
  });
  
  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  useEffect(() => {
    const handleInstallReady = () => setCanInstall(true);
    window.addEventListener('pwa-install-ready', handleInstallReady);
    if ((window as any).deferredPrompt) setCanInstall(true);
    return () => window.removeEventListener('pwa-install-ready', handleInstallReady);
  }, []);

  const handleInstallApp = async () => {
    const promptEvent = (window as any).deferredPrompt;
    if (!promptEvent) {
      alert(t("অ্যাপটি ইতিমধ্যে ইনস্টল করা আছে অথবা আপনার ব্রাউজার এটি সমর্থন করছে না।", "App is already installed or your browser doesn't support direct installation."));
      return;
    }
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
    }
    (window as any).deferredPrompt = null;
  };

  const getLocalDateString = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const activeReminders = useMemo(() => {
    const rems = userState.reminders ?? [];
    return rems.filter(r => !r.isDone).sort((a, b) => a.time - b.time);
  }, [userState.reminders]);

  const stats = useMemo(() => {
    const today = getLocalDateString(Date.now());
    const allSessions = Array.isArray(userState.studyHistory) ? userState.studyHistory : [];
    const todayFocusSeconds = allSessions
      .filter(s => getLocalDateString(s.startTime) === today)
      .reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0) + (userState.activeTimer?.accumulatedFocusSeconds || 0);

    const rawSubjects = Array.isArray(userState.subjects) ? userState.subjects : [];
    const totalChapters = rawSubjects.reduce((acc, curr) => acc + (curr.chapters?.length || 0), 0);
    const completedChapters = rawSubjects.reduce((acc, curr) => acc + (curr.chapters?.filter(c => c.isCompleted).length || 0), 0);
    const completionRate = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

    const dailyGoalSeconds = 6 * 3600; // 6 hours goal
    const studyProgress = Math.min(100, Math.round((todayFocusSeconds / dailyGoalSeconds) * 100));
    const score = Math.round((studyProgress * 0.4) + (completionRate * 0.5) + ((userState.streaks || 0) * 2));

    const focusData = [
      { name: 'Today', value: studyProgress, fill: 'var(--brand-primary)' }
    ];

    return {
      totalFocusSeconds: allSessions.reduce((acc, curr) => acc + curr.durationSeconds, 0),
      todayFocusSeconds,
      completion: completionRate,
      totalChapters,
      completedChapters,
      studyProgress,
      score: Math.min(100, score),
      readiness: score > 85 ? t('চমৎকার', 'Excellent') : score > 60 ? t('ভালো', 'Good') : t('চলমান', 'Steady'),
      focusRadialData: focusData
    };
  }, [userState.studyHistory, userState.subjects, userState.streaks, userState.activeTimer, userState.language]);

  const countdowns = useMemo(() => {
    const list = [];
    const now = new Date().setHours(0,0,0,0);

    if (userState.profile?.targetExamDate) {
      const target = new Date(userState.profile.targetExamDate).getTime();
      const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
      if (diff >= 0) list.push({ name: t('এইচএসসি পরীক্ষা', 'HSC Exam'), days: diff, type: 'hsc' });
    }

    if (userState.profile?.collegeExams) {
      userState.profile.collegeExams.forEach(ex => {
        const target = new Date(ex.date).getTime();
        const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
        if (diff >= 0) list.push({ name: ex.name, days: diff, type: 'college' });
      });
    }

    return list.sort((a, b) => a.days - b.days).slice(0, 3);
  }, [userState.profile, userState.language]);

  function formatDuration(totalSeconds: number) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h}h ${m}m`;
  }

  const addTask = () => {
    if (!newTask.name.trim()) return;
    const task: Task = {
      id: `task-${Date.now()}`,
      name: newTask.name.trim(),
      source: TaskSource.PERSONAL,
      isCompleted: false,
      subjectId: newTask.subjectId || undefined,
      chapterId: newTask.chapterId || undefined,
      createdAt: Date.now()
    };
    onUpdateState(prev => ({ ...prev, dailyTasks: [...(prev.dailyTasks || []), task] }));
    setNewTask({ name: '', source: TaskSource.PERSONAL, subjectId: '', chapterId: '' });
    setIsTaskModalOpen(false);
  };

  const addReminder = async () => {
    if (!newReminder.title.trim() || !newReminder.time || isAddingReminder) return;
    setIsAddingReminder(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("লগইন সেশন পাওয়া যায়নি।", "Session not found."));

      const datetime = new Date(newReminder.time).toISOString();
      
      const { error: dbError } = await supabase.from('reminders').insert({
        user_id: user.id,
        title: newReminder.title.trim(),
        reminder_datetime: datetime,
        is_done: false,
        is_triggered: false,
        repeat_type: newReminder.repeatType
      });

      if (dbError) throw dbError;

      const reminder: Reminder = {
        id: `rem-${Date.now()}`,
        title: newReminder.title.trim(),
        time: new Date(newReminder.time).getTime(),
        isTriggered: false,
        isDone: false,
        repeatType: newReminder.repeatType
      };
      
      onUpdateState(prev => ({ 
        ...prev, 
        reminders: [...(prev.reminders || []), reminder] 
      }));

      setNewReminder({ title: '', time: '', repeatType: 'none' });
      setIsReminderModalOpen(false);
    } catch (err: any) {
      alert(err.message || t("রিমাইন্ডার সেট করা সম্ভব হয়নি।", "Failed to set reminder."));
    } finally {
      setIsAddingReminder(false);
    }
  };

  const toggleTask = (id: string) => {
    onUpdateState(prev => ({
      ...prev,
      dailyTasks: prev.dailyTasks.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)
    }));
  };

  const getSubjectName = (id?: string) => {
    const sub = userState.subjects.find(s => s.id === id);
    return sub ? `${sub.name} (P${sub.paper})` : t('সাধারণ পড়া', 'General');
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-700">
      {/* Dynamic PWA Install Button Section */}
      {canInstall && (
        <div className="bg-brand-primary text-white p-6 rounded-[2.5rem] shadow-xl shadow-brand-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 border border-white/10">
           <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
                 <Download className="animate-bounce" size={28} />
              </div>
              <div className="text-center sm:text-left">
                 <h4 className="font-black text-base uppercase tracking-widest">{t('অ্যাপ ডাউনলোড করো', 'Download App')}</h4>
                 <p className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">{t('হোমস্ক্রিনে অ্যাড করে অফলাইনেও পড়াশোনা করো', 'Add to home screen for better access')}</p>
              </div>
           </div>
           <button 
             onClick={handleInstallApp} 
             className="w-full sm:w-auto px-8 py-3 bg-white text-brand-primary rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"
           >
             {t('ইনস্টল', 'Install Now')}
           </button>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center border-4 border-brand-bg shadow-sm">
            <span className="text-2xl font-black text-brand-primary">{userState.profile?.fullName?.[0]}</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-brand-text-p">{userState.profile?.fullName}! {t('স্বাগতম', 'Welcome')}</h1>
            <p className="text-brand-text-s text-[10px] font-black uppercase tracking-[0.2em]">{t('তোমার আজকের অগ্রগতির চিত্র', 'Daily Progress Overview')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-3 bg-orange-500/10 text-orange-600 px-4 py-2 rounded-2xl border border-orange-500/20 shadow-sm">
            <Flame size={18} className="animate-pulse" />
            <span className="text-xs font-black uppercase">{userState.streaks} {t('স্ট্রিক', 'Streak')}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Stat Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <section className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm flex items-center justify-between overflow-hidden relative">
                <div className="relative z-10">
                  <h3 className="text-lg font-black flex items-center gap-2 mb-2"><Clock size={20} className="text-brand-primary" /> {t('আজকের পড়া', 'Focus Goal')}</h3>
                  <div className="space-y-1">
                    <p className="text-3xl font-black text-brand-text-p">{formatDuration(stats.todayFocusSeconds)}</p>
                    <p className="text-[10px] font-black uppercase text-brand-text-s tracking-widest">{t('৬ ঘণ্টার লক্ষ্য', '6 Hour Goal')}</p>
                  </div>
                </div>
                <div className="w-32 h-32 relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart innerRadius="80%" outerRadius="100%" data={stats.focusRadialData} startAngle={90} endAngle={450}>
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar background dataKey="value" cornerRadius={30} fill="var(--brand-primary)" />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-xl font-black text-brand-primary">{stats.studyProgress}%</span>
                  </div>
                </div>
             </section>

             <section className="bg-brand-primary p-6 rounded-[2.5rem] shadow-xl shadow-brand-primary/20 relative overflow-hidden flex flex-col justify-center">
                <Target size={120} className="absolute -right-4 -bottom-4 opacity-10 text-white" />
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/80 mb-2">{t('এইচএসসি প্রস্তুতি স্কোর', 'Readiness Score')}</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-5xl font-black text-white">{stats.score}%</h2>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase text-white backdrop-blur-sm">{stats.readiness}</div>
                    <p className="text-[9px] font-bold text-white/60 uppercase tracking-tighter">{t('সিলেবাস ভিত্তিক হিসাব', 'Calculated from syllabus')}</p>
                  </div>
                </div>
             </section>
          </div>

          {/* Subjects Progress Grid */}
          <section className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black flex items-center gap-2"><LayoutGrid size={20} className="text-brand-primary" /> {t('সিলেবাস অগ্রগতি', 'Syllabus Breakdown')}</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-brand-text-s">{stats.completedChapters} / {stats.totalChapters} {t('অধ্যায় সম্পন্ন', 'Chapters Done')}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userState.subjects.map((sub, idx) => {
                const total = sub.chapters?.length || 0;
                const done = sub.chapters?.filter(c => c.isCompleted).length || 0;
                const perc = total > 0 ? Math.round((done / total) * 100) : 0;
                
                return (
                  <div key={sub.id} className="bg-brand-bg/40 p-5 rounded-3xl border border-brand-text-s/10 group hover:border-brand-primary transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                      <GraduationCap size={40} />
                    </div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-xs font-black text-brand-text-p uppercase tracking-tight">{sub.name}</h4>
                        <p className="text-[10px] font-bold text-brand-text-s">{sub.paper === 1 ? '1st Paper' : '2nd Paper'}</p>
                      </div>
                      <span className="text-sm font-black text-brand-primary">{perc}%</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-brand-bg rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={`h-full bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full transition-all duration-1000`} 
                          style={{ width: `${perc}%` }} 
                        />
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-black uppercase text-brand-text-s tracking-widest">
                        <span>{done} {t('অধ্যায়', 'Chapters')}</span>
                        <span>{total} {t('মোট', 'Total')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Activity Chart */}
          <section className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm">
            <h3 className="text-lg font-black mb-6 flex items-center gap-3"><History size={20} className="text-brand-secondary" /> {t('পড়াশোনার ইতিহাস', 'Weekly Activity')}</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userState.studyHistory.slice(-7).map(s => ({
                  name: new Date(s.startTime).toLocaleDateString([], { weekday: 'short' }),
                  minutes: Math.round(s.durationSeconds / 60)
                }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="minutes" fill="var(--brand-primary)" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {/* Exam Countdown Widget */}
          {countdowns.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-[10px] font-black uppercase text-brand-text-s tracking-widest ml-1">{t('আসন্ন পরীক্ষা', 'Exam Countdowns')}</h3>
              {countdowns.map((cd, idx) => (
                <div key={idx} className={`p-5 rounded-3xl border flex items-center justify-between shadow-sm transition-all ${cd.type === 'hsc' ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-brand-surface border-brand-text-s/10 text-brand-text-p'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-2xl ${cd.type === 'hsc' ? 'bg-white/20' : 'bg-brand-primary/10 text-brand-primary'}`}><Calendar size={20} /></div>
                    <div>
                      <p className="text-xs font-black truncate max-w-[120px]">{cd.name}</p>
                      <p className={`text-[8px] font-bold uppercase ${cd.type === 'hsc' ? 'text-white/60' : 'text-brand-text-s'}`}>{cd.type === 'hsc' ? 'National Board' : 'College Exam'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black leading-none">{cd.days}</p>
                    <p className={`text-[8px] font-bold uppercase ${cd.type === 'hsc' ? 'text-white/60' : 'text-brand-text-s'}`}>{t('দিন বাকি', 'Days Left')}</p>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Daily Tasks Widget */}
          <section className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black flex items-center gap-3"><ListTodo size={20} className="text-brand-primary" /> {t('ডেইলি টাস্ক', 'Today\'s Task')}</h3>
              <button onClick={() => setIsTaskModalOpen(true)} className="p-2 bg-brand-primary text-white rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all"><Plus size={16} /></button>
            </div>
            
            <div className="space-y-3">
              {userState.dailyTasks?.length > 0 ? userState.dailyTasks.map(task => (
                <div key={task.id} className={`p-4 rounded-2xl border transition-all ${task.isCompleted ? 'bg-emerald-500/5 border-emerald-500/20 shadow-sm' : 'bg-brand-bg/50 border-brand-text-s/10 hover:border-brand-primary/30'}`}>
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleTask(task.id)} className={`mt-0.5 shrink-0 transition-all active:scale-90 ${task.isCompleted ? 'text-emerald-500' : 'text-brand-text-s'}`}>
                      {task.isCompleted ? <CheckCircle size={20} /> : <Circle size={20} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold leading-tight ${task.isCompleted ? 'line-through opacity-50' : 'text-brand-text-p'}`}>{task.name}</p>
                      <p className="text-[9px] font-black uppercase text-brand-text-s mt-1 tracking-tighter opacity-80">{getSubjectName(task.subjectId)}</p>
                    </div>
                    <button onClick={() => onUpdateState(prev => ({ ...prev, dailyTasks: prev.dailyTasks.filter(t => t.id !== task.id) }))} className="text-brand-text-s hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                  {task.isCompleted && task.subjectId && task.chapterId && (
                    <button onClick={() => onTriggerTest(task.subjectId!, task.chapterId!)} className="w-full mt-4 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                      <GraduationCap size={16} /> {t('অধ্যায় যাচাই করো', 'Test This Chapter')}
                    </button>
                  )}
                </div>
              )) : (
                <div className="py-8 text-center bg-brand-bg/30 rounded-3xl border border-dashed border-brand-text-s/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-s opacity-50">{t('কোনো টাস্ক নেই', 'No tasks planned')}</p>
                </div>
              )}
            </div>
          </section>

          {/* Reminders Widget */}
          <section className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black flex items-center gap-3"><Bell size={20} className="text-orange-500" /> {t('রিমাইন্ডার', 'Alerts')}</h3>
              <button onClick={() => setIsReminderModalOpen(true)} className="p-2 bg-orange-500 text-white rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all"><Plus size={16} /></button>
            </div>
            
            <div className="space-y-3">
              {activeReminders.length > 0 ? activeReminders.map(rem => (
                <div key={rem.id} className="p-4 bg-white dark:bg-brand-surface rounded-2xl border border-brand-text-s/10 flex items-center justify-between group hover:border-orange-500/50 transition-all">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-brand-text-p truncate">{rem.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={10} className="text-brand-text-s" />
                      <span className="text-[9px] font-black text-brand-text-s uppercase">
                        {new Date(rem.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={async () => {
                      onUpdateState(prev => ({ ...prev, reminders: (prev.reminders || []).map(r => r.id === rem.id ? { ...r, isDone: true } : r) }));
                      try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user) {
                           await supabase.from('reminders').update({ is_done: true }).eq('title', rem.title).eq('user_id', user.id);
                        }
                      } catch (e) {}
                    }} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"><CheckCircle size={18} /></button>
                  </div>
                </div>
              )) : (
                <div className="py-8 text-center opacity-30">
                  <p className="text-[10px] font-black uppercase tracking-widest">{t('কোনো রিমাইন্ডার নেই', 'Quiet for now')}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Modals remain the same */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-brand-surface p-8 rounded-[3rem] shadow-2xl border border-brand-text-s/10">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-black text-brand-text-p uppercase tracking-widest">{t('নতুন টাস্ক', 'Add New Task')}</h4>
              <button onClick={() => setIsTaskModalOpen(false)} className="p-2 hover:bg-brand-bg rounded-xl text-brand-text-s"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <input type="text" value={newTask.name} onChange={e => setNewTask({...newTask, name: e.target.value})} placeholder={t("টাস্কের নাম লিখো", "e.g. Physics Math Ch 3")} className="w-full px-5 py-4 bg-brand-bg border-0 rounded-2xl font-bold outline-none ring-2 ring-transparent focus:ring-brand-primary/20 transition-all" />
              <select value={newTask.subjectId} onChange={e => setNewTask({...newTask, subjectId: e.target.value, chapterId: ''})} className="w-full px-5 py-4 bg-brand-bg border-0 rounded-2xl font-bold outline-none cursor-pointer">
                <option value="">{t('বিষয় (ঐচ্ছিক)', 'Subject (Optional)')}</option>
                {userState.subjects.map(s => <option key={s.id} value={s.id}>{s.name} (P{s.paper})</option>)}
              </select>
              {newTask.subjectId && (
                <select value={newTask.chapterId} onChange={e => setNewTask({...newTask, chapterId: e.target.value})} className="w-full px-5 py-4 bg-brand-bg border-0 rounded-2xl font-bold outline-none animate-in slide-in-from-top-2 cursor-pointer">
                  <option value="">{t('অধ্যায় (ঐচ্ছিক)', 'Chapter (Optional)')}</option>
                  {userState.subjects.find(s => s.id === newTask.subjectId)?.chapters.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                </select>
              )}
              <button onClick={addTask} className="w-full py-5 bg-brand-primary text-white font-black rounded-2xl shadow-xl shadow-brand-primary/20 uppercase tracking-widest text-[11px] mt-4 hover:scale-[1.02] active:scale-95 transition-all">{t('টাস্ক যোগ করো', 'Confirm Task')}</button>
            </div>
          </div>
        </div>
      )}

      {isReminderModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-brand-surface p-8 rounded-[3rem] shadow-2xl border border-brand-text-s/10">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-black text-brand-text-p uppercase tracking-widest">{t('নতুন রিমাইন্ডার', 'Set Reminder')}</h4>
              <button onClick={() => setIsReminderModalOpen(false)} className="p-2 hover:bg-brand-bg rounded-xl text-brand-text-s"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <input type="text" value={newReminder.title} onChange={e => setNewReminder({...newReminder, title: e.target.value})} placeholder={t("কি মনে করিয়ে দেব?", "Remind me about...")} className="w-full px-5 py-4 bg-brand-bg border-0 rounded-2xl font-bold outline-none" />
              <input type="datetime-local" value={newReminder.time} onChange={e => setNewReminder({...newReminder, time: e.target.value})} className="w-full px-5 py-4 bg-brand-bg border-0 rounded-2xl font-bold outline-none cursor-pointer" />
              <select value={newReminder.repeatType} onChange={e => setNewReminder({...newReminder, repeatType: e.target.value as any})} className="w-full px-5 py-4 bg-brand-bg border-0 rounded-2xl font-bold outline-none cursor-pointer">
                <option value="none">{t('কখনো না', 'No Repeat')}</option>
                <option value="daily">{t('প্রতিদিন', 'Repeat Daily')}</option>
                <option value="weekly">{t('প্রতি সপ্তাহে', 'Repeat Weekly')}</option>
              </select>
              <button 
                onClick={addReminder} 
                disabled={isAddingReminder}
                className="w-full py-5 bg-orange-500 text-white font-black rounded-2xl shadow-xl shadow-orange-500/20 uppercase tracking-widest text-[11px] mt-4 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {isAddingReminder ? <Loader2 className="animate-spin mx-auto" size={20} /> : t('সেভ করো', 'Save Alert')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;