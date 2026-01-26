
import React, { useMemo, useState } from 'react';
import { UserState, Subject } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, RefreshCcw, BarChart3, Info, Target, History, BookOpen, Clock, Coffee, ArrowRight, Calendar, Filter, X } from 'lucide-react';

interface DashboardProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const Dashboard: React.FC<DashboardProps> = ({ userState }) => {
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  const formatDuration = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [h, m, s]
      .map(v => v.toString().padStart(2, '0'))
      .join(':');
  };

  const formatTime12h = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString(userState.language === 'bn' ? 'bn-BD' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getLocalDateString = (timestamp: number) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCountdown = (dateStr: string) => {
    const target = new Date(dateStr).setHours(0,0,0,0);
    const now = new Date().setHours(0,0,0,0);
    const diff = target - now;
    if (diff < 0) return t('শেষ', 'Over');
    if (diff === 0) return t('আজ', 'Today');
    
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days > 7) {
      const w = Math.floor(days / 7);
      const d = days % 7;
      return d > 0 ? `${w}w ${d}d` : `${w}w`;
    }
    return `${days}d`;
  };

  const stats = useMemo(() => {
    const today = getLocalDateString(Date.now());
    const allSessions = userState.studyHistory || [];
    
    // Apply filter if selected
    const filteredSessions = subjectFilter 
      ? allSessions.filter(s => s.subjectId === subjectFilter)
      : allSessions;

    const regularFocusSeconds = filteredSessions
      .filter(s => !s.isRevision)
      .reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);
    
    const revisionFocusSeconds = filteredSessions
      .filter(s => s.isRevision)
      .reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);

    const todayFocusSeconds = filteredSessions
      .filter(s => getLocalDateString(s.startTime) === today)
      .reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);

    const totalBreakSeconds = filteredSessions
      .reduce((acc, curr) => acc + (curr.breakSeconds || 0), 0);
    
    const totalBreaks = filteredSessions
      .reduce((acc, curr) => acc + (curr.numBreaks || 0), 0);

    const dailyGoalSeconds = 4 * 3600; 
    const studyTimeFactor = Math.min(100, Math.round((todayFocusSeconds / dailyGoalSeconds) * 100)); 

    const relevantSubjects = subjectFilter 
      ? userState.subjects.filter(s => s.id === subjectFilter)
      : userState.subjects;

    const totalChapters = relevantSubjects.reduce((acc, curr) => acc + (curr.chapters?.length || 0), 0);
    const completedChapters = relevantSubjects.reduce((acc, curr) => 
      acc + (curr.chapters?.filter(c => c.isCompleted).length || 0), 0);
    const completionRate = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

    const consistencyFactor = Math.min(100, Math.round(((userState.streaks || 0) / 30) * 100));
    const revisionGoalSeconds = 10 * 3600; 
    const revisionFactor = Math.min(100, Math.round((revisionFocusSeconds / revisionGoalSeconds) * 100));

    const finalScore = Math.round(
      (studyTimeFactor * 0.4) + 
      (completionRate * 0.3) + 
      (consistencyFactor * 0.2) + 
      (revisionFactor * 0.1)
    );

    return {
      totalDisplay: formatDuration(regularFocusSeconds + revisionFocusSeconds),
      todayDisplay: formatDuration(todayFocusSeconds),
      breakDisplay: formatDuration(totalBreakSeconds),
      totalBreaks,
      completion: completionRate,
      score: finalScore,
      readinessLabel: finalScore > 85 ? t('চমৎকার', 'Excellent') : 
                      finalScore > 60 ? t('ভালো', 'Good') : 
                      finalScore > 30 ? t('চলমান', 'Steady') : t('শুরু', 'Starting'),
      factors: {
        study: studyTimeFactor,
        completion: completionRate,
        consistency: consistencyFactor,
        revision: revisionFactor
      }
    };
  }, [userState.studyHistory, userState.subjects, userState.streaks, userState.language, subjectFilter]);

  const upcomingExams = useMemo(() => {
    return userState.subjects
      .filter(s => !!s.examDate)
      .sort((a, b) => new Date(a.examDate!).getTime() - new Date(b.examDate!).getTime())
      .slice(0, 4);
  }, [userState.subjects]);

  const weeklyData = useMemo(() => {
    const last7DaysStrings = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return getLocalDateString(d.getTime());
    });

    return last7DaysStrings.map(dateStr => {
      const daySessions = (userState.studyHistory || [])
        .filter(s => getLocalDateString(s.startTime) === dateStr)
        .filter(s => !subjectFilter || s.subjectId === subjectFilter);

      const studyHrs = daySessions.filter(s => !s.isRevision).reduce((acc, s) => acc + (s.durationSeconds || 0), 0) / 3600;
      const revisionHrs = daySessions.filter(s => s.isRevision).reduce((acc, s) => acc + (s.durationSeconds || 0), 0) / 3600;
      const [y, m, d] = dateStr.split('-').map(Number);
      const dayName = new Date(y, m - 1, d).toLocaleDateString(userState.language === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'short' });
      return {
        name: dayName,
        study: parseFloat(studyHrs.toFixed(1)),
        revision: parseFloat(revisionHrs.toFixed(1)),
        fullDate: dateStr
      };
    });
  }, [userState.studyHistory, userState.language, subjectFilter]);

  const recentSessions = useMemo(() => {
    return [...(userState.studyHistory || [])]
      .filter(s => !subjectFilter || s.subjectId === subjectFilter)
      .sort((a, b) => (b.startTime || 0) - (a.startTime || 0))
      .slice(0, 8);
  }, [userState.studyHistory, subjectFilter]);

  const getSubjectName = (id: string) => {
    const sub = userState.subjects.find(s => s.id === id);
    return sub ? `${sub.name} (P${sub.paper})` : t('সাধারণ পড়াশোনা', 'General Study');
  };

  const isDark = document.documentElement.classList.contains('dark');
  const primaryColor = isDark ? '#5FB3A2' : '#5B7DBE';
  const secondaryColor = isDark ? '#8B9CF2' : '#7FAE9E';

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-brand-text-p">
            {userState.profile?.fullName}! {t('তোমার ড্যাশবোর্ড', 'Your Dashboard')}
          </h1>
          <p className="text-brand-text-s font-medium text-[10px] sm:text-xs md:text-sm mt-1">{t('তোমার HSC প্রস্তুতির বর্তমান চিত্র।', 'Your current HSC readiness overview.')}</p>
        </div>
        <div className="flex gap-2">
           <div className={`px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 rounded-xl sm:rounded-2xl flex items-center gap-2 md:gap-3 border border-brand-text-s/10 shadow-sm bg-brand-surface self-start md:self-center`}>
            <Activity size={16} className="text-brand-primary animate-pulse" />
            <span className="text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest text-brand-text-p leading-none">{t('মেজাজ', 'Mood')}: {userState.currentMood}</span>
          </div>
        </div>
      </header>

      {/* Countdown Widgets Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto pb-2">
        {userState.profile?.targetExamDate && (
          <div className="bg-brand-primary text-white p-4 rounded-3xl shadow-lg border border-white/10 flex flex-col justify-between min-w-[150px] shrink-0">
             <div className="flex justify-between items-start">
               <Calendar size={18} className="opacity-60" />
               <span className="text-[9px] font-black uppercase tracking-widest">{t('এইচএসসি লক্ষ্য', 'HSC GOAL')}</span>
             </div>
             <div className="mt-4">
                <h4 className="text-3xl font-black tracking-tighter tabular-nums leading-none">{getCountdown(userState.profile.targetExamDate)}</h4>
                <p className="text-[8px] font-bold opacity-60 uppercase mt-1">{t('বাকি আছে', 'REMAINING')}</p>
             </div>
          </div>
        )}
        {upcomingExams.map(exam => (
          <button 
            key={exam.id}
            onClick={() => setSubjectFilter(subjectFilter === exam.id ? null : exam.id)}
            className={`p-4 rounded-3xl shadow-sm border transition-all flex flex-col justify-between min-w-[150px] shrink-0 ${subjectFilter === exam.id ? 'bg-brand-secondary text-white border-brand-secondary shadow-brand-secondary/30' : 'bg-brand-surface text-brand-text-p border-brand-text-s/10 hover:border-brand-primary/50'}`}
          >
             <div className="flex justify-between items-start">
               <Clock size={18} className={subjectFilter === exam.id ? 'opacity-100' : 'opacity-40'} />
               <span className="text-[9px] font-black uppercase tracking-widest text-right">{exam.name} P{exam.paper}</span>
             </div>
             <div className="mt-4 text-left">
                <h4 className="text-2xl font-black tracking-tighter tabular-nums leading-none">{getCountdown(exam.examDate!)}</h4>
                <p className="text-[8px] font-bold opacity-60 uppercase mt-1">{t('বাকি আছে', 'LEFT')}</p>
             </div>
          </button>
        ))}
      </section>

      {/* Analysis Filtering Context */}
      {subjectFilter && (
        <div className="bg-brand-secondary/10 border border-brand-secondary/20 p-4 rounded-[1.5rem] flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-brand-secondary text-white rounded-lg">
               <Filter size={14} />
             </div>
             <div>
               <p className="text-xs font-black text-brand-secondary uppercase tracking-widest leading-none mb-1">{t('ফিল্টার সক্রিয়', 'Filter Active')}</p>
               <h3 className="text-sm font-bold text-brand-text-p">{getSubjectName(subjectFilter)}</h3>
             </div>
           </div>
           <button 
            onClick={() => setSubjectFilter(null)}
            className="p-2 hover:bg-brand-secondary/20 rounded-full text-brand-secondary transition-all"
           >
             <X size={20} />
           </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-brand-surface p-5 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] shadow-sm border border-brand-text-s/10 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 md:mb-10 relative z-10 gap-4">
            <div>
              <h3 className="text-[9px] sm:text-[10px] font-black text-brand-text-s uppercase tracking-[0.2em] mb-1 md:mb-2">{t('প্রস্তুতি লেভেল', 'Readiness Level')}</h3>
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-brand-text-p leading-none tracking-tighter">{stats.score}</h2>
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-brand-text-s/30">%</span>
              </div>
            </div>
            <div className="sm:text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl bg-brand-primary text-white shadow-xl shadow-brand-primary/30 mb-2 transform hover:scale-105 transition-transform">
                <Target size={14} className="sm:size-16" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest leading-none">{stats.readinessLabel}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 sm:gap-x-12 md:gap-x-16 gap-y-4 sm:gap-y-6 md:gap-y-8 relative z-10">
            {[
              { label: t('আজকের পড়া', 'Today'), value: stats.factors.study, color: 'from-brand-primary to-brand-primary/60' },
              { label: t('সিলেবাস', 'Syllabus'), value: stats.factors.completion, color: 'from-brand-secondary to-brand-secondary/60' },
              { label: t('ধারাবাহিকতা', 'Streak'), value: stats.factors.consistency, color: 'from-orange-500 to-amber-400' },
              { label: t('রিভিশন', 'Revision'), value: stats.factors.revision, color: 'from-purple-500 to-pink-400' }
            ].map((factor, idx) => (
              <div key={idx} className="space-y-1.5 sm:space-y-2">
                <div className="flex justify-between text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                  <span className="text-brand-text-s">{factor.label}</span>
                  <span className="text-brand-text-p">{factor.value}%</span>
                </div>
                <div className="h-1.5 sm:h-2 w-full bg-brand-bg rounded-full overflow-hidden shadow-inner">
                  <div className={`h-full bg-gradient-to-r ${factor.color} rounded-full transition-all duration-1000`} style={{ width: `${factor.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6 md:gap-8">
          <div className="bg-brand-primary text-white p-5 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-brand-primary/20 relative overflow-hidden group">
            <TrendingUp size={48} className="absolute -right-4 -top-4 opacity-10 group-hover:scale-125 transition-transform duration-700 hidden sm:block" />
            <div className="relative z-10">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1.5 sm:mb-2">{t('মোট পড়াশোনা', 'Total Focus')}</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter tabular-nums leading-tight">{stats.totalDisplay}</h2>
              <p className="text-[9px] sm:text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">{t('আজকের:', 'Today:')} {stats.todayDisplay}</p>
            </div>
          </div>
          <div className="bg-brand-surface p-5 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] border border-brand-text-s/10 shadow-sm relative group">
            <Coffee size={48} className="absolute -right-4 -top-4 text-brand-secondary opacity-5 group-hover:rotate-12 transition-transform duration-1000 hidden sm:block" />
            <div className="relative z-10">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-brand-text-s mb-1.5 sm:mb-2">{t('মোট ব্রেক', 'Total Break')}</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-brand-secondary tracking-tighter tabular-nums leading-tight whitespace-nowrap overflow-hidden text-ellipsis">{stats.breakDisplay}</h2>
              <p className="text-[9px] sm:text-[10px] font-bold text-brand-text-s/30 mt-1 uppercase tracking-widest">{stats.totalBreaks} {t('টি ব্রেক', 'Breaks Taken')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-brand-surface p-5 sm:p-6 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] border border-brand-text-s/10 shadow-sm overflow-hidden">
          <h4 className="text-xs sm:text-sm font-black text-brand-text-s flex items-center gap-2 uppercase tracking-[0.2em] mb-6 sm:mb-8">
            <BarChart3 size={16} className="text-brand-primary" /> {t('সাপ্তাহিক রিপোর্ট', 'Weekly Report')}
          </h4>
          <div className="h-56 sm:h-64 md:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: isDark ? '#8A94A6' : '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: isDark ? '#8A94A6' : '#6B7280' }} unit="h" />
                <Tooltip 
                   cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                   contentStyle={{ backgroundColor: isDark ? '#1B2636' : '#E9EDF0', border: 'none', borderRadius: '12px', color: isDark ? '#fff' : '#000', fontSize: '10px' }}
                   itemStyle={{ fontSize: '10px', fontWeight: 'bold', padding: '0' }}
                />
                <Bar dataKey="study" stackId="a" fill={primaryColor} barSize={24} />
                <Bar dataKey="revision" stackId="a" fill={secondaryColor} radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-brand-surface p-5 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] border border-brand-text-s/10 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <History size={16} className="text-brand-secondary" />
              <h4 className="text-xs sm:text-sm font-black text-brand-text-p uppercase tracking-widest">{t('সেশন হিস্ট্রি', 'Session History')}</h4>
            </div>
          </div>
          <div className="flex-1 space-y-3 sm:space-y-4 overflow-y-auto pr-1 max-h-[300px] sm:max-h-[400px] scrollbar-hide">
            {recentSessions.length > 0 ? recentSessions.map((session) => (
              <div key={session.id} className="group flex flex-col gap-2 p-3 sm:p-4 rounded-[1rem] sm:rounded-[1.5rem] bg-brand-bg/50 border border-brand-text-s/10 hover:border-brand-primary transition-all">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h5 className="font-black text-[10px] sm:text-[11px] text-brand-text-p mb-0.5 truncate">
                      {getSubjectName(session.subjectId)}
                    </h5>
                    <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-brand-text-s flex items-center gap-1 leading-none">
                      {session.isRevision ? t('রিভিশন', 'Revision') : t('পড়াশোনা', 'Study')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[8px] sm:text-[9px] font-black text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full whitespace-nowrap">
                    {formatTime12h(session.startTime)} <ArrowRight size={8} /> {session.endTime ? formatTime12h(session.endTime) : '--'}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-0.5 sm:mt-1">
                  <div className="bg-brand-bg p-1.5 sm:p-2 rounded-lg sm:rounded-xl flex items-center gap-1.5 sm:gap-2">
                    <Clock size={10} className="text-brand-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[7px] sm:text-[8px] font-black text-brand-text-s uppercase leading-none mb-0.5">{t('ফোকাস', 'Focus')}</p>
                      <p className="text-[9px] sm:text-[10px] font-black text-brand-text-p tabular-nums leading-none">{formatDuration(session.durationSeconds)}</p>
                    </div>
                  </div>
                  <div className="bg-brand-bg p-1.5 sm:p-2 rounded-lg sm:rounded-xl flex items-center gap-1.5 sm:gap-2">
                    <Coffee size={10} className="text-brand-secondary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[7px] sm:text-[8px] font-black text-brand-text-s uppercase leading-none mb-0.5">{t('ব্রেক', 'Break')}</p>
                      <p className="text-[9px] sm:text-[10px] font-black text-brand-text-p tabular-nums leading-none">{formatDuration(session.breakSeconds)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-center text-[9px] sm:text-[10px] font-bold text-brand-text-s py-6 sm:py-8">{t('এই বিষয়ের কোনো হিস্ট্রি নেই', 'No history for this subject')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
