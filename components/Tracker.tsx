
import React, { useState } from 'react';
import { UserState, StudySession, Mood, ActiveTimerState } from '../types';
import { Play, Pause, Square, Zap, RefreshCcw, History, Clock, Calendar as CalIcon, CheckCircle2, Smile, Zap as FocusIcon, Coffee, Frown, Flame } from 'lucide-react';

interface TrackerProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const Tracker: React.FC<TrackerProps> = ({ userState, onUpdateState }) => {
  const [activeSubjectId, setActiveSubjectId] = useState<string>(userState.activeTimer?.subjectId || '');
  const [isRevision, setIsRevision] = useState(userState.activeTimer?.isRevision || false);
  const [showManual, setShowManual] = useState(false);
  
  // Transient settings (not saved until end)
  const [focusLevel, setFocusLevel] = useState(7);
  const [currentMood, setCurrentMood] = useState<Mood>('Focused');

  const [manualData, setManualData] = useState({
    subjectId: '',
    date: new Date().toISOString().split('T')[0],
    durationMinutes: '',
    isRevision: false,
    mood: 'Focused' as Mood
  });

  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  const timer = userState.activeTimer;

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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
        activeTimer: {
          ...prev.activeTimer,
          isFocusActive: true,
          lastTimestamp: now
        }
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
    
    // Save only if session is significant (e.g., > 10 seconds for testing, but typically 60)
    const significantThreshold = 10; 
    if (timer.accumulatedFocusSeconds < significantThreshold) {
      if (timer.accumulatedFocusSeconds > 0) {
        alert(t('সেশনটি খুব ছোট হওয়ার কারণে সেভ করা হয়নি।', 'Session too short to be saved.'));
      }
      onUpdateState(prev => ({ ...prev, activeTimer: null }));
      return;
    }
    
    const newSession: StudySession = {
      id: `timer-${Date.now()}`,
      subjectId: timer.subjectId,
      startTime: timer.sessionStartTime,
      endTime: Date.now(),
      durationMinutes: Math.max(1, Math.floor(timer.accumulatedFocusSeconds / 60)),
      breakMinutes: Math.floor(timer.accumulatedBreakSeconds / 60),
      numBreaks: timer.numBreaks,
      focusLevel,
      mood: currentMood,
      isRevision: timer.isRevision
    };

    onUpdateState(prev => ({
      ...prev,
      studyHistory: [...prev.studyHistory, newSession],
      streaks: prev.streaks + (timer.accumulatedFocusSeconds > 1800 ? 1 : 0),
      currentMood,
      activeTimer: null
    }));
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
      breakMinutes: 0,
      numBreaks: 0,
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
    { type: 'Great', icon: <Smile size={18} />, color: 'brand-primary', label: { bn: 'দারুণ', en: 'Great' } },
    { type: 'Focused', icon: <FocusIcon size={18} />, color: 'brand-secondary', label: { bn: 'মনযোগী', en: 'Focused' } },
    { type: 'Tired', icon: <Coffee size={18} />, color: 'orange-500', label: { bn: 'ক্লান্ত', en: 'Tired' } },
    { type: 'Stressed', icon: <Frown size={18} />, color: 'red-500', label: { bn: 'চিন্তিত', en: 'Stressed' } },
    { type: 'Burnt Out', icon: <Flame size={18} />, color: 'purple-500', label: { bn: 'অবসন্ন', en: 'Burnt Out' } },
  ];

  const isTimerGlobalActive = !!timer;
  const isFocusingNow = timer?.isFocusActive || false;

  return (
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
      <header className="text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-brand-text-p">{t('স্টাডি ফোকাস', 'Study Focus')}</h2>
        <p className="text-brand-text-s font-medium text-xs md:text-sm">{t('তোমার প্রতিটি মিনিট HSC সাফল্যের পথে গুরুত্বপূর্ণ।', 'Every minute counts toward your HSC success.')}</p>
      </header>

      {/* Mode Switcher */}
      <div className="flex justify-center">
        <div className="bg-brand-surface p-1 md:p-1.5 rounded-full border border-brand-text-s/10 shadow-sm flex gap-1 transition-colors">
          <button 
            onClick={() => !isTimerGlobalActive && setShowManual(false)}
            disabled={isTimerGlobalActive}
            className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-2.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 ${!showManual ? 'bg-brand-primary text-white shadow-lg' : 'text-brand-text-s hover:bg-brand-bg/50'}`}
          >
            <Clock size={14} />
            {t('টাইমার', 'Timer')}
          </button>
          <button 
            onClick={() => !isTimerGlobalActive && setShowManual(true)}
            disabled={isTimerGlobalActive}
            className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-2.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 ${showManual ? 'bg-brand-primary text-white shadow-lg' : 'text-brand-text-s hover:bg-brand-bg/50'}`}
          >
            <History size={14} />
            {t('ম্যানুয়াল', 'Manual')}
          </button>
        </div>
      </div>

      {!showManual ? (
        <div className="bg-brand-surface rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-xl border border-brand-text-s/10 transition-all">
          <div className="mb-8 md:mb-10 flex flex-col items-center gap-6">
            <div className="w-full">
              <label className="block text-[10px] font-black text-brand-text-s uppercase tracking-[0.2em] mb-3 md:mb-4 text-center">{t('মোড নির্বাচন', 'Select Mode')}</label>
              <div className="flex bg-brand-bg p-1 rounded-2xl shadow-inner max-w-sm mx-auto">
                <button 
                  onClick={() => !isTimerGlobalActive && setIsRevision(false)}
                  className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isRevision ? 'bg-brand-surface text-brand-primary shadow-sm' : 'text-brand-text-s'}`}
                >
                  {t('পড়াশোনা', 'Study')}
                </button>
                <button 
                  onClick={() => !isTimerGlobalActive && setIsRevision(true)}
                  className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isRevision ? 'bg-brand-surface text-brand-secondary shadow-sm' : 'text-brand-text-s'}`}
                >
                  <RefreshCcw size={12} />
                  {t('রিভিশন', 'Revision')}
                </button>
              </div>
            </div>
            
            <div className="w-full max-w-sm mx-auto">
              <label className="block text-[10px] font-black text-brand-text-s uppercase tracking-[0.2em] mb-3 md:mb-4 text-center">{t('বিষয় নির্বাচন', 'Subject')}</label>
              <select 
                disabled={isTimerGlobalActive}
                value={activeSubjectId}
                onChange={(e) => setActiveSubjectId(e.target.value)}
                className="w-full bg-brand-bg border-2 border-brand-text-s/10 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary text-sm font-bold transition-all disabled:opacity-50 appearance-none text-center text-brand-text-p"
              >
                <option value="">{t('বিষয় বেছে নাও', 'Choose Subject')}</option>
                {userState.subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name} ({sub.paper}{t('য় পত্র', ' Paper')})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-center py-6 md:py-10">
            <div className={`text-6xl xs:text-7xl sm:text-[8rem] md:text-[10rem] font-black tracking-tighter tabular-nums leading-none select-none ${timer?.isRevision || isRevision ? 'text-brand-secondary' : 'text-brand-text-p'}`}>
              {formatTime(timer?.accumulatedFocusSeconds || 0).split(':').slice(1).join(':')}
              <div className="text-[10px] md:text-sm font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-brand-text-s/30 mt-4">
                {formatTime(timer?.accumulatedFocusSeconds || 0).split(':')[0]} HOURS ELAPSED
              </div>
            </div>
            {isTimerGlobalActive && !isFocusingNow && (
              <div className="mt-4 animate-pulse flex items-center justify-center gap-2 text-brand-secondary font-black text-xs uppercase tracking-widest">
                <Coffee size={14} />
                {t('ব্রেকে আছো: ', 'ON BREAK: ')} {formatTime(timer?.accumulatedBreakSeconds || 0)}
              </div>
            )}
          </div>

          {/* Real-time Mood Picker for active session */}
          <div className="mb-8 max-w-sm mx-auto">
             <label className="block text-[10px] font-black text-brand-text-s uppercase tracking-[0.2em] mb-4 text-center">{t('বর্তমান মেজাজ', 'Current Mood')}</label>
             <div className="flex flex-wrap justify-center gap-2">
                {moodOptions.map((m) => (
                  <button
                    key={m.type}
                    onClick={() => setCurrentMood(m.type)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${
                      currentMood === m.type 
                        ? `bg-brand-primary text-white shadow-lg scale-105` 
                        : 'bg-brand-bg text-brand-text-s hover:bg-brand-bg/80'
                    }`}
                  >
                    {m.icon}
                    {userState.language === 'bn' ? m.label.bn : m.label.en}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex items-center justify-center gap-6 md:gap-10 mt-6 md:mt-4">
            {!isFocusingNow ? (
              <button
                onClick={handleStartResume}
                disabled={!activeSubjectId}
                className={`w-24 h-24 md:w-28 md:h-28 text-white flex items-center justify-center rounded-full hover:scale-105 active:scale-95 shadow-2xl transition-all disabled:opacity-20 disabled:grayscale ${timer?.isRevision || isRevision ? 'bg-brand-secondary shadow-brand-secondary/40' : 'bg-brand-primary shadow-brand-primary/40'}`}
              >
                <Play size={40} md:size={48} className="ml-1.5 md:ml-2 fill-current" />
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="w-24 h-24 md:w-28 md:h-28 bg-brand-surface text-brand-text-p flex items-center justify-center rounded-full border-4 border-brand-bg hover:scale-105 active:scale-95 shadow-xl transition-all"
              >
                <Pause size={40} md:size={48} className="fill-current" />
              </button>
            )}

            <button
              onClick={handleStopEnd}
              disabled={!isTimerGlobalActive}
              className="w-16 h-16 md:w-20 md:h-20 bg-brand-bg text-brand-text-p flex items-center justify-center rounded-full border-4 border-brand-text-s/10 hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-30"
            >
              <Square size={24} md:size={32} className="fill-current text-red-500" />
            </button>
          </div>
        </div>
      ) : (
        /* Manual History Form */
        <div className="bg-brand-surface rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-xl border border-brand-text-s/10 animate-in zoom-in-95 duration-300 transition-colors">
           <form onSubmit={handleManualSubmit} className="space-y-6 md:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                 <div className="space-y-2 md:space-y-3">
                    <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-[0.2em] ml-1">{t('বিষয়', 'Subject')}</label>
                    <select 
                      required
                      value={manualData.subjectId}
                      onChange={(e) => setManualData({...manualData, subjectId: e.target.value})}
                      className="w-full bg-brand-bg border-2 border-brand-text-s/10 rounded-2xl px-5 md:px-6 py-3.5 md:py-4 focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary text-sm font-black transition-all text-brand-text-p"
                    >
                      <option value="">{t('নির্বাচন করো', 'Select Subject')}</option>
                      {userState.subjects.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name} ({sub.paper}{t('য় পত্র', ' Paper')})</option>
                      ))}
                    </select>
                 </div>
                 <div className="space-y-2 md:space-y-3">
                    <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-[0.2em] ml-1">{t('তারিখ', 'Session Date')}</label>
                    <div className="relative">
                      <CalIcon className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 text-brand-text-s/50" size={18} md:size={20} />
                      <input 
                        type="date" 
                        required
                        value={manualData.date}
                        onChange={(e) => setManualData({...manualData, date: e.target.value})}
                        className="w-full pl-12 md:pl-16 pr-5 md:pr-6 py-3.5 md:py-4 bg-brand-bg border-2 border-brand-text-s/10 rounded-2xl focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary text-sm font-black transition-all text-brand-text-p"
                      />
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                 <div className="space-y-2 md:space-y-3">
                    <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-[0.2em] ml-1">{t('সময়কাল (মিনিট)', 'Duration (Minutes)')}</label>
                    <div className="relative">
                      <Clock className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 text-brand-text-s/50" size={18} md:size={20} />
                      <input 
                        type="number" 
                        required
                        min="1"
                        placeholder="60"
                        value={manualData.durationMinutes}
                        onChange={(e) => setManualData({...manualData, durationMinutes: e.target.value})}
                        className="w-full pl-12 md:pl-16 pr-5 md:pr-6 py-3.5 md:py-4 bg-brand-bg border-2 border-brand-text-s/10 rounded-2xl focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary text-sm font-black transition-all text-brand-text-p"
                      />
                    </div>
                 </div>
                 <div className="space-y-2 md:space-y-3">
                    <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-[0.2em] ml-1">{t('সেশনের ধরণ', 'Session Type')}</label>
                    <div className="flex bg-brand-bg p-1 rounded-2xl shadow-inner">
                      <button 
                        type="button"
                        onClick={() => setManualData({...manualData, isRevision: false})}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!manualData.isRevision ? 'bg-brand-surface text-brand-primary shadow-sm' : 'text-brand-text-s'}`}
                      >
                        {t('পড়াশোনা', 'Normal')}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setManualData({...manualData, isRevision: true})}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${manualData.isRevision ? 'bg-brand-surface text-brand-secondary shadow-sm' : 'text-brand-text-s'}`}
                      >
                        {t('রিভিশন', 'Revision')}
                      </button>
                    </div>
                 </div>
              </div>

              <div className="space-y-3">
                 <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-[0.2em] ml-1">{t('সেশনের মেজাজ', 'Session Mood')}</label>
                 <div className="flex flex-wrap gap-2">
                    {moodOptions.map((m) => (
                      <button
                        key={m.type}
                        type="button"
                        onClick={() => setManualData({...manualData, mood: m.type})}
                        className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border-2 ${
                          manualData.mood === m.type 
                            ? `border-brand-primary bg-brand-primary/10 text-brand-primary` 
                            : 'border-transparent bg-brand-bg text-brand-text-s'
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
                className="w-full bg-brand-primary hover:scale-[1.01] active:scale-95 text-white font-black py-4 md:py-5 rounded-[1.5rem] md:rounded-[2rem] shadow-xl transition-all text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] flex items-center justify-center gap-3"
              >
                <CheckCircle2 size={18} md:size={20} />
                {t('সেভ করো', 'Save Log Entry')}
              </button>
           </form>
        </div>
      )}
      
      <div className="bg-brand-primary/5 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] flex items-start gap-4 md:gap-6 border border-brand-primary/10 shadow-sm group transition-colors">
         <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-brand-primary text-white flex items-center justify-center shrink-0 shadow-lg shadow-brand-primary/20 transition-transform group-hover:rotate-6">
            <Zap size={20} md:size={28} className="fill-current" />
         </div>
         <div className="flex-1">
            <h5 className="font-black text-[10px] text-brand-primary uppercase tracking-widest mb-1 md:mb-2">{t(`${userState.profile?.aiName} এর পরামর্শ`, `${userState.profile?.aiName}'s Pro Tip`)}</h5>
            <p className="text-xs md:text-sm text-brand-text-p font-medium italic leading-relaxed">
              {timer?.isRevision || isRevision 
                ? t('"রিভিশন দেওয়ার সময় কঠিন চ্যাপ্টারগুলোর জন্য ফ্লো-চার্ট ব্যবহার করো, স্মৃতিতে দীর্ঘস্থায়ী হবে!"', '"Use flowcharts for complex chapters while revising; it makes them stick in your long-term memory!"')
                : t('"পড়াশোনার সময় ফোনটা এয়ারপ্লেন মোডে রাখো, ফোকাস লেভেল দ্বিগুণ হয়ে যাবে!"', '"Put your phone on airplane mode while studying—your focus level will double instantly!"')}
            </p>
         </div>
      </div>
    </div>
  );
};

export default Tracker;
