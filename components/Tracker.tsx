
import React, { useState, useEffect, useMemo } from 'react';
import { UserState, StudySession, Mood, ActiveTimerState, Task } from '../types';
import { Play, Pause, Square, History, Clock, Brain, Battery, Wind, AlertCircle, Flame, Coffee, Zap as FocusIcon, ListTodo, GraduationCap, ChevronDown } from 'lucide-react';

interface TrackerProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const Tracker: React.FC<TrackerProps> = ({ userState, onUpdateState }) => {
  const [activeSubjectId, setActiveSubjectId] = useState<string>(userState.activeTimer?.subjectId || '');
  const [activeTaskId, setActiveTaskId] = useState<string>(userState.activeTimer?.taskId || '');
  const [activeExamId, setActiveExamId] = useState<string>(userState.activeTimer?.examId || '');
  const [isRevision, setIsRevision] = useState(userState.activeTimer?.isRevision || false);
  const [showManual, setShowManual] = useState(false);
  const [currentMood, setCurrentMood] = useState<Mood>(userState.currentMood || 'Focused');

  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  const formatDuration = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  const timer = userState.activeTimer;

  // Filter tasks that belong to the selected subject or are general
  const availableTasks = useMemo(() => {
    return userState.dailyTasks.filter(task => 
      !task.isCompleted && (!activeSubjectId || task.subjectId === activeSubjectId)
    );
  }, [userState.dailyTasks, activeSubjectId]);

  const upcomingExams = useMemo(() => {
    const collegeExams = Array.isArray(userState.profile?.collegeExams) ? userState.profile!.collegeExams : [];
    const rawSubjects = Array.isArray(userState.subjects) ? userState.subjects : [];
    const subjectExams = rawSubjects.filter(s => !!s.examDate).map(s => ({
      id: s.id,
      name: `${s.name} (P${s.paper})`,
      type: 'subject'
    }));
    return [...collegeExams.map(ex => ({ id: ex.id, name: ex.name, type: 'college' })), ...subjectExams];
  }, [userState.profile?.collegeExams, userState.subjects]);

  const handleStartResume = () => {
    if (!activeSubjectId) {
      alert(t('দয়া করে একটি বিষয় নির্বাচন করো!', 'Please select a subject!'));
      return;
    }
    onUpdateState(prev => {
      const now = Date.now();
      if (!prev.activeTimer) {
        return {
          ...prev,
          activeTimer: {
            subjectId: activeSubjectId,
            taskId: activeTaskId || undefined,
            examId: activeExamId || undefined,
            isFocusActive: true,
            isRevision,
            accumulatedFocusSeconds: 0,
            accumulatedBreakSeconds: 0,
            numBreaks: 0,
            lastTimestamp: now,
            sessionStartTime: now
          }
        };
      }
      return {
        ...prev,
        activeTimer: { ...prev.activeTimer, isFocusActive: true, lastTimestamp: now }
      };
    });
  };

  const handlePause = () => {
    onUpdateState(prev => {
      if (!prev.activeTimer) return prev;
      return {
        ...prev,
        activeTimer: { 
          ...prev.activeTimer, 
          isFocusActive: false, 
          numBreaks: prev.activeTimer.numBreaks + 1, 
          lastTimestamp: Date.now() 
        }
      };
    });
  };

  const handleStopEnd = () => {
    if (!timer) return;
    const session: StudySession = {
      id: `timer-${Date.now()}`,
      subjectId: timer.subjectId,
      taskId: timer.taskId,
      examId: timer.examId,
      startTime: timer.sessionStartTime,
      endTime: Date.now(),
      durationSeconds: timer.accumulatedFocusSeconds,
      breakSeconds: timer.accumulatedBreakSeconds,
      numBreaks: timer.numBreaks,
      focusLevel: 8,
      mood: currentMood,
      isRevision: timer.isRevision
    };
    onUpdateState(prev => ({
      ...prev,
      studyHistory: [...(prev.studyHistory || []), session],
      activeTimer: null
    }));
  };

  const moods: { label: Mood; icon: React.ReactNode; color: string }[] = [
    { label: 'Great', icon: <Flame size={18} />, color: 'text-orange-500' },
    { label: 'Focused', icon: <Brain size={18} />, color: 'text-brand-primary' },
    { label: 'Tired', icon: <Battery size={18} />, color: 'text-amber-500' },
    { label: 'Stressed', icon: <AlertCircle size={18} />, color: 'text-rose-500' },
    { label: 'Burnt Out', icon: <Wind size={18} />, color: 'text-slate-400' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-12">
      <header className="flex items-center justify-between px-2">
        <div className="w-10"></div>
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-brand-text-p">{t('স্টাডি ফোকাস', 'Study Focus')}</h2>
          <p className="text-brand-text-s text-[10px] sm:text-xs font-medium uppercase tracking-widest">{t('সাফল্যের সময় গণনা করো', 'Track time to success')}</p>
        </div>
        <div className="w-10"></div>
      </header>

      <div className="bg-brand-surface rounded-[2.5rem] p-6 sm:p-10 shadow-xl border border-brand-text-s/10 transition-all">
        {/* Selection Area */}
        <div className="mb-8 space-y-5">
          <div className="flex bg-brand-bg p-1 rounded-2xl max-w-[280px] mx-auto border border-brand-text-s/5">
            <button 
              disabled={!!timer}
              onClick={() => setIsRevision(false)} 
              className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!isRevision ? 'bg-brand-surface text-brand-primary shadow-sm' : 'text-brand-text-s'}`}
            >
              {t('পড়াশোনা', 'Study')}
            </button>
            <button 
              disabled={!!timer}
              onClick={() => setIsRevision(true)} 
              className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isRevision ? 'bg-brand-surface text-brand-secondary shadow-sm' : 'text-brand-text-s'}`}
            >
              {t('রিভিশন', 'Revision')}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-brand-text-s uppercase tracking-widest ml-1">{t('বিষয় নির্বাচন করো', 'Choose Subject')}</label>
              <div className="relative">
                <select 
                  disabled={!!timer} 
                  value={activeSubjectId} 
                  onChange={(e) => {
                    setActiveSubjectId(e.target.value);
                    setActiveTaskId(''); // Reset task when subject changes
                  }} 
                  className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl px-5 py-4 text-xs font-bold appearance-none outline-none transition-all disabled:opacity-50"
                >
                  <option value="">{t('বিষয় বেছে নাও', 'Choose Subject')}</option>
                  {userState.subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name} (P{sub.paper})</option>)}
                </select>
                {!timer && <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-text-s pointer-events-none" size={16} />}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-brand-text-s uppercase tracking-widest ml-1">{t('হোমওয়ার্ক/টাস্ক', 'Select Task')}</label>
                <div className="relative">
                  <select 
                    disabled={!!timer} 
                    value={activeTaskId} 
                    onChange={(e) => setActiveTaskId(e.target.value)} 
                    className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl px-5 py-4 text-xs font-bold appearance-none outline-none transition-all disabled:opacity-50"
                  >
                    <option value="">{t('টাস্ক বেছে নাও', 'Choose Task')}</option>
                    {availableTasks.map(task => <option key={task.id} value={task.id}>{task.name}</option>)}
                  </select>
                  {!timer && <ListTodo className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-text-s pointer-events-none opacity-40" size={16} />}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-brand-text-s uppercase tracking-widest ml-1">{t('পরীক্ষা সংযোগ (ঐচ্ছিক)', 'Link Exam')}</label>
                <div className="relative">
                  <select 
                    disabled={!!timer} 
                    value={activeExamId} 
                    onChange={(e) => setActiveExamId(e.target.value)} 
                    className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl px-5 py-4 text-xs font-bold appearance-none outline-none transition-all disabled:opacity-50"
                  >
                    <option value="">{t('পরীক্ষা বেছে নাও', 'Choose Exam')}</option>
                    {upcomingExams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                  </select>
                  {!timer && <GraduationCap className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-text-s pointer-events-none opacity-40" size={16} />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timer Display */}
        <div className="text-center py-6 sm:py-10">
          <div 
            className="font-black tracking-tighter tabular-nums leading-none select-none text-brand-text-p transition-all drop-shadow-sm"
            style={{ fontSize: 'clamp(2.5rem, 18vw, 7.5rem)' }}
          >
            {formatDuration(timer?.accumulatedFocusSeconds || 0)}
          </div>
          
          <div className="flex items-center justify-center gap-8 mt-6">
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-1.5 text-brand-primary font-black text-[10px] uppercase tracking-widest">
                <FocusIcon size={12} className="animate-pulse" />
                <span>{t('ফোকাস টাইম', 'FOCUS TIME')}</span>
              </div>
              <p className="text-xs font-bold text-brand-text-s">{formatDuration(timer?.accumulatedFocusSeconds || 0)}</p>
            </div>
            
            <div className="h-10 w-px bg-brand-text-s/10"></div>

            <div className="flex flex-col items-center gap-1.5">
              <div className={`flex items-center gap-1.5 font-black text-[10px] uppercase tracking-widest transition-all ${timer && !timer.isFocusActive ? 'text-brand-secondary' : 'text-brand-text-s opacity-30'}`}>
                <Coffee size={12} />
                <span>{t('ব্রেক টাইম', 'BREAK TIME')}</span>
              </div>
              <p className={`text-xs font-bold transition-all ${timer && !timer.isFocusActive ? 'text-brand-secondary' : 'text-brand-text-s opacity-30'}`}>{formatDuration(timer?.accumulatedBreakSeconds || 0)}</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-8 mt-4">
          <div className={`flex gap-3 p-2 bg-brand-bg rounded-3xl transition-all shadow-inner ${!timer ? 'opacity-30 pointer-events-none grayscale scale-95' : 'scale-100'}`}>
            {moods.map(m => (
              <button
                key={m.label}
                onClick={() => setCurrentMood(m.label)}
                className={`p-3 rounded-2xl transition-all active:scale-90 ${currentMood === m.label ? 'bg-brand-surface shadow-md scale-110' : 'opacity-40 hover:opacity-100'}`}
                title={m.label}
              >
                <div className={currentMood === m.label ? m.color : 'text-brand-text-s'}>
                  {m.icon}
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-8 pb-4">
            {!timer?.isFocusActive ? (
              <button 
                onClick={handleStartResume} 
                className="w-24 h-24 bg-brand-primary text-white flex items-center justify-center rounded-full shadow-2xl transition-all active:scale-90 hover:scale-105 group"
              >
                <Play size={36} className="ml-1 fill-current group-hover:scale-110 transition-transform" />
              </button>
            ) : (
              <button 
                onClick={handlePause} 
                className="w-24 h-24 bg-brand-surface text-brand-text-p flex items-center justify-center rounded-full border-4 border-brand-bg shadow-xl transition-all active:scale-90 hover:scale-105"
              >
                <Pause size={36} className="fill-current" />
              </button>
            )}
            <button 
              onClick={handleStopEnd} 
              disabled={!timer} 
              className="w-16 h-16 bg-brand-bg text-red-500 flex items-center justify-center rounded-full shadow-lg transition-all active:scale-90 disabled:opacity-30 hover:bg-red-50"
            >
              <Square size={22} className="fill-current" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Session Info Details */}
      {timer && (
        <div className="bg-brand-bg/50 border border-brand-text-s/10 p-5 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-2">
           <div className="p-3 bg-brand-surface rounded-2xl text-brand-primary shrink-0">
             <Brain size={20} />
           </div>
           <div className="min-w-0">
             <h4 className="text-[10px] font-black text-brand-text-s uppercase tracking-widest">{t('চলতি সেশন বিবরণ', 'Current Session Details')}</h4>
             <p className="text-sm font-bold text-brand-text-p truncate">
               {userState.subjects.find(s => s.id === timer.subjectId)?.name} 
               {timer.taskId && ` • ${userState.dailyTasks.find(t => t.id === timer.taskId)?.name}`}
             </p>
           </div>
        </div>
      )}
    </div>
  );
};

export default Tracker;
