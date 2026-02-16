import React, { useState } from 'react';
import { useLekhapora } from '../contexts/LekhaporaContext';
import { Subject, Chapter } from '../types';
import { CheckCircle2, Circle, Clock, Plus, Trash2, BookOpen, ChevronRight } from 'lucide-react';

const SyllabusPanel: React.FC = () => {
  const { state, dispatch } = useLekhapora();
  const t = (bn: string, en: string) => state.settings.language === 'bn' ? bn : en;

  const cycleStatus = (subjectId: string, chapterId: string) => {
    dispatch({ type: 'TOGGLE_CHAPTER', payload: { subjectId, chapterId } });
  };

  const getStatusIcon = (status?: string) => {
    if (status === 'completed') return <CheckCircle2 className="text-emerald-500" size={20} />;
    if (status === 'in-progress') return <Clock className="text-orange-500 animate-pulse" size={20} />;
    return <Circle className="text-brand-text-s/30" size={20} />;
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter italic uppercase">{t('সিলেবাস ট্র্যাকার', 'Syllabus Tracker')}</h2>
          <p className="text-brand-text-s font-medium mt-1">{t('NCTB কারিকুলাম অনুযায়ী তোমার প্রগতি ট্র্যাক করো।', 'Monitor your progress following the NCTB curriculum.')}</p>
        </div>
        <button className="px-8 py-4 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-primary/20 flex items-center gap-2">
          <Plus size={16} /> {t('নতুন বিষয়', 'Add Subject')}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {state.subjects.map(sub => {
          const done = sub.chapters?.filter(c => c.isCompleted).length || 0;
          const total = sub.chapters?.length || 0;
          const perc = total > 0 ? Math.round((done / total) * 100) : 0;

          return (
            <div key={sub.id} className="bg-brand-surface rounded-[3rem] p-8 border border-brand-text-s/10 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary font-black shadow-inner">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-brand-text-p">{sub.name}</h3>
                    <p className="text-[10px] font-bold text-brand-text-s uppercase">{t('পত্র', 'Paper')} {sub.paper}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-brand-primary">{perc}%</p>
                  <p className="text-[9px] font-bold text-brand-text-s uppercase">{done}/{total} {t('অধ্যায়', 'Done')}</p>
                </div>
              </div>

              <div className="space-y-2">
                {sub.chapters.map(ch => (
                  <button 
                    key={ch.id}
                    onClick={() => cycleStatus(sub.id, ch.id)}
                    className="w-full flex items-center gap-4 p-4 bg-brand-bg/50 rounded-2xl border border-transparent hover:border-brand-primary/20 transition-all text-left group"
                  >
                    <div className="shrink-0 group-active:scale-90 transition-transform">
                      {getStatusIcon(ch.status || (ch.isCompleted ? 'completed' : 'not-started'))}
                    </div>
                    <span className={`text-sm font-bold flex-1 ${ch.isCompleted ? 'text-brand-text-s line-through' : 'text-brand-text-p'}`}>{ch.name}</span>
                    <ChevronRight size={14} className="text-brand-text-s opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SyllabusPanel;