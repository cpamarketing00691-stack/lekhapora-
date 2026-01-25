
import React, { useState, useEffect, useRef } from 'react';
import { UserState, StudySession, Mood } from '../types';
import { Play, Pause, Square, Book, Zap, RefreshCcw, PlusCircle, History, Clock, Calendar as CalIcon } from 'lucide-react';

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
  const [showManual, setShowManual] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Manual Entry State
  const [manualData, setManualData] = useState({
    subjectId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
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
      streaks: prev.streaks + (seconds > 1800 ? 1 : 0),
      currentMood
    }));

    setIsRunning(false);
    setSeconds(0);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualData.subjectId || !manualData.startTime || !manualData.endTime) return;

    const startParts = manualData.startTime.split(':');
    const endParts = manualData.endTime.split(':');
    
    const startDate = new Date(manualData.date);
    startDate.setHours(parseInt(startParts[0]), parseInt(startParts[1]), 0, 0);
    
    const endDate = new Date(manualData.date);
    endDate.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0, 0);

    const durationMs = endDate.getTime() - startDate.getTime();
    const durationMinutes = Math.floor(durationMs / 60000);

    if (durationMinutes <= 0) {
        alert(t('শেষ সময় অবশ্যই শুরু সময়ের পরে হতে হবে।', 'End time must be after start time.'));
        return;
    }

    const newSession: StudySession = {
      id: `manual-${Date.now()}`,
      subjectId: manualData.subjectId,
      startTime: startDate.getTime(),
      endTime: endDate.getTime(),
      durationMinutes,
      focusLevel: 8,
      mood: 'Focused',
      isRevision: manualData.isRevision
    };

    onUpdateState(prev => ({
      ...prev,
      studyHistory: [...prev.studyHistory, newSession],
      streaks: prev.streaks + (durationMinutes >= 30 ? 1 : 0)
    }));

    setManualData({ ...manualData, subjectId: '' });
    setShowManual(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header className="text-center">
        <h2 className="text-3xl font-black">{t('স্টাডি ট্র্যাকার', 'Study Tracker')}</h2>
        <p className="text-slate-500">{t('পড়াশোনা রেকর্ড করার স্মার্ট পদ্ধতি।', 'Smart way to record your study.')}</p>
      </header>

      <div className="flex justify-center mb-2">
        <button 
          onClick={() => {
            if (isRunning) return;
            setShowManual(!showManual);
          }}
          disabled={isRunning}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all disabled:opacity-50 ${showManual ? 'bg-slate-900 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-100 dark:border-slate-800 shadow-sm'}`}
        >
          {showManual ? <History size={14} /> : <PlusCircle size={14} />}
          {showManual ? t('টাইমারে ফিরে যাও', 'Back to Timer') : t('পুরানো পড়াশোনা যোগ করো', 'Add Past Session')}
        </button>
      </div>

      {!showManual ? (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-800">
          <div className="mb-8 flex items-center justify-between">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{t('বিষয় নির্বাচন করো', 'Select Subject')}</label>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button 
                onClick={() => !isRunning && setIsRevision(false)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${!isRevision ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-400'}`}
              >
                {t('পড়াশোনা', 'Study')}
              </button>
              <button 
                onClick={() => !isRunning && setIsRevision(true)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 transition-all ${isRevision ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm' : 'text-slate-400'}`}
              >
                <RefreshCcw size={10} />
                {t('রিভিশন', 'Revision')}
              </button>
            </div>
          </div>
          
          <div className="mb-8 overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex gap-3">
              {userState.subjects.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => !isRunning && setActiveSubjectId(sub.id)}
                  disabled={isRunning}
                  className={`flex-shrink-0 flex items-center gap-2 p-4 px-6 rounded-2xl border-2 transition-all text-sm font-bold ${
                    activeSubjectId === sub.id
                      ? (isRevision ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700' : 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700')
                      : 'border-slate-50 dark:border-slate-800 hover:border-slate-200 bg-white dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  <Book size={16} />
                  {sub.name} (P{sub.paper})
                </button>
              ))}
            </div>
          </div>

          <div className="text-center py-12">
            <div className={`text-9xl font-black tracking-tighter tabular-nums mb-4 ${isRevision ? 'text-purple-600' : 'text-slate-900 dark:text-white'}`}>
              {formatTime(seconds)}
            </div>
            <p className={`text-xs font-black uppercase tracking-[0.3em] ${isRunning ? 'text-emerald-500 animate-pulse' : 'text-slate-300'}`}>
              {isRunning ? t('ফোকাস মোড একটিভ', 'Focus Mode Active') : t('শুরু করতে বোতামে চাপ দাও', 'Tap to start session')}
            </p>
          </div>

          <div className="flex items-center justify-center gap-8">
            {isRunning ? (
              <button
                onClick={() => setIsRunning(false)}
                className="w-24 h-24 bg-white dark:bg-slate-800 text-slate-600 flex items-center justify-center rounded-full border-4 border-slate-100 dark:border-slate-700 hover:scale-105 transition-all shadow-xl"
              >
                <Pause size={40} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={() => activeSubjectId && setIsRunning(true)}
                disabled={!activeSubjectId}
                className={`w-24 h-24 text-white flex items-center justify-center rounded-full hover:scale-110 shadow-2xl transition-all disabled:opacity-20 ${isRevision ? 'bg-purple-500 shadow-purple-500/30' : 'bg-emerald-500 shadow-emerald-500/30'}`}
              >
                <Play size={40} className="ml-2" fill="currentColor" />
              </button>
            )}

            <button
              onClick={handleStop}
              className="w-24 h-24 bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center rounded-full border-4 border-red-100 dark:border-red-900/20 hover:scale-105 transition-all shadow-xl"
            >
              <Square size={40} fill="currentColor" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
           <form onSubmit={handleManualSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">{t('বিষয়', 'Subject')}</label>
                    <select 
                      required
                      value={manualData.subjectId}
                      onChange={(e) => setManualData({...manualData, subjectId: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-emerald-500 text-sm font-bold"
                    >
                      <option value="">{t('নির্বাচন করো', 'Select Subject')}</option>
                      {userState.subjects.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name} (P{sub.paper})</option>
                      ))}
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">{t('তারিখ', 'Date')}</label>
                    <div className="relative">
                      <CalIcon className="absolute left-5 top-4 text-slate-400" size={18} />
                      <input 
                        type="date" 
                        required
                        value={manualData.date}
                        onChange={(e) => setManualData({...manualData, date: e.target.value})}
                        className="w-full pl-14 pr-5 py-4 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl focus:ring-2 focus:ring-emerald-500 text-sm font-bold"
                      />
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">{t('শুরু ও শেষ সময়', 'Time Interval')}</label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Clock className="absolute left-4 top-3 text-slate-300" size={16} />
                        <input 
                          type="time" required
                          value={manualData.startTime}
                          onChange={(e) => setManualData({...manualData, startTime: e.target.value})}
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <span className="text-slate-300 font-bold">→</span>
                      <div className="relative flex-1">
                        <Clock className="absolute left-4 top-3 text-slate-300" size={16} />
                        <input 
                          type="time" required
                          value={manualData.endTime}
                          onChange={(e) => setManualData({...manualData, endTime: e.target.value})}
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">{t('ধরণ', 'Type')}</label>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                      <button 
                        type="button"
                        onClick={() => setManualData({...manualData, isRevision: false})}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${!manualData.isRevision ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                      >
                        {t('পড়াশোনা', 'Study')}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setManualData({...manualData, isRevision: true})}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${manualData.isRevision ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm' : 'text-slate-400'}`}
                      >
                        {t('রিভিশন', 'Revision')}
                      </button>
                    </div>
                 </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all transform active:scale-95 text-sm uppercase tracking-widest"
              >
                {t('রেকর্ড সেভ করো', 'Save Manual Record')}
              </button>
           </form>
        </div>
      )}
      
      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-[2.5rem] flex items-start gap-5 border border-emerald-100 dark:border-emerald-800">
         <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Zap size={20} fill="currentColor" />
         </div>
         <div>
            <h5 className="font-bold text-sm text-emerald-800 dark:text-emerald-400">{t(`${userState.profile?.aiName} এর টিপস`, `Pro Tip from ${userState.profile?.aiName}`)}</h5>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 italic mt-1 leading-relaxed">
              {isRevision 
                ? t('"রিভিশন দেওয়ার সময় ম্যাপ বা ডায়াগ্রামগুলো একবার দেখে নিলে পড়া দীর্ঘস্থায়ী হয়!"', '"Quickly reviewing maps or diagrams while revising helps retention!"')
                : t('"পড়ার ৩০ মিনিট পর ৫ মিনিটের একটি ছোট বিরতি নাও, ব্রেইন রিফ্রেশ হবে!"', '"Take a 5-minute break after 30 minutes of study to refresh your brain!"')}
            </p>
         </div>
      </div>
    </div>
  );
};

export default Tracker;
