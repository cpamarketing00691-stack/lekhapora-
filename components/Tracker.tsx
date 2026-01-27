
import React, { useState, useEffect } from 'react';
import { UserState, StudySession, Mood, ActiveTimerState, Task } from '../types';
import { Play, Pause, Square, Zap, RefreshCcw, History, Clock, Calendar as CalIcon, CheckCircle2, Smile, Zap as FocusIcon, Coffee, Frown, Flame, GraduationCap, ListTodo, Sparkles } from 'lucide-react';

interface TrackerProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const Tracker: React.FC<TrackerProps> = ({ userState, onUpdateState }) => {
  const [activeSubjectId, setActiveSubjectId] = useState<string>(userState.activeTimer?.subjectId || '');
  const [isRevision, setIsRevision] = useState(userState.activeTimer?.isRevision || false);
  const [showManual, setShowManual] = useState(false);
  const [currentMood, setCurrentMood] = useState<Mood>('Focused');

  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  const formatDuration = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  const timer = userState.activeTimer;

  const handleStartResume = () => {
    if (!activeSubjectId) return;
    onUpdateState(prev => {
      const now = Date.now();
      if (!prev.activeTimer) {
        return {
          ...prev,
          activeTimer: {
            subjectId: activeSubjectId,
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

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 overflow-x-hidden px-1">
      <header className="text-center">
        <h2 className="text-3xl font-black tracking-tight text-brand-text-p">{t('স্টাডি ফোকাস', 'Study Focus')}</h2>
        <p className="text-brand-text-s text-xs mt-1 font-medium">{t('তোমার সাফল্যের সময় গণনা শুরু করো।', 'Start tracking your success time.')}</p>
      </header>

      <div className="bg-brand-surface rounded-[2.5rem] p-6 sm:p-10 shadow-xl border border-brand-text-s/10">
        <div className="mb-8 space-y-6">
          <div className="flex bg-brand-bg p-1 rounded-2xl max-w-xs mx-auto">
            <button onClick={() => !timer && setIsRevision(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isRevision ? 'bg-brand-surface text-brand-primary shadow-sm' : 'text-brand-text-s'}`}>{t('পড়াশোনা', 'Study')}</button>
            <button onClick={() => !timer && setIsRevision(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isRevision ? 'bg-brand-surface text-brand-secondary shadow-sm' : 'text-brand-text-s'}`}>{t('রিভিশন', 'Revision')}</button>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-brand-text-s uppercase tracking-widest text-center">{t('বিষয় নির্বাচন করো', 'Choose Subject')}</label>
            <select 
              disabled={!!timer} 
              value={activeSubjectId} 
              onChange={(e) => setActiveSubjectId(e.target.value)} 
              className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-2xl px-4 py-4 text-sm font-bold text-center appearance-none outline-none transition-all"
            >
              <option value="">{t('বিষয় বেছে নাও', 'Choose Subject')}</option>
              {userState.subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
            </select>
          </div>
        </div>

        <div className="text-center py-6">
          <div 
            className="font-black tracking-tighter tabular-nums leading-none select-none text-brand-text-p"
            style={{ fontSize: 'clamp(3rem, 20vw, 8rem)' }}
          >
            {formatDuration(timer?.accumulatedFocusSeconds || 0)}
          </div>
          {timer && !timer.isFocusActive && (
            <div className="mt-4 flex items-center justify-center gap-2 text-brand-secondary font-black text-xs uppercase tracking-widest animate-pulse">
              <Coffee size={14} /> {t('ব্রেকে আছো', 'ON BREAK')}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-6 mt-8">
          {!timer?.isFocusActive ? (
            <button 
              onClick={handleStartResume} 
              disabled={!activeSubjectId} 
              className="w-20 h-20 sm:w-24 sm:h-24 bg-brand-primary text-white flex items-center justify-center rounded-full shadow-2xl transition-all active:scale-95 disabled:opacity-30"
            >
              <Play size={32} className="ml-1 fill-current" />
            </button>
          ) : (
            <button 
              onClick={handlePause} 
              className="w-20 h-20 sm:w-24 sm:h-24 bg-brand-surface text-brand-text-p flex items-center justify-center rounded-full border-4 border-brand-bg shadow-xl transition-all active:scale-95"
            >
              <Pause size={32} className="fill-current" />
            </button>
          )}
          <button 
            onClick={handleStopEnd} 
            disabled={!timer} 
            className="w-14 h-14 sm:w-16 sm:h-16 bg-brand-bg text-red-500 flex items-center justify-center rounded-full shadow-lg transition-all active:scale-95 disabled:opacity-30"
          >
            <Square size={20} className="fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tracker;
