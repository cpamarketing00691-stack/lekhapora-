import React, { useMemo } from 'react';
import { useLekhapora } from '../contexts/LekhaporaContext';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Clock, Target, Flame, GraduationCap, ChevronRight, Zap, ListTodo, Plus, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPanel: React.FC = () => {
  const { state } = useLekhapora();
  const t = (bn: string, en: string) => state.settings.language === 'bn' ? bn : en;

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = state.studyHistory.filter(s => 
      new Date(s.startTime).toISOString().split('T')[0] === today
    );
    const todaySeconds = todaySessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    
    const totalChapters = state.subjects.reduce((acc, s) => acc + (s.chapters?.length || 0), 0);
    const doneChapters = state.subjects.reduce((acc, s) => acc + (s.chapters?.filter(c => c.isCompleted).length || 0), 0);
    const syllabusCompletion = totalChapters > 0 ? doneChapters / totalChapters : 0;

    const focusConsistency = Math.min(1, todaySeconds / state.settings.focusGoalSeconds);
    const readiness = Math.round((syllabusCompletion * 0.6 + focusConsistency * 0.4) * 100);

    return {
      todaySeconds,
      todayProgress: Math.min(100, Math.round((todaySeconds / state.settings.focusGoalSeconds) * 100)),
      readiness,
      totalChapters,
      doneChapters,
      radialData: [{ name: 'Focus', value: Math.min(100, (todaySeconds / state.settings.focusGoalSeconds) * 100), fill: 'var(--brand-primary)' }]
    };
  }, [state]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const QuickAction = ({ to, icon: Icon, title, desc, color }: any) => (
    <Link to={to} className={`${color} p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm group hover:scale-[1.02] active:scale-95 transition-all flex flex-col justify-between h-48`}>
      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
        <Icon size={24} />
      </div>
      <div>
        <h4 className="font-black text-white text-lg leading-tight mb-1">{title}</h4>
        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{desc}</p>
      </div>
    </Link>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Hero Section */}
      <section className="bg-brand-primary p-10 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl shadow-brand-primary/20">
        <Zap className="absolute -right-8 -top-8 w-64 h-64 opacity-10 rotate-12" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
              <Flame size={14} className="animate-pulse" /> {t('অপ্রতিরোধ্য প্রস্তুতি!', 'Unstoppable Prep!')}
            </div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]">
              {t('প্রস্তুতি স্কোর', 'Readiness')}<br />
              <span className="text-white/60 italic">{stats.readiness}%</span>
            </h2>
            <p className="text-white/80 font-medium max-w-sm text-sm">
              {t('তোমার সিলেবাস ও আজকের পড়ার সময় অনুযায়ী হিসাব করা হয়েছে।', 'Calculated based on your syllabus progress and today\'s focus time.')}
            </p>
          </div>
          
          <div className="w-56 h-56 relative shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="80%" outerRadius="100%" data={stats.radialData} startAngle={90} endAngle={450}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={24} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black">{stats.todayProgress}%</span>
              <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{t('লক্ষ্য', 'Goal')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickAction 
          to="/app/tracker" 
          icon={Clock} 
          title={t('পড়া শুরু করি', 'Focus Now')} 
          desc={t('ডিপ স্টাডি সেশন', 'Deep study session')} 
          color="bg-brand-primary" 
        />
        <QuickAction 
          to="/app/exams" 
          icon={GraduationCap} 
          title={t('মডেল টেস্ট', 'Take Test')} 
          desc={t('নিজের দক্ষতা যাচাই', 'Verify your skills')} 
          color="bg-indigo-600" 
        />
        <QuickAction 
          to="/app/syllabus" 
          icon={Target} 
          title={t('সিলেবাস', 'Syllabus')} 
          desc={t('অধ্যায় সম্পন্ন করো', 'Complete chapters')} 
          color="bg-emerald-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           {/* Progress Detail */}
           <section className="bg-brand-surface p-8 rounded-[3rem] border border-brand-text-s/10 shadow-sm">
              <div className="flex items-center justify-between mb-8 px-2">
                 <h3 className="text-xl font-black flex items-center gap-3"><Target className="text-brand-primary"/> {t('সিলেবাস বিস্তারিত', 'Syllabus Breakdown')}</h3>
                 <span className="text-[10px] font-black text-brand-text-s uppercase">{stats.doneChapters} / {stats.totalChapters} {t('অধ্যায়', 'Chapters')}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {state.subjects.slice(0, 4).map(sub => {
                  const done = sub.chapters?.filter(c => c.isCompleted).length || 0;
                  const total = sub.chapters?.length || 0;
                  const perc = total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <div key={sub.id} className="p-6 bg-brand-bg/50 rounded-2xl border border-brand-text-s/5 group hover:border-brand-primary transition-all">
                       <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-xs font-black uppercase text-brand-text-p tracking-tight">{sub.name}</p>
                            <p className="text-[9px] font-bold text-brand-text-s">Paper {sub.paper}</p>
                          </div>
                          <span className="text-sm font-black text-brand-primary">{perc}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-brand-surface rounded-full overflow-hidden shadow-inner">
                          <div className="h-full bg-brand-primary rounded-full transition-all duration-1000" style={{ width: `${perc}%` }} />
                       </div>
                    </div>
                  );
                })}
              </div>
           </section>
        </div>

        {/* Task & Sidebar */}
        <div className="space-y-8">
           <section className="bg-brand-surface p-8 rounded-[3rem] border border-brand-text-s/10 shadow-sm">
              <div className="flex items-center justify-between mb-8 px-2">
                 <h3 className="text-xl font-black flex items-center gap-3"><ListTodo className="text-brand-primary"/> {t('ডেইলি টাস্ক', 'Tasks')}</h3>
                 <button className="p-2 bg-brand-bg rounded-xl text-brand-text-s hover:text-brand-primary"><Plus size={18}/></button>
              </div>
              <div className="space-y-4">
                 {state.tasks.length > 0 ? state.tasks.slice(0, 5).map(task => (
                    <div key={task.id} className="flex items-center gap-4 p-4 bg-brand-bg/50 rounded-2xl border border-transparent hover:border-brand-primary/20 transition-all">
                       <div className={`w-2 h-2 rounded-full ${task.isCompleted ? 'bg-emerald-500' : 'bg-brand-text-s/30'}`} />
                       <p className={`text-xs font-bold truncate ${task.isCompleted ? 'line-through opacity-50' : 'text-brand-text-p'}`}>{task.name}</p>
                    </div>
                 )) : (
                    <div className="py-10 text-center opacity-30">
                       <p className="text-[10px] font-black uppercase tracking-widest">{t('কোনো টাস্ক নেই', 'No tasks today')}</p>
                    </div>
                 )}
              </div>
           </section>

           <section className="bg-brand-surface p-8 rounded-[3rem] border border-brand-text-s/10 shadow-sm">
              <h3 className="text-xl font-black flex items-center gap-3 mb-8"><Calendar className="text-brand-primary"/> {t('আসন্ন পরীক্ষা', 'Deadlines')}</h3>
              <div className="space-y-4">
                 {state.user.profile?.collegeExams?.slice(0, 3).map(ex => (
                    <div key={ex.id} className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                       <p className="text-xs font-black text-brand-text-p">{ex.name}</p>
                       <p className="text-[9px] font-bold text-brand-text-s uppercase mt-1">{ex.date}</p>
                    </div>
                 ))}
                 {!state.user.profile?.collegeExams?.length && (
                    <p className="text-[10px] font-bold text-brand-text-s uppercase text-center py-4">{t('কোনো পরীক্ষা নেই', 'No exams listed')}</p>
                 )}
              </div>
           </section>
        </div>
      </div>
    </div>
  );
};

export default DashboardPanel;