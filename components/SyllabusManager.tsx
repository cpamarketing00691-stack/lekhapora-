
import React, { useState, useRef, useMemo } from 'react';
import { UserState, Subject, Chapter, Difficulty } from '../types';
import { geminiService } from '../services/gemini';
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
  const [chapterSearch, setChapterSearch] = useState<Record<string, string>>({}); // subjectId -> searchTerm
  const fileInputRef = useRef<HTMLInputElement>(null);
  const routineFileInputRef = useRef<HTMLInputElement>(null);
  
  const [manualSubject, setManualSubject] = useState({ name: '', paper: 1, chapters: '' });
  const [bulkRoutine, setBulkRoutine] = useState('');

  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const base64 = await readFileAsBase64(file);
      const result = await geminiService.analyzeSyllabusImage(userState.profile, base64, file.type);
      
      if (result && result.subjects && result.subjects.length > 0) {
        onUpdateState(prev => {
          const currentSubjects = [...prev.subjects];
          
          result.subjects.forEach((scannedSub: any) => {
            const existingIdx = currentSubjects.findIndex(s => 
              s.name.toLowerCase().includes(scannedSub.name.toLowerCase()) || 
              scannedSub.name.toLowerCase().includes(s.name.toLowerCase()) && 
              s.paper === scannedSub.paper
            );

            const chapters: Chapter[] = scannedSub.chapters.map((chName: string, chIdx: number) => ({
              id: `ch-${Date.now()}-${chIdx}-${Math.random()}`,
              name: chName,
              isCompleted: false
            }));

            if (existingIdx > -1) {
              const existingSub = currentSubjects[existingIdx];
              const newChapters = [...existingSub.chapters];
              chapters.forEach(c => {
                if (!newChapters.some(ec => ec.name.toLowerCase() === c.name.toLowerCase())) {
                  newChapters.push(c);
                }
              });
              currentSubjects[existingIdx] = { ...existingSub, chapters: newChapters };
            } else {
              currentSubjects.push({
                id: `scanned-${Date.now()}-${Math.random()}`,
                name: scannedSub.name,
                paper: scannedSub.paper as 1 | 2,
                chapters
              });
            }
          });

          return { ...prev, subjects: currentSubjects };
        });
        alert(t("সিলেবাস সফলভাবে আপডেট করা হয়েছে!", "Syllabus updated successfully!"));
      } else {
        alert(t("সিলেবাসে কোনো তথ্য পাওয়া যায়নি। ছবি পরিষ্কার করে আবার তোলো।", "No syllabus data found. Please take a clearer photo."));
      }
    } catch (error) {
      console.error("Failed to process image:", error);
      alert(t("সিলেবাস এক্সট্রাক্ট করতে সমস্যা হয়েছে। আবার চেষ্টা করো।", "Failed to extract syllabus. Please try again."));
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
      const base64 = await readFileAsBase64(file);
      const result = await geminiService.analyzeExamRoutineImage(userState.profile, base64, file.type);
      
      if (result && result.exams && result.exams.length > 0) {
        let matchCount = 0;
        onUpdateState(prev => {
          const updatedSubjects = prev.subjects.map(sub => {
            const match = result.exams.find((ex: any) => {
              const exName = ex.subjectName.toLowerCase();
              const subName = sub.name.toLowerCase();
              const nameMatch = exName.includes(subName) || subName.includes(exName);
              return nameMatch && parseInt(ex.paper) === sub.paper;
            });

            if (match) {
              matchCount++;
              return { ...sub, examDate: match.date };
            }
            return sub;
          });
          return { ...prev, subjects: updatedSubjects };
        });

        if (matchCount > 0) {
          alert(t(`${matchCount}টি বিষয়ের পরীক্ষার তারিখ রুটিন থেকে আপডেট করা হয়েছে!`, `Updated exam dates for ${matchCount} subjects from routine!`));
        } else {
          alert(t("রুটিন থেকে কোনো বিষয়ের মিল পাওয়া যায়নি।", "No matching subjects found in the routine image."));
        }
      } else {
        alert(t("রুটিন থেকে কোনো তারিখ পাওয়া যায়নি। ছবি পরিষ্কার করে আবার তোলো।", "No dates found in routine. Please take a clearer photo."));
      }
    } catch (error) {
      console.error("Failed to process routine:", error);
      alert(t("রুটিন প্রসেস করতে সমস্যা হয়েছে।", "Failed to process routine."));
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
      subjects: [...prev.subjects, newSubject]
    }));

    setManualSubject({ name: '', paper: 1, chapters: '' });
    setShowManualAdd(false);
  };

  const handleBulkRoutineAdd = () => {
    if (!bulkRoutine.trim()) return;

    const lines = bulkRoutine.split('\n');
    let updatedCount = 0;

    onUpdateState(prev => {
      const updatedSubjects = prev.subjects.map(sub => {
        const foundLine = lines.find(line => {
          const l = line.toLowerCase();
          const sName = sub.name.toLowerCase();
          const paperMatch = l.includes(sub.paper.toString()) || 
                            (sub.paper === 1 && (l.includes('1st') || l.includes('১ম'))) ||
                            (sub.paper === 2 && (l.includes('2nd') || l.includes('২য়')));
          return l.includes(sName) && paperMatch;
        });

        if (foundLine) {
          const dateMatch = foundLine.match(/\d{4}-\d{2}-\d{2}/) || foundLine.match(/\d{2}-\d{2}-\d{4}/);
          if (dateMatch) {
            updatedCount++;
            let dateStr = dateMatch[0];
            if (dateStr.includes('-') && dateStr.split('-')[0].length === 2) {
               const parts = dateStr.split('-');
               dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            return { ...sub, examDate: dateStr };
          }
        }
        return sub;
      });
      return { ...prev, subjects: updatedSubjects };
    });

    if (updatedCount > 0) {
      alert(t(`${updatedCount}টি বিষয়ের তারিখ ম্যানুয়ালি আপডেট করা হয়েছে।`, `Manually updated dates for ${updatedCount} subjects.`));
      setBulkRoutine('');
      setShowManualRoutine(false);
    } else {
      alert(t("কোনো সঠিক ফরম্যাট পাওয়া যায়নি। (উদাহরণ: Physics 1 2025-05-20)", "No correct format found. (Example: Physics 1 2025-05-20)"));
    }
  };

  const deleteSubject = (id: string) => {
    if (confirm(t("তুমি কি নিশ্চিত যে তুমি এই বিষয়টি ডিলিট করতে চাও?", "Are you sure you want to delete this subject?"))) {
      onUpdateState(prev => ({
        ...prev,
        subjects: prev.subjects.filter(s => s.id !== id)
      }));
    }
  };

  const toggleAllChapters = (subjectId: string, completed: boolean) => {
    onUpdateState(prev => ({
      ...prev,
      subjects: prev.subjects.map(s => s.id === subjectId ? {
        ...s,
        chapters: s.chapters.map(c => ({ ...c, isCompleted: completed }))
      } : s)
    }));
  };

  const updateDifficulty = (subjectId: string, chapterId: string, diff: Difficulty) => {
    onUpdateState(prev => ({
      ...prev,
      subjects: prev.subjects.map(s => s.id === subjectId ? {
        ...s,
        chapters: s.chapters.map(c => c.id === chapterId ? { ...c, difficulty: diff } : c)
      } : s)
    }));
  };

  const difficultyMeta: Record<Difficulty, { color: string, label: { bn: string, en: string } }> = {
    'Easy': { color: 'emerald', label: { bn: 'সহজ', en: 'Easy' } },
    'Medium': { color: 'amber', label: { bn: 'মাঝারি', en: 'Medium' } },
    'Hard': { color: 'rose', label: { bn: 'কঠিন', en: 'Hard' } }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">{t('সিলেবাস গাইড', 'Syllabus Guide')}</h2>
          <p className="text-slate-500 font-medium text-xs md:text-sm mt-1">{t('তোমার NCTB সিলেবাস এবং পরীক্ষার তারিখ ম্যানেজ করো।', 'Manage your NCTB syllabus and exam timeline.')}</p>
        </div>
        
        <div className="flex flex-wrap gap-2 md:gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="group flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-3.5 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-100 dark:border-emerald-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-emerald-50 transition-all disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
            {t('সিলেবাস স্ক্যান', 'Scan Syllabus')}
          </button>
          
          <button 
            onClick={() => routineFileInputRef.current?.click()}
            disabled={isRoutineProcessing}
            className="group flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-3.5 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-2 border-blue-100 dark:border-blue-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-blue-50 transition-all disabled:opacity-50"
          >
            {isRoutineProcessing ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
            {t('রুটিন আপলোড', 'Upload Routine')}
          </button>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={() => { setShowManualAdd(!showManualAdd); setShowManualRoutine(false); }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all ${showManualAdd ? 'bg-emerald-500 text-white' : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'}`}
            >
              <Plus size={16} />
              {t('ম্যানুয়াল অ্যাড', 'Manual Add')}
            </button>
            <button 
              onClick={() => { setShowManualRoutine(!showManualRoutine); setShowManualAdd(false); }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all ${showManualRoutine ? 'bg-indigo-600 text-white' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border border-indigo-100 dark:border-indigo-800'}`}
            >
              <Calendar size={16} />
              {t('ম্যানুয়াল রুটিন', 'Manual Routine')}
            </button>
          </div>
        </div>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
      <input type="file" ref={routineFileInputRef} className="hidden" accept="image/*" onChange={handleRoutineUpload} />

      {showManualAdd && (
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-emerald-200 dark:border-emerald-800 animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h3 className="font-black text-lg md:text-xl flex items-center gap-3">
              <Plus className="text-emerald-500" />
              {t('নতুন বিষয় যোগ করো', 'Add New Subject')}
            </h3>
            <button onClick={() => setShowManualAdd(false)} className="text-slate-400 hover:text-slate-600 font-bold text-[10px] uppercase tracking-widest">{t('বন্ধ', 'Close')}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-6">
            <div className="space-y-2">
              <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{t('বিষয়ের নাম', 'Subject Name')}</label>
              <input 
                type="text" 
                value={manualSubject.name}
                onChange={e => setManualSubject({...manualSubject, name: e.target.value})}
                placeholder="e.g. Physics"
                className="w-full px-5 py-3 md:px-6 md:py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-bold outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{t('পত্র', 'Paper')}</label>
              <select 
                value={manualSubject.paper}
                onChange={e => setManualSubject({...manualSubject, paper: parseInt(e.target.value)})}
                className="w-full px-5 py-3 md:px-6 md:py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-bold outline-none appearance-none"
              >
                <option value={1}>1st Paper</option>
                <option value={2}>2nd Paper</option>
              </select>
            </div>
          </div>
          <div className="space-y-2 mb-8 md:mb-10">
            <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{t('চ্যাপ্টার লিস্ট', 'Chapter Titles (One per line)')}</label>
            <textarea 
              value={manualSubject.chapters}
              onChange={e => setManualSubject({...manualSubject, chapters: e.target.value})}
              placeholder="Chapter 1&#10;Chapter 2"
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-bold min-h-[120px] outline-none"
            />
          </div>
          <button 
            onClick={handleManualAdd}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/10 uppercase tracking-widest text-xs transition-all"
          >
            {t('সেভ করো', 'Add Subject')}
          </button>
        </div>
      )}

      {showManualRoutine && (
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-indigo-200 dark:border-indigo-800 animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h3 className="font-black text-lg md:text-xl flex items-center gap-3">
              <Calendar className="text-indigo-500" />
              {t('রুটিন ম্যানুয়াল এন্ট্রি', 'Manual Routine Entry')}
            </h3>
            <button onClick={() => setShowManualRoutine(false)} className="text-slate-400 hover:text-slate-600 font-bold text-[10px] uppercase tracking-widest">{t('বন্ধ', 'Close')}</button>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
               <p className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest mb-2">{t('কিভাবে লিখবে?', 'Format Example')}</p>
               <p className="text-[10px] text-indigo-600/70 dark:text-indigo-400/60 leading-relaxed font-medium">
                {t('প্রতি লাইনে একটি বিষয়, পত্র এবং তারিখ (YYYY-MM-DD) লিখো।', 'Enter subject, paper, and date (YYYY-MM-DD) per line.')} <br/>
                <code className="bg-white/50 dark:bg-black/20 px-1 rounded">Physics 1 2025-05-20</code><br/>
                <code className="bg-white/50 dark:bg-black/20 px-1 rounded">Bangla 2 2025-05-24</code>
               </p>
            </div>
            <textarea 
              value={bulkRoutine}
              onChange={e => setBulkRoutine(e.target.value)}
              placeholder="Physics 1 2025-05-20&#10;Chemistry 2 2025-06-15"
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-bold min-h-[150px] outline-none"
            />
          </div>
          
          <button 
            onClick={handleBulkRoutineAdd}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/10 uppercase tracking-widest text-xs transition-all"
          >
            {t('রুটিন সেভ করো', 'Save Routine')}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 md:gap-10">
        {userState.subjects.map(sub => {
          const searchTerm = chapterSearch[sub.id]?.toLowerCase() || '';
          const filteredChapters = sub.chapters.filter(ch => ch.name.toLowerCase().includes(searchTerm));
          
          const completedCount = sub.chapters.filter(c => c.isCompleted).length;
          const totalCount = sub.chapters.length;
          const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
          
          return (
            <div key={sub.id} className="group bg-white dark:bg-slate-900 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-all">
              <div className="p-6 md:p-10 pb-0">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6 md:mb-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 md:gap-4 mb-3">
                      <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-[1.5rem] flex items-center justify-center text-white font-black text-lg md:text-xl shadow-lg ${progressPercent === 100 ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-slate-900 dark:bg-slate-700'}`}>
                        {sub.name[0]}
                      </div>
                      <div>
                        <h3 className="font-black text-xl md:text-2xl tracking-tight flex items-center gap-2">
                          {sub.name}
                          {progressPercent === 100 && <CheckCircle size={20} className="text-emerald-500" />}
                        </h3>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] md:text-[10px] font-black uppercase rounded-md tracking-widest">
                          {t('পত্র', 'P')} {sub.paper}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-4 md:mt-6">
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                        <Calendar size={14} className="text-blue-500" />
                        <input 
                          type="date" 
                          value={sub.examDate || ''}
                          onChange={(e) => {
                            onUpdateState(prev => ({
                              ...prev,
                              subjects: prev.subjects.map(s => s.id === sub.id ? { ...s, examDate: e.target.value } : s)
                            }));
                          }}
                          className="text-[10px] bg-transparent border-0 p-0 font-black focus:ring-0 uppercase w-28 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl">
                         <LayoutGrid size={14} className="text-emerald-500" />
                         <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                           {completedCount}/{totalCount}
                         </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Chapter Search Bar for the Card */}
                    <div className="relative mr-2 hidden sm:block">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <input 
                        type="text" 
                        placeholder={t("চ্যাপ্টার খুঁজুন...", "Find chapter...")}
                        value={chapterSearch[sub.id] || ''}
                        onChange={(e) => setChapterSearch({...chapterSearch, [sub.id]: e.target.value})}
                        className="pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl text-[10px] font-bold w-40 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                      />
                    </div>

                    <button 
                      onClick={() => toggleAllChapters(sub.id, completedCount < totalCount)}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
                        completedCount === totalCount
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        : 'bg-emerald-500 text-white shadow-lg'
                      }`}
                    >
                      {completedCount === totalCount ? t('মুছুন', 'Reset') : t('শেষ', 'Done')}
                    </button>
                    
                    <button 
                      onClick={() => deleteSubject(sub.id)}
                      className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all rounded-xl opacity-100 md:opacity-0 md:group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 md:space-y-3 mb-8 md:mb-10">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('সিলেবাস অগ্রগতি', 'Progress')}</span>
                    <span className="text-base md:text-xl font-black text-slate-900 dark:text-white">{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="h-3 md:h-4 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-300 transition-all duration-1000" 
                      style={{ width: `${progressPercent}%` }} 
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/50 dark:bg-slate-950/20 p-6 md:p-10 border-t border-slate-50 dark:border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {filteredChapters.map(ch => (
                    <div 
                      key={ch.id} 
                      className={`group/item flex flex-col p-4 md:p-6 rounded-[2rem] transition-all border-2 bg-white dark:bg-slate-900 ${
                        ch.isCompleted 
                        ? 'border-emerald-50 dark:border-emerald-900/30' 
                        : 'border-transparent hover:border-slate-100 dark:hover:border-slate-700 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <div className="relative pt-1 shrink-0">
                          <input 
                            type="checkbox" 
                            checked={ch.isCompleted} 
                            onChange={() => {
                              onUpdateState(prev => ({
                                ...prev,
                                subjects: prev.subjects.map(s => s.id === sub.id ? {
                                  ...s,
                                  chapters: s.chapters.map(c => c.id === ch.id ? { ...c, isCompleted: !c.isCompleted } : c)
                                } : s)
                              }));
                            }}
                            className="peer w-5 h-5 md:w-6 md:h-6 rounded-md border-2 border-slate-200 dark:border-slate-700 text-emerald-500 focus:ring-0 appearance-none checked:bg-emerald-500 checked:border-emerald-500 transition-all cursor-pointer"
                          />
                          <CheckCircle2 
                            size={12} 
                            className="absolute top-[10px] left-[4px] md:top-[11px] md:left-[5px] text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`font-bold text-xs md:text-sm leading-tight block ${ch.isCompleted ? 'text-emerald-700 dark:text-emerald-400 line-through opacity-60' : 'text-slate-600 dark:text-slate-200'}`}>
                            {ch.name}
                          </span>
                        </div>
                      </div>

                      {/* Difficulty Picker */}
                      <div className="mt-auto flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-3">
                         <div className="flex gap-1.5">
                            {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((level) => (
                              <button
                                key={level}
                                onClick={() => updateDifficulty(sub.id, ch.id, level)}
                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                  ch.difficulty === level 
                                    ? `bg-${difficultyMeta[level].color}-500 text-white shadow-md scale-110` 
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-300 hover:text-slate-500'
                                }`}
                                title={t(difficultyMeta[level].label.bn, difficultyMeta[level].label.en)}
                              >
                                <Tag size={10} />
                              </button>
                            ))}
                         </div>
                         {ch.difficulty && (
                           <span className={`text-[8px] font-black uppercase tracking-widest text-${difficultyMeta[ch.difficulty].color}-500`}>
                             {t(difficultyMeta[ch.difficulty].label.bn, difficultyMeta[ch.difficulty].label.en)}
                           </span>
                         )}
                      </div>
                    </div>
                  ))}
                  
                  {filteredChapters.length === 0 && (
                    <div className="col-span-full py-10 text-center space-y-3">
                      <Search className="mx-auto text-slate-200" size={32} />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("কোনো চ্যাপ্টার পাওয়া যায়নি", "No matching chapters found")}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {userState.subjects.length === 0 && (
          <div className="text-center py-20 md:py-32 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
             <AlertTriangle size={32} md:size={40} className="text-slate-200 mx-auto mb-6" />
             <h3 className="text-xl md:text-2xl font-black text-slate-400">{t('সিলেবাস খুঁজে পাওয়া যায়নি!', 'Empty Syllabus')}</h3>
             <div className="mt-8 flex justify-center gap-3">
               <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2.5 bg-emerald-500 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20">{t('স্ক্যান', 'Scan')}</button>
               <button onClick={() => setShowManualAdd(true)} className="px-6 py-2.5 bg-slate-900 text-white font-black rounded-xl text-[10px] uppercase tracking-widest">{t('ম্যানুয়াল', 'Manual')}</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyllabusManager;
