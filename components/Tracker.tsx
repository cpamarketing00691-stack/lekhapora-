
import React, { useState, useEffect, useRef } from 'react';
import { UserState, StudySession, Mood } from '../types';
import { Play, Pause, Square, Book, Zap, RefreshCcw, PlusCircle, History, Clock, Calendar as CalIcon, CheckCircle2 } from 'lucide-react';

interface TrackerProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const Tracker: React.FC<TrackerProps> = ({ userState, onUpdateState }) => {
  const [activeSubjectId, setActiveSubjectId] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [focusLevel, setFocusLevel] = useState(7);
  const [currentMood, setCurrentMood] = useState<Mood>('Focused');
  const [isRevision, setIsRevision] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Manual Entry State as requested: Subject, Duration, Revision Toggle
  const [manualData, setManualData] = useState({
    subjectId: '',
    date: new Date().toISOString().split('T')[0],
    durationMinutes: '',
    isRevision: false
  });

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
    if (!isRunning && seconds < 60) {
      if (seconds > 0) alert(t('সেশন ১ মিনিটের কম হওয়ায় সেভ করা হবে না।', 'Session too short (less than 1 min) to be saved.'));
      setIsRunning(false);
      setSeconds(0);
      return;
    }
    
    const newSession: StudySession = {
      id: `timer-${Date.now()}`,
      subjectId: activeSubjectId,
      startTime: Date.now() - (seconds * 1000),
      endTime: Date.now(),
      durationMinutes: Math.max(1, Math.floor(seconds / 60)),
      focusLevel,
      mood: currentMood,
      isRevision
    };

    onUpdateState(prev => ({
      ...prev,
      studyHistory: [...prev.studyHistory, newSession],
      streaks: prev.streaks + (seconds > 1800 ? 1 : 0),
      currentMood
    }));

    setIsRunning(false);
    setSeconds(0);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const duration = parseInt(manualData.durationMinutes);
    if (!manualData.subjectId || isNaN(duration) || duration <= 0) return;

    const sessionDate = new Date(manualData.date);
    const startTime = sessionDate.getTime();

    const newSession: StudySession = {
      id: `manual-${Date.now()}`,
      subjectId: manualData.subjectId,
      startTime: startTime,
      endTime: startTime + (duration * 60000),
      durationMinutes: duration,
      focusLevel: 8,
      mood: 'Focused',
      isRevision: manualData.isRevision
    };

    onUpdateState(prev => ({
      ...prev,
      studyHistory: [...prev.studyHistory, newSession],
      streaks: prev.streaks + (duration >= 30 ? 1 : 0)
    }));

    setManualData({ ...manualData, subjectId: '', durationMinutes: '' });
    setShowManual(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="text-center space-y-2">
        <h2 className="text-4xl font-black tracking-tight">{t('স্টাডি ফোকাস', 'Study Focus')}</h2>
        <p className="text-slate-500 font-medium">{t('তোমার প্রতিটি মিনিট HSC সাফল্যের পথে গুরুত্বপূর্ণ।', 'Every minute counts toward your HSC success.')}</p>
      </header>

      {/* Mode Switcher (Manual vs Realtime) */}
      <div className="flex justify-center">
        <div className="bg-white dark:bg-slate-900 p-1.5 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm flex gap-1">
          <button 
            onClick={() => !isRunning && setShowManual(false)}
            disabled={isRunning}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 ${!showManual ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
          >
            <Clock size={14} />
            {t('টাইমার', 'Real-time')}
          </button>
          <button 
            onClick={() => !isRunning && setShowManual(true)}
            disabled={isRunning}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 ${showManual ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
          >
            <History size={14} />
            {t('ম্যানুয়াল', 'Manual Add')}
          </button>
        </div>
      </div>

      {!showManual ? (
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-800 transition-all">
          <div className="mb-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="w-full sm:w-auto">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center sm:text-left">{t('মোড নির্বাচন', 'Select Mode')}</label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl shadow-inner">
                <button 
                  onClick={() => !isRunning && setIsRevision(false)}
                  className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isRevision ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-xl' : 'text-slate-400'}`}
                >
                  {t('পড়াশোনা', 'Study')}
                </button>
                <button 
                  onClick={() => !isRunning && setIsRevision(true)}
                  className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isRevision ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-xl' : 'text-slate-400'}`}
                >
                  <RefreshCcw size={14} />
                  {t('রিভিশন', 'Revision')}
                </button>
              </div>
            </div>
            
            <div className="w-full sm:w-64">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center sm:text-left">{t('বিষয় নির্বাচন', 'Subject')}</label>
              <select 
                disabled={isRunning}
                value={activeSubjectId}
                onChange={(e) => setActiveSubjectId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-bold transition-all disabled:opacity-50 appearance-none"
              >
                <option value="">{t('বিষয় বেছে নাও', 'Choose Subject')}</option>
                {userState.subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name} ({sub.paper}{t('য় পত্র', 'nd Paper')})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-center py-10 relative">
            <div className={`text-[8rem] sm:text-[10rem] font-black tracking-tighter tabular-nums leading-none select-none ${isRevision ? 'text-purple-600' : 'text-slate-900 dark:text-white'}`}>
              {formatTime(seconds).split(':').slice(1).join(':')}
              <div className="text-sm font-black uppercase tracking-[0.5em] text-slate-300 mt-2">{formatTime(seconds).split(':')[0]} HOURS ELAPSED</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-10 mt-4">
            {!isRunning ? (
              <button
                onClick={() => activeSubjectId && setIsRunning(true)}
                disabled={!activeSubjectId}
                className={`w-28 h-28 text-white flex items-center justify-center rounded-full hover:scale-110 active:scale-95 shadow-2xl transition-all disabled:opacity-20 disabled:grayscale ${isRevision ? 'bg-purple-500 shadow-purple-500/40' : 'bg-emerald-500 shadow-emerald-500/40'}`}
              >
                <Play size={48} className="ml-2 fill-current" />
              </button>
            ) : (
              <button
                onClick={() => setIsRunning(false)}
                className="w-28 h-28 bg-white dark:bg-slate-800 text-slate-600 flex items-center justify-center rounded-full border-4 border-slate-100 dark:border-slate-700 hover:scale-110 active:scale-95 shadow-xl transition-all"
              >
                <Pause size={48} className="fill-current" />
              </button>
            )}

            <button
              onClick={handleStop}
              className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center rounded-full border-4 border-red-100 dark:border-red-900/10 hover:scale-110 active:scale-95 transition-all shadow-lg"
            >
              <Square size={32} className="fill-current" />
            </button>
          </div>
        </div>
      ) : (
        /* Manual History Form */
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
           <form onSubmit={handleManualSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{t('বিষয়', 'Subject')}</label>
                    <select 
                      required
                      value={manualData.subjectId}
                      onChange={(e) => setManualData({...manualData, subjectId: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-black transition-all"
                    >
                      <option value="">{t('নির্বাচন করো', 'Select Subject')}</option>
                      {userState.subjects.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name} ({sub.paper}{t('য় পত্র', 'nd Paper')})</option>
                      ))}
                    </select>
                 </div>
                 <div className="space-y-3">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{t('তারিখ', 'Session Date')}</label>
                    <div className="relative">
                      <CalIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input 
                        type="date" 
                        required
                        value={manualData.date}
                        onChange={(e) => setManualData({...manualData, date: e.target.value})}
                        className="w-full pl-16 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-black transition-all"
                      />
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{t('সময়কাল (মিনিট)', 'Duration (Minutes)')}</label>
                    <div className="relative">
                      <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input 
                        type="number" 
                        required
                        min="1"
                        placeholder="e.g. 60"
                        value={manualData.durationMinutes}
                        onChange={(e) => setManualData({...manualData, durationMinutes: e.target.value})}
                        className="w-full pl-16 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-black transition-all"
                      />
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{t('সেশনের ধরণ', 'Session Type')}</label>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl shadow-inner">
                      <button 
                        type="button"
                        onClick={() => setManualData({...manualData, isRevision: false})}
                        className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!manualData.isRevision ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-xl' : 'text-slate-400'}`}
                      >
                        {t('পড়াশোনা', 'Normal Study')}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setManualData({...manualData, isRevision: true})}
                        className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${manualData.isRevision ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-xl' : 'text-slate-400'}`}
                      >
                        {t('রিভিশন', 'Revision')}
                      </button>
                    </div>
                 </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-slate-900 dark:bg-emerald-600 hover:scale-[1.02] active:scale-95 text-white font-black py-5 rounded-[2rem] shadow-2xl transition-all text-sm uppercase tracking-[0.3em] flex items-center justify-center gap-3"
              >
                <CheckCircle2 size={20} />
                {t('সেভ করো', 'Save Log Entry')}
              </button>
           </form>
        </div>
      )}
      
      {/* Dynamic Pro Tip */}
      <div className="bg-emerald-500/10 dark:bg-emerald-900/20 p-8 rounded-[3rem] flex items-start gap-6 border border-emerald-500/20 shadow-sm transition-all hover:shadow-emerald-500/10 group">
         <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 transition-transform group-hover:rotate-12">
            <Zap size={28} className="fill-current" />
         </div>
         <div className="flex-1">
            <h5 className="font-black text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">{t(`${userState.profile?.aiName} এর পরামর্শ`, `${userState.profile?.aiName}'s Pro Tip`)}</h5>
            <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium italic leading-relaxed">
              {isRevision 
                ? t('"রিভিশন দেওয়ার সময় কঠিন চ্যাপ্টারগুলোর জন্য ফ্লো-চার্ট ব্যবহার করো, স্মৃতিতে দীর্ঘস্থায়ী হবে!"', '"Use flowcharts for complex chapters while revising; it makes them stick in your long-term memory!"')
                : t('"পড়াশোনার সময় ফোনটা এয়ারপ্লেন মোডে রাখো, ফোকাস লেভেল দ্বিগুণ হয়ে যাবে!"', '"Put your phone on airplane mode while studying—your focus level will double instantly!"')}
            </p>
         </div>
      </div>
    </div>
  );
};

export default Tracker;
