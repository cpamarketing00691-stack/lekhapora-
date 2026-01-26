
import React, { useMemo } from 'react';
import { UserState } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, RefreshCcw, BarChart3, Info, Target, History, BookOpen, Clock, Coffee } from 'lucide-react';

interface DashboardProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const Dashboard: React.FC<DashboardProps> = ({ userState }) => {
  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  const stats = useMemo(() => {
    const regularStudyMinutes = userState.studyHistory
      .filter(s => !s.isRevision)
      .reduce((acc, curr) => acc + curr.durationMinutes, 0);
    
    const revisionMinutes = userState.studyHistory
      .filter(s => s.isRevision)
      .reduce((acc, curr) => acc + curr.durationMinutes, 0);

    const totalBreakMinutes = userState.studyHistory
      .reduce((acc, curr) => acc + (curr.breakMinutes || 0), 0);
    
    const totalBreaks = userState.studyHistory
      .reduce((acc, curr) => acc + (curr.numBreaks || 0), 0);

    const studyTimeFactor = Math.min(100, (regularStudyMinutes / 6000) * 100); 
    const totalChapters = userState.subjects.reduce((acc, curr) => acc + curr.chapters.length, 0);
    const completedChapters = userState.subjects.reduce((acc, curr) => 
      acc + curr.chapters.filter(c => c.isCompleted).length, 0);
    const completionRate = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;
    const consistencyFactor = Math.min(100, (userState.streaks / 30) * 100);
    const revisionFactor = Math.min(100, (revisionMinutes / 1200) * 100);

    const finalScore = (studyTimeFactor * 0.4) + (completionRate * 0.3) + (consistencyFactor * 0.2) + (revisionFactor * 0.1);

    return {
      totalHours: ((regularStudyMinutes + revisionMinutes) / 60).toFixed(1),
      studyHours: (regularStudyMinutes / 60).toFixed(1),
      revisionHours: (revisionMinutes / 60).toFixed(1),
      breakHours: (totalBreakMinutes / 60).toFixed(1),
      totalBreaks,
      completion: completionRate.toFixed(0),
      score: Math.round(finalScore),
      readinessLabel: finalScore > 85 ? t('চমৎকার', 'Excellent') : 
                      finalScore > 60 ? t('ভালো', 'Good') : 
                      finalScore > 30 ? t('চলমান', 'Steady') : t('শুরু', 'Starting'),
      factors: {
        study: Math.round(studyTimeFactor),
        completion: Math.round(completionRate),
        consistency: Math.round(consistencyFactor),
        revision: Math.round(revisionFactor)
      }
    };
  }, [userState, userState.language]);

  const weeklyData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const daySessions = userState.studyHistory.filter(s => {
        const sDate = new Date(s.startTime).toISOString().split('T')[0];
        return sDate === date;
      });

      const study = daySessions.filter(s => !s.isRevision).reduce((acc, s) => acc + s.durationMinutes, 0) / 60;
      const revision = daySessions.filter(s => s.isRevision).reduce((acc, s) => acc + s.durationMinutes, 0) / 60;
      const dayName = new Date(date).toLocaleDateString(userState.language === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'short' });

      return {
        name: dayName,
        study: parseFloat(study.toFixed(1)),
        revision: parseFloat(revision.toFixed(1)),
        fullDate: date
      };
    });
  }, [userState.studyHistory, userState.language]);

  const recentSessions = useMemo(() => {
    return [...userState.studyHistory]
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, 5);
  }, [userState.studyHistory]);

  const getSubjectName = (id: string) => {
    const sub = userState.subjects.find(s => s.id === id);
    return sub ? `${sub.name} (P${sub.paper})` : t('অজানা বিষয়', 'Unknown Subject');
  };

  const moodColor = {
    'Great': 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
    'Focused': 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
    'Tired': 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
    'Stressed': 'text-red-500 bg-red-50 dark:bg-red-900/20',
    'Burnt Out': 'text-purple-500 bg-purple-50 dark:bg-purple-900/20'
  }[userState.currentMood || 'Great'];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            {userState.profile?.fullName}! {t('তোমার ড্যাশবোর্ড', 'Your Dashboard')}
          </h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm mt-1">{t('তোমার HSC প্রস্তুতির বর্তমান চিত্র।', 'Your current HSC readiness overview.')}</p>
        </div>
        <div className={`px-4 py-2 md:px-5 md:py-2.5 rounded-2xl flex items-center gap-2 md:gap-3 border border-slate-100 dark:border-slate-800 shadow-sm ${moodColor} self-start md:self-center`}>
          <Activity size={18} className="animate-pulse" />
          <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{t('মেজাজ', 'Mood')}: {userState.currentMood}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 md:mb-10 relative z-10 gap-4">
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-1 md:mb-2">{t('প্রস্তুতি লেভেল', 'Readiness Level')}</h3>
              <div className="flex items-baseline gap-2">
                <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">{stats.score}</h2>
                <span className="text-xl md:text-2xl font-bold text-slate-300">%</span>
              </div>
            </div>
            <div className="sm:text-right flex flex-col items-start sm:items-end">
              <div className="inline-flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 mb-2 md:mb-3 transform hover:scale-105 transition-transform cursor-default">
                <Target size={16} md:size={18} />
                <span className="text-xs md:text-sm font-black uppercase tracking-widest">{stats.readinessLabel}</span>
              </div>
              <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.1em]">{t('NCTB প্রোটোকল অনুযায়ী', 'NCTB Compliant Scoring')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 md:gap-x-16 gap-y-6 md:gap-y-8 relative z-10">
            {[
              { label: t('পড়াশোনা (৪০%)', 'Study (40%)'), value: stats.factors.study, color: 'from-emerald-500 to-teal-400' },
              { label: t('সিলেবাস (৩০%)', 'Syllabus (30%)'), value: stats.factors.completion, color: 'from-blue-500 to-indigo-400' },
              { label: t('ধারাবাহিকতা (২০%)', 'Streak (20%)'), value: stats.factors.consistency, color: 'from-orange-500 to-amber-400' },
              { label: t('রিভিশন (১০%)', 'Revision (10%)'), value: stats.factors.revision, color: 'from-purple-500 to-pink-400' }
            ].map((factor, idx) => (
              <div key={idx} className="space-y-2 md:space-y-3">
                <div className="flex justify-between text-[10px] md:text-[11px] font-black uppercase tracking-wider">
                  <span className="text-slate-400">{factor.label}</span>
                  <span className="text-slate-600 dark:text-slate-300">{factor.value}%</span>
                </div>
                <div className="h-2 md:h-2.5 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div className={`h-full bg-gradient-to-r ${factor.color} rounded-full transition-all duration-1000`} style={{ width: `${factor.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-slate-50 dark:border-slate-800 flex items-center gap-3 md:gap-4 relative z-10">
             <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
               <Info size={16} md:size={18} className="text-slate-400" />
             </div>
             <p className="text-[9px] md:text-[11px] text-slate-400 font-bold leading-relaxed italic uppercase tracking-tighter">
               {t('অ্যানালাইটিক্স: ব্রেক ও রিভিশন সমন্বিত চিত্র', 'Analytics: Integration of Breaks & Revision')}
             </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 md:gap-8">
          <div className="bg-emerald-600 text-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-emerald-600/20 relative overflow-hidden group">
            <TrendingUp size={48} className="absolute -right-4 -top-4 md:-right-6 md:-top-6 opacity-10 group-hover:scale-125 transition-transform duration-700" />
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2 md:mb-3">{t('মোট পড়াশোনা', 'Total Focus')}</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter">{stats.totalHours}</h2>
              <p className="text-[10px] font-bold opacity-60 mt-1 md:mt-2 uppercase tracking-widest">{t('ঘণ্টা সমাপ্ত', 'Hours Logged')}</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm relative group">
            <Coffee size={48} className="absolute -right-4 -top-4 md:-right-6 md:-top-6 text-blue-500 opacity-5 group-hover:rotate-12 transition-transform duration-1000" />
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 md:mb-3">{t('মোট ব্রেক', 'Total Break')}</p>
              <h2 className="text-4xl md:text-5xl font-black text-blue-500 tracking-tighter">{stats.breakHours}</h2>
              <p className="text-[10px] font-bold text-slate-300 mt-1 md:mt-2 uppercase tracking-widest">{stats.totalBreaks} {t('টি ব্রেক', 'Breaks Taken')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-8 md:mb-10">
            <div>
              <h4 className="text-sm font-black text-slate-400 flex items-center gap-2 md:gap-3 uppercase tracking-[0.2em]">
                <BarChart3 size={18} md:size={20} className="text-emerald-500" /> {t('সাপ্তাহিক রিপোর্ট', 'Weekly Report')}
              </h4>
            </div>
          </div>
          
          <div className="h-64 md:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 20, right: 10, left: -30, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} unit="h" />
                <Tooltip />
                <Bar dataKey="study" stackId="a" fill="#10b981" barSize={32} />
                <Bar dataKey="revision" stackId="a" fill="#a855f7" radius={[8, 8, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <History size={18} className="text-blue-500" />
            <h4 className="text-xs md:text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{t('সাম্প্রতিক হিস্ট্রি', 'History')}</h4>
          </div>
          
          <div className="flex-1 space-y-4 overflow-y-auto pr-1 max-h-[300px] md:max-h-[380px] scrollbar-hide">
            {recentSessions.length > 0 ? recentSessions.map((session) => (
              <div key={session.id} className="group flex items-start gap-3 p-3 rounded-[1.25rem] bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all">
                <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${session.isRevision ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {session.isRevision ? <RefreshCcw size={14} /> : <BookOpen size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-black text-[10px] text-slate-800 dark:text-slate-100 truncate mb-0.5">
                    {getSubjectName(session.subjectId)}
                  </h5>
                  <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                    <span className="flex items-center gap-1"><Clock size={10} /> {session.durationMinutes}m</span>
                    <span className="flex items-center gap-1 text-blue-400"><Coffee size={10} /> {session.breakMinutes || 0}m</span>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-center text-[10px] font-bold text-slate-400 py-8">{t('এখনো কোনো সেশন নেই!', 'No history yet!')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
