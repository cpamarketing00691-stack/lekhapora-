
import React, { useState } from 'react';
import { UserState, Subject, Chapter } from '../types';
import { Plus, Trash2, GraduationCap, X, CheckCircle2 } from 'lucide-react';

interface SyllabusPanelProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const SyllabusPanel: React.FC<SyllabusPanelProps> = ({ userState, onUpdateState }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newSub, setNewSub] = useState({ name: '', paper: 1 as 1 | 2, chapters: '' });
  
  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  const handleAdd = () => {
    if (!newSub.name || !newSub.chapters) return;
    const chapters: Chapter[] = newSub.chapters.split('\n').filter(l => l.trim()).map((n, i) => ({
      id: `manual-ch-${Date.now()}-${i}`,
      name: n.trim(),
      isCompleted: false
    }));
    
    const s: Subject = {
      id: `sub-${Date.now()}`,
      name: newSub.name,
      paper: newSub.paper,
      chapters
    };

    onUpdateState(prev => ({ ...prev, subjects: [...prev.subjects, s] }));
    setNewSub({ name: '', paper: 1, chapters: '' });
    setShowAdd(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h2 className="text-4xl font-black tracking-tighter leading-none mb-2">{t('সিলেবাস মাস্টার', 'Syllabus Master')}</h2>
           <p className="text-brand-text-s font-medium text-sm tracking-tight">{t('তোমার একাডেমিক অগ্রগতির পূর্ণাঙ্গ ম্যাপ।', 'Complete map of your academic progress.')}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-8 py-4 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-primary/20 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">
          <Plus size={20}/> {t('নতুন বিষয়', 'Add Subject')}
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
           <div className="w-full max-w-xl bg-brand-surface p-10 rounded-[3.5rem] shadow-2xl space-y-6 border border-brand-text-s/10 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-brand-text-p uppercase tracking-widest">{t('ম্যানুয়াল অ্যাড', 'Add New Subject')}</h3>
                <button onClick={() => setShowAdd(false)} className="p-2 text-brand-text-s hover:text-rose-500"><X size={24}/></button>
              </div>
              <div className="space-y-4">
                 <input 
                   placeholder={t("বিষয়ের নাম", "Subject Name")}
                   value={newSub.name}
                   onChange={e => setNewSub({...newSub, name: e.target.value})}
                   className="w-full px-6 py-4 bg-brand-bg rounded-2xl outline-none font-bold text-sm"
                 />
                 <select 
                   value={newSub.paper}
                   onChange={e => setNewSub({...newSub, paper: parseInt(e.target.value) as 1 | 2})}
                   className="w-full px-6 py-4 bg-brand-bg rounded-2xl outline-none font-bold text-sm"
                 >
                   <option value={1}>1st Paper</option>
                   <option value={2}>2nd Paper</option>
                 </select>
                 <textarea 
                   placeholder={t("অধ্যায়সমূহ (প্রতি লাইনে একটি)", "Chapters (One per line)")}
                   value={newSub.chapters}
                   onChange={e => setNewSub({...newSub, chapters: e.target.value})}
                   className="w-full h-40 px-6 py-4 bg-brand-bg rounded-2xl outline-none font-bold text-sm resize-none"
                 />
                 <button onClick={handleAdd} className="w-full py-5 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-primary/20">{t('সেভ করো', 'Confirm Add')}</button>
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        {userState.subjects.map(sub => (
          <div key={sub.id} className="bg-brand-surface p-10 rounded-[3.5rem] border border-brand-text-s/10 shadow-sm space-y-10">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 bg-brand-primary rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-lg rotate-3">{sub.name[0]}</div>
                   <div>
                      <h3 className="text-2xl font-black text-brand-text-p">{sub.name}</h3>
                      <p className="text-[10px] font-black uppercase text-brand-text-s tracking-widest">{t('পত্র', 'Paper')} {sub.paper}</p>
                   </div>
                </div>
                <button onClick={() => onUpdateState(prev => ({ ...prev, subjects: prev.subjects.filter(s => s.id !== sub.id) }))} className="p-3 text-brand-text-s hover:text-rose-500 transition-colors"><Trash2/></button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sub.chapters.map(ch => (
                  <div key={ch.id} className={`p-6 rounded-[2rem] border transition-all flex items-start gap-4 ${ch.isCompleted ? 'bg-brand-bg border-emerald-500/20' : 'bg-brand-bg/50 border-transparent shadow-sm'}`}>
                     <button 
                       onClick={() => onUpdateState(prev => ({
                         ...prev,
                         subjects: prev.subjects.map(s => s.id === sub.id ? {
                           ...s, chapters: s.chapters.map(c => c.id === ch.id ? {...c, isCompleted: !c.isCompleted} : c)
                         } : s)
                       }))}
                       className={`mt-0.5 transition-all ${ch.isCompleted ? 'text-emerald-500' : 'text-brand-text-s opacity-30'}`}
                     >
                       <CheckCircle2 size={24}/>
                     </button>
                     <div className="min-w-0">
                        <p className={`text-xs font-black leading-tight ${ch.isCompleted ? 'line-through opacity-50' : 'text-brand-text-p'}`}>{ch.name}</p>
                        {ch.testScore !== undefined && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-brand-primary/10 rounded-lg text-[8px] font-black text-brand-primary uppercase tracking-tighter">
                            <GraduationCap size={10}/> Score: {ch.testScore}/30
                          </div>
                        )}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SyllabusPanel;
