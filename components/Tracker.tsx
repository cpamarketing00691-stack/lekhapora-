import React, { useState, useEffect, useMemo } from 'react';
import { UserState, StudySession, Mood } from '../types';
import { Play, Pause, Square, Clock, Brain, Coffee, Zap as FocusIcon, AlertCircle, Sparkles } from 'lucide-react';

interface TrackerProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const Tracker: React.FC<TrackerProps> = ({ userState, onUpdateState }) => {
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>('');
  const [selectedPaper, setSelectedPaper] = useState<1 | 2>(1);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [isRevision, setIsRevision] = useState(false);
  const [currentMood, setCurrentMood] = useState<Mood>('Focused');
  
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  const timer = userState.activeTimer;

  const { displayFocusSeconds, displayBreakSeconds } = useMemo(() => {
    if (!timer) return { displayFocusSeconds: 0, displayBreakSeconds: 0 };
    const diff = Math.max(0, Math.floor((now - timer.lastTimestamp) / 1000));
    return {
      displayFocusSeconds: timer.accumulatedFocusSeconds + (timer.isFocusActive ? diff : 0),
      displayBreakSeconds: timer.accumulatedBreakSeconds + (!timer.isFocusActive ? diff : 0)
    };
  }, [timer, now]);

  const subjectNames = useMemo(() => Array.from(new Set(userState.subjects.map(s => s.name))).sort(), [userState.subjects]);
  const targetSubject = useMemo(() => userState.subjects.find(s => s.name === selectedSubjectName && s.paper === selectedPaper), [selectedSubjectName, selectedPaper, userState.subjects]);

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
    const nowTs = Date.now();
    onUpdateState(prev => {
      if (!prev.activeTimer) {
        return {
          ...prev,
          activeTimer: {
            subjectId: targetSubject.id,
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
      const delta = Math.max(0, Math.floor((nowTs - prev.activeTimer.lastTimestamp) / 1000));
      return {
        ...prev,
        activeTimer: { 
          ...prev.activeTimer, 
          isFocusActive: true, 
          accumulatedBreakSeconds: prev.activeTimer.accumulatedBreakSeconds + (!prev.activeTimer.isFocusActive ? delta : 0),
          lastTimestamp: nowTs 
        }
      };
    });
  };

  const handlePause = () => {
    const nowTs = Date.now();
    onUpdateState(prev => {
      if (!prev.activeTimer) return prev;
      const delta = Math.max(0, Math.floor((nowTs - prev.activeTimer.lastTimestamp) / 1000));
      return {
        ...prev,
        activeTimer: { 
          ...prev.activeTimer, 
          isFocusActive: false, 
          accumulatedFocusSeconds: prev.activeTimer.accumulatedFocusSeconds + (prev.activeTimer.isFocusActive ? delta : 0),
          numBreaks: prev.activeTimer.numBreaks + 1, 
          lastTimestamp: nowTs 
        }
      };
    });
  };

  const handleStopEnd = () => {
    if (!timer) return;
    const nowTs = Date.now();
    const delta = Math.max(0, Math.floor((nowTs - timer.lastTimestamp) / 1000));
    const finalFocus = timer.accumulatedFocusSeconds + (timer.isFocusActive ? delta : 0);
    const finalBreak = timer.accumulatedBreakSeconds + (!timer.isFocusActive ? delta : 0);

    const session: StudySession = {
      id: `session-${Date.now()}`,
      subjectId: timer.subjectId,
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

  const moods: { type: Mood, icon: React.ReactNode }[] = [
    { type: 'Focused', icon: <Brain size={16} /> },
    { type: 'Tired', icon: <Coffee size={16} /> },
    { type: 'Stressed', icon: <AlertCircle size={16} /> },
    { type: 'Great', icon: <Sparkles size={16} /> }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-12">
      <header className="text-center">
        <h2 className="text-3xl font-black tracking-tight text-brand-text-p">{t('স্টাডি ফোকাস', 'Study Focus')}</h2>
      </header>

      <div className="bg-brand-surface rounded-[2.5rem] p-8 sm:p-10 shadow-xl border border-brand-text-s/10">
        <div className="mb-8 space-y-4">
          <select disabled={!!timer} value={selectedSubjectName} onChange={e => setSelectedSubjectName(e.target.value)} className="w-full bg-brand-bg rounded-2xl px-5 py-4 font-bold outline-none border-2 border-transparent focus:border-brand-primary transition-all">
            <option value="">{t('বিষয় নির্বাচন করো', 'Choose Subject')}</option>
            {subjectNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
          <div className="flex gap-2">
             <button disabled={!!timer} onClick={() => setSelectedPaper(1)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${selectedPaper === 1 ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-brand-bg text-brand-text-s hover:bg-brand-surface'}`}>1st Paper</button>
             <button disabled={!!timer} onClick={() => setSelectedPaper(2)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${selectedPaper === 2 ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-brand-bg text-brand-text-s hover:bg-brand-surface'}`}>2nd Paper</button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-brand-bg rounded-2xl border border-brand-text-s/5">
             <div className="flex items-center gap-3">
                <FocusIcon className={isRevision ? 'text-brand-secondary' : 'text-brand-primary'} size={20} />
                <span className="text-xs font-black uppercase tracking-widest text-brand-text-p">{t('রিভিশন মোড', 'Revision Mode')}</span>
             </div>
             <button disabled={!!timer} onClick={() => setIsRevision(!isRevision)} className={`w-12 h-6 rounded-full transition-all relative ${isRevision ? 'bg-brand-secondary' : 'bg-brand-text-s/30'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isRevision ? 'left-7' : 'left-1'}`} />
             </button>
          </div>
        </div>

        <div className="text-center py-6">
          <div className={`font-black tracking-tighter tabular-nums transition-all drop-shadow-sm ${timer?.isFocusActive === false ? 'text-brand-secondary scale-95 opacity-60' : 'text-brand-text-p'}`} style={{ fontSize: 'clamp(3rem, 18vw, 6.5rem)' }}>
            {formatDuration(displayFocusSeconds)}
          </div>
          <div className="flex items-center justify-center gap-10 mt-6">
            <div className="text-center">
              <p className="text-[10px] font-black text-brand-primary uppercase mb-1">Study</p>
              <p className="text-sm font-bold">{formatDuration(displayFocusSeconds)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-brand-secondary uppercase mb-1">Break</p>
              <p className="text-sm font-bold">{formatDuration(displayBreakSeconds)}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-8 mt-6">
          <div className="flex items-center justify-center gap-10 pb-4">
            {!timer?.isFocusActive ? (
              <button onClick={handleStartResume} className="w-24 h-24 bg-brand-primary text-white flex items-center justify-center rounded-full shadow-2xl transition-all active:scale-90 hover:scale-105 border-8 border-brand-surface">
                <Play size={40} className="ml-1 fill-current" />
              </button>
            ) : (
              <button onClick={handlePause} className="w-24 h-24 bg-brand-surface text-brand-text-p flex items-center justify-center rounded-full border-8 border-brand-bg shadow-xl transition-all active:scale-90">
                <Pause size={40} className="fill-current" />
              </button>
            )}
            <button onClick={handleStopEnd} disabled={!timer} className="w-16 h-16 bg-brand-bg text-red-500 flex items-center justify-center rounded-full shadow-lg transition-all active:scale-90 disabled:opacity-30">
              <Square size={24} className="fill-current" />
            </button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            {moods.map((m) => (
              <button key={m.type} onClick={() => setCurrentMood(m.type)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentMood === m.type ? 'bg-brand-primary text-white shadow-lg' : 'bg-brand-bg text-brand-text-s border border-brand-text-s/10'}`}>
                {m.icon} {m.type}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tracker;