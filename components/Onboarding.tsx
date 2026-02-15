import React, { useState, useMemo } from 'react';
import { Group, Religion, Medium, UserProfile, CollegeExam, Language } from '../types';
import { BOARDS, YEARS, SUBJECT_OPTIONS, COMPULSORY_SUBJECTS_LIST } from '../constants';
import { ChevronRight, ChevronLeft, BookOpen, CheckCircle2, Info, School, Plus, Trash2, Calendar, Loader2 } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile & { selectedSubjectNames: string[] }) => void;
  language: Language;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, language }) => {
  const [step, setStep] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);
  const [data, setData] = useState<Partial<UserProfile>>({
    fullName: '',
    college: '',
    group: Group.SCIENCE,
    board: BOARDS[0],
    medium: Medium.BANGLA,
    targetYear: YEARS[0],
    religion: Religion.ISLAM,
    collegeExams: []
  });

  const [selectedElectives, setSelectedElectives] = useState<string[]>([]);
  const [selectedFourth, setSelectedFourth] = useState<string>('');
  const [newExam, setNewExam] = useState({ name: '', date: '' });

  const t = (bn: string, en: string) => language === 'bn' ? bn : en;

  const next = () => {
    if (step === 2) {
      setSelectedElectives([]);
      setSelectedFourth('');
    }
    setStep(s => s + 1);
  };
  const back = () => setStep(s => s - 1);

  const addExam = () => {
    if (!newExam.name || !newExam.date) return;
    setData(prev => ({
      ...prev,
      collegeExams: [...(prev.collegeExams || []), { id: `exam-${Date.now()}`, name: newExam.name, date: newExam.date }]
    }));
    setNewExam({ name: '', date: '' });
  };

  const removeExam = (id: string) => {
    setData(prev => ({
      ...prev,
      collegeExams: (prev.collegeExams || []).filter(ex => ex.id !== id)
    }));
  };

  const finish = async () => {
    if (data.fullName && data.group && data.board && data.medium && data.targetYear && data.religion && data.college && selectedElectives.length === 3 && selectedFourth) {
      setIsFinishing(true);
      try {
        const finalProfile: UserProfile = {
          ...data as UserProfile
        };
        
        const allSelectedSubjectNames = [
          ...COMPULSORY_SUBJECTS_LIST,
          ...selectedElectives,
          selectedFourth
        ];

        await onComplete({ ...finalProfile, selectedSubjectNames: allSelectedSubjectNames });
      } finally {
        setIsFinishing(false);
      }
    } else {
      alert(t("দয়া করে সমস্ত প্রয়োজনীয় তথ্য পূরণ করুন।", "Please fill in all required information."));
    }
  };

  const groupSubjectsPool = useMemo(() => {
    if (!data.group) return [];
    return SUBJECT_OPTIONS[data.group];
  }, [data.group]);

  const toggleElective = (subj: string) => {
    if (selectedElectives.includes(subj)) {
      setSelectedElectives(prev => prev.filter(s => s !== subj));
    } else if (selectedElectives.length < 3) {
      if (subj === selectedFourth) setSelectedFourth('');
      setSelectedElectives(prev => [...prev, subj]);
    }
  };

  const selectFourth = (subj: string) => {
    if (selectedElectives.includes(subj)) {
      setSelectedElectives(prev => prev.filter(s => s !== subj));
    }
    setSelectedFourth(subj);
  };

  const isStepValid = useMemo(() => {
    if (step === 1) return !!data.fullName && !!data.college && !!data.targetYear;
    if (step === 2) return !!data.group && !!data.medium;
    if (step === 3) return !!data.religion && !!data.board;
    if (step === 4) return selectedElectives.length === 3 && !!selectedFourth;
    if (step === 5) return true;
    return false;
  }, [step, data, selectedElectives, selectedFourth]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-xl border border-slate-100 dark:border-slate-800 transition-all flex flex-col max-h-[90vh]">
        <div className="mb-6">
          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? 'bg-brand-primary' : 'bg-slate-100 dark:bg-slate-800'}`} />
            ))}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-brand-text-p leading-none">
            {step === 5 ? t('কলেজ পরীক্ষা (ঐচ্ছিক)', 'College Exams (Optional)') : step === 4 ? t('বিষয় নির্বাচন (Flexible)', 'Subject Selection (Flexible)') : t(`ধাপ ${step}: প্রোফাইল তৈরি`, `Step ${step}: Profile Setup`)}
          </h2>
          <p className="text-brand-text-s text-[10px] sm:text-xs mt-2 font-bold uppercase tracking-widest leading-tight">
            {step === 5 ? t('তোমার কলেজের আসন্ন পরীক্ষার তারিখগুলো যোগ করো', 'Add your upcoming college exam dates.') : step === 4 ? t('কলেজ অনুযায়ী তোমার বিষয়গুলো বেছে নাও', 'Select your subjects according to your college curriculum.') : t('এআই তোমার জন্য সঠিক প্ল্যান তৈরি করতে এই তথ্যগুলো প্রয়োজন', 'AI needs this information to create your personalized study plan.')}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide pr-1">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 py-1">
              <div>
                <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-[0.2em] mb-2 ml-1">{t('পূর্ণ নাম', 'Full Name')}</label>
                <input type="text" value={data.fullName || ''} onChange={e => setData({...data, fullName: e.target.value})} className="w-full px-5 py-3 rounded-2xl bg-brand-bg border-2 border-transparent focus:border-brand-primary text-brand-text-p font-bold outline-none transition-all" placeholder={t("তোমার নাম লেখো", "Enter your name")} />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-[0.2em] mb-2 ml-1">{t('কলেজের নাম', 'College Name')}</label>
                <div className="relative">
                  <School className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-s" size={18} />
                  <input type="text" value={data.college || ''} onChange={e => setData({...data, college: e.target.value})} className="w-full pl-12 pr-5 py-3 rounded-2xl bg-brand-bg border-2 border-transparent focus:border-brand-primary text-brand-text-p font-bold outline-none transition-all" placeholder={t("যেমন: নটর ডেম কলেজ", "e.g. Notre Dame College")} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-[0.2em] mb-2 ml-1">{t('টার্গেট এইচএসসি বছর', 'Target HSC Year')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {YEARS.map(y => (
                    <button key={y} onClick={() => setData({...data, targetYear: y})} className={`py-3 rounded-2xl border-2 font-black text-xs transition-all ${data.targetYear === y ? 'border-brand-primary bg-brand-primary/5 text-brand-primary shadow-sm' : 'border-transparent bg-brand-bg text-brand-text-s hover:bg-brand-surface'}`}>
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 py-1">
              <div>
                <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-[0.2em] mb-2 ml-1">{t('একাডেমিক গ্রুপ', 'Academic Group')}</label>
                <div className="grid grid-cols-1 gap-3">
                  {Object.values(Group).map(g => (
                    <button key={g} onClick={() => setData({...data, group: g})} className={`px-5 py-3 text-left rounded-2xl border-2 font-black transition-all ${data.group === g ? 'border-brand-primary bg-brand-primary/5 text-brand-primary shadow-sm' : 'border-transparent bg-brand-bg text-brand-text-s hover:bg-brand-surface'}`}>
                      {g} Group
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-[0.2em] mb-2 ml-1">{t('মাধ্যম (Medium)', 'Medium')}</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.values(Medium).map(m => (
                    <button key={m} onClick={() => setData({...data, medium: m})} className={`py-3 rounded-2xl border-2 font-black transition-all ${data.medium === m ? 'border-brand-primary bg-brand-primary/5 text-brand-primary shadow-sm' : 'border-transparent bg-brand-bg text-brand-text-s hover:bg-brand-surface'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 py-1">
              <div>
                <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-[0.2em] mb-2 ml-1">{t('ধর্ম (রুটিন সমন্বয়ের জন্য)', 'Religion (for routine adjustment)')}</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.values(Religion).map(r => (
                    <button key={r} onClick={() => setData({...data, religion: r})} className={`py-3 rounded-2xl border-2 font-black transition-all ${data.religion === r ? 'border-brand-primary bg-brand-primary/5 text-brand-primary shadow-sm' : 'border-transparent bg-brand-bg text-brand-text-s hover:bg-brand-surface'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-[0.2em] mb-2 ml-1">{t('শিক্ষা বোর্ড', 'Education Board')}</label>
                <select value={data.board || ''} onChange={e => setData({...data, board: e.target.value})} className="w-full px-5 py-3 rounded-2xl bg-brand-bg border-2 border-transparent focus:border-brand-primary text-brand-text-p font-bold outline-none appearance-none cursor-pointer">
                  {BOARDS.map(b => <option key={b} value={b}>{b} {t('বোর্ড', 'Board')}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 py-1">
              <div className="bg-brand-surface/50 p-4 rounded-2xl border border-brand-text-s/10">
                <p className="text-[10px] font-black text-brand-text-s uppercase tracking-widest mb-2">{t('আবশ্যিক বিষয় (Compulsory)', 'Compulsory Subjects')}</p>
                <div className="flex flex-wrap gap-2">
                  {COMPULSORY_SUBJECTS_LIST.map(s => (
                    <span key={s} className="px-2 py-1 bg-brand-primary/10 text-brand-primary rounded-lg text-[9px] font-bold border border-brand-primary/20">{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-[0.2em] mb-3 ml-1">{t('মূল বিষয়সমূহ (Main Subjects - ৩টি বেছে নাও)', 'Main Subjects (Choose 3)')}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {groupSubjectsPool.map(subj => (
                    <button key={subj} onClick={() => toggleElective(subj)} className={`flex items-center justify-between px-4 py-2.5 rounded-xl border-2 font-bold text-[10px] transition-all ${selectedElectives.includes(subj) ? 'border-brand-primary bg-brand-primary/5 text-brand-primary shadow-sm' : 'border-transparent bg-brand-bg text-brand-text-s hover:bg-brand-surface'}`}>
                      {subj}
                      {selectedElectives.includes(subj) && <CheckCircle2 size={14} />}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-[0.2em] mb-3 ml-1">{t('৪র্থ বিষয় (ঐচ্ছিক - ১টি বেছে নাও)', '4th Subject (Optional - Choose 1)')}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {groupSubjectsPool.map(subj => (
                    <button key={`opt-${subj}`} disabled={selectedElectives.includes(subj)} onClick={() => selectFourth(subj)} className={`flex items-center justify-between px-4 py-2.5 rounded-xl border-2 font-bold text-[10px] transition-all ${selectedFourth === subj ? 'border-brand-secondary bg-brand-secondary/5 text-brand-secondary shadow-sm' : 'border-transparent bg-brand-bg text-brand-text-s hover:bg-brand-surface disabled:opacity-30'}`}>
                      {subj}
                      {selectedFourth === subj && <CheckCircle2 size={14} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 py-1">
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border-2 border-brand-primary/20 space-y-4">
                <h3 className="text-xs font-black text-brand-primary uppercase tracking-widest">{t('নতুন পরীক্ষা যোগ করো', 'Add College Exam')}</h3>
                <div className="grid grid-cols-1 gap-2">
                  <input type="text" value={newExam.name} onChange={e => setNewExam({...newExam, name: e.target.value})} placeholder={t("পরীক্ষার নাম (যেমন: ১ম টিউটোরিয়াল)", "Exam Name (e.g. 1st Tutorial)")} className="w-full px-4 py-2.5 rounded-xl bg-brand-bg border-0 font-bold outline-none text-xs" />
                  <input type="date" value={newExam.date} onChange={e => setNewExam({...newExam, date: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-brand-bg border-0 font-bold outline-none text-xs cursor-pointer" />
                  <button onClick={addExam} className="w-full py-2.5 bg-brand-primary text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2">
                    <Plus size={14} /> {t('অ্যাড করো', 'Add Exam')}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {(data.collegeExams || []).map(ex => (
                  <div key={ex.id} className="flex items-center justify-between p-3 bg-brand-bg rounded-2xl border border-brand-text-s/10 group">
                    <div className="flex items-center gap-3">
                      <Calendar size={16} className="text-brand-primary" />
                      <div>
                        <p className="text-[10px] font-black text-brand-text-p">{ex.name}</p>
                        <p className="text-[9px] font-bold text-brand-text-s uppercase">{ex.date}</p>
                      </div>
                    </div>
                    <button onClick={() => removeExam(ex.id)} className="p-2 text-red-500 transition-all"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          {step > 1 && (
            <button onClick={back} disabled={isFinishing} className="flex-1 px-4 py-3.5 bg-brand-surface text-brand-text-p font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-brand-bg transition-all text-[10px] uppercase tracking-widest disabled:opacity-50">
              <ChevronLeft size={16} /> {t('পিছনে', 'Back')}
            </button>
          )}
          <button onClick={step === 5 ? finish : next} disabled={!isStepValid || isFinishing} className={`flex-[2] px-4 py-3.5 font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all text-[10px] uppercase tracking-widest disabled:opacity-30 disabled:grayscale ${step >= 4 ? 'bg-brand-secondary text-white shadow-brand-secondary/20' : 'bg-brand-primary text-white shadow-brand-primary/20'}`}>
            {isFinishing ? <Loader2 className="animate-spin" size={16} /> : (step === 5 ? t('পড়া শুরু করি', 'Start Studying') : t('পরবর্তী ধাপ', 'Next Step'))}
            {!isFinishing && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;