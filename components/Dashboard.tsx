
import React, { useMemo, useState } from 'react';
import { UserState, Subject, CollegeExam, Task, TaskSource, StudySession, Reminder } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { TrendingUp, Activity, History, BookOpen, Clock, Coffee, Calendar, X, GraduationCap, ListTodo, Plus, Trash2, CheckCircle, Circle, Sparkles, PlayCircle, Flame, Battery, Wind, AlertCircle, Brain, Bell, ExternalLink, Target, Info } from 'lucide-react';

interface DashboardProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
  onTriggerTest: (subjectId: string, chapterId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userState, onUpdateState, onTriggerTest }) => {
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [examFilter, setExamFilter] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [reminderModalTarget, setReminderModalTarget] = useState<{id: string, name: string} | null>(null);
  const [reminderTime, setReminderTime] = useState('');
  
  const [newTask, setNewTask] = useState({ 
    name: '', 
    source: TaskSource.PERSONAL,
    subjectId: '',
    chapterId: ''
  });
  
  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  const getLocalDateString = (timestamp: number) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const weeklyChartData = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = getLocalDateString(d.getTime());
      days.push({
        dateStr,
        label: d.toLocaleDateString(userState.language === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'short' }),
        study: 0,
        revision: 0
      });
    }
    const history = Array.isArray(userState.studyHistory) ? userState.studyHistory : [];
    history.forEach(session => {
      const sDate = getLocalDateString(session.startTime);
      const dayData = days.find(d => d.dateStr === sDate);
      if (dayData) {
        const hours = session.durationSeconds / 3600;
        if (session.isRevision) dayData.revision += hours;
        else dayData.study += hours;
      }
    });
    if (userState.activeTimer) {
      const sDate = getLocalDateString(userState.activeTimer.lastTimestamp);
      const dayData = days.find(d => d.dateStr === sDate);
      if (dayData) {
        const hours = userState.activeTimer.accumulatedFocusSeconds / 3600;
        if (userState.activeTimer.isRevision) dayData.revision += hours;
        else dayData.study += hours;
      }
    }
    return days.map(d => ({
      ...d,
      study: parseFloat(d.study.toFixed(1)),
      revision: parseFloat(d.revision.toFixed(1))
    }));
  }, [userState.studyHistory, userState.activeTimer, userState.language]);

  const formatDuration = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  const stats = useMemo(() => {
    const today = getLocalDateString(Date.now());
    const allSessions = Array.isArray(userState.studyHistory) ? userState.studyHistory : [];
    const todayFocusSeconds = allSessions
      .filter(s => getLocalDateString(s.startTime) === today)
      .reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0) + (userState.activeTimer?.accumulatedFocusSeconds || 0);

    const dailyGoalSeconds = 4 * 3600; 
    const studyTimeFactor = Math.min(100, Math.round((todayFocusSeconds / dailyGoalSeconds) * 100)); 

    const rawSubjects = Array.isArray(userState.subjects) ? userState.subjects : [];
    const totalChapters = rawSubjects.reduce((acc, curr) => acc + (curr.chapters?.length || 0), 0);
    const completedChapters = rawSubjects.reduce((acc, curr) => acc + (curr.chapters?.filter(c => c.isCompleted).length || 0), 0);
    const completionRate = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

    const finalScore = Math.round((studyTimeFactor * 0.4) + (completionRate * 0.4) + ((userState.streaks || 0) * 2));

    return {
      totalDisplay: formatDuration(allSessions.reduce((acc, curr) => acc + curr.durationSeconds, 0)),
      todayDisplay: formatDuration(todayFocusSeconds),
      score: Math.min(100, finalScore),
      readinessLabel: finalScore > 85 ? t('চমৎকার', 'Excellent') : finalScore > 60 ? t('ভালো', 'Good') : finalScore > 30 ? t('চলমান', 'Steady') : t('শুরু', 'Starting'),
      factors: { study: studyTimeFactor, completion: completionRate, consistency: Math.min(100, (userState.streaks || 0) * 10), revision: 0 }
    };
  }, [userState.studyHistory, userState.subjects, userState.streaks, userState.language, userState.activeTimer]);

  const addTask = () => {
    if (!newTask.name.trim()) return;
    const task: Task = {
      id: `task-${Date.now()}`,
      name: newTask.name.trim(),
      source: newTask.source,
      isCompleted: false,
      // Normalize empty strings to undefined to ensure truthy checks work in rendering
      subjectId: newTask.subjectId || undefined,
      chapterId: newTask.chapterId || undefined,
      createdAt: Date.now()
    };
    onUpdateState(prev => ({ ...prev, dailyTasks: [...(prev.dailyTasks || []), task] }));
    setNewTask({ name: '', source: TaskSource.PERSONAL, subjectId: '', chapterId: '' });
    setIsTaskModalOpen(false);
  };

  const toggleTask = (id: string) => {
    onUpdateState(prev => ({
      ...prev,
      dailyTasks: prev.dailyTasks.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)
    }));
  };

  const deleteTask = (id: string) => {
    onUpdateState(prev => ({
      ...prev,
      dailyTasks: prev.dailyTasks.filter(t => t.id !== id)
    }));
  };

  const getSubjectName = (id: string) => {
    const sub = userState.subjects.find(s => s.id === id);
    return sub ? `${sub.name} (P${sub.paper})` : t('সাধারণ পড়া', 'General');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-brand-text-p">{userState.profile?.fullName}! {t('তোমার ড্যাশবোর্ড', 'Your Dashboard')}</h1>
          <p className="text-brand-text-s font-medium text-[10px] sm:text-xs mt-1 leading-tight">{t('তোমার প্রস্তুতির বর্তমান চিত্র।', 'Your academic progress overview.')}</p>
        </div>
        <div className="flex flex-wrap gap-2 self-start md:self-center">
          <div className="px-4 py-2 rounded-2xl flex items-center gap-2 border border-orange-500/20 shadow-sm bg-orange-500/10 text-orange-600">
            <Flame size={18} fill="currentColor" className="animate-bounce" />
            <span className="text-[10px] font-black uppercase tracking-widest">{userState.streaks} {t('দিনের স্ট্রিক', 'Day Streak')}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-brand-surface p-6 sm:p-8 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2"><TrendingUp size={20} /> {t('সাপ্তাহিক অ্যাক্টিভিটি', 'Weekly Activity')}</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgb(var(--brand-text-s))' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgb(var(--brand-text-s))' }} unit="h" />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="study" stackId="a" fill="rgb(var(--brand-primary))" radius={[0, 0, 0, 0]} barSize={24} />
                  <Bar dataKey="revision" stackId="a" fill="rgb(var(--brand-secondary))" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm">
            <h3 className="text-lg font-black mb-6 flex items-center gap-3"><History size={20} /> {t('সাম্প্রতিক অ্যাক্টিভিটি', 'Recent Activity')}</h3>
            <div className="space-y-4">
              {userState.studyHistory.slice(0, 5).map((session) => (
                <div key={session.id} className="flex gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-brand-text-s/10 ${session.isRevision ? 'bg-brand-secondary/10 text-brand-secondary' : 'bg-brand-primary/10 text-brand-primary'}`}><BookOpen size={18} /></div>
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
          <section className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black flex items-center gap-3"><ListTodo size={20} /> {t('লক্ষ্য / টাস্ক', 'Focus Tasks')}</h3>
              <button onClick={() => setIsTaskModalOpen(true)} className="p-2 bg-brand-primary text-white rounded-xl"><Plus size={16} /></button>
            </div>
            
            <div className="space-y-3">
              {userState.dailyTasks.length > 0 ? userState.dailyTasks.map(task => (
                <div key={task.id} className={`p-4 rounded-2xl border transition-all ${task.isCompleted ? 'bg-emerald-50/20 border-emerald-100' : 'bg-brand-bg/50 border-brand-text-s/10'}`}>
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleTask(task.id)} className={`mt-0.5 shrink-0 ${task.isCompleted ? 'text-emerald-500' : 'text-brand-text-s'}`}>
                      {task.isCompleted ? <CheckCircle size={18} /> : <Circle size={18} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold ${task.isCompleted ? 'line-through opacity-50' : ''}`}>{task.name}</p>
                      <p className="text-[8px] font-black uppercase text-brand-text-s mt-1">{task.source}</p>
                    </div>
                    <button onClick={() => deleteTask(task.id)} className="text-brand-text-s hover:text-red-500"><Trash2 size={14} /></button>
                  </div>

                  {task.isCompleted && task.subjectId && task.chapterId && (
                    <button 
                      onClick={() => onTriggerTest(task.subjectId!, task.chapterId!)}
                      className="w-full mt-3 py-2 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      <GraduationCap size={14} />
                      {t('চলো তোমার পড়া চেক করো', 'Check Study')}
                    </button>
                  )}
                </div>
              )) : (
                <div className="py-10 text-center opacity-30">
                  <Info className="mx-auto mb-2" size={24} />
                  <p className="text-[10px] font-black uppercase">{t('কোনো টাস্ক নেই', 'No tasks')}</p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-brand-primary text-white p-6 rounded-[2.5rem] shadow-xl shadow-brand-primary/20">
             <div className="flex items-center justify-between mb-4">
                <Target size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">{stats.readinessLabel}</span>
             </div>
             <h2 className="text-4xl font-black">{stats.score}%</h2>
             <p className="text-[10px] font-bold opacity-80 uppercase mt-1">{t('এইচএসসি প্রস্তুতি', 'HSC Readiness Score')}</p>
          </section>
        </div>
      </div>

      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
             <div className="w-full max-w-md bg-brand-surface p-8 rounded-[2rem] shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-black text-brand-text-p uppercase tracking-widest">{t('নতুন টাস্ক', 'New Task')}</h4>
                  <button onClick={() => setIsTaskModalOpen(false)} className="text-brand-text-s"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                   <input 
                     type="text" 
                     value={newTask.name}
                     onChange={e => setNewTask({...newTask, name: e.target.value})}
                     placeholder={t("টাস্কের নাম লিখো", "Task Name")}
                     className="w-full px-4 py-3 bg-brand-bg border-0 rounded-xl font-bold outline-none"
                   />
                   <select 
                     value={newTask.subjectId} 
                     onChange={e => setNewTask({...newTask, subjectId: e.target.value, chapterId: ''})}
                     className="w-full px-4 py-3 bg-brand-bg border-0 rounded-xl font-bold outline-none"
                   >
                     <option value="">{t('বিষয় (ঐচ্ছিক)', 'Subject (Optional)')}</option>
                     {userState.subjects.map(s => <option key={s.id} value={s.id}>{s.name} (P{s.paper})</option>)}
                   </select>
                   {newTask.subjectId && (
                     <select 
                       value={newTask.chapterId} 
                       onChange={e => setNewTask({...newTask, chapterId: e.target.value})}
                       className="w-full px-4 py-3 bg-brand-bg border-0 rounded-xl font-bold outline-none"
                     >
                       <option value="">{t('চ্যাপ্টার (ঐচ্ছিক)', 'Chapter (Optional)')}</option>
                       {userState.subjects.find(s => s.id === newTask.subjectId)?.chapters.map(ch => (
                         <option key={ch.id} value={ch.id}>{ch.name}</option>
                       ))}
                     </select>
                   )}
                   <div className="flex gap-2">
                     {Object.values(TaskSource).map(source => (
                       <button 
                         key={source}
                         onClick={() => setNewTask({...newTask, source})}
                         className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase border-2 transition-all ${newTask.source === source ? 'bg-brand-primary border-brand-primary text-white' : 'border-brand-text-s/10 text-brand-text-s'}`}
                       >
                         {source}
                       </button>
                     ))}
                   </div>
                   <button onClick={addTask} className="w-full py-4 bg-brand-primary text-white font-black rounded-2xl shadow-xl shadow-brand-primary/20 uppercase tracking-widest text-xs mt-4">
                     {t('টাস্ক যোগ করো', 'Add Task')}
                   </button>
                </div>
             </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
