
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserState, Subject, Chapter, MCQ, TestAttempt } from '../types';
import { 
  Timer, ChevronLeft, ChevronRight, CheckCircle2, 
  AlertCircle, History, BookOpen, Clock, 
  Check, X, GraduationCap, Loader2, Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TestSectionProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
  initialContext: { subjectId: string; chapterId: string } | null;
  clearContext: () => void;
}

const TestSection: React.FC<TestSectionProps> = ({ userState, onUpdateState, initialContext, clearContext }) => {
  const [view, setView] = useState<'selection' | 'exam' | 'result' | 'history'>('selection');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialContext?.subjectId || '');
  const [selectedChapterId, setSelectedChapterId] = useState<string>(initialContext?.chapterId || '');
  const [currentQuestions, setCurrentQuestions] = useState<MCQ[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [isLoading, setIsLoading] = useState(false);
  const [historyAttempt, setHistoryAttempt] = useState<TestAttempt | null>(null);

  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  const timerRef = useRef<number | null>(null);

  /**
   * AGGRESSIVE NORMALIZATION (Logical Matching)
   * 1. Lowercase & Trim
   * 2. Normalize Bangla/English numerals to a single form
   * 3. Remove punctuation for fuzzy/logical matching
   * 4. Consolidate whitespace
   */
  const normalize = (str: any): string => {
    if (!str) return '';
    const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const en = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let result = String(str).toLowerCase().trim();
    
    for (let i = 0; i < 10; i++) {
      result = result.split(bn[i]).join(en[i]);
    }
    
    return result
      .replace(/[:.,\-\(\)\[\]\{\}\/_]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  /**
   * DYNAMIC TABLE SELECTION
   * Maps subject name and paper to specific Supabase table names.
   */
  const getTableName = (subjectName: string, paper: number): string => {
    const cleanName = subjectName.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
      
    if (cleanName === 'ict') return 'ict_mcq';
    
    const suffix = paper === 1 ? '1st' : '2nd';
    return `${cleanName}_${suffix}_mcq`;
  };

  useEffect(() => {
    if (initialContext) {
      setSelectedSubjectId(initialContext.subjectId);
      setSelectedChapterId(initialContext.chapterId);
      startExam(initialContext.subjectId, initialContext.chapterId);
      clearContext();
    }
  }, [initialContext]);

  const startExam = async (subjIdArg?: string, chapIdArg?: string) => {
    const sId = subjIdArg || selectedSubjectId;
    const cId = chapIdArg || selectedChapterId;
    
    if (!sId || !cId) return;
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentSubject = userState.subjects.find(s => s.id === sId);
      const currentChapter = currentSubject?.chapters.find(c => c.id === cId);

      if (!currentSubject || !currentChapter) {
        throw new Error("Subject or Chapter not found in state");
      }

      const tableName = getTableName(currentSubject.name, currentSubject.paper);
      const targetChapterNorm = normalize(currentChapter.name);

      // INTERNAL LOGGING
      console.log(`[Exam Initialization] Table: ${tableName}, Chapter: ${currentChapter.name}`);

      // ATTEMPT 1: Specific Table Fetch
      const { data: tableData, error: tableError } = await supabase.from(tableName).select('*');

      // VERIFY CONNECTION: Check if it's a genuine database/network failure
      const isConnectionError = tableError && (
        tableError.message.toLowerCase().includes('failed to fetch') || 
        tableError.code === 'PGRST116' || 
        tableError.code === '500' ||
        tableError.code === 'ECONNREFUSED'
      );

      if (isConnectionError) {
        console.error("Supabase Connection Error:", tableError);
        throw tableError; 
      }

      if (!tableError && tableData && tableData.length > 0) {
        const started = await processMcqs(tableData, targetChapterNorm, user.id, cId);
        if (started) {
          setIsLoading(false);
          return;
        }
      }

      // ATTEMPT 2: Fallback to Global 'mcqs' table
      console.log("[Exam Initialization] Falling back to 'mcqs' table...");
      const { data: globalData, error: globalError } = await supabase
        .from('mcqs')
        .select('*')
        .ilike('subject_name', `%${currentSubject.name}%`);

      if (globalError && globalError.message.toLowerCase().includes('failed to fetch')) {
        throw globalError;
      }

      if (globalData && globalData.length > 0) {
        const started = await processMcqs(globalData, targetChapterNorm, user.id, cId);
        if (started) {
          setIsLoading(false);
          return;
        }
      }

      // NO RESULTS BUT CONNECTED: Treat as logic/filtering issue, not connection issue
      console.warn(`[Exam Initialization] No questions found for normalized chapter: ${targetChapterNorm}`);
      alert(t("এই চ্যাপ্টারের জন্য পর্যাপ্ত প্রশ্ন ডেটাবেজে খুঁজে পাওয়া যায়নি।", "No questions found for this chapter in the database."));

    } catch (err: any) {
      console.error("Exam Initialization Critical Error:", err);
      // Only show connection error for confirmed network/auth/db failures
      alert(t("সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। দয়া করে ইন্টারনেট কানেকশন চেক করো।", "Could not connect to the server. Please check your internet connection."));
    } finally {
      setIsLoading(false);
    }
  };

  const processMcqs = async (rawMcqs: any[], targetChapterNorm: string, userId: string, chapterId: string): Promise<boolean> => {
    // Stage 1: Logical Filter (Matches Chapter or Sub-Chapter)
    let filteredMcqs = rawMcqs.filter(q => {
      const qChapterNorm = normalize(q.chapter_name || q.chapter_id);
      const qSubChapterNorm = normalize(q.sub_chapter_name || q.sub_chapter);

      return qChapterNorm.includes(targetChapterNorm) || 
             targetChapterNorm.includes(qChapterNorm) ||
             qSubChapterNorm.includes(targetChapterNorm);
    });

    // Stage 2: Relaxed Filter (If specific match fails, try broader subject pool)
    if (filteredMcqs.length === 0) {
      console.log("[MCQ Processing] No specific chapter match. Using broader subject pool.");
      filteredMcqs = rawMcqs; 
    }

    if (filteredMcqs.length === 0) return false;

    // Randomization
    const shuffledPool = [...filteredMcqs].sort(() => Math.random() - 0.5);

    // Repetition priority (Try to use unseen, but use all if pool is small)
    try {
      const { data: seenLogs } = await supabase
        .from('test_attempts')
        .select('questions')
        .eq('user_id', userId)
        .eq('chapter_id', chapterId);

      const seenIds = new Set((seenLogs || []).flatMap(log => (Array.isArray(log.questions) ? log.questions : []).map((q: any) => q.id)));
      const unseen = shuffledPool.filter(q => !seenIds.has(q.id));
      
      const finalSelection = unseen.length >= 5 ? unseen : shuffledPool;
      const finalSet = finalSelection.slice(0, 30);

      setCurrentQuestions(finalSet);
      setUserAnswers(new Array(finalSet.length).fill(-1));
      setCurrentIndex(0);
      setTimeLeft(1800);
      setView('exam');
      return true;
    } catch (e) {
      // SAFE READ MODE: If history check fails, proceed with the full pool anyway
      console.warn("[MCQ Processing] History check failed, proceeding in safe read mode.");
      const finalSet = shuffledPool.slice(0, 30);
      setCurrentQuestions(finalSet);
      setUserAnswers(new Array(finalSet.length).fill(-1));
      setCurrentIndex(0);
      setTimeLeft(1800);
      setView('exam');
      return true;
    }
  };

  useEffect(() => {
    if (view === 'exam' && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            submitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [view]);

  const submitExam = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const correctCount = userAnswers.reduce((acc, ans, idx) => {
      return ans === currentQuestions[idx].correct_index ? acc + 1 : acc;
    }, 0);

    const attempt: TestAttempt = {
      id: `attempt-${Date.now()}`,
      subjectId: selectedSubjectId,
      chapterId: selectedChapterId,
      score: correctCount,
      total: currentQuestions.length,
      timeTakenSeconds: 1800 - timeLeft,
      date: Date.now(),
      questions: currentQuestions,
      userAnswers: userAnswers
    };

    onUpdateState(prev => ({
      ...prev,
      testHistory: [attempt, ...(prev.testHistory || [])],
      subjects: prev.subjects.map(s => s.id === selectedSubjectId ? {
        ...s,
        chapters: s.chapters.map(c => c.id === selectedChapterId ? {
          ...c,
          testScore: Math.max(c.testScore || 0, correctCount)
        } : c)
      } : s)
    }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('test_attempts').insert({
          user_id: user.id,
          subject_id: selectedSubjectId,
          chapter_id: selectedChapterId,
          score: correctCount,
          total: currentQuestions.length,
          time_seconds: 1800 - timeLeft,
          questions: currentQuestions,
          user_answers: userAnswers
        });
      }
    } catch (e) { console.error("Cloud save failed", e); }

    setView('result');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentSubject = userState.subjects.find(s => s.id === selectedSubjectId);
  const currentChapter = currentSubject?.chapters.find(c => c.id === selectedChapterId);

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in duration-500">
      
      {view === 'selection' && (
        <div className="space-y-6">
          <header>
            <h2 className="text-3xl font-black text-brand-text-p">{t('টেস্ট ও প্র্যাকটিস', 'Test & Practice')}</h2>
            <p className="text-brand-text-s text-xs font-bold uppercase tracking-widest mt-1">{t('তোমার প্রস্তুতির যাচাই করো', 'Evaluate your preparation level')}</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="text-brand-primary" size={24} />
                <h3 className="font-bold text-lg">{t('সিলেবাস টেস্ট', 'Syllabus Test')}</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-brand-text-s tracking-widest ml-1 mb-2 block">{t('বিষয় নির্বাচন করো', 'Choose Subject')}</label>
                  <div className="grid grid-cols-1 gap-2">
                    {userState.subjects.map(sub => (
                      <button 
                        key={sub.id} 
                        onClick={() => { setSelectedSubjectId(sub.id); setSelectedChapterId(''); }}
                        className={`text-left px-5 py-3 rounded-2xl border-2 transition-all font-bold text-sm ${selectedSubjectId === sub.id ? 'bg-brand-primary/5 border-brand-primary text-brand-primary' : 'bg-brand-bg border-transparent text-brand-text-s hover:bg-brand-surface'}`}
                      >
                        {sub.name} (P{sub.paper})
                      </button>
                    ))}
                  </div>
                </div>

                {selectedSubjectId && (
                  <div className="animate-in slide-in-from-top-2">
                    <label className="text-[10px] font-black uppercase text-brand-text-s tracking-widest ml-1 mb-2 block">{t('চ্যাপ্টার নির্বাচন করো', 'Choose Chapter')}</label>
                    <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto scrollbar-hide pr-1">
                      {userState.subjects.find(s => s.id === selectedSubjectId)?.chapters.map(ch => (
                        <button 
                          key={ch.id} 
                          onClick={() => setSelectedChapterId(ch.id)}
                          className={`text-left px-5 py-3 rounded-2xl border-2 transition-all font-bold text-xs ${selectedChapterId === ch.id ? 'bg-brand-secondary/5 border-brand-secondary text-brand-secondary' : 'bg-brand-bg border-transparent text-brand-text-s hover:bg-brand-surface'}`}
                        >
                          <div className="flex justify-between items-center">
                            <span>{ch.name}</span>
                            {ch.testScore !== undefined && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full uppercase">Score: {ch.testScore}/30</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  disabled={!selectedSubjectId || !selectedChapterId || isLoading}
                  onClick={() => startExam()}
                  className="w-full mt-4 py-4 bg-brand-primary text-white font-black rounded-2xl shadow-xl shadow-brand-primary/20 uppercase tracking-widest text-[11px] disabled:opacity-30 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <GraduationCap size={18} />}
                  {t('টেস্ট শুরু করো', 'Start Test Now')}
                </button>
              </div>
            </section>

            <section className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <History className="text-brand-secondary" size={24} />
                <h3 className="font-bold text-lg">{t('টেস্ট হিস্ট্রি', 'Test History')}</h3>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto scrollbar-hide">
                {userState.testHistory && userState.testHistory.length > 0 ? userState.testHistory.map(att => (
                  <button 
                    key={att.id} 
                    onClick={() => { setHistoryAttempt(att); setView('history'); }}
                    className="w-full text-left p-4 bg-brand-bg rounded-2xl border border-brand-text-s/5 group hover:border-brand-primary transition-all"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-[10px] font-black text-brand-text-s uppercase tracking-widest">
                        {new Date(att.date).toLocaleDateString()}
                      </p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${att.score >= 20 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {att.score}/{att.total}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-brand-text-p truncate">{userState.subjects.find(s => s.id === att.subjectId)?.name}</h4>
                    <p className="text-[9px] font-medium text-brand-text-s truncate">{userState.subjects.find(s => s.id === att.subjectId)?.chapters.find(c => c.id === att.chapterId)?.name}</p>
                  </button>
                )) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-brand-text-s opacity-30 gap-3 py-10">
                    <AlertCircle size={40} />
                    <p className="text-[10px] font-black uppercase tracking-widest">{t('কোনো টেস্ট দেওয়া হয়নি', 'No tests taken yet')}</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {view === 'exam' && (
        <div className="space-y-6">
          <header className="flex items-center justify-between bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm sticky top-0 z-50">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary shrink-0">
                  <GraduationCap size={24} />
               </div>
               <div>
                  <h3 className="text-sm font-black text-brand-text-p truncate max-w-[150px] sm:max-w-none">{currentSubject?.name} • {currentChapter?.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-black text-brand-text-s uppercase tracking-widest">{t('প্রশ্ন', 'Question')} {currentIndex + 1} / {currentQuestions.length}</span>
                  </div>
               </div>
             </div>
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-brand-bg rounded-xl border border-brand-text-s/10">
                  <Clock size={16} className={timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-brand-primary'} />
                  <span className={`text-sm font-black tabular-nums ${timeLeft < 300 ? 'text-rose-500' : 'text-brand-text-p'}`}>{formatTime(timeLeft)}</span>
                </div>
                <button 
                  onClick={submitExam}
                  className="px-6 py-2 bg-emerald-500 text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                  {t('সাবমিট', 'Finish')}
                </button>
             </div>
          </header>

          <div className="bg-brand-surface p-8 sm:p-12 rounded-[3rem] border border-brand-text-s/10 shadow-sm space-y-10 min-h-[400px] flex flex-col">
            <div className="flex-1">
              <h2 className="text-lg sm:text-2xl font-black text-brand-text-p leading-tight mb-10">
                {currentQuestions[currentIndex].question}
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {currentQuestions[currentIndex].options.map((option, idx) => (
                  <button 
                    key={idx}
                    onClick={() => {
                      const newAns = [...userAnswers];
                      newAns[currentIndex] = idx;
                      setUserAnswers(newAns);
                    }}
                    className={`flex items-center gap-4 px-6 py-5 rounded-[1.5rem] border-2 transition-all text-left font-bold text-sm ${userAnswers[currentIndex] === idx ? 'bg-brand-primary border-brand-primary text-white shadow-xl shadow-brand-primary/20 scale-[1.02]' : 'bg-brand-bg border-transparent text-brand-text-s hover:bg-brand-bg/80'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${userAnswers[currentIndex] === idx ? 'bg-white/20 border-white' : 'bg-brand-surface border-brand-text-s/10'}`}>
                       {String.fromCharCode(65 + idx)}
                    </div>
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-8 border-t border-brand-text-s/10">
              <button 
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(currentIndex - 1)}
                className="p-4 bg-brand-bg text-brand-text-s rounded-2xl hover:text-brand-text-p disabled:opacity-20 transition-all"
              >
                <ChevronLeft size={24} />
              </button>
              
              <div className="flex gap-1 overflow-x-auto max-w-[200px] scrollbar-hide py-2 px-1">
                {currentQuestions.map((_, i) => (
                   <div key={i} className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${i === currentIndex ? 'bg-brand-primary scale-150' : userAnswers[i] !== -1 ? 'bg-brand-secondary' : 'bg-brand-text-s/20'}`}></div>
                ))}
              </div>

              <button 
                onClick={() => {
                  if (currentIndex < currentQuestions.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                  } else {
                    submitExam();
                  }
                }}
                className="p-4 bg-brand-primary text-white rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-lg shadow-brand-primary/20"
              >
                {currentIndex === currentQuestions.length - 1 ? <CheckCircle2 size={24} /> : <ChevronRight size={24} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'result' && (
        <div className="max-w-2xl mx-auto space-y-8 py-10 animate-in zoom-in-95 duration-500">
           <div className="bg-brand-surface p-10 rounded-[3rem] border border-brand-text-s/10 text-center shadow-xl space-y-8 relative overflow-hidden">
              <Sparkles className="absolute -right-10 -bottom-10 opacity-10 text-brand-primary" size={200} />
              <div className="relative z-10">
                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 shadow-2xl ${userAnswers.filter((a, i) => a === currentQuestions[i].correct_index).length >= 20 ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                  <CheckCircle2 size={48} />
                </div>
                <h2 className="text-3xl font-black text-brand-text-p">{t('টেস্ট সম্পন্ন হয়েছে!', 'Test Completed!')}</h2>
                <p className="text-brand-text-s font-bold text-xs uppercase tracking-widest mt-2">{t('তোমার ফলাফল নিচের মতো:', 'Here is your performance summary:')}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-10">
                 <div className="bg-brand-bg p-6 rounded-3xl border border-brand-text-s/5">
                    <p className="text-[10px] font-black text-brand-text-s uppercase tracking-widest mb-1">{t('সঠিক উত্তর', 'SCORE')}</p>
                    <h3 className="text-3xl font-black text-brand-primary">{userAnswers.filter((a, i) => a === currentQuestions[i].correct_index).length} / {currentQuestions.length}</h3>
                 </div>
                 <div className="bg-brand-bg p-6 rounded-3xl border border-brand-text-s/5">
                    <p className="text-[10px] font-black text-brand-text-s uppercase tracking-widest mb-1">{t('সময় লেগেছে', 'TIME USED')}</p>
                    <h3 className="text-3xl font-black text-brand-text-p">{formatTime(1800 - timeLeft)}</h3>
                 </div>
              </div>

              <div className="pt-4 relative z-10">
                <button 
                  onClick={() => setView('selection')}
                  className="w-full py-4 bg-brand-primary text-white font-black rounded-2xl shadow-xl shadow-brand-primary/20 uppercase tracking-widest text-xs active:scale-95 transition-all"
                >
                  {t('ড্যাশবোর্ডে ফিরে যাও', 'Return to Selection')}
                </button>
                <button 
                  onClick={() => { setHistoryAttempt(userState.testHistory[0]); setView('history'); }}
                  className="w-full mt-3 py-4 bg-brand-bg text-brand-text-p border border-brand-text-s/10 font-black rounded-2xl uppercase tracking-widest text-[10px] active:scale-95 transition-all"
                >
                  {t('প্রশ্নগুলোর সমাধান দেখো', 'Review Questions')}
                </button>
              </div>
           </div>
        </div>
      )}

      {view === 'history' && historyAttempt && (
        <div className="space-y-6">
          <header className="flex items-center justify-between">
            <button onClick={() => setView('selection')} className="flex items-center gap-2 text-brand-text-s hover:text-brand-text-p font-black text-[10px] uppercase tracking-widest transition-all">
              <ChevronLeft size={16} /> {t('পিছনে', 'Back')}
            </button>
            <h3 className="text-sm font-black text-brand-text-p uppercase tracking-widest">{t('রিভিউ ও সমাধান', 'Review & Solutions')}</h3>
            <div className="w-10"></div>
          </header>

          <div className="space-y-4">
            {historyAttempt.questions.map((q, idx) => {
              const isCorrect = historyAttempt.userAnswers[idx] === q.correct_index;
              const userAns = historyAttempt.userAnswers[idx];
              
              return (
                <div key={q.id} className={`bg-brand-surface p-6 rounded-[2rem] border transition-all ${isCorrect ? 'border-emerald-100 dark:border-emerald-900/30' : 'border-rose-100 dark:border-rose-900/30'}`}>
                   <div className="flex items-start gap-4 mb-4">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-black text-xs ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                        {idx + 1}
                      </div>
                      <h4 className="text-sm sm:text-lg font-black text-brand-text-p leading-tight">{q.question}</h4>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((opt, oIdx) => (
                        <div 
                          key={oIdx}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-[11px] font-bold ${oIdx === q.correct_index ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : oIdx === userAns ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-brand-bg border-transparent text-brand-text-s'}`}
                        >
                           <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border text-[9px] ${oIdx === q.correct_index ? 'bg-emerald-500 border-emerald-500 text-white' : oIdx === userAns ? 'bg-rose-500 border-rose-500 text-white' : 'bg-brand-surface border-brand-text-s/10 text-brand-text-s'}`}>
                             {oIdx === q.correct_index ? <Check size={12} /> : oIdx === userAns ? <X size={12} /> : String.fromCharCode(65 + oIdx)}
                           </div>
                           {opt}
                        </div>
                      ))}
                   </div>
                   {q.explanation && (
                     <div className="mt-4 p-4 bg-brand-bg/50 rounded-xl border border-brand-text-s/5">
                        <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-1 flex items-center gap-2">
                          <AlertCircle size={12} /> {t('ব্যাখ্যা', 'EXPLANATION')}
                        </p>
                        <p className="text-xs font-medium text-brand-text-s leading-relaxed italic">{q.explanation}</p>
                     </div>
                   )}
                </div>
              );
            })}
          </div>

          <button 
            onClick={() => setView('selection')}
            className="w-full py-5 bg-brand-primary text-white font-black rounded-2xl shadow-xl shadow-brand-primary/20 uppercase tracking-widest text-[10px] active:scale-95 transition-all"
          >
            {t('শেষ করো', 'Close Review')}
          </button>
        </div>
      )}
    </div>
  );
};

export default TestSection;
