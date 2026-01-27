
import React, { useMemo, useState } from 'react';
import { UserState, Subject, CollegeExam, Task, TaskSource } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, RefreshCcw, BarChart3, Info, Target, History, BookOpen, Clock, Coffee, ArrowRight, Calendar, Filter, X, GraduationCap, ListTodo, Plus, Trash2, CheckCircle, Circle, Tag, Sparkles, BookCheck, Edit3 } from 'lucide-react';

interface DashboardProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const Dashboard: React.FC<DashboardProps> = ({ userState, onUpdateState }) => {
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [examFilter, setExamFilter] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isManualChapterMode, setIsManualChapterMode] = useState(false);
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
    const allSessions = Array.isArray(userState.studyHistory) ? userState.studyHistory : [];
    
    let filteredSessions = allSessions;
    if (subjectFilter) filteredSessions = filteredSessions.filter(s => s.subjectId === subjectFilter);
    if (examFilter) filteredSessions = filteredSessions.filter(s => s.examId === examFilter);

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
  }, [userState.studyHistory, userState.subjects, userState.streaks, userState.language, subjectFilter, examFilter]);

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

  const weeklyData = useMemo(() => {
    const data = [];
    const today = new Date();
    const history = Array.isArray(userState.studyHistory) ? userState.studyHistory : [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateString(d.getTime());
      
      const daySessions = history.filter(s => getLocalDateString(s.startTime) === dateStr);

      const studySeconds = daySessions.filter(s => !s.isRevision).reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
      const revisionSeconds = daySessions.filter(s => s.isRevision).reduce((acc, s) => acc + (s.durationSeconds || 0), 0);

      const dayIndex = d.getDay();
      const labelsBN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];
      const labelsEN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      data.push({
        name: userState.language === 'bn' ? labelsBN[dayIndex] : labelsEN[dayIndex],
        study: Number((studySeconds / 3600).toFixed(1)),
        revision: Number((revisionSeconds / 3600).toFixed(1))
      });
    }
    return data;
  }, [userState.studyHistory, userState.language]);

  const recentSessions = useMemo(() => {
    const history = Array.isArray(userState.studyHistory) ? userState.studyHistory : [];
    return [...history]
      .filter(s => !subjectFilter || s.subjectId === subjectFilter)
      .filter(s => !examFilter || s.examId === examFilter)
      .sort((a, b) => (b.startTime || 0) - (a.startTime || 0))
      .slice(0, 8);
  }, [userState.studyHistory, subjectFilter, examFilter]);

  const getSubjectName = (id: string) => {
    const rawSubjects = Array.isArray(userState.subjects) ? userState.subjects : [];
    const sub = rawSubjects.find(s => s.id === id);
    return sub ? `${sub.name} (P${sub.paper})` : t('সাধারণ পড়াশোনা', 'General Study');
  };

  const getExamName = (id: string) => {
    const collegeExams = Array.isArray(userState.profile?.collegeExams) ? userState.profile!.collegeExams : [];
    const ex = collegeExams.find(e => e.id === id);
    return ex ? ex.name : '';
  };

  const addTask = () => {
    if (!newTask.name.trim()) return;

    let finalChapterId = newTask.chapterId;
    let finalCustomChapterName = newTask.customChapterName.trim();

    const rawSubjects = Array.isArray(userState.subjects) ? userState.subjects : [];
    if (isManualChapterMode && finalCustomChapterName && newTask.subjectId) {
      const selectedSub = rawSubjects.find(s => s.id === newTask.subjectId);
      const match = Array.isArray(selectedSub?.chapters) ? selectedSub?.chapters.find(c => 
        c.name.toLowerCase() === finalCustomChapterName.toLowerCase()
      ) : null;
      if (match) {
        finalChapterId = match.id;
        finalCustomChapterName = ''; 
      }
    }

    const task: Task = {
      id: `task-${Date.now()}`,
      name: newTask.name.trim(),
      source: TaskSource.PERSONAL,
      isCompleted: false,
      subjectId: newTask.subjectId || undefined,
      chapterId: finalChapterId || undefined,
      customChapterName: finalCustomChapterName || undefined,
      createdAt: Date.now()
    };

    onUpdateState(prev => ({
      ...prev,
      dailyTasks: [...(Array.isArray(prev.dailyTasks) ? prev.dailyTasks : []), task]
    }));
    setNewTask({ name: '', source: TaskSource.PERSONAL, subjectId: '', chapterId: '', customChapterName: '' });
    setIsTaskModalOpen(false);
    setIsManualChapterMode(false);
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

  const isDark = document.documentElement.classList.contains('dark');
  const primaryColor = isDark ? '#5FB3A2' : '#5B7DBE';
  const secondaryColor = isDark ? '#8B9CF2' : '#7FAE9E';

  const rawSubjects = Array.isArray(userState.subjects) ? userState.subjects : [];
  const selectedSubject = rawSubjects.find(s => s.id === newTask.subjectId);

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700 pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl xs:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-brand-text-p leading-tight">
            <span className="opacity-40">{t('কিরে', 'Hey')}</span> {userState.profile?.fullName}!
          </h1>
          <p className="text-brand-text-s font-bold text-[11px] sm:text-xs md:text-sm mt-1 uppercase tracking-widest">{t('প্রস্তুতির বর্তমান হালচাল', 'Current Preparation Status')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl flex items-center gap-3 border border-brand-text-s/10 shadow-sm bg-brand-surface">
            <Activity size={16} className="text-brand-primary animate-pulse" />
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-brand-text-p leading-none">{t('মেজাজ', 'Mood')}: {userState.currentMood}</span>
          </div>
        </div>
      </header>

      {/* Countdown Area */}
      <section className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6 snap-x">
        {userState.profile?.targetExamDate && (
          <div className="bg-brand-primary text-white p-6 rounded-[2.5rem] shadow-xl border border-white/10 flex flex-col justify-between min-w-[200px] xs:min-w-[220px] snap-center shrink-0">
             <div className="flex justify-between items-start">
               <Calendar size={20} className="opacity-60" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('লক্ষ্য তারিখ', 'HSC GOAL')}</span>
             </div>
             <div className="mt-6">
                <h4 className="text-5xl font-black tracking-tighter tabular-nums leading-none">{getCountdown(userState.profile.targetExamDate)}</h4>
                <p className="text-[10px] font-bold opacity-60 uppercase mt-2 tracking-widest">{t('বাকি আছে', 'REMAINING')}</p>
             </div>
          </div>
        )}
        {upcomingExams.length > 0 && upcomingExams.map(exam => {
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
              className={`p-6 rounded-[2.5rem] shadow-sm border transition-all flex flex-col justify-between min-w-[180px] xs:min-w-[200px] snap-center shrink-0 text-left hover:scale-[1.02] active:scale-95 ${isActive ? 'bg-brand-secondary text-white border-brand-secondary shadow-brand-secondary/30' : 'bg-brand-surface text-brand-text-p border-brand-text-s/10 hover:border-brand-primary/50'}`}
            >
               <div className="flex justify-between items-start">
                 {exam.type === 'college' ? <GraduationCap size={20} className={isActive ? 'opacity-100' : 'opacity-40'} /> : <Clock size={20} className={isActive ? 'opacity-100' : 'opacity-40'} />}
                 <span className="text-[10px] font-black uppercase tracking-widest text-right truncate ml-2 max-w-[100px]">{exam.name}</span>
               </div>
               <div className="mt-6">
                  <h4 className="text-4xl font-black tracking-tighter tabular-nums leading-none">{getCountdown(exam.date)}</h4>
                  <p className="text-[10px] font-bold opacity-60 uppercase mt-2 tracking-widest truncate">{exam.type === 'college' ? t('কলেজ পরীক্ষা', 'COLLEGE') : t('বোর্ড পরীক্ষা', 'BOARD')}</p>
               </div>
            </button>
          );
        })}
      </section>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* Readiness and Stats Column */}
        <div className="lg:col-span-8 space-y-6 md:space-y-8">
          
          {/* Readiness Meter */}
          <section className="bg-brand-surface p-6 sm:p-8 md:p-10 lg:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-brand-text-s/10 shadow-sm relative overflow-hidden flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-6 md:mb-10">
                <div>
                  <h3 className="text-[10px] font-black text-brand-text-s uppercase tracking-[0.2em] mb-2">{t('সামগ্রিক প্রস্তুতি', 'Readiness Score')}</h3>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-6xl sm:text-7xl lg:text-8xl font-black text-brand-text-p leading-none tracking-tighter">{stats.score}</h2>
                    <span className="text-2xl font-bold text-brand-text-s/30">%</span>
                  </div>
                </div>
                <div className="hidden xs:flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-primary text-white shadow-xl shadow-brand-primary/30">
                  <Target size={18} />
                  <span className="text-xs font-black uppercase tracking-widest leading-none">{stats.readinessLabel}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                {[
                  { label: t('আজকের পড়া', 'Focus'), value: stats.factors.study, color: 'from-brand-primary to-brand-primary/60' },
                  { label: t('সিলেবাস', 'Syllabus'), value: stats.factors.completion, color: 'from-brand-secondary to-brand-secondary/60' },
                  { label: t('ধারাবাহিকতা', 'Consistency'), value: stats.factors.consistency, color: 'from-orange-500 to-amber-400' },
                  { label: t('রিভিশন', 'Revision'), value: stats.factors.revision, color: 'from-purple-500 to-pink-400' }
                ].map((factor, idx) => (
                  <div key={idx} className="space-y-2.5">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-brand-text-s">{factor.label}</span>
                      <span className="text-brand-text-p">{factor.value}%</span>
                    </div>
                    <div className="h-2 w-full bg-brand-bg rounded-full overflow-hidden shadow-inner">
                      <div className={`h-full bg-gradient-to-r ${factor.color} rounded-full transition-all duration-1000`} style={{ width: `${factor.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Weekly Report Chart */}
          <section className="bg-brand-surface p-6 sm:p-8 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-xs sm:text-sm font-black text-brand-text-s flex items-center gap-3 uppercase tracking-[0.2em]">
                <BarChart3 size={18} className="text-brand-primary" /> {t('সাপ্তাহিক রিপোর্ট', 'Weekly Report')}
              </h4>
            </div>
            <div className="h-64 sm:h-72 lg:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: isDark ? '#8A94A6' : '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: isDark ? '#8A94A6' : '#6B7280' }} unit="h" />
                  <Tooltip 
                     cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                     contentStyle={{ backgroundColor: isDark ? '#1B2636' : '#E9EDF0', border: 'none', borderRadius: '16px', fontSize: '11px', fontWeight: 700 }}
                  />
                  <Bar dataKey="study" stackId="a" fill={primaryColor} barSize={32} />
                  <Bar dataKey="revision" stackId="a" fill={secondaryColor} radius={[8, 8, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* Right Sidebar Column */}
        <div className="lg:col-span-4 space-y-6 md:space-y-8">
          
          {/* Main Focus Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6">
            <div className="bg-brand-primary text-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl shadow-brand-primary/20 relative overflow-hidden group">
              <TrendingUp size={60} className="absolute -right-4 -top-4 opacity-10 group-hover:scale-125 transition-transform duration-700" />
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-2">{t('মোট ফোকাস', 'Total Time')}</p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter tabular-nums leading-none">{stats.totalDisplay}</h2>
                <div className="mt-4 flex items-center gap-2">
                  <span className="px-2 py-1 rounded-lg bg-white/20 text-[10px] font-black uppercase tracking-widest">{t('আজ', 'Today')}: {stats.todayDisplay}</span>
                </div>
              </div>
            </div>
            <div className="bg-brand-surface p-6 sm:p-8 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm relative overflow-hidden group">
              <Coffee size={60} className="absolute -right-4 -top-4 text-brand-secondary opacity-5 group-hover:rotate-12 transition-transform duration-1000" />
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text-s mb-2">{t('বিশ্রাম সেশন', 'Break Time')}</p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-brand-secondary tracking-tighter tabular-nums leading-none">{stats.breakDisplay}</h2>
                <p className="text-[10px] font-black text-brand-text-s/40 mt-3 uppercase tracking-widest">{stats.totalBreaks} {t('টি ব্রেক', 'Total Breaks')}</p>
              </div>
            </div>
          </div>

          {/* Session History Sidebar */}
          <section className="bg-brand-surface p-6 sm:p-8 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm h-full max-h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <History size={18} className="text-brand-secondary" />
                <h4 className="text-xs font-black text-brand-text-p uppercase tracking-widest">{t('হিস্ট্রি', 'Recent History')}</h4>
              </div>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto scrollbar-hide pr-1">
              {recentSessions.length > 0 ? recentSessions.map((session) => (
                <div key={session.id} className="group flex flex-col gap-3 p-4 rounded-2xl bg-brand-bg/40 border border-brand-text-s/5 hover:border-brand-primary transition-all">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h5 className="font-bold text-xs text-brand-text-p mb-1 truncate leading-tight">
                        {getSubjectName(session.subjectId)}
                      </h5>
                      <div className="flex items-center gap-2">
                         <span className={`text-[9px] font-black uppercase tracking-widest leading-none ${session.isRevision ? 'text-brand-secondary' : 'text-brand-primary'}`}>
                           {session.isRevision ? t('রিভিশন', 'Revision') : t('পড়াশোনা', 'Focus')}
                         </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-[10px] font-black tabular-nums text-brand-text-s">
                      {new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-brand-surface/50 p-2 rounded-xl flex items-center gap-2">
                      <Clock size={12} className="text-brand-primary shrink-0" />
                      <p className="text-[11px] font-black text-brand-text-p tabular-nums leading-none">{formatDuration(session.durationSeconds)}</p>
                    </div>
                    <div className="flex-1 bg-brand-surface/50 p-2 rounded-xl flex items-center gap-2">
                      <Coffee size={12} className="text-brand-secondary shrink-0" />
                      <p className="text-[11px] font-black text-brand-text-p tabular-nums leading-none">{formatDuration(session.breakSeconds)}</p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-20">
                  <History size={32} className="mb-2" />
                  <p className="text-xs font-black uppercase tracking-widest">{t('কোনো তথ্য নেই', 'No History')}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Daily Tasks Section - Full Width Bottom */}
      <section className="bg-brand-surface p-6 sm:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-brand-text-s/10 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary shadow-sm">
               <ListTodo size={24} />
             </div>
             <div>
               <h3 className="text-xl font-black text-brand-text-p">{t('আজকের লক্ষ্য / হোমওয়ার্ক', 'Focus / Homework')}</h3>
               <p className="text-[10px] font-bold text-brand-text-s uppercase tracking-widest mt-0.5">{t('তোমার দৈনিক কার্যতালিকা', 'Manage your daily tasks')}</p>
             </div>
          </div>
          <button 
            onClick={() => setIsTaskModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3.5 bg-brand-primary text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-brand-primary/20 hover:scale-105 transition-all active:scale-95"
          >
            <Plus size={18} /> {t('নতুন হোমওয়ার্ক', 'Add New Task')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
          {userState.dailyTasks.length > 0 ? userState.dailyTasks.map(task => (
            <div key={task.id} className={`group flex flex-col p-5 rounded-3xl border transition-all duration-300 hover:shadow-lg ${task.isCompleted ? 'bg-emerald-50/20 border-emerald-100/50 dark:bg-emerald-950/10 dark:border-emerald-900/30' : 'bg-brand-bg/40 border-brand-text-s/5 hover:border-brand-primary/30'}`}>
              <div className="flex items-start justify-between gap-3">
                 <button onClick={() => toggleTask(task.id)} className="flex items-start gap-4 flex-1 text-left min-w-0">
                    <div className={`mt-0.5 shrink-0 transition-all ${task.isCompleted ? 'text-emerald-500 scale-110' : 'text-brand-text-s'}`}>
                      {task.isCompleted ? <CheckCircle size={22} /> : <Circle size={22} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold leading-tight ${task.isCompleted ? 'text-emerald-700 dark:text-emerald-400 line-through opacity-50' : 'text-brand-text-p'}`}>{task.name}</p>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-brand-text-s bg-brand-surface px-2 py-1 rounded-lg">
                          <Tag size={9} /> {task.source}
                        </span>
                        {task.subjectId && (
                           <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-2 py-1 rounded-lg border border-brand-primary/10">
                             <BookCheck size={9} /> {getSubjectName(task.subjectId)}
                           </span>
                        )}
                      </div>
                    </div>
                 </button>
                 <button onClick={() => deleteTask(task.id)} className="p-2 text-brand-text-s hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={16} />
                 </button>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-16 text-center space-y-4 bg-brand-bg/20 rounded-[2.5rem] border-2 border-dashed border-brand-text-s/10 flex flex-col items-center justify-center">
               <div className="w-16 h-16 rounded-full bg-brand-surface flex items-center justify-center text-brand-text-s/20">
                 <ListTodo size={32} />
               </div>
               <p className="text-xs font-black text-brand-text-s uppercase tracking-widest">{t('আজকের কোনো হোমওয়ার্ক নেই', 'No tasks set for today')}</p>
               <button onClick={() => setIsTaskModalOpen(true)} className="text-[10px] font-black text-brand-primary uppercase tracking-widest border-b border-brand-primary/30 pb-0.5 hover:border-brand-primary transition-all">
                 {t('প্রথমটি যোগ করো', 'Add your first task')}
               </button>
            </div>
          )}
        </div>

        {/* Improved Task Modal - Center on Screen */}
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
             <div className="w-full max-w-lg bg-brand-surface p-8 sm:p-10 rounded-[3rem] shadow-2xl border border-brand-text-s/10 max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 slide-in-from-bottom-4">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-2xl">
                      <Plus size={20} />
                    </div>
                    <h4 className="font-black text-lg text-brand-text-p uppercase tracking-widest">{t('নতুন হোমওয়ার্ক', 'New Task')}</h4>
                  </div>
                  <button onClick={() => setIsTaskModalOpen(false)} className="p-2 text-brand-text-s hover:text-brand-text-p hover:bg-brand-bg rounded-xl transition-all"><X size={24} /></button>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-brand-text-s uppercase tracking-[0.2em] ml-1">{t('টাস্কের নাম', 'Task Title')}</label>
                      <input 
                        type="text" 
                        value={newTask.name}
                        onChange={e => setNewTask({...newTask, name: e.target.value})}
                        placeholder={t("যেমন: ফিজিক্স প্রবলেম সেট", "e.g. Physics Problem Set")}
                        className="w-full px-6 py-4 bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl font-bold outline-none transition-all"
                      />
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-brand-text-s uppercase tracking-[0.2em] ml-1">{t('বিষয় (ঐচ্ছিক)', 'Subject')}</label>
                        <select 
                          value={newTask.subjectId} 
                          onChange={e => {
                            setNewTask({...newTask, subjectId: e.target.value, chapterId: '', customChapterName: ''});
                            setIsManualChapterMode(false);
                          }}
                          className="w-full px-4 py-4 bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl font-bold outline-none appearance-none cursor-pointer"
                        >
                          <option value="">{t('সব বিষয়', 'All Subjects')}</option>
                          {userState.subjects.map(s => <option key={s.id} value={s.id}>{s.name} P{s.paper}</option>)}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                          <label className="text-[10px] font-black text-brand-text-s uppercase tracking-[0.2em]">{t('উৎস', 'Source')}</label>
                        </div>
                        <select 
                          value={newTask.source} 
                          onChange={e => setNewTask({...newTask, source: e.target.value as TaskSource})}
                          className="w-full px-4 py-4 bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl font-bold outline-none appearance-none cursor-pointer"
                        >
                          {Object.values(TaskSource).map(source => <option key={source} value={source}>{source}</option>)}
                        </select>
                      </div>
                   </div>

                   <button 
                    onClick={addTask}
                    className="w-full py-5 mt-4 bg-brand-primary text-white font-black rounded-3xl shadow-2xl shadow-brand-primary/30 uppercase tracking-[0.3em] text-xs hover:scale-[1.02] active:scale-95 transition-all"
                   >
                     {t('অ্যাড টাস্ক', 'Save Task')}
                   </button>
                </div>
             </div>
          </div>
        )}
      </section>

      {/* Filter Indicator */}
      {(subjectFilter || examFilter) && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[90] bg-brand-surface/90 backdrop-blur-xl border border-brand-primary/30 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4">
           <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-brand-primary animate-ping" />
             <p className="text-[10px] font-black text-brand-text-p uppercase tracking-widest truncate max-w-[120px]">
               {subjectFilter ? getSubjectName(subjectFilter) : getExamName(examFilter!)}
             </p>
           </div>
           <button onClick={() => { setSubjectFilter(null); setExamFilter(null); }} className="p-1.5 hover:bg-brand-primary/10 rounded-full text-brand-primary transition-all">
             <X size={16} />
           </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
