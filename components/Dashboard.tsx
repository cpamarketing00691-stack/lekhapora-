import React, { useMemo, useState } from 'react';
import { UserState, Task, TaskSource, Reminder } from '../types';
import { BookOpen, History, Clock, X, GraduationCap, ListTodo, Plus, Trash2, CheckCircle, Circle, Flame, Target, Calendar, Bell, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
  onTriggerTest: (subjectId: string, chapterId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userState, onUpdateState, onTriggerTest }) => {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ name: '', source: TaskSource.PERSONAL });
  const [newReminder, setNewReminder] = useState({ title: '', time: '' });
  
  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  const formatDuration = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const history = userState.studyHistory || [];
    const todayFocus = history.filter(s => new Date(s.startTime).toISOString().split('T')[0] === todayStr).reduce((a, c) => a + (c.durationSeconds || 0), 0) + (userState.activeTimer?.accumulatedFocusSeconds || 0);
    
    const subjects = userState.subjects || [];
    const totalChapters = subjects.reduce((a, c) => a + (c.chapters?.length || 0), 0);
    const doneChapters = subjects.reduce((a, c) => a + (c.chapters?.filter(ch => ch.isCompleted).length || 0), 0);
    const completionRate = totalChapters > 0 ? Math.round((doneChapters / totalChapters) * 100) : 0;
    
    const tasksDone = userState.dailyTasks?.filter(t => t.isCompleted).length || 0;
    const taskFactor = userState.dailyTasks?.length ? (tasksDone / userState.dailyTasks.length) * 10 : 0;
    
    const studyFactor = Math.min(100, Math.round((todayFocus / 14400) * 100));
    const score = Math.min(100, Math.round((studyFactor * 0.3) + (completionRate * 0.5) + (userState.streaks * 2) + taskFactor));
    
    return {
      todayFocus: formatDuration(todayFocus),
      completion: completionRate,
      score,
      readiness: score > 85 ? t('চমৎকার', 'Excellent') : score > 60 ? t('ভালো', 'Good') : t('চলমান', 'Steady')
    };
  }, [userState]);

  const countdowns = useMemo(() => {
    const list = [];
    const now = new Date();
    now.setHours(0,0,0,0);
    
    if (userState.profile?.targetExamDate) {
      const diff = Math.ceil((new Date(userState.profile.targetExamDate).getTime() - now.getTime()) / 86400000);
      if (diff >= 0) list.push({ name: t('এইচএসসি পরীক্ষা', 'HSC Exam'), days: diff, type: 'hsc' });
    }
    
    (userState.profile?.collegeExams || []).forEach(ex => {
      const diff = Math.ceil((new Date(ex.date).getTime() - now.getTime()) / 86400000);
      if (diff >= 0) list.push({ name: ex.name, days: diff, type: 'college' });
    });
    
    return list.sort((a, b) => a.days - b.days).slice(0, 3);
  }, [userState.profile, userState.language]);

  const addTask = () => {
    if (!newTask.name.trim()) return;
    const task: Task = {
      id: `task-${Date.now()}`,
      name: newTask.name.trim(),
      source: newTask.source,
      isCompleted: false,
      createdAt: Date.now()
    };
    onUpdateState(prev => ({ ...prev, dailyTasks: [...prev.dailyTasks, task] }));
    setNewTask({ name: '', source: TaskSource.PERSONAL });
    setIsTaskModalOpen(false);
  };

  const getSubjectName = (id?: string) => {
    const sub = userState.subjects.find(s => s.id === id);
    return sub ? `${sub.name} (P${sub.paper})` : t('সাধারণ পড়া', 'General');
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-700">
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
              {userState.subjects.slice(0, 4).map(sub => {
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
              {userState.studyHistory.slice(-3).reverse().map((session) => (
                <div key={session.id} className="flex items-center gap-4 bg-brand-bg/30 p-4 rounded-2xl">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${session.isRevision ? 'bg-brand-secondary/10 text-brand-secondary' : 'bg-brand-primary/10 text-brand-primary'}`}><Clock size={18} /></div>
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
          <section className="bg-brand-primary text-white p-8 rounded-[2.5rem] shadow-xl shadow-brand-primary/20 relative overflow-hidden">
            <Target size={60} className="absolute -right-4 -bottom-4 opacity-10" />
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">{t('এইচএসসি প্রস্তুতি স্কোর', 'HSC Readiness Score')}</p>
              <h2 className="text-5xl font-black">{stats.score}%</h2>
              <div className="mt-4 inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase">{stats.readiness}</div>
            </div>
          </section>

          {/* Restored Countdown Section */}
          <section className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm">
            <h3 className="text-lg font-black flex items-center gap-3 mb-4"><Calendar size={18} className="text-brand-primary" /> {t('পরীক্ষার সময়রেখা', 'Exam Timeline')}</h3>
            <div className="space-y-3">
              {countdowns.map((cd, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-brand-bg rounded-xl border border-brand-text-s/5">
                  <div>
                    <p className="text-[10px] font-black text-brand-text-s uppercase tracking-widest">{cd.type === 'hsc' ? 'MAIN' : 'COLLEGE'}</p>
                    <p className="text-xs font-bold text-brand-text-p">{cd.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-brand-primary">{cd.days}</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-brand-text-s">{t('দিন বাকি', 'Days Left')}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black flex items-center gap-3"><ListTodo size={20} className="text-brand-primary" /> {t('টাস্ক', 'Tasks')}</h3>
              <button onClick={() => setIsTaskModalOpen(true)} className="p-2 bg-brand-primary text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"><Plus size={16} /></button>
            </div>
            <div className="space-y-3">
              {userState.dailyTasks.filter(t => !t.isCompleted).map(task => (
                <div key={task.id} className="p-4 bg-brand-bg rounded-2xl border border-brand-text-s/10 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <button onClick={() => onUpdateState(prev => ({ ...prev, dailyTasks: prev.dailyTasks.map(t => t.id === task.id ? { ...t, isCompleted: true } : t) }))} className="text-brand-text-s hover:text-brand-primary transition-all"><Circle size={18} /></button>
                    <p className="text-xs font-bold text-brand-text-p">{task.name}</p>
                  </div>
                  <button onClick={() => onUpdateState(prev => ({ ...prev, dailyTasks: prev.dailyTasks.filter(t => t.id !== task.id) }))} className="text-brand-text-s hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-brand-surface p-8 rounded-[2rem] shadow-2xl border border-brand-text-s/10">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-black text-brand-text-p uppercase tracking-widest">{t('নতুন টাস্ক', 'New Task')}</h4>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-brand-text-s hover:text-brand-text-p"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <input type="text" value={newTask.name} onChange={e => setNewTask({...newTask, name: e.target.value})} placeholder={t("টাস্কের নাম লিখো", "e.g. Physics Ch 3 Math")} className="w-full px-4 py-3 bg-brand-bg rounded-xl font-bold outline-none border-2 border-transparent focus:border-brand-primary transition-all" />
              <button onClick={addTask} className="w-full py-4 bg-brand-primary text-white font-black rounded-2xl shadow-xl shadow-brand-primary/20 uppercase tracking-widest text-xs active:scale-95 transition-all">Add Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;