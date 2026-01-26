
import React, { useState, useEffect, useRef } from 'react';
import { UserState, StudySession, Mood } from '../types';
import { Play, Pause, Square, Book, Zap, RefreshCcw, PlusCircle, History, Clock, Calendar as CalIcon, CheckCircle2, Smile, Zap as FocusIcon, Coffee, Frown, Flame } from 'lucide-react';

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

  const [manualData, setManualData] = useState({
    subjectId: '',
    date: new Date().toISOString().split('T')[0],
    durationMinutes: '',
    isRevision: false,
    mood: 'Focused' as Mood
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
    if (!manualData.subjectId || isNaN(duration) || duration <= 0) {
      alert(t('অনুগ্রহ করে সঠিক সময়কাল (মিনিট) লিখুন।', 'Please enter a valid duration in minutes.'));
      return;
    }

    const sessionDate = new Date(manualData.date);
    const startTime = sessionDate.getTime();

    const newSession: StudySession = {
      id: `manual-${Date.now()}`,
      subjectId: manualData.subjectId,
      startTime: startTime,
      endTime: startTime + (duration * 60000),
      durationMinutes: duration,
      focusLevel: 8,
      mood: manualData.mood,
      isRevision: manualData.isRevision
    };

    onUpdateState(prev => ({
      ...prev,
      studyHistory: [...prev.studyHistory, newSession],
      streaks: prev.streaks + (duration >= 30 ? 1 : 0),
      currentMood: manualData.mood
    }));

    setManualData({ ...manualData, subjectId: '', durationMinutes: '', mood: 'Focused' });
    setShowManual(false);
  };

  const moodOptions: { type: Mood, icon: any, color: string, label: { bn: string, en: string } }[] = [
    { type: 'Great', icon: <Smile size={18} />, color: 'emerald', label: { bn: 'দারুণ', en: 'Great' } },
    { type: 'Focused', icon: <FocusIcon size={18} />, color: 'blue', label: { bn: 'মনযোগী', en: 'Focused' } },
    { type: 'Tired', icon: <Coffee size={18} />, color: 'orange', label: { bn: 'ক্লান্ত', en: 'Tired' } },
    { type: 'Stressed', icon: <Frown size={18} />, color: 'red', label: { bn: 'চিন্তিত', en: 'Stressed' } },
    { type: 'Burnt Out', icon: <Flame size={18} />, color: 'purple', label: { bn: 'অবসন্ন', en: 'Burnt Out' } },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
      <header className="text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight">{t('স্টাডি ফোকাস', 'Study Focus')}</h2>
        <p className="text-slate-500 font-medium text-xs md:text-sm">{t('তোমার প্রতিটি মিনিট HSC সাফল্যের পথে গুরুত্বপূর্ণ।', 'Every minute counts toward your HSC success.')}</p>
      </header>

      {/* Mode Switcher */}
      <div className="flex justify-center">
        <div className="bg-white dark:bg-slate-900 p-1 md:p-1.5 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm flex gap-1">
          <button 
            onClick={() => !isRunning && setShowManual(false)}
            disabled={isRunning}
            className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-2.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 ${!showManual ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Clock size={14} />
            {t('টাইমার', 'Timer')}
          </button>
          <button 
            onClick={() => !isRunning && setShowManual(true)}
            disabled={isRunning}
            className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-2.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 ${showManual ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <History size={14} />
            {t('ম্যানুয়াল', 'Manual')}
          </button>
        </div>
      </div>

      {!showManual ? (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-xl border border-slate-100 dark:border-slate-800 transition-all">
          <div className="mb-8 md:mb-10 flex flex-col items-center gap-6">
            <div className="w-full">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 md:mb-4 text-center">{t('মোড নির্বাচন', 'Select Mode')}</label>
              <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-2xl shadow-inner max-w-sm mx-auto">
                <button 
                  onClick={() => !isRunning && setIsRevision(false)}
                  className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isRevision ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                >
                  {t('পড়াশোনা', 'Study')}
                </button>
                <button 
                  onClick={() => !isRunning && setIsRevision(true)}
                  className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isRevision ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm' : 'text-slate-400'}`}
                >
                  <RefreshCcw size={12} />
                  {t('রিভিশন', 'Revision')}
                </button>
              </div>
            </div>
            
            <div className="w-full max-w-sm mx-auto">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 md:mb-4 text-center">{t('বিষয় নির্বাচন', 'Subject')}</label>
              <select 
                disabled={isRunning}
                value={activeSubjectId}
                onChange={(e) => setActiveSubjectId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-bold transition-all disabled:opacity-50 appearance-none text-center"
              >
                <option value="">{t('বিষয় বেছে নাও', 'Choose Subject')}</option>
                {userState.subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name} ({sub.paper}{t('য় পত্র', ' Paper')})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-center py-6 md:py-10">
            <div className={`text-6xl xs:text-7xl sm:text-[8rem] md:text-[10rem] font-black tracking-tighter tabular-nums leading-none select-none ${isRevision ? 'text-purple-600' : 'text-slate-900 dark:text-white'}`}>
              {formatTime(seconds).split(':').slice(1).join(':')}
              <div className="text-[10px] md:text-sm font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-slate-300 mt-4">{formatTime(seconds).split(':')[0]} HOURS ELAPSED</div>
            </div>
          </div>

          {/* Real-time Mood Picker for active session */}
          <div className="mb-8 max-w-sm mx-auto">
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">{t('বর্তমান মেজাজ', 'Current Mood')}</label>
             <div className="flex flex-wrap justify-center gap-2">
                {moodOptions.map((m) => (
                  <button
                    key={m.type}
                    onClick={() => setCurrentMood(m.type)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${
                      currentMood === m.type 
                        ? `bg-${m.color}-500 text-white shadow-lg scale-105` 
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {m.icon}
                    {userState.language === 'bn' ? m.label.bn : m.label.en}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex items-center justify-center gap-6 md:gap-10 mt-6 md:mt-4">
            {!isRunning ? (
              <button
                onClick={() => activeSubjectId && setIsRunning(true)}
                disabled={!activeSubjectId}
                className={`w-24 h-24 md:w-28 md:h-28 text-white flex items-center justify-center rounded-full hover:scale-105 active:scale-95 shadow-2xl transition-all disabled:opacity-20 disabled:grayscale ${isRevision ? 'bg-purple-500 shadow-purple-500/40' : 'bg-emerald-500 shadow-emerald-500/40'}`}
              >
                <Play size={40} md:size={48} className="ml-1.5 md:ml-2 fill-current" />
              </button>
            ) : (
              <button
                onClick={() => setIsRunning(false)}
                className="w-24 h-24 md:w-28 md:h-28 bg-white dark:bg-slate-800 text-slate-600 flex items-center justify-center rounded-full border-4 border-slate-100 dark:border-slate-700 hover:scale-105 active:scale-95 shadow-xl transition-all"
              >
                <Pause size={40} md:size={48} className="fill-current" />
              </button>
            )}

            <button
              onClick={handleStop}
              className="w-16 h-16 md:w-20 md:h-20 bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center rounded-full border-4 border-red-100 dark:border-red-900/10 hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              <Square size={24} md:size={32} className="fill-current" />
            </button>
          </div>
        </div>
      ) : (
        /* Manual History Form */
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
           <form onSubmit={handleManualSubmit} className="space-y-6 md:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                 <div className="space-y-2 md:space-y-3">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">{t('বিষয়', 'Subject')}</label>
                    <select 
                      required
                      value={manualData.subjectId}
                      onChange={(e) => setManualData({...manualData, subjectId: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-5 md:px-6 py-3.5 md:py-4 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-black transition-all"
                    >
                      <option value="">{t('নির্বাচন করো', 'Select Subject')}</option>
                      {userState.subjects.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name} ({sub.paper}{t('য় পত্র', ' Paper')})</option>
                      ))}
                    </select>
                 </div>
                 <div className="space-y-2 md:space-y-3">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">{t('তারিখ', 'Session Date')}</label>
                    <div className="relative">
                      <CalIcon className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} md:size={20} />
                      <input 
                        type="date" 
                        required
                        value={manualData.date}
                        onChange={(e) => setManualData({...manualData, date: e.target.value})}
                        className="w-full pl-12 md:pl-16 pr-5 md:pr-6 py-3.5 md:py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-black transition-all"
                      />
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                 <div className="space-y-2 md:space-y-3">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">{t('সময়কাল (মিনিট)', 'Duration (Minutes)')}</label>
                    <div className="relative">
                      <Clock className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} md:size={20} />
                      <input 
                        type="number" 
                        required
                        min="1"
                        placeholder="60"
                        value={manualData.durationMinutes}
                        onChange={(e) => setManualData({...manualData, durationMinutes: e.target.value})}
                        className="w-full pl-12 md:pl-16 pr-5 md:pr-6 py-3.5 md:py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-black transition-all"
                      />
                    </div>
                 </div>
                 <div className="space-y-2 md:space-y-3">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">{t('সেশনের ধরণ', 'Session Type')}</label>
                    <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-2xl shadow-inner">
                      <button 
                        type="button"
                        onClick={() => setManualData({...manualData, isRevision: false})}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!manualData.isRevision ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                      >
                        {t('পড়াশোনা', 'Normal')}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setManualData({...manualData, isRevision: true})}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${manualData.isRevision ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm' : 'text-slate-400'}`}
                      >
                        {t('রিভিশন', 'Revision')}
                      </button>
                    </div>
                 </div>
              </div>

              {/* Manual Mood Selector */}
              <div className="space-y-3">
                 <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">{t('সেশনের মেজাজ', 'Session Mood')}</label>
                 <div className="flex flex-wrap gap-2">
                    {moodOptions.map((m) => (
                      <button
                        key={m.type}
                        type="button"
                        onClick={() => setManualData({...manualData, mood: m.type})}
                        className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border-2 ${
                          manualData.mood === m.type 
                            ? `border-${m.color}-500 bg-${m.color}-50 dark:bg-${m.color}-900/20 text-${m.color}-600` 
                            : 'border-transparent bg-slate-50 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {m.icon}
                        {userState.language === 'bn' ? m.label.bn : m.label.en}
                      </button>
                    ))}
                 </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-slate-900 dark:bg-emerald-600 hover:scale-[1.01] active:scale-95 text-white font-black py-4 md:py-5 rounded-[1.5rem] md:rounded-[2rem] shadow-xl transition-all text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] flex items-center justify-center gap-3"
              >
                <CheckCircle2 size={18} md:size={20} />
                {t('সেভ করো', 'Save Log Entry')}
              </button>
           </form>
        </div>
      )}
      
      {/* Dynamic Pro Tip */}
      <div className="bg-emerald-500/5 dark:bg-emerald-900/10 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] flex items-start gap-4 md:gap-6 border border-emerald-500/10 shadow-sm group">
         <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 transition-transform group-hover:rotate-6">
            <Zap size={20} md:size={28} className="fill-current" />
         </div>
         <div className="flex-1">
            <h5 className="font-black text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1 md:mb-2">{t(`${userState.profile?.aiName} এর পরামর্শ`, `${userState.profile?.aiName}'s Pro Tip`)}</h5>
            <p className="text-xs md:text-sm text-emerald-800 dark:text-emerald-200 font-medium italic leading-relaxed">
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
