import React, { useState, useEffect, useMemo } from 'react';
import { useLekhapora } from '../contexts/LekhaporaContext';
import { Mood, StudySession, Subject } from '../types';
import { Play, Pause, Square, Clock, Brain, Coffee, Zap, Target, Loader2 } from 'lucide-react';

const Tracker: React.FC = () => {
  const { state, dispatch } = useLekhapora();
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [sessionType, setSessionType] = useState<'focus' | 'break'>('focus');
  const [selectedSub, setSelectedSub] = useState('');
  const [mood, setMood] = useState<Mood>('Focused');
  
  const t = (bn: string, en: string) => state.settings.language === 'bn' ? bn : en;

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleComplete = () => {
    setIsActive(false);
    if (sessionType === 'focus') {
      const session: StudySession = {
        id: `session-${Date.now()}`,
        subjectId: selectedSub || 'GENERAL',
        startTime: Date.now() - (25 * 60 * 1000),
        durationSeconds: 25 * 60,
        mood: mood,
        isRevision: false
      };
      dispatch({ type: 'ADD_STUDY_SESSION', payload: session });
      alert(t("ফোকাস সেশন শেষ! ৫ মিনিটের ব্রেক নাও।", "Focus session complete! Take a 5 min break."));
      setSessionType('break');
      setTimeLeft(5 * 60);
    } else {
      alert(t("ব্রেক শেষ! আবার পড়ার সময়।", "Break over! Time to focus again."));
      setSessionType('focus');
      setTimeLeft(25 * 60);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const moods: { label: Mood; icon: any }[] = [
    { label: 'Focused', icon: Brain },
    { label: 'Great', icon: Zap },
    { label: 'Tired', icon: Coffee },
    { label: 'Stressed', icon: Target }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="bg-brand-surface rounded-[4rem] p-12 border border-brand-text-s/10 shadow-2xl text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 h-1 bg-brand-primary transition-all duration-1000" style={{ width: `${(( (sessionType === 'focus' ? 25*60 : 5*60) - timeLeft) / (sessionType === 'focus' ? 25*60 : 5*60)) * 100}%` }} />
        
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary mb-8">
          {sessionType === 'focus' ? t('ডিপ ফোকাস মোড', 'Deep Focus Mode') : t('বিশ্রাম সময়', 'Short Break')}
        </p>

        <h1 className="text-8xl md:text-9xl font-black tabular-nums tracking-tighter text-brand-text-p mb-12">
          {formatTime(timeLeft)}
        </h1>

        <div className="flex justify-center gap-8 mb-12">
          <button 
            onClick={() => setIsActive(!isActive)}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 ${isActive ? 'bg-brand-bg text-brand-text-p border-2 border-brand-text-s/10' : 'bg-brand-primary text-white shadow-brand-primary/20'}`}
          >
            {isActive ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
          </button>
          <button 
            onClick={() => { setIsActive(false); setTimeLeft(25*60); }}
            className="w-20 h-20 bg-brand-bg text-rose-500 rounded-full flex items-center justify-center border-2 border-brand-text-s/10 active:scale-95 transition-all"
          >
            <Square size={28} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 max-w-sm mx-auto">
          <select 
            value={selectedSub}
            onChange={e => setSelectedSub(e.target.value)}
            disabled={isActive}
            className="w-full bg-brand-bg p-4 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-brand-primary transition-all appearance-none text-center"
          >
            <option value="">{t('বিষয় নির্বাচন করো', 'Choose Subject')}</option>
            {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name} (P{s.paper})</option>)}
          </select>

          <div className="flex justify-center gap-3">
            {moods.map(m => (
              <button 
                key={m.label}
                onClick={() => setMood(m.label)}
                className={`p-4 rounded-2xl border-2 transition-all ${mood === m.label ? 'bg-brand-primary border-brand-primary text-white' : 'bg-brand-bg border-transparent text-brand-text-s'}`}
              >
                <m.icon size={20} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tracker;