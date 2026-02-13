
import React, { useState, useRef } from 'react';
import { UserState, Subject, Chapter } from '../types';
import { Camera, Loader2, Sparkles, CheckCircle2, X, Info, Layers, RefreshCw, Save } from 'lucide-react';

interface OCRPanelProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const TESSERACT_URL = "https://esm.sh/tesseract.js@5.0.5";

const OCRPanel: React.FC<OCRPanelProps> = ({ userState, onUpdateState }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState({ name: '', paper: 1 as 1 | 2 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  const handleOCR = async (file: File) => {
    setIsProcessing(true);
    setPreviewUrl(URL.createObjectURL(file));
    try {
      const tesseract: any = await import(TESSERACT_URL);
      const worker = await tesseract.createWorker('eng+ben');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      const lines = text.split('\n')
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 4);
      
      setResults(lines);
    } catch (error) {
      alert(t("স্ক্যান ব্যর্থ হয়েছে।", "Scan failed."));
    } finally {
      setIsProcessing(false);
    }
  };

  const saveToSyllabus = () => {
    if (!editSubject.name || results.length === 0) return;

    const chapters: Chapter[] = results.map((name, i) => ({
      id: `ocr-ch-${Date.now()}-${i}`,
      name,
      isCompleted: false
    }));

    const newSub: Subject = {
      id: `ocr-sub-${Date.now()}`,
      name: editSubject.name,
      paper: editSubject.paper,
      chapters
    };

    onUpdateState(prev => ({
      ...prev,
      subjects: [...prev.subjects, newSub]
    }));

    setResults([]);
    setPreviewUrl(null);
    setEditSubject({ name: '', paper: 1 });
    alert(t("সিলেবাসে যোগ করা হয়েছে!", "Added to syllabus!"));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="text-center space-y-3">
        <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary mx-auto mb-6 shadow-inner">
           <Camera size={32} />
        </div>
        <h2 className="text-3xl font-black tracking-tight">{t('স্মার্ট সিলেবাস স্ক্যানার', 'Smart OCR Scanner')}</h2>
        <p className="text-brand-text-s font-medium max-w-lg mx-auto leading-relaxed">
          {t('তোমার বইয়ের সূচিপত্রের ছবি তোলো, এআই স্বয়ংক্রিয়ভাবে তোমার সিলেবাস তৈরি করে দেবে।', 'Snap a photo of your book\'s index. AI will automatically build your digital syllabus.')}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Area */}
        <section className={`bg-brand-surface rounded-[3rem] p-10 border-2 border-dashed transition-all flex flex-col items-center justify-center gap-6 min-h-[400px] ${previewUrl ? 'border-brand-primary/40' : 'border-brand-text-s/10 hover:border-brand-primary/30'}`}>
          {previewUrl ? (
            <div className="w-full space-y-6">
              <img src={previewUrl} className="w-full h-64 object-cover rounded-3xl shadow-xl" />
              <button 
                onClick={() => { setPreviewUrl(null); setResults([]); }}
                className="w-full py-4 bg-brand-bg text-brand-text-s font-black rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]"
              >
                <RefreshCw size={14}/> {t('আবার ছবি তোলো', 'Retake Photo')}
              </button>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 bg-brand-bg rounded-3xl flex items-center justify-center text-brand-text-s"><Layers size={40}/></div>
              <div className="text-center">
                <p className="text-sm font-black text-brand-text-p uppercase tracking-widest mb-1">{t('ছবি আপলোড করো', 'Drop Syllabus Image')}</p>
                <p className="text-[10px] font-bold text-brand-text-s uppercase">{t('JPG, PNG সমর্থন করে', 'Supports JPG, PNG')}</p>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-10 py-5 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                {isProcessing ? <Loader2 size={20} className="animate-spin" /> : t('ক্যামেরা ওপেন করো', 'Open Camera')}
              </button>
            </>
          )}
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleOCR(file);
          }} />
        </section>

        {/* Results Area */}
        <section className="bg-brand-surface rounded-[3rem] p-10 border border-brand-text-s/10 shadow-sm flex flex-col min-h-[400px]">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black flex items-center gap-3"><Sparkles className="text-brand-primary"/> {t('শনাক্তকৃত অধ্যায়', 'Detected Chapters')}</h3>
              <span className="text-[10px] font-black text-brand-text-s uppercase bg-brand-bg px-3 py-1 rounded-full">{results.length} Chapters</span>
           </div>

           <div className="flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-hide mb-8">
              {results.length > 0 ? results.map((line, i) => (
                <div key={i} className="group relative flex items-center gap-4 p-4 bg-brand-bg rounded-2xl border border-transparent hover:border-brand-primary/20 transition-all">
                   <div className="w-6 h-6 rounded-lg bg-brand-surface flex items-center justify-center text-[10px] font-black text-brand-text-s">{i+1}</div>
                   <input 
                     value={line} 
                     onChange={e => {
                        const newR = [...results];
                        newR[i] = e.target.value;
                        setResults(newR);
                     }}
                     className="bg-transparent border-none outline-none text-xs font-bold w-full text-brand-text-p"
                   />
                   <button onClick={() => setResults(results.filter((_, idx) => idx !== i))} className="p-1 opacity-0 group-hover:opacity-100 text-rose-500 transition-opacity"><X size={14}/></button>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-4">
                   <Info size={40}/>
                   <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                     {t('স্ক্যান করার পর এখানে অধ্যায়গুলো দেখা যাবে।', 'Chapters will appear here after scanning.')}
                   </p>
                </div>
              )}
           </div>

           {results.length > 0 && (
             <div className="space-y-4 animate-in slide-in-from-bottom-2">
                <div className="grid grid-cols-2 gap-3">
                   <input 
                     placeholder={t("বিষয়ের নাম", "Subject Name")}
                     value={editSubject.name}
                     onChange={e => setEditSubject({...editSubject, name: e.target.value})}
                     className="px-4 py-3 bg-brand-bg rounded-xl font-bold text-xs outline-none"
                   />
                   <select 
                     value={editSubject.paper}
                     onChange={e => setEditSubject({...editSubject, paper: parseInt(e.target.value) as 1 | 2})}
                     className="px-4 py-3 bg-brand-bg rounded-xl font-bold text-xs outline-none"
                   >
                     <option value={1}>1st Paper</option>
                     <option value={2}>2nd Paper</option>
                   </select>
                </div>
                <button 
                  onClick={saveToSyllabus}
                  className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <Save size={18}/> {t('সেভ করো', 'Save to Syllabus')}
                </button>
             </div>
           )}
        </section>
      </div>
    </div>
  );
};

export default OCRPanel;
