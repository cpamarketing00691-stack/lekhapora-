
import React, { useState, useEffect, useMemo } from 'react';
import { UserState, StudySession, Mood, ActiveTimerState, Task, Subject } from '../types';
import { Play, Pause, Square, History, Clock, Brain, Battery, Wind, AlertCircle, Flame, Coffee, Zap as FocusIcon, ListTodo, GraduationCap, ChevronDown, CheckCircle2, BookOpen } from 'lucide-react';

interface TrackerProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const Tracker: React.FC<TrackerProps> = ({ userState, onUpdateState }) => {
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>('');
  const [selectedPaper, setSelectedPaper] = useState<1 | 2>(1);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [activeTaskId, setActiveTaskId] = useState<string>('');
  const [activeExamId, setActiveExamId] = useState<string>('');
  const [isRevision, setIsRevision] = useState(false);
  const [currentMood, setCurrentMood] = useState<Mood>('Focused');
  
  // UI ONLY: Sub-second ticker to make the display feel alive even if the parent state update is throttled.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  const timer = userState.activeTimer;

  // Sync local selection state with the active timer on mount or change
  useEffect(() => {
    if (timer) {
      const currentSubject = userState.subjects.find(s => s.id === timer.subjectId);
      if (currentSubject) {
        setSelectedSubjectName(currentSubject.name);
        setSelectedPaper(currentSubject.paper);
      }
      if (timer.taskId) setActiveTaskId(timer.taskId);
      if (timer.chapterId) setSelectedChapterId(timer.chapterId);
      if (timer.examId) setActiveExamId(timer.examId);
      setIsRevision(timer.isRevision);
    }
  }, [!!timer, timer?.subjectId]);

  // Derive display values using Date.now() to bridge the gap between state ticks.
  const { displayFocusSeconds, displayBreakSeconds } = useMemo(() => {
    if (!timer) return { displayFocusSeconds: 0, displayBreakSeconds: 0 };
    const diffSecs = Math.max(0, Math.floor((now - timer.lastTimestamp) / 1000));
    return {
      displayFocusSeconds: timer.accumulatedFocusSeconds + (timer.isFocusActive ? diffSecs : 0),
      displayBreakSeconds: timer.accumulatedBreakSeconds + (!timer.isFocusActive ? diffSecs : 0)
    };
  }, [timer, now]);

  // Derive unique subject names for the dropdown
  const subjectNames = useMemo(() => {
    const names = new Set(userState.subjects.map(s => s.name));
    return Array.from(names).sort();
  }, [userState.subjects]);

  // Find the target subject based on selection
  const targetSubject = useMemo(() => {
    return userState.subjects.find(s => s.name === selectedSubjectName && s.paper === selectedPaper);
  }, [selectedSubjectName, selectedPaper, userState.subjects]);

  const chapters = useMemo(() => {
    return targetSubject?.chapters || [];
  }, [targetSubject]);

  const availableTasks = useMemo(() => {
    return userState.dailyTasks.filter(task => 
      !task.isCompleted && (!targetSubject || task.subjectId === targetSubject.id)
    );
  }, [userState.dailyTasks, targetSubject]);

  const formatDuration = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  const handleStartResume = () => {
    if (!targetSubject) {
      alert(t('দয়া করে বিষয় নির্বাচন করো!', 'Please select a subject!'));
      return;
    }
    
    onUpdateState(prev => {
      const nowTs = Date.now();
      if (!prev.activeTimer) {
        return {
          ...prev,
          activeTimer: {
            subjectId: targetSubject.id,
            taskId: activeTaskId || undefined,
            chapterId: selectedChapterId || undefined,
            examId: activeExamId || undefined,
            isFocusActive: true,
            isRevision,
            accumulatedFocusSeconds: 0,
            accumulatedBreakSeconds: 0,
            numBreaks: 0,
            lastTimestamp: nowTs,
            sessionStartTime: nowTs
          }
        };
      }

      // RESUME STUDY: Finalize the break count using current timestamp before switching.
      const elapsedMs = nowTs - prev.activeTimer.lastTimestamp;
      const deltaSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
      
      return {
        ...prev,
        activeTimer: { 
          ...prev.activeTimer, 
          isFocusActive: true, 
          accumulatedBreakSeconds: prev.activeTimer.accumulatedBreakSeconds + deltaSeconds,
          lastTimestamp: nowTs // Reset anchor to now
        }
      };
    });
  };

  const handlePause = () => {
    onUpdateState(prev => {
      if (!prev.activeTimer) return prev;
      const nowTs = Date.now();
      
      // START BREAK: Finalize the study count using current timestamp before switching.
      const elapsedMs = nowTs - prev.activeTimer.lastTimestamp;
      const deltaSeconds = Math.max(0, Math.floor(elapsedMs / 1000));

      return {
        ...prev,
        activeTimer: { 
          ...prev.activeTimer, 
          isFocusActive: false, 
          accumulatedFocusSeconds: prev.activeTimer.accumulatedFocusSeconds + deltaSeconds,
          numBreaks: prev.activeTimer.numBreaks + 1, 
          lastTimestamp: nowTs // Reset anchor to now
        }
      };
    });
  };

  const handleStopEnd = () => {
    if (!timer) return;
    const nowTs = Date.now();
    const elapsedMs = nowTs - timer.lastTimestamp;
    const deltaSeconds = Math.max(0, Math.floor(elapsedMs / 1000));

    const finalFocus = timer.accumulatedFocusSeconds + (timer.isFocusActive ? deltaSeconds : 0);
    const finalBreak = timer.accumulatedBreakSeconds + (!timer.isFocusActive ? deltaSeconds : 0);

    const session: StudySession = {
      id: `timer-${Date.now()}`,
      subjectId: timer.subjectId,
      taskId: timer.taskId,
      chapterId: timer.chapterId,
      examId: timer.examId,
      startTime: timer.sessionStartTime,
      endTime: nowTs,
      durationSeconds: finalFocus,
      breakSeconds: finalBreak,
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

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-12">
      <header className="text-center">
        <h2 className="text-3xl font-black tracking-tight text-brand-text-p">{t('স্টাডি ফোকাস', 'Study Focus')}</h2>
        <p className="text-brand-text-s text-xs font-medium uppercase tracking-widest mt-1">{t('সাফল্যের সময় গণনা শুরু করো', 'Start counting your success time')}</p>
      </header>

      <div className="bg-brand-surface rounded-[2.5rem] p-6 sm:p-10 shadow-xl border border-brand-text-s/10 transition-all">
        {/* Selection Area */}
        <div className="mb-8 space-y-6">
          <div className="flex bg-brand-bg p-1 rounded-2xl max-w-[300px] mx-auto border border-brand-text-s/5">
            <button 
              disabled={!!timer}
              onClick={() => setIsRevision(false)} 
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isRevision ? 'bg-brand-surface text-brand-primary shadow-sm' : 'text-brand-text-s'}`}
            >
              {t('পড়াশোনা', 'Study')}
            </button>
            <button 
              disabled={!!timer}
              onClick={() => setIsRevision(true)} 
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isRevision ? 'bg-brand-surface text-brand-secondary shadow-sm' : 'text-brand-text-s'}`}
            >
              {t('রিভিশন', 'Revision')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-brand-text-s uppercase tracking-widest ml-1">{t('বিষয় নির্বাচন', 'Choose Subject')}</label>
              <div className="relative">
                <select 
                  disabled={!!timer} 
                  value={selectedSubjectName} 
                  onChange={(e) => setSelectedSubjectName(e.target.value)} 
                  className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl px-5 py-4 text-xs font-bold appearance-none outline-none transition-all disabled:opacity-50"
                >
                  <option value="">{t('বিষয় বেছে নাও', 'Choose Subject')}</option>
                  {subjectNames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
                {!timer && <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-text-s pointer-events-none" size={16} />}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-widest ml-1">{t('পত্র/পার্ট নির্বাচন', 'Select Paper')}</label>
              <div className="flex bg-brand-bg p-1 rounded-2xl h-[52px]">
                <button 
                  disabled={!!timer}
                  onClick={() => setSelectedPaper(1)}
                  className={`flex-1 rounded-xl text-[10px] font-black uppercase transition-all ${selectedPaper === 1 ? 'bg-brand-surface text-brand-primary shadow-sm' : 'text-brand-text-s opacity-50'}`}
                >
                  {t('১ম পত্র', '1st Paper')}
                </button>
                <button 
                  disabled={!!timer}
                  onClick={() => setSelectedPaper(2)}
                  className={`flex-1 rounded-xl text-[10px] font-black uppercase transition-all ${selectedPaper === 2 ? 'bg-brand-surface text-brand-primary shadow-sm' : 'text-brand-text-s opacity-50'}`}
                >
                  {t('২য় পত্র', '2nd Paper')}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-brand-text-s uppercase tracking-widest ml-1">{t('চ্যাপ্টার (ঐচ্ছিক)', 'Chapter (Optional)')}</label>
              <div className="relative">
                <select 
                  disabled={!!timer} 
                  value={selectedChapterId} 
                  onChange={(e) => setSelectedChapterId(e.target.value)} 
                  className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl px-5 py-4 text-xs font-bold appearance-none outline-none transition-all disabled:opacity-50"
                >
                  <option value="">{t('চ্যাপ্টার বেছে নাও', 'Choose Chapter')}</option>
                  {chapters.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                </select>
                {!timer && <BookOpen className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-text-s pointer-events-none opacity-40" size={16} />}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-brand-text-s uppercase tracking-widest ml-1">{t('টাস্ক (ঐচ্ছিক)', 'Task (Optional)')}</label>
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
          </div>
        </div>

        {/* Timer UI */}
        <div className="text-center py-6">
          <div 
            className={`font-black tracking-tighter tabular-nums leading-none select-none transition-all drop-shadow-sm ${timer?.isFocusActive === false ? 'text-brand-secondary scale-95 opacity-80' : 'text-brand-text-p scale-100'}`}
            style={{ fontSize: 'clamp(3rem, 18vw, 7.5rem)' }}
          >
            {formatDuration(displayFocusSeconds)}
          </div>
          
          <div className="flex items-center justify-center gap-10 mt-8">
            <div className={`flex flex-col items-center gap-1 transition-all ${timer?.isFocusActive ? 'scale-110' : 'opacity-40'}`}>
              <div className="flex items-center gap-1.5 text-brand-primary font-black text-[10px] uppercase tracking-widest">
                <FocusIcon size={12} className={timer?.isFocusActive ? "animate-pulse" : ""} />
                <span>{t('ফোকাস টাইম', 'FOCUS TIME')}</span>
              </div>
              <p className="text-sm font-bold text-brand-text-p">{formatDuration(displayFocusSeconds)}</p>
            </div>
            
            <div className="h-10 w-px bg-brand-text-s/10"></div>

            <div className={`flex flex-col items-center gap-1 transition-all ${timer && !timer.isFocusActive ? 'scale-110 text-brand-secondary' : 'opacity-40 text-brand-text-s'}`}>
              <div className="flex items-center gap-1.5 font-black text-[10px] uppercase tracking-widest">
                <Coffee size={12} className={timer && !timer.isFocusActive ? "animate-bounce" : ""} />
                <span>{t('ব্রেক টাইম', 'BREAK TIME')}</span>
              </div>
              <p className="text-sm font-bold">{formatDuration(displayBreakSeconds)}</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-8 mt-6">
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

          <div className="flex items-center justify-center gap-10 pb-4">
            {!timer?.isFocusActive ? (
              <button 
                onClick={handleStartResume} 
                className="w-24 h-24 bg-brand-primary text-white flex items-center justify-center rounded-full shadow-2xl transition-all active:scale-90 hover:scale-105 group border-8 border-brand-surface"
              >
                <Play size={40} className="ml-1 fill-current transition-transform group-hover:scale-110" />
              </button>
            ) : (
              <button 
                onClick={handlePause} 
                className="w-24 h-24 bg-brand-surface text-brand-text-p flex items-center justify-center rounded-full border-8 border-brand-bg shadow-xl transition-all active:scale-90 hover:scale-105"
              >
                <Pause size={40} className="fill-current" />
              </button>
            )}
            <button 
              onClick={handleStopEnd} 
              disabled={!timer} 
              className="w-16 h-16 bg-brand-bg text-red-500 flex items-center justify-center rounded-full shadow-lg transition-all active:scale-90 disabled:opacity-30 hover:bg-red-50"
            >
              <Square size={24} className="fill-current" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Session Details Summary */}
      {timer && (
        <div className="bg-brand-bg/40 border border-brand-text-s/10 p-5 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-2">
           <div className="p-3 bg-brand-surface rounded-2xl text-brand-primary shrink-0 border border-brand-text-s/5 shadow-sm">
             <Brain size={24} />
           </div>
           <div className="min-w-0">
             <h4 className="text-[10px] font-black text-brand-text-s uppercase tracking-widest">{t('চলতি সেশন', 'Current Session')}</h4>
             <p className="text-sm font-bold text-brand-text-p truncate">
               {selectedSubjectName} {t(selectedPaper === 1 ? '১ম পত্র' : '২য় পত্র', selectedPaper === 1 ? '1st Paper' : '2nd Paper')}
               {selectedChapterId && ` • ${targetSubject?.chapters.find(c => c.id === selectedChapterId)?.name}`}
               {timer.taskId && ` • ${userState.dailyTasks.find(t => t.id === timer.taskId)?.name}`}
             </p>
           </div>
        </div>
      )}
    </div>
  );
};

export default Tracker;
