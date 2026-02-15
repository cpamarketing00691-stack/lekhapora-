import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserState, Subject, Chapter, MCQ, TestAttempt } from '../types';
import { 
  Timer, ChevronLeft, ChevronRight, CheckCircle2, 
  AlertCircle, History, BookOpen, Clock, 
  Check, X, GraduationCap, Loader2, Sparkles, Trophy
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TestSectionProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
  initialContext: { subjectId: string; chapterId: string } | null;
  clearContext: () => void;
  onTriggerModelExam?: (examId: string) => void;
}

type TestStatus = 'selection' | 'exam' | 'result' | 'history';

const TestSection: React.FC<TestSectionProps> = ({ userState, onUpdateState, initialContext, clearContext, onTriggerModelExam }) => {
  const [testStatus, setTestStatus] = useState<TestStatus>('selection');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialContext?.subjectId || '');
  const [selectedChapterId, setSelectedChapterId] = useState<string>(initialContext?.chapterId || '');
  const [currentQuestions, setCurrentQuestions] = useState<MCQ[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(1800); 
  const [isLoading, setIsLoading] = useState(false);
  const [historyAttempt, setHistoryAttempt] = useState<TestAttempt | null>(null);
  
  const [availableTests, setAvailableTests] = useState<any[]>([]);

  // Guards
  const isSubmissionLocked = useRef(false);
  const timerIntervalRef = useRef<number | null>(null);

  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  useEffect(() => {
    fetchAvailableTests();
  }, []);

  const fetchAvailableTests = async () => {
    try {
      const { data, error } = await supabase.from('questions_bank').select('subject, chapter');
      if (error) throw error;
      
      const map: any = {};
      data?.forEach(q => {
        if (!map[q.subject]) map[q.subject] = new Set();
        map[q.subject].add(q.chapter);
      });
      
      const list = Object.entries(map).flatMap(([subj, chapters]: any) => 
        Array.from(chapters).map(ch => ({ subject: subj, chapter: ch }))
      );
      setAvailableTests(list);
    } catch (e) {
      console.error("Failed to load test catalog");
    }
  };

  const startExam = async (subjName?: string, chapName?: string) => {
    setIsLoading(true);
    isSubmissionLocked.current = false;
    
    try {
      const { data, error } = await supabase
        .from('questions_bank')
        .select('*')
        .eq('subject', subjName)
        .eq('chapter', chapName)
        .limit(30);

      if (error || !data || data.length === 0) {
        alert(t("প্রশ্ন পাওয়া যায়নি!", "No questions found."));
        return;
      }

      const mapped = data.map(q => ({
        id: q.id,
        question: q.question_text,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options),
        correct_index: q.options.indexOf(q.correct_answer),
        explanation: q.explanation
      }));

      setCurrentQuestions(mapped);
      setUserAnswers(new Array(mapped.length).fill(-1));
      setCurrentIndex(0);
      setTimeLeft(1800);
      setTestStatus('exam');
    } catch (err: any) {
      alert("Error loading exam");
    } finally {
      setIsLoading(false);
    }
  };

  const submitExam = async () => {
    if (isSubmissionLocked.current) return;
    isSubmissionLocked.current = true;
    
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const score = userAnswers.reduce((acc, ans, idx) => acc + (ans === currentQuestions[idx].correct_index ? 1 : 0), 0);

    const attempt: TestAttempt = {
      id: `attempt-${Date.now()}`,
      subjectId: selectedSubjectId,
      chapterId: selectedChapterId,
      score,
      total: currentQuestions.length,
      timeTakenSeconds: 1800 - timeLeft,
      date: Date.now(),
      questions: currentQuestions,
      userAnswers
    };

    onUpdateState(prev => ({
      ...prev,
      testHistory: [attempt, ...(prev.testHistory || [])]
    }));

    setTestStatus('result');
  };

  useEffect(() => {
    if (testStatus === 'exam' && timeLeft > 0) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            submitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
    }
  }, [testStatus, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in duration-500">
      {testStatus === 'selection' && (
        <div className="space-y-8">
          <header>
            <h2 className="text-3xl font-black text-brand-text-p">{t('টেস্ট লাইব্রেরি', 'Test Library')}</h2>
            <p className="text-brand-text-s text-xs font-bold uppercase tracking-widest mt-1">{t('প্রশ্ন ব্যাংক থেকে পরীক্ষা দিন', 'Practice from question bank')}</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableTests.map((tst, i) => (
              <div key={i} className="bg-brand-surface p-8 rounded-[2.5rem] border border-brand-text-s/10 hover:border-brand-primary transition-all shadow-sm group">
                <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary mb-6 group-hover:scale-110 transition-transform">
                  <BookOpen size={24} />
                </div>
                <h4 className="font-black text-brand-text-p text-lg leading-tight mb-2">{tst.subject}</h4>
                <p className="text-xs font-bold text-brand-text-s uppercase mb-6">{tst.chapter}</p>
                <button 
                  onClick={() => startExam(tst.subject, tst.chapter)}
                  disabled={isLoading}
                  className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 size={14} className="animate-spin"/> : <GraduationCap size={14}/>}
                  {t('শুরু করো', 'Start Test')}
                </button>
              </div>
            ))}
            {availableTests.length === 0 && (
              <div className="col-span-full py-20 text-center opacity-30">
                <AlertCircle size={48} className="mx-auto mb-4"/>
                <p className="font-black uppercase tracking-widest">{t('কোনো টেস্ট পাওয়া যায়নি', 'No tests available')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {testStatus === 'exam' && currentQuestions.length > 0 && (
        <div className="space-y-6">
          <header className="flex items-center justify-between bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm sticky top-0 z-50">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
                  <GraduationCap size={24} />
                </div>
                <div>
                   <h3 className="text-sm font-black text-brand-text-p truncate max-w-[150px]">{currentQuestions[currentIndex].question.slice(0, 30)}...</h3>
                   <p className="text-[9px] font-black text-brand-text-s uppercase tracking-widest">{t('প্রশ্ন', 'Question')} {currentIndex + 1} / {currentQuestions.length}</p>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-brand-bg rounded-xl border border-brand-text-s/10 font-black tabular-nums">
                  {formatTime(timeLeft)}
                </div>
                <button onClick={submitExam} className="px-6 py-2 bg-emerald-500 text-white font-black rounded-xl text-[10px] uppercase tracking-widest">Finish</button>
             </div>
          </header>
          
          <main className="bg-brand-surface p-8 sm:p-12 rounded-[3rem] border border-brand-text-s/10 shadow-sm space-y-10">
             <h2 className="text-lg sm:text-2xl font-black text-brand-text-p leading-tight">{currentQuestions[currentIndex].question}</h2>
             <div className="grid grid-cols-1 gap-4">
                {currentQuestions[currentIndex].options.map((option, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => { const newAns = [...userAnswers]; newAns[currentIndex] = idx; setUserAnswers(newAns); }} 
                    className={`flex items-center gap-4 px-6 py-5 rounded-[1.5rem] border-2 transition-all text-left font-bold text-sm ${userAnswers[currentIndex] === idx ? 'bg-brand-primary border-brand-primary text-white' : 'bg-brand-bg border-transparent hover:bg-brand-bg/80'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${userAnswers[currentIndex] === idx ? 'bg-white/20 border-white' : 'bg-brand-surface border-brand-text-s/10'}`}>{String.fromCharCode(65 + idx)}</div>
                    {option}
                  </button>
                ))}
             </div>
             <div className="flex justify-between items-center pt-8 border-t border-brand-text-s/10">
                <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(currentIndex - 1)} className="p-4 bg-brand-bg rounded-2xl disabled:opacity-20"><ChevronLeft/></button>
                <div className="flex gap-1">
                   {currentQuestions.map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIndex ? 'bg-brand-primary scale-150' : userAnswers[i] !== -1 ? 'bg-emerald-500' : 'bg-brand-text-s/20'}`}></div>
                   ))}
                </div>
                <button onClick={() => currentIndex < currentQuestions.length - 1 ? setCurrentIndex(currentIndex + 1) : submitExam()} className="p-4 bg-brand-primary text-white rounded-2xl"><ChevronRight/></button>
             </div>
          </main>
        </div>
      )}

      {testStatus === 'result' && (
        <div className="max-w-2xl mx-auto py-10 text-center animate-in zoom-in-95">
           <div className="bg-brand-surface p-12 rounded-[4rem] border border-brand-text-s/10 shadow-2xl space-y-8">
              <div className="w-24 h-24 bg-emerald-500 text-white mx-auto rounded-full flex items-center justify-center shadow-xl mb-6">
                <Trophy size={48} />
              </div>
              <h2 className="text-3xl font-black text-brand-text-p">{t('টেস্ট সম্পন্ন!', 'Test Finished!')}</h2>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-brand-bg p-6 rounded-3xl">
                    <p className="text-[10px] font-black uppercase text-brand-text-s mb-1">Score</p>
                    <p className="text-3xl font-black text-brand-primary">{userAnswers.filter((a, i) => a === currentQuestions[i].correct_index).length} / {currentQuestions.length}</p>
                 </div>
                 <div className="bg-brand-bg p-6 rounded-3xl">
                    <p className="text-[10px] font-black uppercase text-brand-text-s mb-1">Time</p>
                    <p className="text-3xl font-black text-brand-text-p">{formatTime(1800 - timeLeft)}</p>
                 </div>
              </div>
              <button onClick={() => setTestStatus('selection')} className="w-full py-5 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs">Back to Library</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default TestSection;