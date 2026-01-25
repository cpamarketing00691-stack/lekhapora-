
import React, { useState, useEffect, useRef } from 'react';
import { UserState, Subject, StudySession, Mood } from '../types';
import { Play, Pause, Square, Book, AlertCircle, Zap, RefreshCcw } from 'lucide-react';

interface TrackerProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const Tracker: React.FC<TrackerProps> = ({ userState, onUpdateState }) => {
  const [activeSubjectId, setActiveSubjectId] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [focusLevel, setFocusLevel] = useState(5);
  const [currentMood, setCurrentMood] = useState<Mood>('Great');
  const [isRevision, setIsRevision] = useState(false);
  const timerRef = useRef<number | null>(null);

  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStop = () => {
    if (!isRunning && seconds === 0) return;
    
    const newSession: StudySession = {
      id: Date.now().toString(),
      subjectId: activeSubjectId,
      startTime: Date.now() - (seconds * 1000),
      endTime: Date.now(),
      durationMinutes: Math.floor(seconds / 60),
      focusLevel,
      mood: currentMood,
      isRevision
    };

    onUpdateState(prev => ({
      ...prev,
      studyHistory: [...prev.studyHistory, newSession],
      streaks: prev.streaks + (seconds > 1800 ? 1 : 0), // Count as streak only if > 30 mins
      currentMood
    }));

    setIsRunning(false);
    setSeconds(0);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header className="text-center">
        <h2 className="text-3xl font-black">{t('স্টাডি ট্র্যাকার', 'Study Tracker')}</h2>
        <p className="text-slate-500">{t('NCTB বোর্ডের জন্য রিয়েল-টাইম ফোকাস ট্র্যাকিং।', 'Real-time focus tracking for NCTB boards.')}</p>
      </header>

      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-700">
        <div className="mb-6 flex items-center justify-between gap-4">
           <div>
              <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest">{t('বিষয় নির্বাচন করো', 'Choose Subject')}</label>
           </div>
           <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
             <button 
               onClick={() => setIsRevision(false)}
               className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!isRevision ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-400'}`}
             >
               {t('পড়াশোনা', 'Study')}
             </button>
             <button 
               onClick={() => setIsRevision(true)}
               className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${isRevision ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm' : 'text-slate-400'}`}
             >
               <RefreshCcw size={12} />
               {t('রিভিশন', 'Revision')}
             </button>
           </div>
        </div>
        
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto pr-1">
            {userState.subjects.map(sub => (
              <button
                key={sub.id}
                onClick={() => !isRunning && setActiveSubjectId(sub.id)}
                disabled={isRunning}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-sm font-semibold text-left ${
                  activeSubjectId === sub.id
                    ? (isRevision ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-emerald-500 bg-emerald-50 text-emerald-700')
                    : 'border-slate-50 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <Book size={16} />
                {sub.name} (P{sub.paper})
              </button>
            ))}
          </div>
        </div>

        {isRunning && (
          <div className="mb-8 space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <label className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2 uppercase">
                <span>{t('বর্তমান ফোকাস লেভেল', 'Current Focus Level')}</span>
                <span className="text-emerald-500">{focusLevel}/10</span>
              </label>
              <input 
                type="range" min="1" max="10" 
                value={focusLevel} 
                onChange={(e) => setFocusLevel(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-full appearance-none accent-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">{t('তোমার মেজাজ', 'Your Mood')}</label>
              <div className="flex gap-2">
                {(['Great', 'Focused', 'Tired', 'Stressed'] as Mood[]).map(m => (
                  <button 
                    key={m}
                    onClick={() => setCurrentMood(m)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${currentMood === m ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="text-center py-8">
          <div className={`text-8xl font-black tracking-tighter tabular-nums mb-2 ${isRevision ? 'text-purple-600' : 'text-slate-900 dark:text-white'}`}>
            {formatTime(seconds)}
          </div>
          <p className="text-slate-400 font-medium">{isRunning ? t(' সেশন চলছে...', ' session ongoing...') : t('শুরু করতে তৈরি?', 'ready to begin?')}</p>
        </div>

        <div className="flex items-center justify-center gap-6">
          {isRunning ? (
            <button
              onClick={() => setIsRunning(false)}
              className="w-20 h-20 bg-slate-100 text-slate-600 flex items-center justify-center rounded-full hover:scale-105 transition-all"
            >
              <Pause size={32} />
            </button>
          ) : (
            <button
              onClick={() => activeSubjectId && setIsRunning(true)}
              disabled={!activeSubjectId}
              className={`w-20 h-20 text-white flex items-center justify-center rounded-full hover:scale-110 shadow-xl transition-all disabled:opacity-50 ${isRevision ? 'bg-purple-500 shadow-purple-200' : 'bg-emerald-500 shadow-emerald-200'}`}
            >
              <Play size={32} className="ml-1" />
            </button>
          )}

          <button
            onClick={handleStop}
            className="w-20 h-20 bg-red-50 text-red-500 flex items-center justify-center rounded-full hover:scale-105 transition-all"
          >
            <Square size={32} />
          </button>
        </div>
      </div>
      
      <div className="bg-emerald-50 p-4 rounded-3xl flex items-start gap-4 border border-emerald-100">
         <Zap className="text-emerald-500 mt-1" size={20} />
         <div>
            <h5 className="font-bold text-sm text-emerald-800">{t(`${userState.profile?.aiName} থেকে প্রো টিপ`, `Pro Tip from ${userState.profile?.aiName}`)}</h5>
            <p className="text-xs text-emerald-700 italic">
              {isRevision 
                ? t('"রিভিশন দেওয়ার সময় নিজের দুর্বল জায়গাগুলোতে বেশি নজর দাও!"', '"Focus more on your weak points while revising!"')
                : t('"পড়ার সময় ফোনটা দূরে রাখো, focus ১০০% থাকবে!"', '"Keep your phone away while studying for 100% focus!"')}
            </p>
         </div>
      </div>
    </div>
  );
};

export default Tracker;
