
import React, { useState, useEffect, useMemo } from 'react';
import { UserState, StudySession, Mood, ActiveTimerState, Task } from '../types';
import { Play, Pause, Square, Zap, RefreshCcw, History, Clock, Calendar as CalIcon, CheckCircle2, Smile, Zap as FocusIcon, Coffee, Frown, Flame, GraduationCap, ListTodo, Sparkles, Brain, Battery, Wind, AlertCircle } from 'lucide-react';

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

  const [manualData, setManualData] = useState({
    subjectId: '',
    durationMin: 30,
    breakMin: 5,
    date: new Date().toISOString().split('T')[0],
    isRevision: false
  });

  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  const formatDuration = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  const timer = userState.activeTimer;

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
    if (!activeSubjectId) return;
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
        activeTimer: { ...prev.activeTimer, isFocusActive: false, numBreaks: prev.activeTimer.numBreaks + 1, lastTimestamp: Date.now() }
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

  const handleManualSubmit = () => {
    if (!manualData.subjectId) return;
    const session: StudySession = {
      id: `manual-${Date.now()}`,
      subjectId: manualData.subjectId,
      startTime: new Date(manualData.date).getTime(),
      endTime: new Date(manualData.date).getTime() + (manualData.durationMin * 60000),
      durationSeconds: manualData.durationMin * 60,
      breakSeconds: manualData.breakMin * 60,
      numBreaks: 1,
      focusLevel: 7,
      mood: 'Focused',
      isRevision: manualData.isRevision
    };
    onUpdateState(prev => ({
      ...prev,
      studyHistory: [...(prev.studyHistory || []), session]
    }));
    setShowManual(false);
    alert(t('সেশন সফলভাবে যোগ করা হয়েছে!', 'Manual session added successfully!'));
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
          <p className="text-brand-text-s text-[10px] sm:text-xs font-medium">{t('তোমার সাফল্যের সময় গণনা করো।', 'Track your time to success.')}</p>
        </div>
        <button 
          onClick={() => setShowManual(!showManual)}
          className={`p-2.5 rounded-2xl transition-all shadow-sm ${showManual ? 'bg-brand-primary text-white' : 'bg-brand-surface text-brand-text-s border border-brand-text-s/10'}`}
        >
          <History size={18} />
        </button>
      </header>

      {showManual ? (
        <div className="bg-brand-surface rounded-[2.5rem] p-6 sm:p-10 shadow-xl border border-brand-text-s/10 animate-in zoom-in-95">
          <h3 className="text-lg font-black mb-6 text-center">{t('ম্যানুয়াল পড়াশোনা যোগ করো', 'Manual Study Entry')}</h3>
          <div className="space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-brand-text-s uppercase tracking-widest ml-1">{t('বিষয়', 'Subject')}</label>
                 <select 
                   value={manualData.subjectId}
                   onChange={e => setManualData({...manualData, subjectId: e.target.value})}
                   className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl px-4 py-3 text-xs font-bold outline-none"
                 >
                   <option value="">{t('নির্বাচন করো', 'Select')}</option>
                   {userState.subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                 </select>
               </div>
               <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-brand-text-s uppercase tracking-widest ml-1">{t('তারিখ', 'Date')}</label>
                 <input 
                   type="date"
                   value={manualData.date}
                   onChange={e => setManualData({...manualData, date: e.target.value})}
                   className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl px-4 py-3 text-xs font-bold outline-none cursor-pointer"
                 />
               </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-brand-text-s uppercase tracking-widest ml-1">{t('পড়া (মিনিট)', 'Focus min')}</label>
                 <input 
                   type="number"
                   value={manualData.durationMin}
                   onChange={e => setManualData({...manualData, durationMin: parseInt(e.target.value)})}
                   className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl px-4 py-3 text-xs font-bold outline-none"
                 />
               </div>
               <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-brand-text-s uppercase tracking-widest ml-1">{t('ব্রেক (মিনিট)', 'Break min')}</label>
                 <input 
                   type="number"
                   value={manualData.breakMin}
                   onChange={e => setManualData({...manualData, breakMin: parseInt(e.target.value)})}
                   className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl px-4 py-3 text-xs font-bold outline-none"
                 />
               </div>
             </div>
             <button 
              onClick={handleManualSubmit}
              className="w-full py-4 mt-2 bg-brand-primary text-white font-black rounded-2xl shadow-xl shadow-brand-primary/20 uppercase tracking-widest text-[10px] active:scale-95 transition-all"
             >
               {t('সেভ করো', 'Save Session')}
             </button>
          </div>
        </div>
      ) : (
        <div className="bg-brand-surface rounded-[2.5rem] p-6 sm:p-10 shadow-xl border border-brand-text-s/10 transition-all">
          <div className="mb-8 space-y-6">
            <div className="flex bg-brand-bg p-1 rounded-2xl max-w-[280px] mx-auto border border-brand-text-s/5">
              <button onClick={() => !timer && setIsRevision(false)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!isRevision ? 'bg-brand-surface text-brand-primary shadow-sm' : 'text-brand-text-s'}`}>{t('পড়াশোনা', 'Study')}</button>
              <button onClick={() => !timer && setIsRevision(true)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isRevision ? 'bg-brand-surface text-brand-secondary shadow-sm' : 'text-brand-text-s'}`}>{t('রিভিশন', 'Revision')}</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-brand-text-s uppercase tracking-widest ml-1">{t('বিষয় বেছে নাও', 'Choose Subject')}</label>
                <select 
                  disabled={!!timer} 
                  value={activeSubjectId} 
                  onChange={(e) => setActiveSubjectId(e.target.value)} 
                  className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl px-4 py-3.5 text-xs font-bold appearance-none outline-none transition-all disabled:opacity-50"
                >
                  <option value="">{t('নির্বাচন করো', 'Select')}</option>
                  {userState.subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name} (P{sub.paper})</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-brand-text-s uppercase tracking-widest ml-1">{t('পরীক্ষা (ঐচ্ছিক)', 'Exam (Optional)')}</label>
                <select 
                  disabled={!!timer} 
                  value={activeExamId} 
                  onChange={(e) => setActiveExamId(e.target.value)} 
                  className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl px-4 py-3.5 text-xs font-bold appearance-none outline-none transition-all disabled:opacity-50"
                >
                  <option value="">{t('নির্বাচন করো', 'Select')}</option>
                  {upcomingExams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="text-center py-6">
            <div 
              className="font-black tracking-tighter tabular-nums leading-none select-none text-brand-text-p transition-all"
              style={{ fontSize: 'clamp(2.5rem, 16vw, 6.5rem)' }}
            >
              {formatDuration(timer?.accumulatedFocusSeconds || 0)}
            </div>
            
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-1.5 text-brand-text-s font-black text-[9px] uppercase tracking-widest">
                <FocusIcon size={12} className="text-brand-primary" />
                <span>{t('ফোকাস', 'FOCUS')}</span>
              </div>
              <div className={`flex items-center gap-1.5 font-black text-[9px] uppercase tracking-widest transition-all ${timer && !timer.isFocusActive ? 'text-brand-secondary' : 'text-brand-text-s opacity-30'}`}>
                <Coffee size={12} />
                <span>{t('ব্রেক', 'BREAK')}: {formatDuration(timer?.accumulatedBreakSeconds || 0)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-8 mt-6">
            <div className={`flex gap-2.5 p-1.5 bg-brand-bg rounded-3xl transition-all ${!timer ? 'opacity-30 pointer-events-none grayscale scale-95' : 'scale-100'}`}>
              {moods.map(m => (
                <button
                  key={m.label}
                  onClick={() => setCurrentMood(m.label)}
                  className={`p-2.5 rounded-2xl transition-all ${currentMood === m.label ? 'bg-brand-surface shadow-md scale-110' : 'opacity-40 hover:opacity-100'}`}
                  title={m.label}
                >
                  <div className={currentMood === m.label ? m.color : 'text-brand-text-s'}>
                    {m.icon}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center gap-6 pb-2">
              {!timer?.isFocusActive ? (
                <button 
                  onClick={handleStartResume} 
                  disabled={!activeSubjectId} 
                  className="w-20 h-20 sm:w-24 sm:h-24 bg-brand-primary text-white flex items-center justify-center rounded-full shadow-2xl transition-all active:scale-90 disabled:opacity-30 hover:scale-105"
                >
                  <Play size={32} className="ml-1 fill-current" />
                </button>
              ) : (
                <button 
                  onClick={handlePause} 
                  className="w-20 h-20 sm:w-24 sm:h-24 bg-brand-surface text-brand-text-p flex items-center justify-center rounded-full border-4 border-brand-bg shadow-xl transition-all active:scale-90 hover:scale-105"
                >
                  <Pause size={32} className="fill-current" />
                </button>
              )}
              <button 
                onClick={handleStopEnd} 
                disabled={!timer} 
                className="w-14 h-14 bg-brand-bg text-red-500 flex items-center justify-center rounded-full shadow-lg transition-all active:scale-90 disabled:opacity-30 hover:bg-red-50"
              >
                <Square size={20} className="fill-current" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tracker;
