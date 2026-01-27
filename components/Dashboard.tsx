
import React, { useMemo, useState } from 'react';
import { UserState, Subject, CollegeExam, Task, TaskSource, StudySession } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, RefreshCcw, BarChart3, Info, Target, History, BookOpen, Clock, Coffee, ArrowRight, Calendar, Filter, X, GraduationCap, ListTodo, Plus, Trash2, CheckCircle, Circle, Tag, Sparkles, BookCheck, Edit3, PlayCircle } from 'lucide-react';

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
        <div className="bg-brand-primary text-white p-6 rounded-[2.5rem] shadow-xl shadow-brand-primary/20 animate-in slide-in-from-top-4 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10">
          <div className="flex items-center gap-5 w-full md:w-auto">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shrink-0">
              <PlayCircle size={32} className="animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{t('বর্তমানে পড়ছো', 'Current Study Session')}</p>
              <h3 className="text-lg sm:text-xl font-black truncate">{getSubjectName(userState.activeTimer.subjectId)}</h3>
              <p className="text-[10px] font-bold opacity-80">{userState.activeTimer.isRevision ? t('রিভিশন সেশন', 'Revision Mode') : t('পড়াশোনা সেশন', 'Study Mode')}</p>
            </div>
          </div>
          <div className="flex items-center gap-6 sm:gap-10 w-full md:w-auto justify-center md:justify-end border-t md:border-t-0 border-white/10 pt-4 md:pt-0">
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">{t('পড়ার সময়', 'Study')}</p>
              <p className="text-xl sm:text-2xl font-black tabular-nums">{formatDuration(userState.activeTimer.accumulatedFocusSeconds)}</p>
            </div>
            <div className="h-10 w-px bg-white/20 hidden sm:block"></div>
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">{t('ব্রেক', 'Break')}</p>
              <p className="text-xl sm:text-2xl font-black tabular-nums">{formatDuration(userState.activeTimer.accumulatedBreakSeconds)}</p>
            </div>
          </div>
        </div>
      )}

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

      <section className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary shrink-0">
               <ListTodo size={20} />
             </div>
             <h3 className="text-lg font-black text-brand-text-p leading-tight">{t('আজকের লক্ষ্য / হোমওয়ার্ক', 'Today\'s Focus / Homework')}</h3>
          </div>
          <button 
            onClick={() => setIsTaskModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-brand-primary/20 hover:scale-105 transition-all w-full sm:w-auto justify-center"
          >
            <Plus size={14} /> {t('নতুন হোমওয়ার্ক', 'Add HW')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.isArray(userState.dailyTasks) && userState.dailyTasks.length > 0 ? userState.dailyTasks.map(task => (
            <div key={task.id} className={`group flex flex-col p-4 rounded-2xl border transition-all ${task.isCompleted ? 'bg-emerald-50/30 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800' : 'bg-brand-bg/50 border-brand-text-s/10 hover:border-brand-primary'}`}>
              <div className="flex items-start justify-between gap-2">
                 <button onClick={() => toggleTask(task.id)} className="flex items-start gap-3 min-w-0 text-left">
                    <div className={`mt-0.5 shrink-0 ${task.isCompleted ? 'text-emerald-500' : 'text-brand-text-s'}`}>
                      {task.isCompleted ? <CheckCircle size={18} /> : <Circle size={18} />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold leading-tight ${task.isCompleted ? 'text-emerald-700 dark:text-emerald-400 line-through opacity-60' : 'text-brand-text-p'}`}>{task.name}</p>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-brand-text-s bg-brand-surface px-1.5 py-0.5 rounded">
                          <Tag size={8} /> {task.source}
                        </span>
                        {task.subjectId && (
                           <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded border border-brand-primary/20 truncate max-w-[120px]">
                             <BookCheck size={8} /> {getSubjectName(task.subjectId)}
                           </span>
                        )}
                      </div>
                    </div>
                 </button>
                 <button onClick={() => deleteTask(task.id)} className="p-1.5 text-brand-text-s hover:text-red-500 transition-all">
                    <Trash2 size={14} />
                 </button>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-8 text-center space-y-3 bg-brand-bg/30 rounded-3xl border border-dashed border-brand-text-s/10">
               <Info className="mx-auto text-brand-text-s opacity-20" size={32} />
               <p className="text-[10px] font-black text-brand-text-s uppercase tracking-widest">{t('আজকের কোনো হোমওয়ার্ক নেই', 'No homework set for today')}</p>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-brand-surface p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-brand-text-s/10 relative overflow-hidden">
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-brand-surface p-6 sm:p-8 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm overflow-hidden">
          <h4 className="text-xs sm:text-sm font-black text-brand-text-s flex items-center gap-2 uppercase tracking-[0.2em] mb-6">
            <BarChart3 size={16} className="text-brand-primary" /> {t('সাপ্তাহিক রিপোর্ট', 'Weekly Report')}
          </h4>
          <div className="h-56 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: isDark ? '#8A94A6' : '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: isDark ? '#8A94A6' : '#6B7280' }} unit="h" />
                <Tooltip 
                   cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                   contentStyle={{ backgroundColor: isDark ? '#1B2636' : '#E9EDF0', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                />
                <Bar dataKey="study" stackId="a" fill={primaryColor} barSize={20} />
                <Bar dataKey="revision" stackId="a" fill={secondaryColor} radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-brand-surface p-6 sm:p-8 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <History size={16} className="text-brand-secondary" />
              <h4 className="text-xs sm:text-sm font-black text-brand-text-p uppercase tracking-widest">{t('সেশন হিস্ট্রি', 'Session History')}</h4>
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto pr-1 max-h-[400px] scrollbar-hide">
            {recentSessions.length > 0 ? recentSessions.map((session) => (
              <div key={session.id} className="flex flex-col gap-2 p-4 rounded-2xl bg-brand-bg/50 border border-brand-text-s/10 hover:border-brand-primary transition-all">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h5 className="font-black text-[10px] sm:text-[11px] text-brand-text-p mb-1 truncate">
                      {getSubjectName(session.subjectId)}
                    </h5>
                    <div className="flex flex-wrap items-center gap-2">
                       <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-brand-text-s flex items-center gap-1">
                         {session.isRevision ? t('রিভিশন', 'Revision') : t('পড়াশোনা', 'Study')}
                       </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[8px] sm:text-[9px] font-black text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">
                    {new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="bg-brand-bg p-2 rounded-xl flex items-center gap-2">
                    <Clock size={10} className="text-brand-primary shrink-0" />
                    <p className="text-[9px] sm:text-[10px] font-black text-brand-text-p tabular-nums leading-none">{formatDuration(session.durationSeconds)}</p>
                  </div>
                  <div className="bg-brand-bg p-2 rounded-xl flex items-center gap-2">
                    <Coffee size={10} className="text-brand-secondary shrink-0" />
                    <p className="text-[9px] sm:text-[10px] font-black text-brand-text-p tabular-nums leading-none">{formatDuration(session.breakSeconds)}</p>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-center text-[10px] font-bold text-brand-text-s py-10">{t('কোনো তথ্য নেই', 'No history found')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
