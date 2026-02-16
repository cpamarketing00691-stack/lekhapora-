import React, { useMemo } from 'react';
import { useLekhapora } from '../contexts/LekhaporaContext';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Clock, Target, Flame, GraduationCap, Zap, ListTodo, Calendar, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPanel: React.FC = () => {
  const { state } = useLekhapora();
  const t = (bn: string, en: string) => state.settings.language === 'bn' ? bn : en;

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySeconds = state.studyHistory
      .filter(s => new Date(s.startTime).toISOString().split('T')[0] === today)
      .reduce((acc, s) => acc + s.durationSeconds, 0);
    
    const totalChapters = state.subjects.reduce((acc, s) => acc + (s.chapters?.length || 0), 0);
    const doneChapters = state.subjects.reduce((acc, s) => acc + (s.chapters?.filter(c => c.isCompleted).length || 0), 0);
    
    const readiness = totalChapters > 0 ? Math.round((doneChapters / totalChapters) * 100) : 0;

    return {
      todaySeconds,
      todayProgress: Math.min(100, Math.round((todaySeconds / state.settings.focusGoalSeconds) * 100)),
      readiness,
      totalChapters,
      doneChapters,
      radialData: [{ name: 'Readiness', value: readiness, fill: 'var(--brand-primary)' }]
    };
  }, [state]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Readiness Score */}
        <section className="lg:col-span-2 bg-brand-primary p-10 rounded-[3rem] text-white relative overflow-hidden shadow-xl shadow-brand-primary/20">
          <Zap className="absolute -right-8 -top-8 w-64 h-64 opacity-10 rotate-12" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left space-y-4">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">{t('প্রস্তুতি স্কোর', 'Readiness')}</h2>
              <p className="text-white/80 max-w-sm font-medium">{t('তোমার সিলেবাসের অগ্রগতির ওপর ভিত্তি করে এই স্কোরটি তৈরি হয়েছে।', 'Your readiness score based on NCTB syllabus completion.')}</p>
              <div className="flex gap-4 pt-4">
                <Link to="/app/exams" className="px-6 py-3 bg-white text-brand-primary rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">Take Test</Link>
              </div>
            </div>
            <div className="w-48 h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="80%" outerRadius="100%" data={stats.radialData} startAngle={90} endAngle={450}>
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar background dataKey="value" cornerRadius={20} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center font-black text-4xl">{stats.readiness}%</div>
            </div>
          </div>
        </section>

        {/* Daily Goal */}
        <section className="bg-brand-surface p-8 rounded-[3rem] border border-brand-text-s/10 shadow-sm flex flex-col justify-between">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><Clock className="text-brand-primary" /> {t('আজকের পড়া', 'Focus Goal')}</h3>
              <Flame className="text-orange-500 animate-pulse" />
           </div>
           <div className="space-y-2">
             <p className="text-4xl font-black text-brand-text-p">{formatTime(stats.todaySeconds)}</p>
             <div className="h-2 w-full bg-brand-bg rounded-full overflow-hidden">
                <div className="h-full bg-brand-primary transition-all duration-1000" style={{ width: `${stats.todayProgress}%` }} />
             </div>
             <p className="text-[10px] font-bold text-brand-text-s uppercase">{t('দৈনিক লক্ষ্য:', 'Daily Goal:')} {formatTime(state.settings.focusGoalSeconds)}</p>
           </div>
        </section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('অধ্যায় শেষ', 'Chapters Done'), val: stats.doneChapters, icon: Target, color: 'text-emerald-500' },
          { label: t('মোট টেস্ট', 'Total Tests'), val: state.testHistory.length, icon: GraduationCap, color: 'text-indigo-500' },
          { label: t('গড় মার্কস', 'Avg Accuracy'), val: '78%', icon: TrendingUp, color: 'text-brand-primary' },
          { label: t('বাকি টাস্ক', 'Tasks Left'), val: state.tasks.filter(t => !t.isCompleted).length, icon: ListTodo, color: 'text-orange-500' }
        ].map((s, i) => (
          <div key={i} className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm group hover:border-brand-primary transition-all">
            <s.icon className={`mb-4 ${s.color}`} size={24} />
            <p className="text-[10px] font-black uppercase text-brand-text-s tracking-widest">{s.label}</p>
            <p className="text-2xl font-black text-brand-text-p">{s.val}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardPanel;