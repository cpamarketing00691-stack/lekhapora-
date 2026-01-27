
import React, { useState, useRef, useMemo } from 'react';
import { UserState, Subject, Chapter, Difficulty } from '../types';
import { 
  Camera, Plus, Trash2, Calendar, CheckCircle2, 
  Loader2, AlertTriangle, FileText, CheckCircle, 
  Circle, LayoutGrid, Clock, Search, Tag, ArrowRight
} from 'lucide-react';

interface SyllabusManagerProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const SyllabusManager: React.FC<SyllabusManagerProps> = ({ userState, onUpdateState }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRoutineProcessing, setIsRoutineProcessing] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [showManualRoutine, setShowManualRoutine] = useState(false);
  const [chapterSearch, setChapterSearch] = useState<Record<string, string>>({}); 
  const fileInputRef = useRef<HTMLInputElement>(null);
  const routineFileInputRef = useRef<HTMLInputElement>(null);
  
  const [manualSubject, setManualSubject] = useState({ name: '', paper: 1, chapters: '' });
  const [bulkRoutine, setBulkRoutine] = useState('');

  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      alert(t("সিলেবাস স্ক্যান ফিচারটি সাময়িকভাবে বন্ধ আছে। ম্যানুয়ালি যোগ করুন।", "Syllabus scanning feature is temporarily unavailable. Please add manually."));
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRoutineUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsRoutineProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert(t("রুটিন আপলোড ফিচারটি সাময়িকভাবে বন্ধ আছে। ম্যানুয়ালি যোগ করুন।", "Routine upload feature is temporarily unavailable. Please add manually."));
    } finally {
      setIsRoutineProcessing(false);
      if (routineFileInputRef.current) routineFileInputRef.current.value = '';
    }
  };

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
    onUpdateState(prev => ({
      ...prev,
      subjects: [...(Array.isArray(prev.subjects) ? prev.subjects : []), newSubject]
    }));
    setManualSubject({ name: '', paper: 1, chapters: '' });
    setShowManualAdd(false);
  };

  const deleteSubject = (id: string) => {
    if (confirm(t("তুমি কি নিশ্চিত যে তুমি এই বিষয়টি ডিলিট করতে চাও?", "Are you sure?"))) {
      onUpdateState(prev => ({
        ...prev,
        subjects: Array.isArray(prev.subjects) ? prev.subjects.filter(s => s.id !== id) : []
      }));
    }
  };

  const toggleAllChapters = (subjectId: string, completed: boolean) => {
    onUpdateState(prev => ({
      ...prev,
      subjects: Array.isArray(prev.subjects) ? prev.subjects.map(s => s.id === subjectId ? {
        ...s,
        chapters: Array.isArray(s.chapters) ? s.chapters.map(c => ({ ...c, isCompleted: completed })) : []
      } : s) : []
    }));
  };

  const updateDifficulty = (subjectId: string, chapterId: string, diff: Difficulty) => {
    onUpdateState(prev => ({
      ...prev,
      subjects: Array.isArray(prev.subjects) ? prev.subjects.map(s => s.id === subjectId ? {
        ...s,
        chapters: Array.isArray(s.chapters) ? s.chapters.map(c => c.id === chapterId ? { ...c, difficulty: diff } : c) : []
      } : s) : []
    }));
  };

  const difficultyMeta: Record<Difficulty, { bgColorClass: string, textColorClass: string, label: { bn: string, en: string } }> = {
    'Easy': { bgColorClass: 'bg-emerald-500', textColorClass: 'text-emerald-500', label: { bn: 'সহজ', en: 'Easy' } },
    'Medium': { bgColorClass: 'bg-amber-500', textColorClass: 'text-amber-500', label: { bn: 'মাঝারি', en: 'Medium' } },
    'Hard': { bgColorClass: 'bg-rose-500', textColorClass: 'text-rose-500', label: { bn: 'কঠিন', en: 'Hard' } }
  };

  const subjects = Array.isArray(userState.subjects) ? userState.subjects : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24 md:pb-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex-1">
          <h2 className="text-3xl xs:text-4xl font-black tracking-tight">{t('সিলেবাস গাইড', 'Syllabus')}</h2>
          <p className="text-brand-text-s font-bold text-[10px] sm:text-xs mt-1 uppercase tracking-widest opacity-60">{t('তোমার NCTB সাবজেক্ট লিস্ট ম্যানেজ করো', 'Manage your subjects & chapters')}</p>
        </div>
        
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button 
            onClick={() => { setShowManualAdd(!showManualAdd); setShowManualRoutine(false); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] shadow-lg active:scale-95 transition-all ${showManualAdd ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-brand-surface text-brand-text-p border border-brand-text-s/10'}`}
          >
            <Plus size={18} /> {t('অ্যাড', 'Add')}
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-bg text-brand-primary border-2 border-brand-primary/10 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] hover:bg-brand-primary/5 transition-all disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
            {t('স্ক্যান', 'Scan')}
          </button>
        </div>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

      {showManualAdd && (
        <div className="bg-brand-surface p-6 sm:p-8 rounded-[2.5rem] border-2 border-dashed border-emerald-500/20 animate-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-brand-text-s tracking-[0.2em] ml-1">{t('বিষয়ের নাম', 'Subject')}</label>
              <input type="text" value={manualSubject.name} onChange={e => setManualSubject({...manualSubject, name: e.target.value})} placeholder="e.g. Chemistry" className="w-full px-5 py-4 bg-brand-bg border-2 border-transparent focus:border-emerald-500 rounded-2xl font-bold outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-brand-text-s tracking-[0.2em] ml-1">{t('পত্র', 'Paper')}</label>
              <select value={manualSubject.paper} onChange={e => setManualSubject({...manualSubject, paper: parseInt(e.target.value)})} className="w-full px-5 py-4 bg-brand-bg border-2 border-transparent focus:border-emerald-500 rounded-2xl font-bold outline-none appearance-none">
                <option value={1}>1st Paper</option>
                <option value={2}>2nd Paper</option>
              </select>
            </div>
          </div>
          <div className="space-y-2 mb-6">
            <label className="text-[10px] font-black uppercase text-brand-text-s tracking-[0.2em] ml-1">{t('অধ্যায়সমূহ (প্রতি লাইনে একটি)', 'Chapters (One per line)')}</label>
            <textarea value={manualSubject.chapters} onChange={e => setManualSubject({...manualSubject, chapters: e.target.value})} placeholder="Intro to Organic&#10;Reaction Mechanisms" className="w-full px-5 py-4 bg-brand-bg border-2 border-transparent focus:border-emerald-500 rounded-2xl font-bold min-h-[120px] outline-none" />
          </div>
          <button onClick={handleManualAdd} className="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 uppercase tracking-[0.2em] text-xs transition-all">{t('সেভ করো', 'Save Subject')}</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 md:gap-12">
        {subjects.length > 0 ? subjects.map(sub => {
          const searchTerm = chapterSearch[sub.id]?.toLowerCase() || '';
          const chapters = Array.isArray(sub.chapters) ? sub.chapters : [];
          const filteredChapters = chapters.filter(ch => ch.name.toLowerCase().includes(searchTerm));
          const completedCount = chapters.filter(c => c.isCompleted).length;
          const totalCount = chapters.length;
          const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
          
          return (
            <div key={sub.id} className="bg-brand-surface rounded-[3rem] shadow-sm border border-brand-text-s/10 overflow-hidden group">
              <div className="p-6 sm:p-10 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl transition-colors ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-brand-primary'}`}>
                      {sub.name[0]}
                    </div>
                    <div>
                      <h3 className="font-black text-2xl tracking-tight leading-none mb-1">{sub.name}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-s opacity-60">{t('পত্র', 'Paper')} {sub.paper}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-brand-bg rounded-xl border border-brand-text-s/5">
                      <Calendar size={16} className="text-brand-primary" />
                      <input type="date" value={sub.examDate || ''} onChange={(e) => {
                        onUpdateState(prev => ({
                          ...prev,
                          subjects: prev.subjects.map(s => s.id === sub.id ? { ...s, examDate: e.target.value } : s)
                        }));
                      }} className="bg-transparent border-0 p-0 text-[10px] font-black focus:ring-0 uppercase w-28 cursor-pointer" />
                    </div>
                    <button onClick={() => deleteSubject(sub.id)} className="p-2.5 text-brand-text-s hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={20} /></button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-text-s opacity-60">{t('সিলেবাস অগ্রগতি', 'Progress')}</span>
                    <span className="text-xl font-black text-brand-text-p leading-none">{Math.round(progressPercent)}%</span>
                  </div>
                  <button onClick={() => toggleAllChapters(sub.id, completedCount < totalCount)} className="text-[10px] font-black text-brand-primary uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
                    {completedCount === totalCount ? t('আবার শুরু করো', 'Reset Progress') : t('সব শেষ করো', 'Mark All Complete')}
                  </button>
                </div>
                <div className="h-3 w-full bg-brand-bg rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              <div className="bg-brand-bg/30 p-4 sm:p-10 border-t border-brand-text-s/10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredChapters.map(ch => (
                    <div key={ch.id} className={`p-5 rounded-3xl transition-all border-2 bg-brand-surface ${ch.isCompleted ? 'border-emerald-500/10' : 'border-transparent hover:border-brand-primary/10 shadow-sm'}`}>
                      <div className="flex items-start gap-4 mb-4">
                        <button onClick={() => {
                          onUpdateState(prev => ({
                            ...prev,
                            subjects: prev.subjects.map(s => s.id === sub.id ? {
                              ...s,
                              chapters: s.chapters.map(c => c.id === ch.id ? { ...c, isCompleted: !c.isCompleted } : c)
                            } : s)
                          }));
                        }} className={`mt-0.5 shrink-0 transition-all ${ch.isCompleted ? 'text-emerald-500' : 'text-brand-text-s opacity-30 hover:opacity-100'}`}>
                          {ch.isCompleted ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                        </button>
                        <span className={`font-bold text-xs sm:text-sm leading-tight ${ch.isCompleted ? 'text-emerald-700/50 dark:text-emerald-400/50 line-through' : 'text-brand-text-p'}`}>
                          {ch.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-brand-text-s/5">
                        <div className="flex gap-1.5">
                          {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((level) => (
                            <button key={level} onClick={() => updateDifficulty(sub.id, ch.id, level)} className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${ch.difficulty === level ? `${difficultyMeta[level].bgColorClass} text-white shadow-sm scale-110` : 'bg-brand-bg text-brand-text-s opacity-20 hover:opacity-50'}`}>
                              <Tag size={10} />
                            </button>
                          ))}
                        </div>
                        {ch.difficulty && <span className={`text-[8px] font-black uppercase tracking-widest ${difficultyMeta[ch.difficulty].textColorClass}`}>{t(difficultyMeta[ch.difficulty].label.bn, difficultyMeta[ch.difficulty].label.en)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="py-32 text-center bg-brand-surface rounded-[3rem] border-2 border-dashed border-brand-text-s/10">
             <AlertTriangle size={48} className="text-brand-text-s/20 mx-auto mb-6" />
             <h3 className="text-2xl font-black text-brand-text-p opacity-40">{t('কোনো সিলেবাস নেই', 'No Syllabus Found')}</h3>
             <button onClick={() => setShowManualAdd(true)} className="mt-6 px-8 py-4 bg-brand-primary text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-brand-primary/20">{t('ম্যানুয়ালি যোগ করো', 'Add Subjects Now')}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyllabusManager;
