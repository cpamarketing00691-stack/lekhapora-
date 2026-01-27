
import React, { useMemo, useState } from 'react';
import { UserState, Subject, CollegeExam, Task, TaskSource, StudySession } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, RefreshCcw, BarChart3, Info, Target, History, BookOpen, Clock, Coffee, ArrowRight, Calendar, Filter, X, GraduationCap, ListTodo, Plus, Trash2, CheckCircle, Circle, Tag, Sparkles, BookCheck, Edit3, PlayCircle, Flame, Battery, Wind, AlertCircle, Brain } from 'lucide-react';

interface DashboardProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const Dashboard: React.FC<DashboardProps> = ({ userState, onUpdateState }) => {
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [examFilter, setExamFilter] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ 
    name: '', 
    source: TaskSource.PERSONAL,
    subjectId: '',
    chapterId: '',
    customChapterName: ''
  });
  
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
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
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
    if (diff === 0) return t(' আজ', 'Today');
    
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
    const allSessions = Array.isArray(userState.studyHistory) ? userState.studyHistory : [];
    
    let filteredSessions = allSessions;
    if (subjectFilter) filteredSessions = filteredSessions.filter(s => s.subjectId === subjectFilter);
    if (examFilter) filteredSessions = filteredSessions.filter(s => s.examId === examFilter);

    // Sync metrics: Only include active timer stats if they match the current filters
    const timerMatchesFilters = (!subjectFilter || userState.activeTimer?.subjectId === subjectFilter) &&
                                (!examFilter || userState.activeTimer?.examId === examFilter);

    const activeSessionFocus = timerMatchesFilters ? (userState.activeTimer?.accumulatedFocusSeconds || 0) : 0;
    const activeSessionBreak = timerMatchesFilters ? (userState.activeTimer?.accumulatedBreakSeconds || 0) : 0;
    const activeNumBreaks = timerMatchesFilters ? (userState.activeTimer?.numBreaks || 0) : 0;

    const regularFocusSeconds = filteredSessions
      .filter(s => !s.isRevision)
      .reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0) + (timerMatchesFilters && !userState.activeTimer?.isRevision ? activeSessionFocus : 0);
    
    const revisionFocusSeconds = filteredSessions
      .filter(s => s.isRevision)
      .reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0) + (timerMatchesFilters && userState.activeTimer?.isRevision ? activeSessionFocus : 0);

    const todayFocusSeconds = filteredSessions
      .filter(s => getLocalDateString(s.startTime) === today)
      .reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0) + activeSessionFocus;

    const totalBreakSeconds = filteredSessions
      .reduce((acc, curr) => acc + (curr.breakSeconds || 0), 0) + activeSessionBreak;
    
    const totalBreaks = filteredSessions
      .reduce((acc, curr) => acc + (curr.numBreaks || 0), 0) + activeNumBreaks;

    const dailyGoalSeconds = 4 * 3600; 
    const studyTimeFactor = Math.min(100, Math.round((todayFocusSeconds / dailyGoalSeconds) * 100)); 

    const rawSubjects = Array.isArray(userState.subjects) ? userState.subjects : [];
    const relevantSubjects = subjectFilter 
      ? rawSubjects.filter(s => s.id === subjectFilter)
      : rawSubjects;

    const totalChapters = relevantSubjects.reduce((acc, curr) => acc + (Array.isArray(curr.chapters) ? curr.chapters.length : 0), 0);
    const completedChapters = relevantSubjects.reduce((acc, curr) => 
      acc + (Array.isArray(curr.chapters) ? curr.chapters.filter(c => c.isCompleted).length : 0), 0);
    const completionRate = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

    const consistencyFactor = Math.min(100, Math.round(((userState.streaks || 0) / 30) * 100));
    const revisionFactor = Math.min(100, Math.round((revisionFocusSeconds / (10 * 3600)) * 100));

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
  }, [userState.studyHistory, userState.subjects, userState.streaks, userState.language, subjectFilter, examFilter, userState.activeTimer]);

  const upcomingExams = useMemo(() => {
    const collegeExams = Array.isArray(userState.profile?.collegeExams) ? userState.profile!.collegeExams : [];
    const rawSubjects = Array.isArray(userState.subjects) ? userState.subjects : [];
    const subjectExams = rawSubjects.filter(s => !!s.examDate).map(s => ({
      id: s.id,
      name: `${s.name} P${s.paper}`,
      date: s.examDate!,
      type: 'subject' as const
    }));
    
    return [...collegeExams.map(ex => ({ ...ex, type: 'college' as const })), ...subjectExams]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 8);
  }, [userState.profile?.collegeExams, userState.subjects]);

  const recentSessions = useMemo(() => {
    const history = Array.isArray(userState.studyHistory) ? userState.studyHistory : [];
    return [...history]
      .filter(s => !subjectFilter || s.subjectId === subjectFilter)
      .filter(s => !examFilter || s.examId === examFilter)
      .sort((a, b) => (b.startTime || 0) - (a.startTime || 0))
      .slice(0, 10);
  }, [userState.studyHistory, subjectFilter, examFilter]);

  const getSubjectName = (id: string) => {
    const rawSubjects = Array.isArray(userState.subjects) ? userState.subjects : [];
    const sub = rawSubjects.find(s => s.id === id);
    if (!sub) return t('সাধারণ পড়াশোনা', 'General Study');
    return `${sub.name} (${t(sub.paper === 1 ? '১ম পত্র' : '২য় পত্র', sub.paper === 1 ? '1st Paper' : '2nd Paper')})`;
  };

  const getChapterName = (subjectId: string, chapterId: string) => {
    const sub = userState.subjects.find(s => s.id === subjectId);
    return sub?.chapters.find(c => c.id === chapterId)?.name || '';
  };

  const getTaskName = (id: string) => {
    return userState.dailyTasks.find(t => t.id === id)?.name || '';
  };

  const addTask = () => {
    if (!newTask.name.trim()) return;

    const task: Task = {
      id: `task-${Date.now()}`,
      name: newTask.name.trim(),
      source: TaskSource.PERSONAL,
      isCompleted: false,
      subjectId: newTask.subjectId || undefined,
      chapterId: newTask.chapterId || undefined,
      customChapterName: newTask.customChapterName || undefined,
      createdAt: Date.now()
    };

    onUpdateState(prev => ({
      ...prev,
      dailyTasks: [...(Array.isArray(prev.dailyTasks) ? prev.dailyTasks : []), task]
    }));
    setNewTask({ name: '', source: TaskSource.PERSONAL, subjectId: '', chapterId: '', customChapterName: '' });
    setIsTaskModalOpen(false);
  };

  const toggleTask = (id: string) => {
    onUpdateState(prev => ({
      ...prev,
      dailyTasks: Array.isArray(prev.dailyTasks) ? prev.dailyTasks.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t) : []
    }));
  };

  const deleteTask = (id: string) => {
    onUpdateState(prev => ({
      ...prev,
      dailyTasks: Array.isArray(prev.dailyTasks) ? prev.dailyTasks.filter(t => t.id !== id) : []
    }));
  };

  const moodIcons: Record<string, React.ReactNode> = {
    'Great': <Flame size={14} className="text-orange-500" />,
    'Focused': <Brain size={14} className="text-brand-primary" />,
    'Tired': <Battery size={14} className="text-amber-500" />,
    'Stressed': <AlertCircle size={14} className="text-rose-500" />,
    'Burnt Out': <Wind size={14} className="text-slate-400" />
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-brand-text-p">
            {userState.profile?.fullName}! {t('তোমার ড্যাশবোর্ড', 'Your Dashboard')}
          </h1>
          <p className="text-brand-text-s font-medium text-[10px] sm:text-xs mt-1 leading-tight">{t('তোমার প্রস্তুতির বর্তমান চিত্র।', 'Your academic progress overview.')}</p>
        </div>
        <div className={`px-4 py-2 rounded-2xl flex items-center gap-3 border border-brand-text-s/10 shadow-sm bg-brand-surface self-start md:self-center`}>
          <Activity size={16} className="text-brand-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-text-p leading-none">{t('মেজাজ', 'Mood')}: {userState.currentMood}</span>
        </div>
      </header>

      {/* Active Session Sync Card */}
      {userState.activeTimer && (
        <div className="bg-brand-primary text-white p-6 rounded-[2.5rem] shadow-xl shadow-brand-primary/20 animate-in slide-in-from-top-4 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10 relative overflow-hidden">
          <Sparkles className="absolute -right-10 -bottom-10 opacity-10" size={150} />
          <div className="flex items-center gap-5 w-full md:w-auto relative z-10">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shrink-0 border border-white/30">
              <PlayCircle size={32} className="animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{t('বর্তমানে পড়ছো', 'Currently Studying')}</p>
              <h3 className="text-lg sm:text-xl font-black truncate">{getSubjectName(userState.activeTimer.subjectId)}</h3>
              <p className="text-[10px] font-bold opacity-80 flex flex-wrap items-center gap-2">
                {userState.activeTimer.isRevision ? t('রিভিশন মোড', 'Revision Mode') : t('পড়াশোনা মোড', 'Study Mode')}
                {userState.activeTimer.chapterId && (
                   <span className="bg-white/10 px-2 py-0.5 rounded-full border border-white/20 whitespace-nowrap">
                    {getChapterName(userState.activeTimer.subjectId, userState.activeTimer.chapterId)}
                  </span>
                )}
                {userState.activeTimer.taskId && (
                  <span className="bg-white/10 px-2 py-0.5 rounded-full border border-white/20 whitespace-nowrap">
                    {getTaskName(userState.activeTimer.taskId)}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 sm:gap-10 w-full md:w-auto justify-center md:justify-end border-t md:border-t-0 border-white/10 pt-4 md:pt-0 relative z-10">
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">{t('পড়া', 'FOCUS')}</p>
              <p className="text-xl sm:text-2xl font-black tabular-nums">{formatDuration(userState.activeTimer.accumulatedFocusSeconds)}</p>
            </div>
            <div className="h-10 w-px bg-white/20 hidden sm:block"></div>
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">{t('ব্রেক', 'BREAK')}</p>
              <p className="text-xl sm:text-2xl font-black tabular-nums text-white/80">{formatDuration(userState.activeTimer.accumulatedBreakSeconds)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Summary Cards */}
      <section className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 snap-x">
        {userState.profile?.targetExamDate && (
          <div className="bg-brand-primary text-white p-5 rounded-[2.25rem] shadow-lg border border-white/10 flex flex-col justify-between min-w-[160px] snap-center shrink-0">
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
        {upcomingExams.map(exam => {
          const isActive = (exam.type === 'college' && examFilter === exam.id) || (exam.type === 'subject' && subjectFilter === exam.id);
          return (
            <button 
              key={exam.id}
              onClick={() => {
                if (exam.type === 'college') {
                  setExamFilter(examFilter === exam.id ? null : exam.id);
                  setSubjectFilter(null);
                } else {
                  setSubjectFilter(subjectFilter === exam.id ? null : exam.id);
                  setExamFilter(null);
                }
              }}
              className={`p-5 rounded-[2.25rem] shadow-sm border transition-all flex flex-col justify-between min-w-[200px] snap-center shrink-0 text-left group/card ${isActive ? 'bg-brand-secondary text-white border-brand-secondary shadow-brand-secondary/30' : 'bg-brand-surface text-brand-text-p border-brand-text-s/10 hover:border-brand-primary/50'}`}
            >
               <div className="flex justify-between items-start">
                 {exam.type === 'college' ? <GraduationCap size={18} className={isActive ? 'opacity-100' : 'opacity-40'} /> : <Clock size={18} className={isActive ? 'opacity-100' : 'opacity-40'} />}
                 <span className="text-[9px] font-black uppercase tracking-widest text-right truncate ml-2">{exam.name}</span>
               </div>
               <div className="mt-4 flex justify-between items-end">
                  <div>
                    <h4 className="text-3xl font-black tracking-tighter tabular-nums leading-none">{getCountdown(exam.date)}</h4>
                    <p className="text-[8px] font-bold opacity-60 uppercase mt-1">{exam.type === 'college' ? t('কলেজ পরীক্ষা', 'COLLEGE EXAM') : t('বোর্ড পরীক্ষা', 'BOARD EXAM')}</p>
                  </div>
                  <div className="opacity-0 group-hover/card:opacity-100 transition-opacity bg-white/10 p-2 rounded-xl">
                    <PlayCircle size={18} />
                  </div>
               </div>
            </button>
          );
        })}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Readiness and Activity History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Readiness Card */}
          <section className="bg-brand-surface p-6 sm:p-8 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 relative z-10 gap-4">
              <div>
                <h3 className="text-[10px] font-black text-brand-text-s uppercase tracking-[0.2em] mb-1">{t('প্রস্তুতি লেভেল', 'Readiness Level')}</h3>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-5xl sm:text-6xl font-black text-brand-text-p leading-none tracking-tighter">{stats.score}</h2>
                  <span className="text-xl font-bold text-brand-text-s/30">%</span>
                </div>
              </div>
              <div className="sm:text-right">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-primary text-white shadow-xl shadow-brand-primary/30 mb-2 transform hover:scale-105 transition-transform">
                  <Target size={14} />
                  <span className="text-xs font-black uppercase tracking-widest leading-none">{stats.readinessLabel}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 relative z-10">
              {[
                { label: t('আজকের পড়া', 'Today'), value: stats.factors.study, color: 'from-brand-primary to-brand-primary/60' },
                { label: t('সিলেবাস', 'Syllabus'), value: stats.factors.completion, color: 'from-brand-secondary to-brand-secondary/60' },
                { label: t('ধারাবাহিকতা', 'Streak'), value: stats.factors.consistency, color: 'from-orange-500 to-amber-400' },
                { label: t('রিভিশন', 'Revision'), value: stats.factors.revision, color: 'from-purple-500 to-pink-400' }
              ].map((factor, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                    <span className="text-brand-text-s">{factor.label}</span>
                    <span className="text-brand-text-p">{factor.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-brand-bg rounded-full overflow-hidden shadow-inner">
                    <div className={`h-full bg-gradient-to-r ${factor.color} rounded-full transition-all duration-1000`} style={{ width: `${factor.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Activity Log - RECENT SESSIONS */}
          <section className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary">
                   <History size={20} />
                 </div>
                 <h3 className="text-lg font-black text-brand-text-p">{t('সাম্প্রতিক অ্যাক্টিভিটি', 'Recent Activity')}</h3>
               </div>
               <button className="text-[9px] font-black uppercase tracking-widest text-brand-text-s hover:text-brand-primary transition-all">
                 {t('সব দেখো', 'View All')}
               </button>
            </div>

            <div className="space-y-4">
               {recentSessions.length > 0 ? recentSessions.map((session) => (
                 <div key={session.id} className="flex gap-4 group">
                    <div className="flex flex-col items-center">
                       <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-brand-text-s/10 ${session.isRevision ? 'bg-brand-secondary/10 text-brand-secondary' : 'bg-brand-primary/10 text-brand-primary'}`}>
                         <BookOpen size={18} />
                       </div>
                       <div className="flex-1 w-px bg-brand-text-s/10 my-1 group-last:hidden"></div>
                    </div>
                    <div className="flex-1 min-w-0 pb-4">
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <h4 className="text-xs sm:text-sm font-black text-brand-text-p truncate">
                            {getSubjectName(session.subjectId)}
                            {session.isRevision && <span className="ml-2 text-[8px] bg-brand-secondary/10 text-brand-secondary px-1.5 py-0.5 rounded-md uppercase">{t('রিভিশন', 'Revision')}</span>}
                          </h4>
                          <span className="text-[10px] font-black text-brand-text-s tabular-nums whitespace-nowrap bg-brand-bg px-2 py-0.5 rounded-lg border border-brand-text-s/10">
                            {formatTime12h(session.startTime)} - {session.endTime ? formatTime12h(session.endTime) : '...'}
                          </span>
                       </div>
                       <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-text-s truncate">
                             <Clock size={12} className="opacity-40" />
                             <span>{formatDuration(session.durationSeconds)}</span>
                          </div>
                          {(session.chapterId || session.taskId) && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-text-s truncate">
                               <Sparkles size={12} className="opacity-40" />
                               <span>{session.chapterId ? getChapterName(session.subjectId, session.chapterId) : getTaskName(session.taskId || '')}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-text-s">
                             {moodIcons[session.mood]}
                             <span>{session.mood}</span>
                          </div>
                       </div>
                    </div>
                 </div>
               )) : (
                 <div className="py-12 text-center space-y-3 opacity-30">
                    <History className="mx-auto" size={40} />
                    <p className="text-[10px] font-black uppercase tracking-widest">{t('কোনো তথ্য পাওয়া যায়নি', 'No activity found yet')}</p>
                 </div>
               )}
            </div>
          </section>
        </div>

        {/* Right Column: Totals and Tasks */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-brand-primary text-white p-6 sm:p-8 rounded-[2.5rem] shadow-2xl shadow-brand-primary/20 relative overflow-hidden group flex flex-col justify-center">
              <TrendingUp size={48} className="absolute -right-4 -top-4 opacity-10 group-hover:scale-125 transition-transform duration-700 hidden sm:block" />
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">{t('মোট পড়াশোনা', 'Total Focus')}</p>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tighter tabular-nums leading-tight">{stats.totalDisplay}</h2>
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">{t('আজকের:', 'Today:')} {stats.todayDisplay}</p>
              </div>
            </div>
            <div className="bg-brand-surface p-6 sm:p-8 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm relative group flex flex-col justify-center">
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text-s mb-2">{t('মোট ব্রেক', 'Total Break')}</p>
                <h2 className="text-3xl sm:text-4xl font-black text-brand-secondary tracking-tighter tabular-nums leading-tight">{stats.breakDisplay}</h2>
                <p className="text-[10px] font-bold text-brand-text-s/30 mt-1 uppercase tracking-widest">{stats.totalBreaks} {t('টি ব্রেক', 'Breaks Taken')}</p>
              </div>
            </div>
          </div>

          {/* Homework Section */}
          <section className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary shrink-0">
                   <ListTodo size={20} />
                 </div>
                 <h3 className="text-lg font-black text-brand-text-p leading-tight">{t('লক্ষ্য / টাস্ক', 'Focus Tasks')}</h3>
              </div>
              <button 
                onClick={() => setIsTaskModalOpen(true)}
                className="p-2 bg-brand-primary text-white rounded-xl shadow-lg shadow-brand-primary/20 hover:scale-105 transition-all"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {Array.isArray(userState.dailyTasks) && userState.dailyTasks.length > 0 ? userState.dailyTasks.slice(0, 5).map(task => (
                <div key={task.id} className={`group flex items-start gap-3 p-3 rounded-2xl border transition-all ${task.isCompleted ? 'bg-emerald-50/30 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800' : 'bg-brand-bg/50 border-brand-text-s/10 hover:border-brand-primary'}`}>
                   <button onClick={() => toggleTask(task.id)} className={`mt-0.5 shrink-0 transition-colors ${task.isCompleted ? 'text-emerald-500' : 'text-brand-text-s'}`}>
                      {task.isCompleted ? <CheckCircle size={16} /> : <Circle size={16} />}
                   </button>
                   <div className="min-w-0 flex-1">
                      <p className={`text-[11px] font-bold leading-tight transition-all truncate ${task.isCompleted ? 'text-emerald-700 dark:text-emerald-400 line-through opacity-60' : 'text-brand-text-p'}`}>{task.name}</p>
                      <p className="text-[8px] font-black uppercase text-brand-text-s mt-1 tracking-widest">{task.source}</p>
                   </div>
                   <button onClick={() => deleteTask(task.id)} className="p-1 text-brand-text-s hover:text-red-500 transition-all active:scale-90 md:opacity-0 group-hover:opacity-100">
                      <Trash2 size={12} />
                   </button>
                </div>
              )) : (
                <div className="py-6 text-center space-y-2 opacity-20">
                   <Info className="mx-auto" size={24} />
                   <p className="text-[9px] font-black uppercase tracking-widest">{t('কোনো টাস্ক নেই', 'No tasks set')}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
      
      {/* Task Modal Recovery */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
             <div className="w-full max-w-md bg-brand-surface p-6 sm:p-8 rounded-[2rem] shadow-2xl border border-brand-text-s/10 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-black text-brand-text-p uppercase tracking-widest">{t('নতুন হোমওয়ার্ক যোগ করো', 'New Homework Task')}</h4>
                  <button onClick={() => setIsTaskModalOpen(false)} className="text-brand-text-s hover:text-brand-text-p"><X size={20} /></button>
                </div>
                <div className="space-y-5">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-brand-text-s uppercase tracking-widest ml-1">{t('টাস্কের নাম', 'Task Name')}</label>
                      <input 
                        type="text" 
                        value={newTask.name}
                        onChange={e => setNewTask({...newTask, name: e.target.value})}
                        placeholder={t("যেমন: ফিজিক্স ৩য় অধ্যায় ম্যাথ", "e.g. Physics Ch 3 Problems")}
                        className="w-full px-4 py-3 bg-brand-bg border-2 border-brand-text-s/10 rounded-xl font-bold outline-none focus:border-brand-primary"
                      />
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-brand-text-s uppercase tracking-widest ml-1">{t('বিষয় (ঐচ্ছিক)', 'Subject (Optional)')}</label>
                      <select 
                        value={newTask.subjectId} 
                        onChange={e => setNewTask({...newTask, subjectId: e.target.value})}
                        className="w-full px-4 py-3 bg-brand-bg border-2 border-brand-text-s/10 rounded-xl font-bold outline-none focus:border-brand-primary text-xs"
                      >
                        <option value="">{t('নির্বাচন করো', 'Select')}</option>
                        {userState.subjects.map(s => <option key={s.id} value={s.id}>{s.name} (P{s.paper})</option>)}
                      </select>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-brand-text-s uppercase tracking-widest ml-1">{t('উৎস (Source)', 'Source')}</label>
                      <div className="flex flex-wrap gap-2">
                        {Object.values(TaskSource).map(source => (
                          <button 
                            key={source}
                            onClick={() => setNewTask({...newTask, source})}
                            className={`px-3 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg border-2 transition-all ${newTask.source === source ? 'bg-brand-primary/10 border-brand-primary text-brand-primary' : 'bg-brand-bg border-transparent text-brand-text-s hover:bg-brand-surface'}`}
                          >
                            {source}
                          </button>
                        ))}
                      </div>
                   </div>

                   <button 
                    onClick={addTask}
                    className="w-full py-4 mt-2 bg-brand-primary text-white font-black rounded-2xl shadow-xl shadow-brand-primary/20 uppercase tracking-widest text-[10px] active:scale-95 transition-all"
                   >
                     {t('অ্যাড হোমওয়ার্ক', 'Add Homework')}
                   </button>
                </div>
             </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
