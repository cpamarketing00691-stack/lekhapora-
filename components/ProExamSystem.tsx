
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Timer, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Clock, Check, X, GraduationCap, Loader2, Sparkles, Trophy, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserState, TestAttempt, MCQ, Language } from '../types';

interface ProExamProps {
  examId: string;
  onClose: () => void;
  onUpdateState?: React.Dispatch<React.SetStateAction<UserState>>;
  language?: Language;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
}

interface Exam {
  id: string;
  title: string;
  duration_minutes: number;
}

type ExamStatus = 'not_started' | 'in_progress' | 'submitting' | 'completed';

const ProExamSystem: React.FC<ProExamProps> = ({ examId, onClose, onUpdateState, language = 'bn' }) => {
  const [examStatus, setExamStatus] = useState<ExamStatus>('not_started');
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [result, setResult] = useState<any>(null);
  
  const timerIntervalRef = useRef<number | null>(null);
  const isSubmissionLocked = useRef(false);
  const initializedRef = useRef(false);

  // Translation helper function
  const t = (bn: string, en: string) => language === 'bn' ? bn : en;

  const fetchExamData = useCallback(async () => {
    if (initializedRef.current || examStatus !== 'not_started' || result) return;
    initializedRef.current = true;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return onClose();

      const { data: existingSubmission } = await supabase
        .from('exam_sys_submissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('exam_id', examId)
        .maybeSingle();

      if (existingSubmission) {
        const [examRes, questionsRes] = await Promise.all([
          supabase.from('exam_sys_exams').select('*').eq('id', examId).single(),
          supabase.from('exam_sys_questions').select('*').eq('exam_id', examId).order('order_index')
        ]);
        setExam(examRes.data);
        setQuestions(questionsRes.data || []);
        setResult(existingSubmission);
        setExamStatus('completed');
        return;
      }

      const [examRes, questionsRes] = await Promise.all([
        supabase.from('exam_sys_exams').select('*').eq('id', examId).single(),
        supabase.from('exam_sys_questions').select('*').eq('exam_id', examId).order('order_index')
      ]);

      if (examRes.error || questionsRes.error) throw new Error("Data load failed");

      setExam(examRes.data);
      setQuestions(questionsRes.data || []);
      setTimeLeft(examRes.data.duration_minutes * 60);
      setExamStatus('in_progress');

      await supabase.from('exam_sys_sessions').upsert({ 
        user_id: user.id, 
        exam_id: examId,
        started_at: new Date().toISOString()
      }, { onConflict: 'user_id,exam_id' });

    } catch (err) {
      console.error(err);
      initializedRef.current = false;
      onClose();
    }
  }, [examId, onClose, examStatus, result]);

  useEffect(() => {
    if (!initializedRef.current && examStatus === 'not_started' && !result) {
      fetchExamData();
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [fetchExamData, examStatus, result]);

  const submitExam = useCallback(async (isAuto = false) => {
    if (isSubmissionLocked.current || examStatus === 'completed' || examStatus === 'submitting') return;
    
    isSubmissionLocked.current = true;
    setExamStatus('submitting');
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Auth required");

      const correctCount = questions.reduce((acc, q) => {
        return userAnswers[q.id] === q.correct_index ? acc + 1 : acc;
      }, 0);

      const skippedCount = questions.filter(q => userAnswers[q.id] === undefined).length;
      const wrongCount = questions.length - correctCount - skippedCount;
      const duration = exam ? (exam.duration_minutes * 60) - timeLeft : 0;

      const submission = {
        user_id: user.id,
        exam_id: examId,
        score: correctCount,
        correct_count: correctCount,
        wrong_count: wrongCount,
        skipped_count: skippedCount,
        time_taken_seconds: duration,
        submitted_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('exam_sys_submissions')
        .insert(submission)
        .select()
        .single();
      
      if (error) throw error;

      // REMOVED: Parent state update (onUpdateState) removed from here to prevent remount loop.

      await supabase.from('exam_sys_sessions').delete().match({ user_id: user.id, exam_id: examId });

      setResult(data);
      setExamStatus('completed');
    } catch (err: any) {
      console.error(err);
      isSubmissionLocked.current = false;
      setExamStatus('in_progress');
    }
  }, [examId, questions, userAnswers, exam, timeLeft, examStatus]);

  // Handle exiting the exam and syncing with parent state
  const handleFinalExit = () => {
    if (onUpdateState && result) {
      onUpdateState(prev => ({
        ...prev,
        testHistory: [{
          id: `model-exam-${Date.now()}`,
          subjectId: 'MODEL_EXAM', 
          chapterId: examId,       
          score: result.score,
          total: questions.length,
          timeTakenSeconds: result.time_taken_seconds,
          date: Date.now(),
          questions: questions.map(q => ({ ...q, id: q.id })) as any,
          userAnswers: questions.map(q => userAnswers[q.id] ?? -1)
        }, ...(prev.testHistory || [])]
      }));
    }
    onClose();
  };

  useEffect(() => {
    if (examStatus === 'in_progress' && timeLeft > 0) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            submitExam(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [examStatus, submitExam]);

  const handleRetake = () => {
    if (examStatus === 'submitting') return;
    initializedRef.current = false;
    isSubmissionLocked.current = false;
    setCurrentIndex(0);
    setUserAnswers({});
    setResult(null);
    setExamStatus('not_started');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (examStatus === 'not_started' || (examStatus === 'submitting' && !result)) {
    return (
      <div className="fixed inset-0 z-[200] bg-brand-bg flex flex-col items-center justify-center p-6 text-center">
        <Loader2 size={40} className="animate-spin text-brand-primary mb-4" />
        <h2 className="font-black text-brand-text-p uppercase tracking-widest text-sm">
          {examStatus === 'submitting' ? 'Submitting Responses...' : 'Preparing Your Exam'}
        </h2>
        <p className="text-brand-text-s text-xs mt-2">Entering Secure Mode...</p>
      </div>
    );
  }

  if (examStatus === 'in_progress' && exam && questions.length > 0) {
    const q = questions[currentIndex];
    return (
      <div className="fixed inset-0 z-[200] bg-brand-bg overflow-y-auto pb-20">
        <header className="sticky top-0 z-50 bg-brand-surface border-b border-brand-text-s/10 p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
               <GraduationCap size={20} />
             </div>
             <div>
               <h3 className="text-xs font-black text-brand-text-p truncate max-w-[150px]">{exam.title}</h3>
               <p className="text-[10px] font-bold text-brand-text-s uppercase">Q {currentIndex + 1} of {questions.length}</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${timeLeft < 60 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-brand-bg border-brand-text-s/10'}`}>
              <Clock size={14} className={timeLeft < 60 ? 'animate-pulse' : ''} />
              <span className="text-sm font-black tabular-nums">{formatTime(timeLeft)}</span>
            </div>
            <button onClick={() => confirm("End exam and submit?") && submitExam()} className="px-4 py-2 bg-emerald-500 text-white font-black rounded-lg text-[10px] uppercase">Finish</button>
          </div>
        </header>

        <main className="max-w-2xl mx-auto p-4 mt-6">
          <div className="bg-brand-surface rounded-[2rem] p-8 border border-brand-text-s/10 shadow-sm space-y-8">
             <h2 className="text-lg font-black text-brand-text-p leading-tight">{q.question}</h2>
             <div className="grid grid-cols-1 gap-3">
                {q.options.map((opt, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setUserAnswers(prev => ({ ...prev, [q.id]: idx }))}
                    className={`flex items-center gap-4 px-5 py-4 rounded-xl border-2 transition-all text-left font-bold text-sm ${userAnswers[q.id] === idx ? 'bg-brand-primary border-brand-primary text-white' : 'bg-brand-bg border-transparent text-brand-text-s hover:bg-brand-bg/80'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${userAnswers[q.id] === idx ? 'bg-white/20 border-white' : 'bg-brand-surface border-brand-text-s/10'}`}>
                       {String.fromCharCode(65 + idx)}
                    </div>
                    {opt}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex justify-between items-center mt-8">
            <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(prev => prev - 1)} className="p-4 bg-brand-surface rounded-2xl disabled:opacity-20"><ChevronLeft /></button>
            <div className="flex gap-1 overflow-x-auto max-w-[150px] scrollbar-hide py-2">
              {questions.map((_, i) => (
                 <div key={i} className={`w-1.5 h-1.5 rounded-full shrink-0 ${i === currentIndex ? 'bg-brand-primary' : userAnswers[questions[i].id] !== undefined ? 'bg-brand-secondary' : 'bg-brand-text-s/20'}`} />
              ))}
            </div>
            <button onClick={() => currentIndex < questions.length - 1 ? setCurrentIndex(prev => prev + 1) : submitExam()} className="p-4 bg-brand-primary text-white rounded-2xl shadow-lg">
              {currentIndex === questions.length - 1 ? <CheckCircle2 /> : <ChevronRight />}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (examStatus === 'completed' && result) {
    return (
      <div className="fixed inset-0 z-[200] bg-brand-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-brand-surface p-8 rounded-[3rem] border border-brand-text-s/10 text-center shadow-2xl space-y-6">
           <div className="w-20 h-20 bg-emerald-500 text-white mx-auto rounded-full flex items-center justify-center shadow-xl">
             <CheckCircle2 size={40} />
           </div>
           <h2 className="text-2xl font-black text-brand-text-p">Exam Submitted!</h2>
           <div className="grid grid-cols-2 gap-3">
              <div className="bg-brand-bg p-4 rounded-2xl border border-brand-text-s/5">
                <p className="text-[10px] font-black text-brand-text-s uppercase tracking-widest mb-1">{t('সঠিক উত্তর', 'SCORE')}</p>
                <h3 className="text-2xl font-black text-brand-primary">{result.score} / {questions.length}</h3>
              </div>
              <div className="bg-brand-bg p-4 rounded-2xl border border-brand-text-s/5">
                <p className="text-[10px] font-black text-brand-text-s uppercase tracking-widest mb-1">{t('সময় লেগেছে', 'TIME')}</p>
                <h3 className="text-2xl font-black text-brand-text-p">{formatTime(result.time_taken_seconds)}</h3>
              </div>
           </div>
           <div className="space-y-2 text-left bg-brand-bg p-4 rounded-2xl">
             <div className="flex justify-between text-xs font-bold"><span>Correct:</span> <span className="text-emerald-500">{result.correct_count}</span></div>
             <div className="flex justify-between text-xs font-bold"><span>Wrong:</span> <span className="text-rose-500">{result.wrong_count}</span></div>
             <div className="flex justify-between text-xs font-bold"><span>Skipped:</span> <span className="text-brand-text-s">{result.skipped_count}</span></div>
           </div>
           
           <div className="grid grid-cols-1 gap-3">
              <button onClick={handleRetake} className="w-full py-4 bg-brand-bg text-brand-primary border border-brand-primary/20 font-black rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest text-xs hover:bg-brand-primary/5 transition-all">
                <RefreshCw size={16} /> Retake Exam
              </button>
           </div>
           <button onClick={handleFinalExit} className="w-full text-brand-text-s font-black uppercase text-[10px] mt-2">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return null;
};

export default ProExamSystem;
