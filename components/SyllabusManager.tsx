import React, { useState, useRef } from 'react';
import { UserState, Subject, Chapter, Difficulty } from '../types';
import { 
  Camera, Plus, Trash2, CheckCircle2, 
  Loader2, X, GraduationCap, PlayCircle
} from 'lucide-react';
import ChapterExamModule from './ChapterExamModule';

interface SyllabusManagerProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
  onTriggerTest: (subjectId: string, chapterId: string) => void;
}

const SyllabusManager: React.FC<SyllabusManagerProps> = ({ userState, onUpdateState, onTriggerTest }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [activeQuizContext, setActiveQuizContext] = useState<{
    group: string;
    subject: string;
    paper: number;
    chapter: string;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [manualSubject, setManualSubject] = useState({ name: '', paper: 1, chapters: '' });
  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  const handleManualAdd = () => {
    if (!manualSubject.name || !manualSubject.chapters) return;
    const chapters: Chapter[] = manualSubject.chapters
      .split('\n')
      .filter(line => line.trim())
      .map((name, idx) => ({
        id: `manual-ch-${Date.now()}-${idx}`,
        name: name.trim(),
        isCompleted: false
      }));
    
    const newSubject: Subject = {
      id: `manual-sub-${Date.now()}`,
      name: manualSubject.name,
      paper: manualSubject.paper as 1 | 2,
      chapters
    };

    onUpdateState((prev: UserState) => ({
      ...prev,
      subjects: [...(prev.subjects || []), newSubject]
    }));

    setManualSubject({ name: '', paper: 1, chapters: '' });
    setShowManualAdd(false);
  };

  const deleteSubject = (id: string) => {
    if (confirm(t("তুমি কি নিশ্চিত?", "Are you sure?"))) {
      onUpdateState((prev: UserState) => ({
        ...prev,
        subjects: prev.subjects.filter((s: Subject) => s.id !== id)
      }));
    }
  };

  const toggleAllChapters = (subjectId: string, completed: boolean) => {
    onUpdateState((prev: UserState) => ({
      ...prev,
      subjects: prev.subjects.map((s: Subject) => s.id === subjectId ? {
        ...s,
        chapters: s.chapters.map((c: Chapter) => ({ ...c, isCompleted: completed }))
      } : s)
    }));
  };

  const startChapterQuiz = (subject: Subject, chapter: Chapter) => {
    setActiveQuizContext({
      group: userState.profile?.group || 'Science',
      subject: subject.name,
      paper: subject.paper,
      chapter: chapter.name
    });
  };

  const subjects = Array.isArray(userState.subjects) ? userState.subjects : [];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-20">
      {/* Chapter Quiz Modal Overlay */}
      {activeQuizContext && (
        <ChapterExamModule 
          context={activeQuizContext} 
          onClose={() => setActiveQuizContext(null)} 
          userState={userState} 
        />
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">{t('সিলেবাস গাইড', 'Syllabus Guide')}</h2>
          <p className="text-slate-500 font-medium text-xs md:text-sm mt-1">{t('তোমার NCTB সিলেবাস ম্যানেজ করো।', 'Manage your NCTB syllabus.')}</p>
        </div>
        
        <div className="flex flex-wrap gap-2 md:gap-3">
          <button onClick={() => setShowManualAdd(!showManualAdd)} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all ${showManualAdd ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}>
            <Plus size={16} />
            {t('ম্যানুয়াল অ্যাড', 'Manual Add')}
          </button>
        </div>
      </div>

      {showManualAdd && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-dashed border-emerald-200 dark:border-emerald-800 animate-in zoom-in-95 duration-300 relative">
          <button onClick={() => setShowManualAdd(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500"><X size={20}/></button>
          <div className="mb-8">
            <h3 className="font-black text-xl flex items-center gap-3"><Plus className="text-emerald-500" />{t('নতুন বিষয় যোগ করো', 'Add New Subject')}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            <input type="text" value={manualSubject.name} onChange={e => setManualSubject({...manualSubject, name: e.target.value})} placeholder="Subject Name" className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-bold outline-none" />
            <select value={manualSubject.paper} onChange={e => setManualSubject({...manualSubject, paper: parseInt(e.target.value)})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-bold outline-none">
              <option value={1}>1st Paper</option>
              <option value={2}>2nd Paper</option>
            </select>
          </div>
          <textarea value={manualSubject.chapters} onChange={e => setManualSubject({...manualSubject, chapters: e.target.value})} placeholder="Chapters (One per line)" className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-bold min-h-[120px] outline-none mb-6" />
          <button onClick={handleManualAdd} className="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-xl uppercase tracking-widest text-xs">{t('সেভ করো', 'Save Subject')}</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        {subjects.map((sub: Subject) => (
          <div key={sub.id} className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center text-white font-black text-xl">{sub.name[0]}</div>
                <div>
                  <h3 className="text-2xl font-black">{sub.name}</h3>
                  <span className="text-[10px] font-black uppercase text-brand-text-s tracking-widest">{t('পত্র', 'Paper')} {sub.paper}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleAllChapters(sub.id, true)} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest">{t('সব শেষ', 'All Done')}</button>
                <button onClick={() => deleteSubject(sub.id)} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 size={18} /></button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sub.chapters.map((ch: Chapter) => (
                <div key={ch.id} className={`p-5 rounded-[2.5rem] border transition-all flex flex-col gap-4 ${ch.isCompleted ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-transparent shadow-sm'}`}>
                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      checked={ch.isCompleted} 
                      onChange={() => {
                        onUpdateState((prev: UserState) => ({
                          ...prev,
                          subjects: prev.subjects.map((s: Subject) => s.id === sub.id ? {
                            ...s, chapters: s.chapters.map((c: Chapter) => c.id === ch.id ? {...c, isCompleted: !c.isCompleted} : c)
                          } : s)
                        }));
                      }} 
                      className="w-5 h-5 accent-emerald-500 rounded-lg cursor-pointer mt-0.5" 
                    />
                    <span className={`text-sm font-bold flex-1 ${ch.isCompleted ? 'line-through text-emerald-600' : 'text-slate-600'}`}>{ch.name}</span>
                  </div>
                  
                  <button 
                    onClick={() => startChapterQuiz(sub, ch)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-brand-bg rounded-xl text-brand-primary border border-brand-primary/10 hover:bg-brand-primary hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    <GraduationCap size={14} />
                    {t('কুইজ শুরু করো', 'Start Quiz')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SyllabusManager;