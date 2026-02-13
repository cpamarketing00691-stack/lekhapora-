
import React, { useState, useRef } from 'react';
import { UserState, Subject, Chapter, Difficulty } from '../types';
import { 
  Camera, Plus, Trash2, Calendar, CheckCircle2, 
  Loader2, FileText, CheckCircle, 
  Search, Tag, GraduationCap, Clock, X
} from 'lucide-react';

// Using esm.sh for Tesseract integration
const TESSERACT_URL = "https://esm.sh/tesseract.js@5.0.5";

interface SyllabusManagerProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
  onTriggerTest: (subjectId: string, chapterId: string) => void;
}

const SyllabusManager: React.FC<SyllabusManagerProps> = ({ userState, onUpdateState, onTriggerTest }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [chapterSearch, setChapterSearch] = useState<Record<string, string>>({}); 
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [manualSubject, setManualSubject] = useState({ name: '', paper: 1, chapters: '' });
  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  // OCR Logic
  const preprocessImage = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const threshold = 128;
      const val = avg > threshold ? 255 : 0; // Binarization
      data[i] = data[i + 1] = data[i + 2] = val;
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const handleOCR = async (file: File) => {
    setIsProcessing(true);
    try {
      const { createWorker } = await import(TESSERACT_URL);
      const worker = await createWorker('eng+ben');
      
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise(resolve => img.onload = resolve);

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      preprocessImage(canvas);

      const { data: { text } } = await worker.recognize(canvas);
      await worker.terminate();

      // Simple extraction logic: find lines that look like chapters or subjects
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);
      
      if (lines.length > 0) {
        setManualSubject(prev => ({
          ...prev,
          chapters: lines.join('\n')
        }));
        setShowManualAdd(true);
        alert(t("ওসিআর সফল হয়েছে! বিষয় এবং চ্যাপ্টারগুলো চেক করো।", "OCR successful! Please review the detected content."));
      } else {
        throw new Error("No text detected");
      }
    } catch (error) {
      console.error("OCR Error:", error);
      alert(t("স্ক্যান করতে সমস্যা হয়েছে। দয়া করে পরিষ্কার ছবি আপলোড করো।", "Scanning failed. Please upload a clearer image."));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleOCR(file);
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
    onUpdateState((prev: UserState) => ({
      ...prev,
      subjects: [...(Array.isArray(prev.subjects) ? prev.subjects : []), newSubject]
    }));
    setManualSubject({ name: '', paper: 1, chapters: '' });
    setShowManualAdd(false);
  };

  const updateDifficulty = (subjectId: string, chapterId: string, diff: Difficulty) => {
    onUpdateState((prev: UserState) => ({
      ...prev,
      subjects: Array.isArray(prev.subjects) ? prev.subjects.map((s: Subject) => s.id === subjectId ? {
        ...s,
        chapters: Array.isArray(s.chapters) ? s.chapters.map((c: Chapter) => c.id === chapterId ? { ...c, difficulty: diff } : c) : []
      } : s) : []
    }));
  };

  // Fix: Added toggleAllChapters function to handle "Mark All Done" feature.
  const toggleAllChapters = (subjectId: string, completed: boolean) => {
    onUpdateState((prev: UserState) => ({
      ...prev,
      subjects: Array.isArray(prev.subjects) ? prev.subjects.map((s: Subject) => s.id === subjectId ? {
        ...s,
        chapters: Array.isArray(s.chapters) ? s.chapters.map((c: Chapter) => ({ ...c, isCompleted: completed })) : []
      } : s) : []
    }));
  };

  const subjects = Array.isArray(userState.subjects) ? userState.subjects : [];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">{t('সিলেবাস গাইড', 'Syllabus Guide')}</h2>
          <p className="text-slate-500 font-medium text-xs md:text-sm mt-1">{t('তোমার NCTB সিলেবাস এবং পরীক্ষার তারিখ ম্যানেজ করো।', 'Manage your NCTB syllabus and exam timeline.')}</p>
        </div>
        
        <div className="flex flex-wrap gap-2 md:gap-3">
          <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="group flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-3.5 bg-brand-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all disabled:opacity-50">
            {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
            {t('সিলেবাস স্ক্যান', 'Scan Syllabus')}
          </button>
          
          <button onClick={() => setShowManualAdd(!showManualAdd)} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all ${showManualAdd ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}>
            <Plus size={16} />
            {t('ম্যানুয়াল অ্যাড', 'Manual Add')}
          </button>
        </div>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleImageUpload} />

      {showManualAdd && (
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border-2 border-dashed border-brand-primary/20 animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-lg flex items-center gap-3"><Plus className="text-brand-primary" />{t('বিষয় যোগ করো', 'Add Subject')}</h3>
            <button onClick={() => setShowManualAdd(false)} className="text-slate-400"><X /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input type="text" value={manualSubject.name} onChange={e => setManualSubject({...manualSubject, name: e.target.value})} placeholder="Subject Name" className="w-full px-5 py-3 bg-brand-bg rounded-xl font-bold outline-none" />
            <select value={manualSubject.paper} onChange={e => setManualSubject({...manualSubject, paper: parseInt(e.target.value)})} className="w-full px-5 py-3 bg-brand-bg rounded-xl font-bold outline-none">
              <option value={1}>1st Paper</option>
              <option value={2}>2nd Paper</option>
            </select>
          </div>
          <textarea value={manualSubject.chapters} onChange={e => setManualSubject({...manualSubject, chapters: e.target.value})} placeholder="Chapters (one per line)" className="w-full px-5 py-4 bg-brand-bg rounded-xl font-bold min-h-[120px] outline-none mb-4" />
          <button onClick={handleManualAdd} className="w-full bg-brand-primary text-white font-black py-4 rounded-xl shadow-xl uppercase tracking-widest text-xs">{t('সেভ করো', 'Save Subject')}</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        {subjects.map((sub: Subject) => (
          <div key={sub.id} className="bg-brand-surface rounded-[2.5rem] p-6 border border-brand-text-s/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black">{sub.name} (P{sub.paper})</h3>
              <button onClick={() => toggleAllChapters(sub.id, true)} className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Mark All Done</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sub.chapters.map((ch: Chapter) => (
                <div key={ch.id} className={`p-4 rounded-2xl border bg-white ${ch.isCompleted ? 'border-emerald-200' : 'border-transparent'}`}>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={ch.isCompleted} onChange={() => {
                       onUpdateState((prev: UserState) => ({
                         ...prev,
                         subjects: prev.subjects.map(s => s.id === sub.id ? {
                           ...s, chapters: s.chapters.map(c => c.id === ch.id ? {...c, isCompleted: !c.isCompleted} : c)
                         } : s)
                       }));
                    }} className="w-5 h-5 accent-emerald-500" />
                    <span className={`text-sm font-bold ${ch.isCompleted ? 'line-through text-emerald-600' : ''}`}>{ch.name}</span>
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

export default SyllabusManager;
