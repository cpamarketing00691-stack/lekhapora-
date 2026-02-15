import React, { useMemo, useState, useEffect } from 'react';
import { useLekhapora } from '../contexts/LekhaporaContext';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Clock, Target, Flame, GraduationCap, ChevronRight, TrendingUp, Zap, RefreshCw, WifiOff, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLoadingTimeout } from '../hooks/useLoadingTimeout';

const DashboardPanel: React.FC = () => {
  const { state } = useLekhapora();
  const [initialLoading, setInitialLoading] = useState(true);
  const timedOut = useLoadingTimeout(initialLoading, 8000);
  const t = (bn: string, en: string) => state.settings.language === 'bn' ? bn : en;

  useEffect(() => {
    // Simulate data resolution check
    if (state.user.profile) {
      setInitialLoading(false);
    }
  }, [state.user.profile]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = state.studyHistory.filter(s => 
      new Date(s.startTime).toISOString().split('T')[0] === today
    );
    const todaySeconds = todaySessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    
    const totalChapters = state.subjects.reduce((acc, s) => acc + s.chapters.length, 0);
    const doneChapters = state.subjects.reduce((acc, s) => acc + s.chapters.filter(c => c.isCompleted).length, 0);
    const syllabusCompletion = totalChapters > 0 ? doneChapters / totalChapters : 0;

    const focusConsistency = Math.min(1, todaySeconds / state.settings.focusGoalSeconds);
    const readiness = Math.round((syllabusCompletion * 0.5 + focusConsistency * 0.5) * 100);

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

  if (timedOut && initialLoading) {
    return (
      <div className="h-full flex items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="w-full max-w-md bg-brand-surface p-10 rounded-[3rem] border border-brand-text-s/10 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 bg-amber-500/10 text-amber-600 mx-auto rounded-full flex items-center justify-center">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-xl font-black text-brand-text-p">{t('কানেকশন ধীরগতি...', 'Connection is slow...')}</h2>
          <p className="text-xs font-medium text-brand-text-s">{t('সার্ভারের সাথে সিঙ্ক করতে সমস্যা হচ্ছে। আপনি কি অফলাইনে চালিয়ে যেতে চান?', 'Having trouble syncing with the server. Do you want to continue offline?')}</p>
          <div className="flex flex-col gap-3">
             <button onClick={() => window.location.reload()} className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black uppercase text-xs shadow-lg flex items-center justify-center gap-2">
               <RefreshCw size={16}/> {t('আবার চেষ্টা করুন', 'Retry Sync')}
             </button>
             <button onClick={() => setInitialLoading(false)} className="w-full py-4 bg-brand-bg text-brand-text-p rounded-2xl font-black uppercase text-xs border border-brand-text-s/10 flex items-center justify-center gap-2">
               <WifiOff size={16}/> {t('অফলাইন মোড', 'Continue Offline')}
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Hero: Readiness Score */}
      <section className="bg-brand-primary p-10 rounded-[4rem] text-white relative overflow-hidden shadow-2xl shadow-brand-primary/20">
        <Zap className="absolute -right-10 -top-10 w-64 h-64 opacity-10 rotate-12" />
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">
              <Flame size={14} className="animate-pulse" /> {t('অপ্রতিরোধ্য স্ট্রিক!', 'Unstoppable Streak!')}
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9]">
              {t('প্রস্তুতির হার', 'Readiness')}<br />
              <span className="text-white/60 italic">{stats.readiness}%</span>
            </h2>
            <p className="text-white/80 font-medium max-w-sm">
              {t('তোমার সিলেবাস ও পড়ার সময় অনুযায়ী আজকের স্কোর।', 'Your score based on syllabus mastery and focus consistency.')}
            </p>
          </div>
          
          <div className="flex justify-center md:justify-end">
            <div className="w-48 h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="80%" outerRadius="100%" data={stats.radialData} startAngle={90} endAngle={450}>
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar background dataKey="value" cornerRadius={24} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black">{stats.todayProgress}%</span>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-60">{t('লক্ষ্য', 'Goal')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid: Core Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-brand-surface p-8 rounded-[3rem] border border-brand-text-s/10 shadow-sm group hover:border-brand-primary transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform"><Clock size={28}/></div>
                <div>
                  <p className="text-[10px] font-black text-brand-text-s uppercase tracking-widest">{t('আজকের ফোকাস', 'Today\'s Focus')}</p>
                  <h4 className="text-3xl font-black text-brand-text-p">{formatTime(stats.todaySeconds)}</h4>
                </div>
              </div>
              <div className="h-2 w-full bg-brand-bg rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${stats.todayProgress}%` }} />
              </div>
            </div>

            <div className="bg-brand-surface p-8 rounded-[3rem] border border-brand-text-s/10 shadow-sm group hover:border-brand-primary transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform"><Target size={28}/></div>
                <div>
                  <p className="text-[10px] font-black text-brand-text-s uppercase tracking-widest">{t('সিলেবাস অগ্রগতি', 'Syllabus Mastered')}</p>
                  <h4 className="text-3xl font-black text-brand-text-p">{Math.round((stats.doneChapters / (stats.totalChapters || 1)) * 100)}%</h4>
                </div>
              </div>
              <p className="text-[10px] font-bold text-brand-text-s uppercase">
                {stats.doneChapters} / {stats.totalChapters} {t('অধ্যায় সম্পন্ন', 'Chapters Done')}
              </p>
            </div>
          </div>

          {/* Recent Subjects Area */}
          <section className="bg-brand-surface p-8 rounded-[3.5rem] border border-brand-text-s/10 shadow-sm">
             <div className="flex items-center justify-between mb-8 px-2">
                <h3 className="text-xl font-black flex items-center gap-3"><GraduationCap className="text-brand-primary"/> {t('বিষয়ভিত্তিক অবস্থা', 'Subject Analytics')}</h3>
                <Link to="/app/syllabus" className="p-2 bg-brand-bg rounded-xl hover:text-brand-primary transition-colors"><ChevronRight/></Link>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {state.subjects.slice(0, 4).map(sub => {
                  const done = sub.chapters.filter(c => c.isCompleted).length;
                  const perc = Math.round((done / sub.chapters.length) * 100);
                  return (
                    <div key={sub.id} className="p-6 bg-brand-bg/50 rounded-3xl border border-brand-text-s/5 group hover:border-brand-primary transition-all">
                       <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-xs font-black uppercase text-brand-text-p tracking-tight">{sub.name}</p>
                            <p className="text-[9px] font-bold text-brand-text-s">Paper {sub.paper}</p>
                          </div>
                          <span className="text-sm font-black text-brand-primary">{perc}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-brand-surface rounded-full overflow-hidden">
                          <div className="h-full bg-brand-primary" style={{ width: `${perc}%` }} />
                       </div>
                    </div>
                  );
                })}
             </div>
          </section>
        </div>

        {/* Sidebar: Performance & Insights */}
        <div className="space-y-8">
           <section className="bg-brand-surface p-8 rounded-[3.5rem] border border-brand-text-s/10 shadow-sm">
              <h3 className="text-xl font-black flex items-center gap-3 mb-8"><TrendingUp className="text-brand-secondary"/> {t('পারফরম্যান্স', 'Insights')}</h3>
              <div className="space-y-6">
                 <div className="p-5 bg-brand-bg/50 rounded-2xl border border-brand-text-s/5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-black">AI</div>
                    <div>
                       <p className="text-[10px] font-black text-brand-text-s uppercase tracking-tighter">Bot Suggestion</p>
                       <p className="text-xs font-bold leading-tight mt-1">{t('আজকে ফিজিক্স ৩য় অধ্যায় রিভিশন করলে ভালো হয়।', 'Review Physics Ch 3 today for better retention.')}</p>
                    </div>
                 </div>
              </div>
           </section>
        </div>
      </div>
    </div>
  );
};

export default DashboardPanel;