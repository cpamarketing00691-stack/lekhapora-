import React, { useState } from 'react';
import { useLekhapora } from '../contexts/LekhaporaContext';
import { GraduationCap, BookOpen, Clock, ChevronRight, History, Trophy } from 'lucide-react';

const ExamsPanel: React.FC = () => {
  const { state } = useLekhapora();
  const t = (bn: string, en: string) => state.settings.language === 'bn' ? bn : en;

  const demoExams = [
    { id: 'phy1', title: 'Physics 1st Paper Mock', q: 25, time: 30, diff: 'Medium' },
    { id: 'chem1', title: 'Chemistry 1st Paper Mock', q: 25, time: 30, diff: 'Hard' },
    { id: 'bio1', title: 'Biology 1st Paper Mock', q: 25, time: 25, diff: 'Easy' }
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <header>
        <h2 className="text-4xl font-black tracking-tighter italic uppercase">{t('টেস্ট সেন্টার', 'Exam Hub')}</h2>
        <p className="text-brand-text-s font-medium mt-1">{t('বোর্ড স্ট্যান্ডার্ড প্রশ্নে নিজের দক্ষতা যাচাই করো।', 'Verify your skills with board-standard question patterns.')}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {demoExams.map(exam => (
          <div key={exam.id} className="bg-brand-surface p-8 rounded-[3rem] border border-brand-text-s/10 shadow-sm group hover:border-brand-primary transition-all flex flex-col justify-between h-80">
            <div className="space-y-6">
               <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
                  <GraduationCap size={28} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-brand-text-p">{exam.title}</h3>
                  <div className="flex gap-4 mt-2">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-brand-text-s uppercase"><Clock size={12}/> {exam.time}m</span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-brand-text-s uppercase"><BookOpen size={12}/> {exam.q} Qs</span>
                  </div>
               </div>
            </div>
            <button className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-primary/20 active:scale-95 transition-all">
              {t('শুরু করো', 'Start Test')}
            </button>
          </div>
        ))}
      </div>

      <section className="bg-brand-surface rounded-[3rem] p-10 border border-brand-text-s/10 shadow-sm">
        <h3 className="text-xl font-black flex items-center gap-3 mb-10"><History className="text-brand-primary"/> {t('পরীক্ষার ইতিহাস', 'History')}</h3>
        {state.testHistory.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.testHistory.map(test => (
              <div key={test.id} className="p-6 bg-brand-bg rounded-3xl border border-brand-text-s/5">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black text-brand-text-s uppercase tracking-widest">{new Date(test.date).toLocaleDateString()}</span>
                  <span className="text-sm font-black text-brand-primary">{Math.round((test.score / test.total) * 100)}%</span>
                </div>
                <p className="text-xs font-black text-brand-text-p uppercase truncate">{test.subjectId}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
            <Trophy size={48} />
            <p className="font-black uppercase text-[10px] tracking-widest">{t('এখনো কোনো টেস্ট দেওয়া হয়নি', 'No tests taken yet')}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default ExamsPanel;