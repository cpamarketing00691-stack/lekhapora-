
import React, { useState, useEffect } from 'react';
import { UserState, StudySession, Mood, ActiveTimerState, Task } from '../types';
import { Play, Pause, Square, Zap, RefreshCcw, History, Clock, Calendar as CalIcon, CheckCircle2, Smile, Zap as FocusIcon, Coffee, Frown, Flame, GraduationCap, ListTodo, Sparkles } from 'lucide-react';

interface TrackerProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const Tracker: React.FC<TrackerProps> = ({ userState, onUpdateState }) => {
  const [activeSubjectId, setActiveSubjectId] = useState<string>(userState.activeTimer?.subjectId || '');
  const [activeExamId, setActiveExamId] = useState<string>(userState.activeTimer?.examId || '');
  const [activeTaskId, setActiveTaskId] = useState<string>(userState.activeTimer?.taskId || '');
  const [isRevision, setIsRevision] = useState(userState.activeTimer?.isRevision || false);
  const [showManual, setShowManual] = useState(false);
  
  const [focusLevel, setFocusLevel] = useState(7);
  const [currentMood, setCurrentMood] = useState<Mood>('Focused');

  const [manualData, setManualData] = useState({
    subjectId: '',
    examId: '',
    taskId: '',
    date: new Date().toISOString().split('T')[0],
    durationMinutes: '',
    isRevision: false,
    mood: 'Focused' as Mood
  });

  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  // Auto-fill subject if a linked task is selected
  useEffect(() => {
    if (activeTaskId) {
      const dailyTasks = Array.isArray(userState.dailyTasks) ? userState.dailyTasks : [];
      const matchedTask = dailyTasks.find(task => task.id === activeTaskId);
      if (matchedTask && matchedTask.subjectId) {
        setActiveSubjectId(matchedTask.subjectId);
      }
    }
  }, [activeTaskId, userState.dailyTasks]);

  const formatDuration = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [h, m, s]
      .map(v => v.toString().padStart(2, '0'))
      .join(':');
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
            examId: activeExamId,
            taskId: activeTaskId,
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
      examId: timer.examId,
      taskId: timer.taskId,
      startTime: timer.sessionStartTime,
      endTime: Date.now(),
      durationSeconds: timer.accumulatedFocusSeconds,
      breakSeconds: timer.accumulatedBreakSeconds,
      numBreaks: timer.numBreaks,
      focusLevel,
      mood: currentMood,
      isRevision: timer.isRevision
    };

    onUpdateState(prev => {
      const newState = {
        ...prev,
        studyHistory: [...(Array.isArray(prev.studyHistory) ? prev.studyHistory : []), newSession],
        streaks: (prev.streaks || 0) + (timer.accumulatedFocusSeconds > 1800 ? 1 : 0),
        currentMood,
        activeTimer: null
      };
      return newState;
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const durationMin = parseInt(manualData.durationMinutes);
    if (!manualData.subjectId || isNaN(durationMin) || durationMin <= 0) {
      alert(t('অনুগ্রহ করে সঠিক বিষয় এবং সময়কাল লিখুন।', 'Please select a subject and valid duration.'));
      return;
    }

    const sessionDate = new Date(manualData.date);
    const startTime = sessionDate.getTime();
    const durationSec = durationMin * 60;

    const newSession: StudySession = {
      id: `manual-${Date.now()}`,
      subjectId: manualData.subjectId,
      examId: manualData.examId,
      taskId: manualData.taskId,
      startTime: startTime,
      endTime: startTime + (durationSec * 1000),
      durationSeconds: durationSec,
      breakSeconds: 0,
      numBreaks: 0,
      focusLevel: 8,
      mood: manualData.mood,
      isRevision: manualData.isRevision
    };

    onUpdateState(prev => ({
      ...prev,
      studyHistory: [...(Array.isArray(prev.studyHistory) ? prev.studyHistory : []), newSession],
      streaks: (prev.streaks || 0) + (durationSec >= 1800 ? 1 : 0),
      currentMood: manualData.mood
    }));

    setManualData({ ...manualData, subjectId: '', examId: '', taskId: '', durationMinutes: '', mood: 'Focused' });
    setShowManual(false);
  };

  const isTimerGlobalActive = !!timer;
  const isFocusingNow = timer?.isFocusActive || false;
  
  const subjects = Array.isArray(userState.subjects) ? userState.subjects : [];
  const dailyTasks = Array.isArray(userState.dailyTasks) ? userState.dailyTasks : [];
  const collegeExams = Array.isArray(userState.profile?.collegeExams) ? userState.profile!.collegeExams : [];

  return (
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-24 md:pb-0 px-2 sm:px-0">
      <header className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-brand-text-p leading-none">{t('স্টাডি ফোকাস', 'Study Focus')}</h2>
        <p className="text-brand-text-s font-medium text-[10px] sm:text-xs md:text-sm">{t('তোমার প্রতিটি মিনিট HSC সাফল্যের পথে গুরুত্বপূর্ণ।', 'Every minute counts toward your HSC success.')}</p>
      </header>

      <div className="flex justify-center">
        <div className="bg-brand-surface p-1.5 rounded-full border border-brand-text-s/10 shadow-sm flex gap-1 transition-colors">
          <button 
            onClick={() => !isTimerGlobalActive && setShowManual(false)}
            disabled={isTimerGlobalActive}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 ${!showManual ? 'bg-brand-primary text-white shadow-lg' : 'text-brand-text-s hover:bg-brand-bg/50'}`}
          >
            <Clock size={14} className="hidden sm:block" />
            {t('টাইমার', 'Timer')}
          </button>
          <button 
            onClick={() => !isTimerGlobalActive && setShowManual(true)}
            disabled={isTimerGlobalActive}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 ${showManual ? 'bg-brand-primary text-white shadow-lg' : 'text-brand-text-s hover:bg-brand-bg/50'}`}
          >
            <History size={14} className="hidden sm:block" />
            {t('ম্যানুয়াল', 'Manual')}
          </button>
        </div>
      </div>

      {!showManual ? (
        <div className="bg-brand-surface rounded-[3rem] p-5 sm:p-10 shadow-xl border border-brand-text-s/10 transition-all">
          <div className="mb-10 flex flex-col items-center gap-6">
            <div className="w-full">
              <label className="block text-[10px] font-black text-brand-text-s uppercase tracking-[0.2em] mb-4 text-center leading-none">{t('মোড নির্বাচন', 'Select Mode')}</label>
              <div className="flex bg-brand-bg p-1 rounded-2xl shadow-inner max-w-sm mx-auto">
                <button onClick={() => !isTimerGlobalActive && setIsRevision(false)} className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isRevision ? 'bg-brand-surface text-brand-primary shadow-sm' : 'text-brand-text-s'}`}>{t('পড়াশোনা', 'Study')}</button>
                <button onClick={() => !isTimerGlobalActive && setIsRevision(true)} className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isRevision ? 'bg-brand-surface text-brand-secondary shadow-sm' : 'text-brand-text-s'}`}><RefreshCcw size={10} />{t('রিভিশন', 'Revision')}</button>
              </div>
            </div>

            <div className="w-full max-w-lg space-y-4">
              <div className="space-y-1.5">
                 <label className="block text-[10px] font-black text-brand-text-s uppercase tracking-[0.2em] text-center leading-none">{t('ফোকাস টাস্ক (হোমওয়ার্ক)', 'Focus Task (Homework)')}</label>
                 <select 
                  disabled={isTimerGlobalActive} 
                  value={activeTaskId} 
                  onChange={(e) => setActiveTaskId(e.target.value)} 
                  className="w-full bg-brand-bg border-2 border-brand-text-s/10 rounded-xl px-3 py-3 focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary text-xs font-bold transition-all disabled:opacity-50 appearance-none text-center text-brand-text-p"
                 >
                   <option value="">{t('টাস্ক ছাড়া পড়াশোনা', 'Study without specific task')}</option>
                   {/* Safe Array Handling for dailyTasks filtering and mapping */}
                   {Array.isArray(dailyTasks) && dailyTasks.length > 0 ? dailyTasks.filter(t => !t.isCompleted).map(task => (
                     <option key={task.id} value={task.id}>{task.name} ({task.source})</option>
                   )) : null}
                 </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div>
                  <label className="block text-[10px] font-black text-brand-text-s uppercase tracking-[0.2em] mb-2 text-center leading-none">{t('বিষয়', 'Subject')}</label>
                  <select disabled={isTimerGlobalActive} value={activeSubjectId} onChange={(e) => setActiveSubjectId(e.target.value)} className="w-full bg-brand-bg border-2 border-brand-text-s/10 rounded-xl px-3 py-3 focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary text-xs font-bold transition-all disabled:opacity-50 appearance-none text-center text-brand-text-p">
                    <option value="">{t('বিষয় বেছে নাও', 'Choose Subject')}</option>
                    {/* Safe Array Handling for subjects mapping */}
                    {Array.isArray(subjects) && subjects.length > 0 ? subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name} (P{sub.paper})</option>) : null}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-brand-text-s uppercase tracking-[0.2em] mb-2 text-center leading-none">{t('লক্ষ্য পরীক্ষা (ঐচ্ছিক)', 'Target Exam (Opt)')}</label>
                  <select disabled={isTimerGlobalActive} value={activeExamId} onChange={(e) => setActiveExamId(e.target.value)} className="w-full bg-brand-bg border-2 border-brand-text-s/10 rounded-xl px-3 py-3 focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary text-xs font-bold transition-all disabled:opacity-50 appearance-none text-center text-brand-text-p">
                    <option value="">{t('পরীক্ষা নির্বাচন', 'None')}</option>
                    {/* Safe Array Handling for collegeExams mapping */}
                    {Array.isArray(collegeExams) && collegeExams.length > 0 ? collegeExams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>) : null}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center py-10">
            <div className={`text-[8rem] sm:text-[10rem] font-black tracking-tighter tabular-nums leading-none select-none ${timer?.isRevision || isRevision ? 'text-brand-secondary' : 'text-brand-text-p'}`}>
              {formatDuration(timer?.accumulatedFocusSeconds || 0)}
            </div>
            {isTimerGlobalActive && !isFocusingNow && (
              <div className="mt-4 animate-pulse flex items-center justify-center gap-2 text-brand-secondary font-black text-xs uppercase tracking-widest">
                <Coffee size={14} />
                {t('ব্রেকে আছো: ', 'ON BREAK: ')} {formatDuration(timer?.accumulatedBreakSeconds || 0)}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-10 mt-6">
            {!isFocusingNow ? (
              <button onClick={handleStartResume} disabled={!activeSubjectId} className={`w-24 h-24 md:w-28 md:h-28 text-white flex items-center justify-center rounded-full hover:scale-105 active:scale-95 shadow-2xl transition-all disabled:opacity-20 disabled:grayscale ${timer?.isRevision || isRevision ? 'bg-brand-secondary shadow-brand-secondary/40' : 'bg-brand-primary shadow-brand-primary/40'}`}>
                <Play size={40} className="ml-2 fill-current" />
              </button>
            ) : (
              <button onClick={handlePause} className="w-24 h-24 md:w-28 md:h-28 bg-brand-surface text-brand-text-p flex items-center justify-center rounded-full border-4 border-brand-bg hover:scale-105 active:scale-95 shadow-xl transition-all">
                <Pause size={40} className="fill-current" />
              </button>
            )}
            <button onClick={handleStopEnd} disabled={!isTimerGlobalActive} className="w-16 h-16 md:w-20 md:h-20 bg-brand-bg text-brand-text-p flex items-center justify-center rounded-full border-4 border-brand-text-s/10 hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-30">
              <Square size={24} className="fill-current text-red-500" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-brand-surface rounded-[3rem] p-5 sm:p-10 shadow-xl border border-brand-text-s/10 animate-in zoom-in-95 duration-300">
           <form onSubmit={handleManualSubmit} className="space-y-6 md:space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="block text-[9px] font-black uppercase text-brand-text-s tracking-widest ml-1">{t('বিষয়', 'Subject')}</label>
                    <select required value={manualData.subjectId} onChange={(e) => setManualData({...manualData, subjectId: e.target.value})} className="w-full bg-brand-bg border-2 border-brand-text-s/10 rounded-xl px-4 py-3 focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary text-xs font-black transition-all text-brand-text-p outline-none">
                      <option value="">{t('নির্বাচন করো', 'Select Subject')}</option>
                      {/* Safe Array Handling for manual subjects mapping */}
                      {Array.isArray(subjects) && subjects.length > 0 ? subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name} (P{sub.paper})</option>) : null}
                    </select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="block text-[9px] font-black uppercase text-brand-text-s tracking-widest ml-1">{t('পরীক্ষা (ঐচ্ছিক)', 'Exam (Optional)')}</label>
                    <select value={manualData.examId} onChange={(e) => setManualData({...manualData, examId: e.target.value})} className="w-full bg-brand-bg border-2 border-brand-text-s/10 rounded-xl px-4 py-3 focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary text-xs font-black transition-all text-brand-text-p outline-none">
                      <option value="">{t('পরীক্ষা নির্বাচন', 'None')}</option>
                      {/* Safe Array Handling for manual collegeExams mapping */}
                      {Array.isArray(collegeExams) && collegeExams.length > 0 ? collegeExams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>) : null}
                    </select>
                 </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="block text-[9px] font-black uppercase text-brand-text-s tracking-widest ml-1">{t('তারিখ', 'Date')}</label>
                   <input type="date" required value={manualData.date} onChange={(e) => setManualData({...manualData, date: e.target.value})} className="w-full px-4 py-3 bg-brand-bg border-2 border-brand-text-s/10 rounded-xl text-xs font-black transition-all text-brand-text-p outline-none" />
                </div>
                <div className="space-y-1.5">
                   <label className="block text-[9px] font-black uppercase text-brand-text-s tracking-widest ml-1">{t('সময়কাল (মিনিট)', 'Minutes')}</label>
                   <input type="number" required min="1" value={manualData.durationMinutes} onChange={(e) => setManualData({...manualData, durationMinutes: e.target.value})} className="w-full px-4 py-3 bg-brand-bg border-2 border-brand-text-s/10 rounded-xl text-xs font-black transition-all text-brand-text-p outline-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                 <label className="block text-[9px] font-black uppercase text-brand-text-s tracking-widest ml-1">{t('টাস্ক (ঐচ্ছিক)', 'Task (Optional)')}</label>
                 <select value={manualData.taskId} onChange={(e) => setManualData({...manualData, taskId: e.target.value})} className="w-full bg-brand-bg border-2 border-brand-text-s/10 rounded-xl px-4 py-3 focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary text-xs font-black transition-all text-brand-text-p outline-none">
                    <option value="">{t('নির্বাচন করো', 'Select Task')}</option>
                    {/* Safe Array Handling for manual dailyTasks mapping */}
                    {Array.isArray(dailyTasks) && dailyTasks.length > 0 ? dailyTasks.map(task => (
                      <option key={task.id} value={task.id}>{task.name}</option>
                    )) : null}
                 </select>
              </div>
              <button type="submit" className="w-full bg-brand-primary hover:scale-[1.01] active:scale-95 text-white font-black py-5 rounded-[2rem] shadow-xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                <CheckCircle2 size={16} /> {t('সেভ করো', 'Save Log Entry')}
              </button>
           </form>
        </div>
      )}
    </div>
  );
};

export default Tracker;
