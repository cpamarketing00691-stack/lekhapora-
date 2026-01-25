
import React, { useState, useRef } from 'react';
import { UserState, Subject, Chapter } from '../types';
import { geminiService } from '../services/gemini';
import { Camera, Plus, Trash2, Calendar, CheckCircle2, Loader2, Upload, AlertTriangle, FileText } from 'lucide-react';

interface SyllabusManagerProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const SyllabusManager: React.FC<SyllabusManagerProps> = ({ userState, onUpdateState }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRoutineProcessing, setIsRoutineProcessing] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const routineFileInputRef = useRef<HTMLInputElement>(null);
  
  const [manualSubject, setManualSubject] = useState({ name: '', paper: 1, chapters: '' });

  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await geminiService.analyzeSyllabusImage(userState.profile, base64, file.type);
        
        if (result && result.subjects) {
          const newSubjects: Subject[] = result.subjects.map((s: any, idx: number) => ({
            id: `extracted-${Date.now()}-${idx}`,
            name: s.name,
            paper: s.paper as 1 | 2,
            chapters: s.chapters.map((chName: string, chIdx: number) => ({
              id: `ch-${Date.now()}-${idx}-${chIdx}`,
              name: chName,
              isCompleted: false
            }))
          }));

          onUpdateState(prev => ({
            ...prev,
            subjects: [...prev.subjects, ...newSubjects]
          }));
        }
      };
      reader.readAsDataURL(file);
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
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await geminiService.analyzeExamRoutineImage(userState.profile, base64, file.type);
        
        if (result && result.exams) {
          onUpdateState(prev => {
            const updatedSubjects = prev.subjects.map(sub => {
              // Try to find a matching exam in the extracted routine
              const match = result.exams.find((ex: any) => 
                ex.subjectName.toLowerCase().includes(sub.name.toLowerCase()) && 
                ex.paper === sub.paper
              );
              if (match) {
                return { ...sub, examDate: match.date };
              }
              return sub;
            });
            return { ...prev, subjects: updatedSubjects };
          });
          alert(t("পরীক্ষার রুটিন আপডেট করা হয়েছে!", "Exam routine updated successfully!"));
        }
      };
      reader.readAsDataURL(file);
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

  const deleteSubject = (id: string) => {
    if (confirm(t("তুমি কি নিশ্চিত যে তুমি এই বিষয়টি ডিলিট করতে চাও?", "Are you sure you want to delete this subject?"))) {
      onUpdateState(prev => ({
        ...prev,
        subjects: prev.subjects.filter(s => s.id !== id)
      }));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black">{t('সিলেবাস ম্যানেজমেন্ট', 'Syllabus Manager')}</h2>
          <p className="text-slate-500 font-medium text-sm">{t('তোমার NCTB সিলেবাস কাস্টমাইজ করো।', 'Customize your NCTB syllabus patterns.')}</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
            {t('সিলেবাস স্ক্যান', 'Scan Syllabus')}
          </button>
          
          <button 
            onClick={() => routineFileInputRef.current?.click()}
            disabled={isRoutineProcessing}
            className="flex items-center gap-2 px-5 py-3 bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {isRoutineProcessing ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
            {t('রুটিন আপলোড', 'Upload Routine')}
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageUpload} 
          />
          
          <input 
            type="file" 
            ref={routineFileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleRoutineUpload} 
          />
          
          <button 
            onClick={() => setShowManualAdd(!showManualAdd)}
            className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={20} />
            {t('ম্যানুয়াল অ্যাড', 'Add Manually')}
          </button>
        </div>
      </div>

      {showManualAdd && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-dashed border-emerald-200 dark:border-emerald-800 animate-in zoom-in-95">
          <h3 className="font-black text-xl mb-6 flex items-center gap-3">
            <Plus className="text-emerald-500" />
            {t('নতুন বিষয় যোগ করো', 'Add New Subject')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('বিষয়ের নাম', 'Subject Name')}</label>
              <input 
                type="text" 
                value={manualSubject.name}
                onChange={e => setManualSubject({...manualSubject, name: e.target.value})}
                placeholder="e.g. Physics"
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('পত্র', 'Paper')}</label>
              <select 
                value={manualSubject.paper}
                onChange={e => setManualSubject({...manualSubject, paper: parseInt(e.target.value)})}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl focus:ring-2 focus:ring-emerald-500 font-bold"
              >
                <option value={1}>1st Paper</option>
                <option value={2}>2nd Paper</option>
              </select>
            </div>
          </div>
          <div className="space-y-2 mb-8">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('চ্যাপ্টার লিস্ট (প্রতি লাইনে একটি)', 'Chapters (one per line)')}</label>
            <textarea 
              value={manualSubject.chapters}
              onChange={e => setManualSubject({...manualSubject, chapters: e.target.value})}
              placeholder="Chapter 1&#10;Chapter 2&#10;Chapter 3"
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl focus:ring-2 focus:ring-emerald-500 font-bold min-h-[120px]"
            />
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handleManualAdd}
              className="flex-1 bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20"
            >
              {t('সেভ করো', 'Save Subject')}
            </button>
            <button 
              onClick={() => setShowManualAdd(false)}
              className="px-8 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-2xl"
            >
              {t('বাতিল', 'Cancel')}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {userState.subjects.map(sub => (
          <div key={sub.id} className="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 relative">
            <button 
              onClick={() => deleteSubject(sub.id)}
              className="absolute top-8 right-8 p-3 text-slate-300 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-800 rounded-xl opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={18} />
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
               <div className="space-y-2">
                 <div className="flex items-center gap-3">
                   <h3 className="font-black text-2xl">{sub.name}</h3>
                   <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase rounded-lg">
                    {t('পত্র', 'Paper')} {sub.paper}
                   </span>
                 </div>
                 
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                      <Calendar size={14} className="text-slate-400" />
                      <input 
                        type="date" 
                        value={sub.examDate || ''}
                        onChange={(e) => {
                          onUpdateState(prev => ({
                            ...prev,
                            subjects: prev.subjects.map(s => s.id === sub.id ? { ...s, examDate: e.target.value } : s)
                          }));
                        }}
                        className="text-[10px] bg-transparent border-0 p-0 font-black focus:ring-0 uppercase w-28"
                      />
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('পরীক্ষা', 'Exam')}</span>
                    </div>
                    
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      {sub.chapters.filter(c => c.isCompleted).length} / {sub.chapters.length} {t('সম্পন্ন', 'Chapters Done')}
                    </div>
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sub.chapters.map(ch => (
                <label 
                  key={ch.id} 
                  className={`flex items-center gap-4 p-5 rounded-3xl cursor-pointer transition-all border-2 ${
                    ch.isCompleted 
                    ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800 shadow-sm' 
                    : 'bg-white dark:bg-slate-800/50 border-slate-50 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="relative">
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
                      className="peer w-6 h-6 rounded-lg border-2 border-slate-200 dark:border-slate-700 text-emerald-500 focus:ring-emerald-500 transition-all appearance-none checked:bg-emerald-500 checked:border-emerald-500"
                    />
                    <CheckCircle2 
                      size={14} 
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" 
                    />
                  </div>
                  <div className="flex-1">
                    <span className={`font-bold text-sm leading-tight block ${ch.isCompleted ? 'text-emerald-700 dark:text-emerald-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                      {ch.name}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
        
        {userState.subjects.length === 0 && (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
             <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="text-slate-400" />
             </div>
             <h3 className="text-xl font-bold text-slate-400">{t('কোনো সিলেবাস পাওয়া যায়নি!', 'No Syllabus Found!')}</h3>
             <p className="text-slate-300 text-sm mt-2">{t('পড়াশোনা শুরু করতে আপনার সিলেবাস আপলোড বা অ্যাড করুন।', 'Upload or add your syllabus to start tracking.')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyllabusManager;
