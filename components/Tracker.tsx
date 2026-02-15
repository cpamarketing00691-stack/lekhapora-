import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserState, StudySession, Mood, Task, Subject, Chapter } from '../types';
import { 
  Play, Pause, Square, Clock, Brain, Coffee, 
  Zap as FocusIcon, AlertCircle, Sparkles, 
  Target, Timer as TimerIcon
} from 'lucide-react';

interface TrackerProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

type TimerMode = 'stopwatch' | 'pomodoro';

const Tracker: React.FC<TrackerProps> = ({ userState, onUpdateState }) => {
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>('');
  const [selectedPaper, setSelectedPaper] = useState<1 | 2>(1);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [activeTaskId, setActiveTaskId] = useState<string>('');
  const [isRevision, setIsRevision] = useState(false);
  const [currentMood, setCurrentMood] = useState<Mood>('Focused');
  
  // Timer Mode State
  const [timerMode, setTimerMode] = useState<TimerMode>('pomodoro');
  const [pomodoroStage, setPomodoroStage] = useState<'focus' | 'break'>('focus');
  const [pomodoroRemaining, setPomodoroRemaining] = useState(25 * 60);
  
  const [now, setNow] = useState(Date.now());
  const timer = userState.activeTimer;

  // Sync internal clock for display
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  // Sync UI with active timer state if it exists (e.g. on page refresh)
  useEffect(() => {
    if (timer) {
      const currentSubject = userState.subjects.find((s: Subject) => s.id === timer.subjectId);
      if (currentSubject) {
        setSelectedSubjectName(currentSubject.name);
        setSelectedPaper(currentSubject.paper);
      }
      if (timer.taskId) setActiveTaskId(timer.taskId);
      if (timer.chapterId) setSelectedChapterId(timer.chapterId);
      setIsRevision(timer.isRevision);
    }
  }, [!!timer]);

  // Pomodoro Countdown Logic (Drift-proof)
  useEffect(() => {
    if (timer?.isFocusActive && timerMode === 'pomodoro') {
      const startTime = Date.now();
      const startRemaining = pomodoroRemaining;
      
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const nextRemaining = Math.max(0, startRemaining - elapsed);
        
        setPomodoroRemaining(nextRemaining);
        
        if (nextRemaining <= 0) {
          clearInterval(interval);
          handlePomodoroFinish();
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [timer?.isFocusActive, timerMode, pomodoroStage]);

  const handlePomodoroFinish = () => {
    // Play sound if possible
    try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); } catch(e) {}
    
    if (pomodoroStage === 'focus') {
      alert(t("ফোকাস সেশন শেষ! ৫ মিনিটের ব্রেক নাও।", "Focus session done! Take 5 mins break."));
      setPomodoroStage('break');
      setPomodoroRemaining(5 * 60);
    } else {
      alert(t("ব্রেক শেষ! আবার পড়ার সময়।", "Break over! Time to focus."));
      setPomodoroStage('focus');
      setPomodoroRemaining(25 * 60);
    }
    handlePause();
  };

  // Accurate time calculation based on timestamps (prevents drift)
  const { displayFocusSeconds, displayBreakSeconds } = useMemo(() => {
    if (!timer) return { displayFocusSeconds: 0, displayBreakSeconds: 0 };
    const diffSecs = Math.max(0, Math.floor((now - timer.lastTimestamp) / 1000));
    return {
      displayFocusSeconds: timer.accumulatedFocusSeconds + (timer.isFocusActive ? diffSecs : 0),
      displayBreakSeconds: timer.accumulatedBreakSeconds + (!timer.isFocusActive ? diffSecs : 0)
    };
  }, [timer, now]);

  const subjectNames = useMemo(() => {
    const names = new Set(userState.subjects.map((s: Subject) => s.name));
    return Array.from(names).sort();
  }, [userState.subjects]);

  const targetSubject = useMemo(() => {
    return userState.subjects.find((s: Subject) => s.name === selectedSubjectName && s.paper === selectedPaper);
  }, [selectedSubjectName, selectedPaper, userState.subjects]);

  const chapters = useMemo(() => targetSubject?.chapters || [], [targetSubject]);

  const formatTimeDisplay = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  const handleStartResume = () => {
    if (!targetSubject) {
      alert(t('দয়া করে বিষয় নির্বাচন করো!', 'Please select a subject!'));
      return;
    }
    
    onUpdateState((prev: UserState) => {
      const nowTs = Date.now();
      if (!prev.activeTimer) {
        return {
          ...prev,
          activeTimer: {
            subjectId: targetSubject.id,
            taskId: activeTaskId || undefined,
            chapterId: selectedChapterId || undefined,
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

      const deltaSeconds = Math.max(0, Math.floor((nowTs - prev.activeTimer.lastTimestamp) / 1000));
      return {
        ...prev,
        activeTimer: { 
          ...prev.activeTimer, 
          isFocusActive: true, 
          accumulatedBreakSeconds: prev.activeTimer.accumulatedBreakSeconds + (!prev.activeTimer.isFocusActive ? deltaSeconds : 0),
          lastTimestamp: nowTs 
        }
      };
    });
  };

  const handlePause = () => {
    onUpdateState((prev: UserState) => {
      if (!prev.activeTimer) return prev;
      const nowTs = Date.now();
      const deltaSeconds = Math.max(0, Math.floor((nowTs - prev.activeTimer.lastTimestamp) / 1000));

      return {
        ...prev,
        activeTimer: { 
          ...prev.activeTimer, 
          isFocusActive: false, 
          accumulatedFocusSeconds: prev.activeTimer.accumulatedFocusSeconds + (prev.activeTimer.isFocusActive ? deltaSeconds : 0),
          numBreaks: prev.activeTimer.numBreaks + 1, 
          lastTimestamp: nowTs 
        }
      };
    });
  };

  const handleStopEnd = () => {
    if (!timer) return;
    const nowTs = Date.now();
    const deltaSeconds = Math.max(0, Math.floor((nowTs - timer.lastTimestamp) / 1000));

    const finalFocus = timer.accumulatedFocusSeconds + (timer.isFocusActive ? deltaSeconds : 0);
    const finalBreak = timer.accumulatedBreakSeconds + (!timer.isFocusActive ? deltaSeconds : 0);

    const session: StudySession = {
      id: `session-${Date.now()}`,
      subjectId: timer.subjectId,
      taskId: timer.taskId,
      chapterId: timer.chapterId,
      startTime: timer.sessionStartTime,
      endTime: nowTs,
      durationSeconds: finalFocus,
      breakSeconds: finalBreak,
      numBreaks: timer.numBreaks,
      mood: currentMood,
      isRevision: timer.isRevision
    };

    onUpdateState((prev: UserState) => {
      const updatedTasks = prev.dailyTasks.map((task: Task) => 
        task.id === timer.taskId ? { ...task, isCompleted: true } : task
      );

      const updatedSubjects = prev.subjects.map((sub: Subject) => {
        if (sub.id !== timer.subjectId) return sub;
        return {
          ...sub,
          chapters: sub.chapters.map((ch: Chapter) => {
            if (ch.id !== timer.chapterId) return ch;
            return {
              ...ch,
              studyTimeSeconds: (ch.studyTimeSeconds || 0) + finalFocus
            };
          })
        };
      });

      return {
        ...prev,
        studyHistory: [...(prev.studyHistory || []), session],
        dailyTasks: updatedTasks,
        subjects: updatedSubjects,
        activeTimer: null
      };
    });

    // Reset Pomodoro
    setPomodoroRemaining(25 * 60);
    setPomodoroStage('focus');
  };

  const moods: { label: Mood; icon: React.ReactNode; color: string }[] = [
    { label: 'Focused', icon: <Brain size={18} />, color: 'text-brand-primary' },
    { label: 'Great', icon: <Sparkles size={18} />, color: 'text-orange-500' },
    { label: 'Tired', icon: <Coffee size={18} />, color: 'text-amber-500' },
    { label: 'Stressed', icon: <AlertCircle size={18} />, color: 'text-rose-500' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-16">
      <header className="flex flex-col items-center justify-center text-center space-y-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-brand-text-p">{t('পড়া শুরু করো', 'Study Tracker')}</h2>
          <p className="text-brand-text-s text-[10px] font-black uppercase tracking-[0.2em] italic">{t('একাগ্রতার সাথে তোমার লক্ষ্য অর্জন করো', 'Focus Deeply on Your Goals')}</p>
        </div>

        {/* Focus Mode Selector */}
        <div className="flex bg-brand-surface p-1.5 rounded-2xl border border-brand-text-s/10">
          <button 
            disabled={!!timer}
            onClick={() => setTimerMode('pomodoro')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${timerMode === 'pomodoro' ? 'bg-brand-primary text-white shadow-lg' : 'text-brand-text-s opacity-50'} ${!!timer && 'cursor-not-allowed opacity-30'}`}
          >
            <TimerIcon size={14}/> Pomodoro
          </button>
          <button 
            disabled={!!timer}
            onClick={() => setTimerMode('stopwatch')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${timerMode === 'stopwatch' ? 'bg-brand-primary text-white shadow-lg' : 'text-brand-text-s opacity-50'} ${!!timer && 'cursor-not-allowed opacity-30'}`}
          >
            <Clock size={14}/> Stopwatch
          </button>
        </div>
      </header>

      <div className="bg-brand-surface rounded-[3rem] p-8 sm:p-12 shadow-2xl border border-brand-text-s/10 relative overflow-hidden transition-all duration-500">
        {/* Visual Progress Bar - Syncs with mode */}
        <div 
          className={`absolute top-0 left-0 h-1 bg-brand-primary transition-all duration-300`} 
          style={{ 
            width: timer 
              ? (timerMode === 'pomodoro' 
                  ? `${(( (pomodoroStage === 'focus' ? 25*60 : 5*60) - pomodoroRemaining) / (pomodoroStage === 'focus' ? 25*60 : 5*60)) * 100}%` 
                  : `${(displayFocusSeconds % 60) * 1.66}%`)
              : '0%' 
          }} 
        />

        {/* Options Section - Locked during session */}
        <div className={`space-y-4 mb-10 transition-all duration-500 ${timer ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-brand-text-s uppercase tracking-widest ml-1">{t('বিষয়', 'Subject')}</label>
              <select 
                value={selectedSubjectName} 
                onChange={(e) => { setSelectedSubjectName(e.target.value); setSelectedChapterId(''); }}
                className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl px-5 py-3 text-xs font-bold outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">{t('বিষয় বেছে নাও', 'Choose Subject')}</option>
                {subjectNames.map((name: string) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-brand-text-s uppercase tracking-widest ml-1">{t('পত্র', 'Paper')}</label>
              <div className="flex bg-brand-bg p-1 rounded-2xl border border-brand-text-s/5">
                {[1, 2].map(p => (
                  <button key={p} onClick={() => setSelectedPaper(p as 1 | 2)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedPaper === p ? 'bg-brand-surface text-brand-primary shadow-sm' : 'text-brand-text-s opacity-40'}`}>
                    {p === 1 ? '1st' : '2nd'} Paper
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-brand-text-s uppercase tracking-widest ml-1">{t('চ্যাপ্টার (ঐচ্ছিক)', 'Chapter')}</label>
              <select 
                disabled={!selectedSubjectName}
                value={selectedChapterId} 
                onChange={(e) => setSelectedChapterId(e.target.value)}
                className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl px-5 py-3 text-xs font-bold outline-none transition-all appearance-none cursor-pointer disabled:opacity-30"
              >
                <option value="">{t('চ্যাপ্টার বেছে নাও', 'Choose Chapter')}</option>
                {chapters.map((ch: Chapter) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-brand-text-s uppercase tracking-widest ml-1">{t('লিঙ্কড টাস্ক (ঐচ্ছিক)', 'Linked Task')}</label>
              <select 
                value={activeTaskId} 
                onChange={(e) => setActiveTaskId(e.target.value)}
                className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl px-5 py-3 text-xs font-bold outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">{t('টাস্ক বেছে নাও', 'Choose Task')}</option>
                {userState.dailyTasks.filter(t => !t.isCompleted).map((task: Task) => <option key={task.id} value={task.id}>{task.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="text-center py-6">
          {timerMode === 'pomodoro' && (
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 ${pomodoroStage === 'focus' ? 'text-brand-primary' : 'text-emerald-500'}`}>
              {pomodoroStage === 'focus' ? 'Focusing Deeply' : 'Short Break'}
            </p>
          )}
          <div 
            className={`font-black tracking-tighter tabular-nums leading-none select-none transition-all duration-700 drop-shadow-md ${timer?.isFocusActive === false ? 'text-brand-secondary scale-95 opacity-50' : 'text-brand-text-p'}`}
            style={{ fontSize: 'clamp(4rem, 18vw, 7.5rem)' }}
          >
            {timerMode === 'pomodoro' ? formatTimeDisplay(pomodoroRemaining) : formatTimeDisplay(displayFocusSeconds)}
          </div>
          
          <div className="flex items-center justify-center gap-12 mt-10">
            <div className={`flex flex-col items-center gap-1 transition-all ${timer?.isFocusActive ? 'scale-110' : 'opacity-30'}`}>
              <div className="flex items-center gap-2 text-brand-primary font-black text-[10px] uppercase tracking-widest">
                <Target size={14} className={timer?.isFocusActive ? "animate-pulse" : ""} />
                <span>Focus</span>
              </div>
              <p className="text-xl font-black tabular-nums">{formatTimeDisplay(displayFocusSeconds)}</p>
            </div>
            
            <div className="h-10 w-px bg-brand-text-s/10" />

            <div className={`flex flex-col items-center gap-1 transition-all ${timer && !timer.isFocusActive ? 'scale-110 text-brand-secondary' : 'opacity-30'}`}>
              <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                <Coffee size={14} className={timer && !timer.isFocusActive ? "animate-bounce" : ""} />
                <span>Break</span>
              </div>
              <p className="text-xl font-black tabular-nums">{formatTimeDisplay(displayBreakSeconds)}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-10 mt-6">
          <div className="flex items-center justify-center gap-12">
            {!timer?.isFocusActive ? (
              <button 
                onClick={handleStartResume} 
                className="w-28 h-28 bg-brand-primary text-white flex items-center justify-center rounded-full shadow-2xl shadow-brand-primary/40 transition-all active:scale-90 hover:scale-105 border-8 border-brand-surface"
              >
                <Play size={44} className="ml-1 fill-current" />
              </button>
            ) : (
              <button 
                onClick={handlePause} 
                className="w-28 h-28 bg-brand-surface text-brand-text-p flex items-center justify-center rounded-full border-8 border-brand-bg shadow-xl transition-all active:scale-90"
              >
                <Pause size={44} className="fill-current" />
              </button>
            )}
            <button 
              onClick={handleStopEnd} 
              disabled={!timer} 
              className="w-16 h-16 bg-brand-bg text-red-500 flex items-center justify-center rounded-full shadow-lg transition-all active:scale-90 disabled:opacity-20 hover:bg-red-50"
            >
              <Square size={24} className="fill-current" />
            </button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            {moods.map((m) => (
              <button 
                key={m.label} 
                onClick={() => setCurrentMood(m.label)} 
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${currentMood === m.label ? 'bg-brand-primary text-white shadow-lg' : 'bg-brand-bg text-brand-text-s border border-brand-text-s/10 hover:bg-brand-surface'}`}
              >
                <div className={currentMood === m.label ? 'text-white' : m.color}>{m.icon}</div>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {timer && (
        <div className="bg-brand-surface/80 backdrop-blur-md border border-brand-text-s/10 p-6 rounded-[2.5rem] flex items-center gap-5 animate-in slide-in-from-top-4 shadow-sm">
           <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary shrink-0 border border-brand-primary/20 shadow-inner">
             <Brain size={28} />
           </div>
           <div className="min-w-0">
             <h4 className="text-[10px] font-black text-brand-text-s uppercase tracking-widest mb-1">{t('সেশন চলছে', 'Active Session')}</h4>
             <p className="text-base font-black text-brand-text-p truncate">
               {selectedSubjectName} (P{selectedPaper})
               {selectedChapterId && ` • ${targetSubject?.chapters.find((c: Chapter) => c.id === selectedChapterId)?.name}`}
             </p>
             <p className="text-[9px] font-bold text-brand-text-s uppercase mt-1">{t('শুরু:', 'Started:')} {new Date(timer.sessionStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default Tracker;