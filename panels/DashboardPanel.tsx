
import React, { useMemo } from 'react';
import { UserState, Subject, Chapter, Task } from '../types';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Clock, Target, LayoutGrid, Flame, ArrowRight, BookOpen, GraduationCap, ListTodo, Plus, Calendar, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardPanelProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const DashboardPanel: React.FC<DashboardPanelProps> = ({ userState }) => {
  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayFocus = userState.studyHistory
      .filter(s => new Date(s.startTime).toISOString().split('T')[0] === today)
      .reduce((acc, curr) => acc + curr.durationSeconds, 0);

    const totalChapters = userState.subjects.reduce((acc, s) => acc + s.chapters.length, 0);
    const doneChapters = userState.subjects.reduce((acc, s) => acc + s.chapters.filter(c => c.isCompleted).length, 0);
    const completionRate = totalChapters > 0 ? Math.round((doneChapters / totalChapters) * 100) : 0;
    
    const progress = Math.min(100, Math.round((todayFocus / (6 * 3600)) * 100));

    return {
      todayFocus,
      completionRate,
      doneChapters,
      totalChapters,
      progress,
      radialData: [{ name: 'Progress', value: progress, fill: 'var(--brand-primary)' }]
    };
  }, [userState.studyHistory, userState.subjects]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Banner */}
      <section className="bg-brand-primary p-10 rounded-[3.5rem] shadow-2xl shadow-brand-primary/30 text-white relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[9px] font-black uppercase tracking-widest mb-4">
            <Flame size={12} className="animate-pulse" /> {userState.streaks} {t('দিনের স্ট্রিক!', 'Day Streak!')}
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-[0.9] mb-4">
            {t('পড়া শুরু করো,', 'Keep Pushing,')}<br />
            <span className="text-white/60 italic">{userState.profile?.fullName}!</span>
          </h2>
          <p className="text-white/80 font-medium leading-relaxed">
            {t('তোমার আজকের লক্ষ্য হচ্ছে ৬ ঘণ্টা মনোযোগ দিয়ে পড়া। ইতিমধ্যে তুমি ভালো করছ!', 'Your goal today is 6 hours of focused study. You are already making great progress!')}
          </p>
        </div>
        <div className="w-48 h-48 relative shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart innerRadius="80%" outerRadius="100%" data={stats.radialData} startAngle={90} endAngle={450}>
               <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
               <RadialBar background dataKey="value" cornerRadius={24} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-3xl font-black">{stats.progress}%</p>
            <p className="text-[9px] font-bold uppercase opacity-60 tracking-widest">{t('লক্ষ্য', 'Goal')}</p>
          </div>
        </div>
        <Target size={200} className="absolute -right-10 -bottom-10 opacity-10 rotate-12" />
      </section>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div className="bg-brand-surface p-8 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-600"><Clock size={24}/></div>
                    <div>
                      <p className="text-[10px] font-black text-brand-text-s uppercase tracking-widest">{t('আজকের ফোকাস', 'Today\'s Focus')}</p>
                      <h4 className="text-2xl font-black text-brand-text-p">{formatTime(stats.todayFocus)}</h4>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-brand-bg rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${stats.progress}%` }}></div>
                  </div>
               </div>

               <div className="bg-brand-surface p-8 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600"><Target size={24}/></div>
                    <div>
                      <p className="text-[10px] font-black text-brand-text-s uppercase tracking-widest">{t('সিলেবাস সম্পন্ন', 'Syllabus Done')}</p>
                      <h4 className="text-2xl font-black text-brand-text-p">{stats.completionRate}%</h4>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-brand-text-s uppercase tracking-tighter">
                    {stats.doneChapters} / {stats.totalChapters} {t('টি অধ্যায় শেষ', 'Chapters Completed')}
                  </p>
               </div>
            </div>

            <section className="bg-brand-surface p-8 rounded-[3rem] border border-brand-text-s/10 shadow-sm">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black flex items-center gap-3"><LayoutGrid size={24} className="text-brand-primary"/> {t('বিষয়ভিত্তিক অগ্রগতি', 'Subject Progress')}</h3>
                  <Link to="/app/syllabus" className="p-2 bg-brand-bg text-brand-primary rounded-xl hover:scale-110 transition-all"><ArrowRight size={18}/></Link>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userState.subjects.map(sub => {
                    const done = sub.chapters.filter(c => c.isCompleted).length;
                    const total = sub.chapters.length;
                    const perc = total > 0 ? Math.round((done/total)*100) : 0;
                    return (
                      <div key={sub.id} className="p-5 bg-brand-bg/40 rounded-3xl border border-brand-text-s/5 group hover:border-brand-primary transition-all">
                        <div className="flex justify-between items-start mb-3">
                           <div>
                              <p className="text-xs font-black uppercase text-brand-text-p tracking-tight">{sub.name}</p>
                              <p className="text-[9px] font-bold text-brand-text-s">Paper {sub.paper}</p>
                           </div>
                           <span className="text-sm font-black text-brand-primary">{perc}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-brand-bg rounded-full overflow-hidden shadow-inner">
                          <div className="h-full bg-brand-primary" style={{ width: `${perc}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
               </div>
            </section>
         </div>

         <div className="space-y-8">
            <section className="bg-brand-surface p-8 rounded-[3rem] border border-brand-text-s/10 shadow-sm">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black flex items-center gap-3"><ListTodo size={24} className="text-brand-primary"/> {t('টাস্ক লিস্ট', 'Tasks')}</h3>
                  <Link to="/app/calendar" className="p-2 bg-brand-primary/10 text-brand-primary rounded-xl hover:scale-110 transition-all"><Plus size={18}/></Link>
               </div>
               <div className="space-y-3">
                  {userState.dailyTasks.length > 0 ? userState.dailyTasks.slice(0, 5).map(task => (
                    <div key={task.id} className={`p-4 rounded-2xl border transition-all flex items-center gap-4 ${task.isCompleted ? 'bg-emerald-50/50 border-emerald-100 opacity-60' : 'bg-brand-bg border-transparent shadow-sm'}`}>
                       <div className={`w-2 h-2 rounded-full ${task.isCompleted ? 'bg-emerald-500' : 'bg-brand-text-s/30'}`}></div>
                       <p className={`text-xs font-bold truncate ${task.isCompleted ? 'line-through' : ''}`}>{task.name}</p>
                    </div>
                  )) : (
                    <div className="py-10 text-center opacity-30 text-[10px] font-black uppercase tracking-widest">{t('কোনো টাস্ক নেই', 'No pending tasks')}</div>
                  )}
               </div>
            </section>

            <section className="bg-brand-surface p-8 rounded-[3rem] border border-brand-text-s/10 shadow-sm">
               <h3 className="text-xl font-black flex items-center gap-3 mb-8"><Bell size={24} className="text-orange-500"/> {t('রিমাইন্ডার', 'Alerts')}</h3>
               <div className="space-y-3">
                  {userState.reminders && userState.reminders.length > 0 ? userState.reminders.filter(r => !r.isDone).slice(0, 3).map(rem => (
                    <div key={rem.id} className="p-4 bg-brand-bg rounded-2xl flex flex-col gap-1 border border-brand-text-s/5">
                       <p className="text-xs font-black text-brand-text-p truncate">{rem.title}</p>
                       <p className="text-[9px] font-bold text-brand-text-s uppercase">{new Date(rem.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  )) : (
                    <div className="py-6 text-center opacity-30 text-[10px] font-black uppercase tracking-widest">{t('শান্ত দুপুর!', 'Quiet for now')}</div>
                  )}
               </div>
            </section>
         </div>
      </div>
    </div>
  );
};

export default DashboardPanel;
