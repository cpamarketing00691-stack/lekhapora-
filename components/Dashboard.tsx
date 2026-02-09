import React, { useMemo, useState, useEffect } from 'react';
import { UserState, Subject, Task, TaskSource, Reminder } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, Activity, History, BookOpen, Clock, X, GraduationCap, ListTodo, Plus, Trash2, CheckCircle, Circle, Sparkles, PlayCircle, Flame, Target, Info, ChevronRight, Bell, BellOff, Calendar, AlertCircle, RefreshCw, Loader2, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { subscribeToPush, checkNotificationPermission } from '../lib/push-service';

interface DashboardProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
  onTriggerTest: (subjectId: string, chapterId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userState, onUpdateState, onTriggerTest }) => {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  
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
    const handleInstallAvailable = () => setShowInstallBanner(true);
    window.addEventListener('pwa-install-available', handleInstallAvailable);
    if ((window as any).deferredPrompt) setShowInstallBanner(true);
    return () => window.removeEventListener('pwa-install-available', handleInstallAvailable);
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = (window as any).deferredPrompt;
    if (!promptEvent) return;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
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

    const dailyGoalSeconds = 4 * 3600;
    const studyTimeFactor = Math.min(100, Math.round((todayFocusSeconds / dailyGoalSeconds) * 100));
    const score = Math.round((studyTimeFactor * 0.4) + (completionRate * 0.5) + ((userState.streaks || 0) * 2));

    return {
      totalFocus: formatDuration(allSessions.reduce((acc, curr) => acc + curr.durationSeconds, 0)),
      todayFocus: formatDuration(todayFocusSeconds),
      completion: completionRate,
      score: Math.min(100, score),
      readiness: score > 85 ? t('চমৎকার', 'Excellent') : score > 60 ? t('ভালো', 'Good') : t('চলমান', 'Steady')
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
      let permission = await checkNotificationPermission();
      
      if (permission === 'default') {
        const userAgreed = confirm(t("রিমাইন্ডার পেতে নোটিফিকেশন অ্যালাউ করা জরুরি। আপনি কি রাজি?", "Notification permission is required to send reminders. Do you agree?"));
        if (!userAgreed) {
          throw new Error(t("নোটিফিকেশন পারমিশন ছাড়া রিমাইন্ডার সেট করা সম্ভব নয়।", "Cannot set reminder without notification permission."));
        }
        permission = await Notification.requestPermission();
      }

      if (permission !== 'granted') {
        throw new Error(t("ব্রাউজার সেটিং থেকে নোটিফিকেশন অন করে আবার চেষ্টা করুন।", "Please enable notifications in your browser settings and try again."));
      }

      try {
        if ('serviceWorker' in navigator) {
           await subscribeToPush();
        }
      } catch (pushErr) {
        console.warn("Push sync failed, proceeding anyway:", pushErr);
      }

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
      alert(t("রিমাইন্ডার সফলভাবে সেট করা হয়েছে!", "Reminder set successfully!"));

    } catch (err: any) {
      console.error("Reminder Error:", err);
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
      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="bg-brand-primary text-white p-5 rounded-[2.5rem] shadow-xl shadow-brand-primary/20 flex items-center justify-between animate-in slide-in-from-top-4 mb-2">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                 <Download className="animate-bounce" size={24} />
              </div>
              <div>
                 <h4 className="font-black text-sm uppercase tracking-widest">{t('অ্যাপ ইনস্টল করো', 'Install StudyKori')}</h4>
                 <p className="text-[10px] font-bold opacity-80">{t('হোমস্ক্রিনে অ্যাড করে পড়াশোনা সহজ করো', 'Add to Home Screen for the best experience')}</p>
              </div>
           </div>
           <button onClick={handleInstallClick} className="px-6 py-2.5 bg-white text-brand-primary rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
             {t('ইনস্টল', 'Install')}
           </button>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-text-p">{userState.profile?.fullName}! {t('স্বাগতম', 'Welcome')}</h1>
          <p className="text-brand-text-s text-xs font-bold uppercase tracking-widest">{t('তোমার আজকের অগ্রগতির চিত্র', 'Daily Progress Overview')}</p>
        </div>
        <div className="flex items-center gap-3 bg-orange-500/10 text-orange-600 px-4 py-2 rounded-2xl border border-orange-500/20">
          <Flame size={18} className="animate-bounce" />
          <span className="text-xs font-black uppercase">{userState.streaks} {t('দিনের স্ট্রিক', 'Day Streak')}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black flex items-center gap-2"><BookOpen size={20} className="text-brand-primary" /> {t('সিলেবাস স্ট্যাটাস', 'Syllabus Status')}</h3>
              <span className="text-[10px] font-black uppercase text-brand-text-s">{stats.completion}% {t('সম্পন্ন', 'Completed')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userState.subjects.map(sub => {
                const total = sub.chapters?.length || 0;
                const done = sub.chapters?.filter(c => c.isCompleted).length || 0;
                const perc = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <div key={sub.id} className="bg-brand-bg/50 p-4 rounded-2xl border border-brand-text-s/5 group hover:border-brand-primary transition-all">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-brand-text-p">{sub.name} <span className="text-[10px] opacity-40">P{sub.paper}</span></span>
                      <span className="text-[10px] font-black text-brand-primary">{perc}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-brand-surface rounded-full overflow-hidden">
                      <div className="h-full bg-brand-primary rounded-full transition-all duration-1000" style={{ width: `${perc}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm">
            <h3 className="text-lg font-black mb-6 flex items-center gap-3"><History size={20} className="text-brand-secondary" /> {t('সাম্প্রতিক সেশন', 'Recent Sessions')}</h3>
            <div className="space-y-4">
              {userState.studyHistory.slice(0, 3).map((session) => (
                <div key={session.id} className="flex items-center gap-4 bg-brand-bg/30 p-4 rounded-2xl">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${session.isRevision ? 'bg-brand-secondary/10 text-brand-secondary' : 'bg-brand-primary/10 text-brand-primary'}`}><BookOpen size={18} /></div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-brand-text-p truncate">{getSubjectName(session.subjectId)}</h4>
                    <p className="text-[10px] font-bold text-brand-text-s">{formatDuration(session.durationSeconds)} • {session.mood}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {countdowns.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-[10px] font-black uppercase text-brand-text-s tracking-widest ml-1">{t('আসন্ন পরীক্ষা', 'Exam Countdowns')}</h3>
              {countdowns.map((cd, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm transition-all ${cd.type === 'hsc' ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white border-brand-text-s/10 text-brand-text-p'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${cd.type === 'hsc' ? 'bg-white/20' : 'bg-brand-primary/10 text-brand-primary'}`}><Calendar size={18} /></div>
                    <p className="text-xs font-black truncate max-w-[120px]">{cd.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black leading-none">{cd.days}</p>
                    <p className="text-[8px] font-bold uppercase opacity-60">{t('দিন বাকি', 'Days Left')}</p>
                  </div>
                </div>
              ))}
            </section>
          )}

          <section className="bg-brand-primary text-white p-8 rounded-[2.5rem] shadow-xl shadow-brand-primary/20 relative overflow-hidden">
            <Target size={60} className="absolute -right-4 -bottom-4 opacity-10" />
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">{t('এইচএসসি প্রস্তুতি স্কোর', 'HSC Readiness Score')}</p>
              <h2 className="text-5xl font-black">{stats.score}%</h2>
              <div className="mt-4 inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase">{stats.readiness}</div>
            </div>
          </section>

          <section className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black flex items-center gap-3"><ListTodo size={20} className="text-brand-primary" /> {t('ডেইলি টাস্ক', 'Daily Tasks')}</h3>
              <button onClick={() => setIsTaskModalOpen(true)} className="p-2 bg-brand-primary text-white rounded-xl shadow-lg hover:scale-105 transition-transform"><Plus size={16} /></button>
            </div>
            
            <div className="space-y-3">
              {userState.dailyTasks?.length > 0 ? userState.dailyTasks.map(task => (
                <div key={task.id} className={`p-4 rounded-2xl border transition-all ${task.isCompleted ? 'bg-emerald-50/20 border-emerald-100' : 'bg-brand-bg/50 border-brand-text-s/10'}`}>
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleTask(task.id)} className={`mt-0.5 shrink-0 ${task.isCompleted ? 'text-emerald-500' : 'text-brand-text-s'}`}>
                      {task.isCompleted ? <CheckCircle size={18} /> : <Circle size={18} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold leading-tight ${task.isCompleted ? 'line-through opacity-50' : 'text-brand-text-p'}`}>{task.name}</p>
                      <p className="text-[8px] font-black uppercase text-brand-text-s mt-1">{getSubjectName(task.subjectId)}</p>
                    </div>
                    <button onClick={() => onUpdateState(prev => ({ ...prev, dailyTasks: prev.dailyTasks.filter(t => t.id !== task.id) }))} className="text-brand-text-s hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                  {task.isCompleted && task.subjectId && task.chapterId && (
                    <button onClick={() => onTriggerTest(task.subjectId!, task.chapterId!)} className="w-full mt-3 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                      <GraduationCap size={16} /> {t('চলো তোমার পড়া চেক করো', 'Check Study')}
                    </button>
                  )}
                </div>
              )) : (
                <div className="py-6 text-center opacity-30">
                  <p className="text-[10px] font-black uppercase tracking-widest">{t('কোনো টাস্ক নেই', 'No tasks')}</p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black flex items-center gap-3"><Bell size={20} className="text-orange-500" /> {t('রিমাইন্ডার', 'Reminders')}</h3>
              <button onClick={() => setIsReminderModalOpen(true)} className="p-2 bg-orange-500 text-white rounded-xl shadow-lg hover:scale-105 transition-transform"><Plus size={16} /></button>
            </div>
            
            <div className="space-y-3">
              {activeReminders.length > 0 ? activeReminders.map(rem => (
                <div key={rem.id} className="p-4 bg-white rounded-2xl border border-brand-text-s/10 flex items-center justify-between group">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-brand-text-p truncate">{rem.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={10} className="text-brand-text-s" />
                      <span className="text-[9px] font-black text-brand-text-s uppercase">
                        {new Date(rem.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(rem.time).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                        {rem.repeatType && rem.repeatType !== 'none' && <span className="ml-2 inline-flex items-center gap-1"><RefreshCw size={8} /> {rem.repeatType}</span>}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={async () => {
                      onUpdateState(prev => ({ ...prev, reminders: (prev.reminders || []).map(r => r.id === rem.id ? { ...r, isDone: true } : r) }));
                      try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user) {
                           await supabase.from('reminders').update({ is_done: true }).eq('title', rem.title).eq('user_id', user.id);
                        }
                      } catch (e) {}
                    }} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"><CheckCircle size={16} /></button>
                    <button onClick={() => onUpdateState(prev => ({ ...prev, reminders: (prev.reminders || []).filter(r => r.id !== rem.id) }))} className="p-2 text-brand-text-s hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>
              )) : (
                <div className="py-6 text-center opacity-30">
                  <p className="text-[10px] font-black uppercase tracking-widest">{t('কোনো রিমাইন্ডার নেই', 'No reminders')}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-brand-surface p-8 rounded-[2rem] shadow-2xl border border-brand-text-s/10">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-black text-brand-text-p uppercase tracking-widest">{t('নতুন টাস্ক', 'New Task')}</h4>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-brand-text-s"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <input type="text" value={newTask.name} onChange={e => setNewTask({...newTask, name: e.target.value})} placeholder={t("টাস্কের নাম লিখো", "e.g. Physics Math Ch 3")} className="w-full px-4 py-3 bg-brand-bg border-0 rounded-xl font-bold outline-none" />
              <select value={newTask.subjectId} onChange={e => setNewTask({...newTask, subjectId: e.target.value, chapterId: ''})} className="w-full px-4 py-3 bg-brand-bg border-0 rounded-xl font-bold outline-none">
                <option value="">{t('বিষয় (ঐচ্ছিক)', 'Subject (Optional)')}</option>
                {userState.subjects.map(s => <option key={s.id} value={s.id}>{s.name} (P{s.paper})</option>)}
              </select>
              {newTask.subjectId && (
                <select value={newTask.chapterId} onChange={e => setNewTask({...newTask, chapterId: e.target.value})} className="w-full px-4 py-3 bg-brand-bg border-0 rounded-xl font-bold outline-none animate-in slide-in-from-top-2">
                  <option value="">{t('চ্যাপ্টার (ঐচ্ছিক)', 'Chapter (Optional)')}</option>
                  {userState.subjects.find(s => s.id === newTask.subjectId)?.chapters.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                </select>
              )}
              <button onClick={addTask} className="w-full py-4 bg-brand-primary text-white font-black rounded-2xl shadow-xl shadow-brand-primary/20 uppercase tracking-widest text-xs mt-4 hover:scale-[1.02] active:scale-95 transition-all">{t('টাস্ক যোগ করো', 'Add Task')}</button>
            </div>
          </div>
        </div>
      )}

      {isReminderModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-brand-surface p-8 rounded-[2rem] shadow-2xl border border-brand-text-s/10">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-black text-brand-text-p uppercase tracking-widest">{t('নতুন রিমাইন্ডার', 'New Reminder')}</h4>
              <button onClick={() => setIsReminderModalOpen(false)} className="text-brand-text-s"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-brand-text-s ml-1">{t('রিমাইন্ডার টাইটেল', 'Title')}</label>
                <input type="text" value={newReminder.title} onChange={e => setNewReminder({...newReminder, title: e.target.value})} placeholder={t("কি মনে করিয়ে দেব?", "Remind me about...")} className="w-full px-4 py-3 bg-brand-bg border-0 rounded-xl font-bold outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-brand-text-s ml-1">{t('সময় ও তারিখ', 'Date & Time')}</label>
                <input type="datetime-local" value={newReminder.time} onChange={e => setNewReminder({...newReminder, time: e.target.value})} className="w-full px-4 py-3 bg-brand-bg border-0 rounded-xl font-bold outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-brand-text-s ml-1">{t('পুনরাবৃত্তি', 'Repeat')}</label>
                <select value={newReminder.repeatType} onChange={e => setNewReminder({...newReminder, repeatType: e.target.value as any})} className="w-full px-4 py-3 bg-brand-bg border-0 rounded-xl font-bold outline-none">
                  <option value="none">{t('কখনো না', 'None')}</option>
                  <option value="daily">{t('প্রতিদিন', 'Daily')}</option>
                  <option value="weekly">{t('প্রতি সপ্তাহে', 'Weekly')}</option>
                </select>
              </div>
              <button 
                onClick={addReminder} 
                disabled={isAddingReminder}
                className="w-full py-4 bg-orange-500 text-white font-black rounded-2xl shadow-xl shadow-orange-500/20 uppercase tracking-widest text-xs mt-4 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {isAddingReminder ? <Loader2 className="animate-spin mx-auto" size={16} /> : t('সেভ করো', 'Save Reminder')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;