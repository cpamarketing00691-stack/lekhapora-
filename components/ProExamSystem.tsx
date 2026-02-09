import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Timer, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Clock, Check, X, GraduationCap, Loader2, Sparkles, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserState, TestAttempt, MCQ } from '../types';

interface ProExamProps {
  examId: string;
  onClose: () => void;
  onUpdateState?: React.Dispatch<React.SetStateAction<UserState>>;
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

const ProExamSystem: React.FC<ProExamProps> = ({ examId, onClose, onUpdateState }) => {
  const [view, setView] = useState<'loading' | 'exam' | 'result' | 'leaderboard'>('loading');
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const fetchExamData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return onClose();

      // Fetch Exam and Questions
      const [examRes, questionsRes] = await Promise.all([
        supabase.from('exam_sys_exams').select('*').eq('id', examId).single(),
        supabase.from('exam_sys_questions').select('*').eq('exam_id', examId).order('order_index')
      ]);

      if (examRes.error || questionsRes.error) throw new Error("Failed to load exam data");

      setExam(examRes.data);
      setQuestions(questionsRes.data);

      // Session Tracking & Sync - Start fresh for every entry
      const { data: session } = await supabase
        .from('exam_sys_sessions')
        .upsert({ 
          user_id: user.id, 
          exam_id: examId,
          started_at: new Date().toISOString() // Force a fresh start time
        }, { onConflict: 'user_id,exam_id' })
        .select()
        .single();

      setTimeLeft(examRes.data.duration_minutes * 60);
      setView('exam');
    } catch (err) {
      console.error(err);
      onClose();
    }
  }, [examId, onClose]);

  useEffect(() => {
    fetchExamData();
  }, [fetchExamData]);

  const submitExam = async (isAuto = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Auth required");

      const correctCount = questions.reduce((acc, q) => {
        return userAnswers[q.id] === q.correct_index ? acc + 1 : acc;
      }, 0);

      const skippedCount = questions.filter(q => userAnswers[q.id] === undefined).length;
      const wrongCount = questions.length - correctCount - skippedCount;
      const duration = (exam!.duration_minutes * 60) - timeLeft;

      const submission = {
        user_id: user.id,
        exam_id: examId,
        score: correctCount,
        correct_count: correctCount,
        wrong_count: wrongCount,
        skipped_count: skippedCount,
        time_taken_seconds: duration
      };

      // 1. Save to global Supabase results
      const { data, error } = await supabase.from('exam_sys_submissions').insert(submission).select().single();
      if (error) throw error;

      // 2. Add to local history so it shows up in "History" tab
      if (onUpdateState) {
        const historyEntry: TestAttempt = {
          id: `model-exam-${Date.now()}`,
          subjectId: 'MODEL_EXAM', // Identifier for model exam entries
          chapterId: examId,       // Reference back to this exam
          score: correctCount,
          total: questions.length,
          timeTakenSeconds: duration,
          date: Date.now(),
          questions: questions.map(q => ({
            id: q.id,
            question: q.question,
            options: q.options,
            correct_index: q.correct_index,
            explanation: q.explanation
          })) as any,
          userAnswers: questions.map(q => userAnswers[q.id] ?? -1)
        };

        onUpdateState(prev => ({
          ...prev,
          testHistory: [historyEntry, ...(prev.testHistory || [])]
        }));
      }

      // 3. Clean up session for a clean restart later
      await supabase.from('exam_sys_sessions').delete().eq('user_id', user.id).eq('exam_id', examId);

      setResult(data);
      setView('result');
    } catch (err) {
      console.error(err);
      alert("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (view === 'exam' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            submitExam(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [view, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (view === 'loading') {
    return (
      <div className="fixed inset-0 z-[200] bg-brand-bg flex flex-col items-center justify-center p-6 text-center">
        <Loader2 size={40} className="animate-spin text-brand-primary mb-4" />
        <h2 className="font-black text-brand-text-p uppercase tracking-widest text-sm">Preparing Your Exam</h2>
        <p className="text-brand-text-s text-xs mt-2">Entering Secure Mode...</p>
      </div>
    );
  }

  if (view === 'exam' && exam && questions.length > 0) {
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

  if (view === 'result' && result) {
    return (
      <div className="fixed inset-0 z-[200] bg-brand-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-brand-surface p-8 rounded-[3rem] border border-brand-text-s/10 text-center shadow-2xl space-y-6">
           <div className="w-20 h-20 bg-emerald-500 text-white mx-auto rounded-full flex items-center justify-center shadow-xl">
             <CheckCircle2 size={40} />
           </div>
           <h2 className="text-2xl font-black text-brand-text-p">Exam Submitted!</h2>
           <div className="grid grid-cols-2 gap-3">
              <div className="bg-brand-bg p-4 rounded-2xl border border-brand-text-s/5">
                <p className="text-[10px] font-black text-brand-text-s uppercase">Score</p>
                <h3 className="text-2xl font-black text-brand-primary">{result.score} / {questions.length}</h3>
              </div>
              <div className="bg-brand-bg p-4 rounded-2xl border border-brand-text-s/5">
                <p className="text-[10px] font-black text-brand-text-s uppercase">Accuracy</p>
                <h3 className="text-2xl font-black text-brand-text-p">{Math.round((result.correct_count / questions.length) * 100)}%</h3>
              </div>
           </div>
           <div className="space-y-2 text-left bg-brand-bg p-4 rounded-2xl">
             <div className="flex justify-between text-xs font-bold"><span>Correct:</span> <span className="text-emerald-500">{result.correct_count}</span></div>
             <div className="flex justify-between text-xs font-bold"><span>Wrong:</span> <span className="text-rose-500">{result.wrong_count}</span></div>
             <div className="flex justify-between text-xs font-bold"><span>Skipped:</span> <span className="text-brand-text-s">{result.skipped_count}</span></div>
           </div>
           <button onClick={() => setView('leaderboard')} className="w-full py-4 bg-brand-primary text-white font-black rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
             <Trophy size={16} /> View Leaderboard
           </button>
           <button onClick={onClose} className="w-full text-brand-text-s font-black uppercase text-[10px]">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  if (view === 'leaderboard') {
    return <Leaderboard examId={examId} onClose={onClose} />;
  }

  return null;
};

const Leaderboard: React.FC<{ examId: string; onClose: () => void }> = ({ examId, onClose }) => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('exam_sys_submissions')
      .select('score, time_taken_seconds, submitted_at, user_id')
      .eq('exam_id', examId)
      .order('score', { ascending: false })
      .order('time_taken_seconds', { ascending: true })
      .limit(10)
      .then(({ data }) => {
        setEntries(data || []);
        setLoading(false);
      });
  }, [examId]);

  return (
    <div className="fixed inset-0 z-[200] bg-brand-bg p-4 sm:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl bg-brand-surface rounded-[3rem] border border-brand-text-s/10 shadow-2xl flex flex-col max-h-[80vh]">
         <div className="p-8 border-b border-brand-text-s/10 flex items-center justify-between">
            <h2 className="text-xl font-black text-brand-text-p flex items-center gap-3"><Trophy className="text-brand-primary" /> Leaderboard</h2>
            <button onClick={onClose} className="text-brand-text-s font-bold text-xs uppercase">Close</button>
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-2">
           {loading ? <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-brand-primary" /></div> : entries.map((entry, idx) => (
             <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl ${idx === 0 ? 'bg-brand-primary/10 border border-brand-primary/20' : 'bg-brand-bg'}`}>
               <div className="flex items-center gap-4">
                 <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-brand-primary text-white' : 'bg-brand-surface text-brand-text-s'}`}>{idx + 1}</span>
                 <span className="font-bold text-sm text-brand-text-p">Student ID: {entry.user_id.slice(0, 8)}...</span>
               </div>
               <div className="text-right">
                 <p className="font-black text-brand-primary">{entry.score} Marks</p>
                 <p className="text-[10px] font-bold text-brand-text-s uppercase">{entry.time_taken_seconds}s Taken</p>
               </div>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
};

export default ProExamSystem;