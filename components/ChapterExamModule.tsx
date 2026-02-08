import React, { useState, useEffect, useCallback } from 'react';
import { Timer, Clock, CheckCircle2, X, ChevronRight, Loader2, Trophy, AlertCircle, GraduationCap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MCQ, UserState } from '../types';

interface ChapterExamModuleProps {
  context: {
    group: string;
    subject: string;
    paper: number;
    chapter: string;
  };
  onClose: () => void;
  userState: UserState;
}

const ChapterExamModule: React.FC<ChapterExamModuleProps> = ({ context, onClose, userState }) => {
  const [questions, setQuestions] = useState<MCQ[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(1200); // 20 mins default
  const [status, setStatus] = useState<'loading' | 'active' | 'finished'>('loading');
  const [result, setResult] = useState<any>(null);

  const fetchQuestions = useCallback(async () => {
    const { data, error } = await supabase
      .from('chapter_mcq_bank')
      .select('*')
      .eq('group_name', context.group)
      .eq('subject_name', context.subject)
      .eq('paper', context.paper)
      .eq('chapter_name', context.chapter)
      .limit(25); // Standard chapter test size

    if (error || !data || data.length === 0) {
      alert("No questions found for this chapter yet!");
      return onClose();
    }

    const formatted: MCQ[] = data.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correct_index: q.correct_index,
      explanation: q.explanation
    })).sort(() => Math.random() - 0.5);

    setQuestions(formatted);
    setStatus('active');
  }, [context, onClose]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    if (status === 'active' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && status === 'active') {
      submitExam();
    }
  }, [timeLeft, status]);

  const submitExam = async () => {
    setStatus('loading');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let correct = 0;
    let skipped = 0;
    questions.forEach((q) => {
      if (answers[q.id] === undefined) skipped++;
      else if (answers[q.id] === q.correct_index) correct++;
    });

    const wrong = questions.length - correct - skipped;
    const timeTaken = 1200 - timeLeft;

    const submission = {
      user_id: user.id,
      group_name: context.group,
      subject_name: context.subject,
      paper: context.paper,
      chapter_name: context.chapter,
      score: correct,
      total_questions: questions.length,
      correct_count: correct,
      wrong_count: wrong,
      skipped_count: skipped,
      time_taken_seconds: timeTaken
    };

    const { data, error } = await supabase.from('chapter_exam_attempts').insert(submission).select().single();
    
    if (error) {
      console.error(error);
      alert("Error saving result.");
    }

    setResult(data);
    setStatus('finished');
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (status === 'loading') return (
    <div className="fixed inset-0 z-[300] bg-brand-bg flex items-center justify-center">
      <Loader2 className="animate-spin text-brand-primary" size={40} />
    </div>
  );

  if (status === 'finished') return (
    <div className="fixed inset-0 z-[300] bg-brand-bg overflow-y-auto p-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-brand-surface p-8 rounded-[3rem] border border-brand-text-s/10 shadow-2xl text-center space-y-6">
        <Trophy size={60} className="mx-auto text-brand-primary" />
        <h2 className="text-2xl font-black">{context.chapter} Results</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-brand-bg p-4 rounded-2xl">
            <p className="text-[10px] font-black uppercase text-brand-text-s">Score</p>
            <p className="text-2xl font-black text-brand-primary">{result?.score} / {questions.length}</p>
          </div>
          <div className="bg-brand-bg p-4 rounded-2xl">
            <p className="text-[10px] font-black uppercase text-brand-text-s">Time</p>
            <p className="text-2xl font-black text-brand-text-p">{formatTime(result?.time_taken_seconds || 0)}</p>
          </div>
        </div>
        <button onClick={onClose} className="w-full py-4 bg-brand-primary text-white font-black rounded-2xl uppercase tracking-widest text-xs">Back to Syllabus</button>
      </div>
    </div>
  );

  const q = questions[currentIndex];

  return (
    <div className="fixed inset-0 z-[300] bg-brand-bg flex flex-col">
      <header className="bg-brand-surface p-6 border-b border-brand-text-s/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
            <GraduationCap size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black truncate max-w-[200px]">{context.chapter}</h3>
            <p className="text-[10px] font-bold text-brand-text-s uppercase">Attempt {currentIndex + 1} / {questions.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${timeLeft < 120 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-brand-bg border-brand-text-s/10'}`}>
            <Clock size={16} />
            <span className="text-sm font-black tabular-nums">{formatTime(timeLeft)}</span>
          </div>
          <button onClick={() => confirm("End exam?") && submitExam()} className="text-[10px] font-black uppercase text-brand-text-s">Exit</button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <h2 className="text-xl md:text-2xl font-black leading-tight">{q.question}</h2>
          <div className="grid gap-3">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => setAnswers({ ...answers, [q.id]: idx })}
                className={`p-5 rounded-2xl border-2 text-left font-bold text-sm transition-all flex items-center gap-4 ${answers[q.id] === idx ? 'bg-brand-primary border-brand-primary text-white shadow-lg' : 'bg-brand-surface border-transparent hover:bg-brand-surface/80'}`}
              >
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${answers[q.id] === idx ? 'bg-white/20 border-white' : 'bg-brand-bg border-brand-text-s/10'}`}>
                  {String.fromCharCode(65 + idx)}
                </div>
                {opt}
              </button>
            ))}
          </div>
        </div>
      </main>

      <footer className="p-6 bg-brand-surface border-t border-brand-text-s/10 flex items-center justify-between">
        <button 
          disabled={currentIndex === 0} 
          onClick={() => setCurrentIndex(prev => prev - 1)}
          className="px-6 py-3 font-black text-xs uppercase tracking-widest text-brand-text-s disabled:opacity-20"
        >
          Previous
        </button>
        <button 
          onClick={() => currentIndex < questions.length - 1 ? setCurrentIndex(prev => prev + 1) : submitExam()}
          className="px-10 py-4 bg-brand-primary text-white font-black rounded-2xl shadow-xl shadow-brand-primary/20 flex items-center gap-2 text-xs uppercase tracking-widest transition-all active:scale-95"
        >
          {currentIndex === questions.length - 1 ? 'Submit' : 'Next'} <ChevronRight size={16} />
        </button>
      </footer>
    </div>
  );
};

export default ChapterExamModule;