import React, { useState } from 'react';
import { UserState } from '../types';
import TestSection from '../components/TestSection';
import ProExamSystem from '../components/ProExamSystem';
import { GraduationCap, BookOpen, Clock, ChevronRight, History, Sparkles } from 'lucide-react';

interface ExamsPanelProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const ExamsPanel: React.FC<ExamsPanelProps> = ({ userState, onUpdateState }) => {
  const [activeMode, setActiveMode] = useState<'hub' | 'practice' | 'pro'>('hub');
  const [selectedProExamId, setSelectedProExamId] = useState<string | null>(null);

  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  const examCatalog = [
    { id: 'hsc-physics-1', title: 'HSC Physics 1st Paper Mock', duration: 45, questions: 25, difficulty: 'Hard' },
    { id: 'hsc-chemistry-1', title: 'HSC Chemistry 1st Paper Mock', duration: 45, questions: 25, difficulty: 'Medium' },
    { id: 'hsc-ict-full', title: 'ICT Comprehensive Test', duration: 30, questions: 20, difficulty: 'Easy' },
  ];

  if (activeMode === 'practice') {
    return (
      <div className="animate-in fade-in duration-500">
        <button onClick={() => setActiveMode('hub')} className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase text-brand-text-s hover:text-brand-primary transition-colors">
          <ChevronRight className="rotate-180" size={14} /> {t('হাবে ফিরে যাও', 'Back to Exam Hub')}
        </button>
        <TestSection userState={userState} onUpdateState={onUpdateState} initialContext={null} clearContext={() => {}} />
      </div>
    );
  }

  if (activeMode === 'pro' && selectedProExamId) {
    return <ProExamSystem examId={selectedProExamId} onClose={() => { setActiveMode('hub'); setSelectedProExamId(null); }} onUpdateState={onUpdateState} language={userState.language} />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h2 className="text-4xl font-black tracking-tighter leading-none mb-2 italic">{t('টেস্ট ও অ্যাসেসমেন্ট', 'EXAM HUB.')}</h2>
           <p className="text-brand-text-s font-medium text-sm tracking-tight">{t('বোর্ড স্ট্যান্ডার্ড প্রশ্নে তোমার দক্ষতা যাচাই করো।', 'Standardized assessments for NCTB excellence.')}</p>
        </div>
        <div className="flex gap-3">
           <div className="px-6 py-3 bg-brand-primary/10 text-brand-primary rounded-2xl border border-brand-primary/20 flex items-center gap-3">
             <Sparkles size={18} className="animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest">{t('এআই এনালাইটিক্স', 'AI Powered')}</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {/* Practice Mode Card */}
         <section onClick={() => setActiveMode('practice')} className="bg-brand-surface p-10 rounded-[3.5rem] border border-brand-text-s/10 shadow-sm cursor-pointer group hover:border-brand-primary transition-all relative overflow-hidden">
            <BookOpen size={150} className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity rotate-12" />
            <div className="relative z-10 space-y-6">
               <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform shadow-inner">
                  <BookOpen size={32} />
               </div>
               <div>
                  <h3 className="text-2xl font-black text-brand-text-p uppercase tracking-tight">{t('চ্যাপ্টার প্র্যাকটিস', 'Quick Practice')}</h3>
                  <p className="text-brand-text-s font-medium text-sm leading-relaxed mt-2">{t('নির্দিষ্ট অধ্যায়ের ওপর ছোট কুইজ দিয়ে তোমার দুর্বলতা খুঁজে বের করো।', 'Target specific chapters with focused MCQ drills to plug knowledge gaps.')}</p>
               </div>
               <div className="flex items-center gap-3 text-brand-primary font-black text-xs uppercase tracking-widest">
                  {t('শুরু করো', 'Start Drills')} <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
               </div>
            </div>
         </section>

         {/* Model Exam Section */}
         <section className="bg-brand-surface p-10 rounded-[3.5rem] border border-brand-text-s/10 shadow-sm space-y-8">
            <div className="flex items-center justify-between mb-2">
               <h3 className="text-xl font-black flex items-center gap-3"><GraduationCap className="text-indigo-500"/> {t('বোর্ড মডেল টেস্ট', 'Model Exams')}</h3>
               <span className="text-[9px] font-black bg-indigo-500 text-white px-3 py-1 rounded-full uppercase">Professional</span>
            </div>
            
            <div className="space-y-4">
               {examCatalog.map(exam => (
                 <div key={exam.id} className="p-5 bg-brand-bg rounded-3xl border border-transparent hover:border-indigo-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                       <div className="min-w-0">
                          <p className="text-sm font-black text-brand-text-p truncate pr-4">{exam.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                             <span className="flex items-center gap-1 text-[9px] font-bold text-brand-text-s uppercase"><Clock size={10}/> {exam.duration}m</span>
                             <span className="flex items-center gap-1 text-[9px] font-bold text-brand-text-s uppercase"><BookOpen size={10}/> {exam.questions} Qs</span>
                             <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${exam.difficulty === 'Hard' ? 'bg-rose-500/10 text-rose-600' : 'bg-brand-primary/10 text-brand-primary'}`}>{exam.difficulty}</span>
                          </div>
                       </div>
                       <button 
                         onClick={() => { setSelectedProExamId(exam.id); setActiveMode('pro'); }}
                         className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                       >
                         Enter
                       </button>
                    </div>
                 </div>
               ))}
            </div>
         </section>
      </div>

      {/* History Area */}
      <section className="bg-brand-surface p-10 rounded-[3.5rem] border border-brand-text-s/10 shadow-sm">
         <div className="flex items-center justify-between mb-10 px-2">
            <h3 className="text-xl font-black flex items-center gap-3"><History className="text-brand-primary"/> {t('পরীক্ষার ইতিহাস', 'Performance History')}</h3>
         </div>
         
         {userState.testHistory.length > 0 ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {userState.testHistory.slice(0, 6).map(attempt => (
                 <div key={attempt.id} className="p-6 bg-brand-bg/50 rounded-3xl border border-brand-text-s/5 group hover:border-brand-primary transition-all">
                    <div className="flex justify-between items-start mb-4">
                       <span className="text-[9px] font-black text-brand-text-s uppercase tracking-widest">{new Date(attempt.date).toLocaleDateString()}</span>
                       <span className="text-sm font-black text-brand-primary">{Math.round((attempt.score / attempt.total) * 100)}%</span>
                    </div>
                    <p className="text-xs font-black text-brand-text-p uppercase tracking-tight truncate">{attempt.subjectId}</p>
                    <div className="h-1 w-full bg-brand-surface rounded-full mt-4 overflow-hidden">
                       <div className="h-full bg-brand-primary" style={{ width: `${(attempt.score / attempt.total) * 100}%` }} />
                    </div>
                 </div>
              ))}
           </div>
         ) : (
           <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
              <History size={48} />
              <p className="text-[10px] font-black uppercase tracking-widest">{t('এখনো কোনো পরীক্ষা দেওয়া হয়নি', 'No exam logs found')}</p>
           </div>
         )}
      </section>
    </div>
  );
};

export default ExamsPanel;