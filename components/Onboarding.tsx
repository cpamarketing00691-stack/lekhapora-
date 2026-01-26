
import React, { useState, useMemo } from 'react';
import { Group, Religion, Medium, UserProfile } from '../types';
import { BOARDS, YEARS, SUBJECT_OPTIONS, COMPULSORY_SUBJECTS_LIST } from '../constants';
import { ChevronRight, ChevronLeft, BookOpen, CheckCircle2, Info, School } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile & { selectedSubjectNames: string[] }) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<UserProfile>>({
    fullName: '',
    college: '',
    group: Group.SCIENCE,
    board: BOARDS[0],
    medium: Medium.BANGLA,
    targetYear: YEARS[0],
    religion: Religion.ISLAM,
  });

  // Flexible Subject Selection State
  const [selectedElectives, setSelectedElectives] = useState<string[]>([]);
  const [selectedFourth, setSelectedFourth] = useState<string>('');

  const next = () => {
    if (step === 2) {
      // Reset subject selection if group changes mid-onboarding
      setSelectedElectives([]);
      setSelectedFourth('');
    }
    setStep(s => s + 1);
  };
  const back = () => setStep(s => s - 1);

  const finish = () => {
    if (data.fullName && data.group && data.board && data.medium && data.targetYear && data.religion && data.college && selectedElectives.length === 3 && selectedFourth) {
      const finalProfile: UserProfile = {
        ...data as UserProfile,
        aiName: `${data.fullName.split(' ')[0]} AI`
      };
      
      // Construct final subject list: Compulsory (3) + Electives (3) + Optional (1) = 7 Subjects
      const allSelectedSubjectNames = [
        ...COMPULSORY_SUBJECTS_LIST,
        ...selectedElectives,
        selectedFourth
      ];

      onComplete({ ...finalProfile, selectedSubjectNames: allSelectedSubjectNames });
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
      // If choosing as elective, it can't be 4th
      if (subj === selectedFourth) setSelectedFourth('');
      setSelectedElectives(prev => [...prev, subj]);
    }
  };

  const selectFourth = (subj: string) => {
    // If choosing as 4th, it can't be in electives
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
    return false;
  }, [step, data, selectedElectives, selectedFourth]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-xl border border-slate-100 dark:border-slate-800 transition-all">
        <div className="mb-8">
          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? 'bg-brand-primary' : 'bg-slate-100 dark:bg-slate-800'}`} />
            ))}
          </div>
          <h2 className="text-2xl font-black text-brand-text-p leading-none">
            {step === 4 ? 'বিষয় নির্বাচন (Flexible)' : `ধাপ ${step}: প্রোফাইল তৈরি`}
          </h2>
          <p className="text-brand-text-s text-xs mt-2 font-bold uppercase tracking-widest">
            {step === 4 ? 'কলেজ অনুযায়ী তোমার বিষয়গুলো বেছে নাও' : 'এআই তোমার জন্য সঠিক প্ল্যান তৈরি করতে এই তথ্যগুলো প্রয়োজন'}
          </p>
        </div>

        <div className="min-h-[380px]">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-[0.2em] mb-2 ml-1">পূর্ণ নাম</label>
                <input 
                  type="text" 
                  value={data.fullName}
                  onChange={e => setData({...data, fullName: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl bg-brand-bg border-2 border-transparent focus:border-brand-primary text-brand-text-p font-bold outline-none transition-all" 
                  placeholder="তোমার নাম লেখো"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-[0.2em] mb-2 ml-1">কলেজের নাম</label>
                <div className="relative">
                  <School className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-s" size={18} />
                  <input 
                    type="text" 
                    value={data.college}
                    onChange={e => setData({...data, college: e.target.value})}
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-brand-bg border-2 border-transparent focus:border-brand-primary text-brand-text-p font-bold outline-none transition-all" 
                    placeholder="যেমন: নটর ডেম কলেজ"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-[0.2em] mb-2 ml-1">টার্গেট এইচএসসি বছর</label>
                <div className="grid grid-cols-3 gap-3">
                  {YEARS.map(y => (
                    <button 
                      key={y}
                      onClick={() => setData({...data, targetYear: y})}
                      className={`py-4 rounded-2xl border-2 font-black transition-all ${data.targetYear === y ? 'border-brand-primary bg-brand-primary/5 text-brand-primary shadow-sm' : 'border-transparent bg-brand-bg text-brand-text-s hover:bg-brand-surface'}`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-[0.2em] mb-2 ml-1">একাডেমিক গ্রুপ</label>
                <div className="grid grid-cols-1 gap-3">
                  {Object.values(Group).map(g => (
                    <button 
                      key={g}
                      onClick={() => setData({...data, group: g})}
                      className={`px-6 py-4 text-left rounded-2xl border-2 font-black transition-all ${data.group === g ? 'border-brand-primary bg-brand-primary/5 text-brand-primary shadow-sm' : 'border-transparent bg-brand-bg text-brand-text-s hover:bg-brand-surface'}`}
                    >
                      {g} Group
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-[0.2em] mb-2 ml-1">মাধ্যম (Medium)</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.values(Medium).map(m => (
                    <button 
                      key={m}
                      onClick={() => setData({...data, medium: m})}
                      className={`py-4 rounded-2xl border-2 font-black transition-all ${data.medium === m ? 'border-brand-primary bg-brand-primary/5 text-brand-primary shadow-sm' : 'border-transparent bg-brand-bg text-brand-text-s hover:bg-brand-surface'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-[0.2em] mb-2 ml-1">ধর্ম (রুটিন সমন্বয়ের জন্য)</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.values(Religion).map(r => (
                    <button 
                      key={r}
                      onClick={() => setData({...data, religion: r})}
                      className={`py-4 rounded-2xl border-2 font-black transition-all ${data.religion === r ? 'border-brand-primary bg-brand-primary/5 text-brand-primary shadow-sm' : 'border-transparent bg-brand-bg text-brand-text-s hover:bg-brand-surface'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-[0.2em] mb-2 ml-1">শিক্ষা বোর্ড</label>
                <select 
                  value={data.board}
                  onChange={e => setData({...data, board: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl bg-brand-bg border-2 border-transparent focus:border-brand-primary text-brand-text-p font-bold outline-none appearance-none cursor-pointer"
                >
                  {BOARDS.map(b => <option key={b} value={b}>{b} Board</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 h-[420px] overflow-y-auto pr-2 scrollbar-hide">
              <div className="bg-brand-surface/50 p-4 rounded-2xl border border-brand-text-s/10">
                <p className="text-[10px] font-black text-brand-text-s uppercase tracking-widest mb-2">আবশ্যিক বিষয় (Compulsory)</p>
                <div className="flex flex-wrap gap-2">
                  {COMPULSORY_SUBJECTS_LIST.map(s => (
                    <span key={s} className="px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-lg text-[10px] font-bold border border-brand-primary/20">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-[0.2em] mb-3 ml-1">মূল বিষয়সমূহ (Main Subjects - ৩টি বেছে নাও)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {groupSubjectsPool.map(subj => (
                    <button 
                      key={subj}
                      onClick={() => toggleElective(subj)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 font-bold text-xs transition-all ${
                        selectedElectives.includes(subj) 
                          ? 'border-brand-primary bg-brand-primary/5 text-brand-primary shadow-sm' 
                          : 'border-transparent bg-brand-bg text-brand-text-s hover:bg-brand-surface'
                      }`}
                    >
                      {subj}
                      {selectedElectives.includes(subj) && <CheckCircle2 size={16} />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-[0.2em] mb-3 ml-1">৪র্থ বিষয় (Optional - ১টি বেছে নাও)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {groupSubjectsPool.map(subj => (
                    <button 
                      key={`opt-${subj}`}
                      disabled={selectedElectives.includes(subj)}
                      onClick={() => selectFourth(subj)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 font-bold text-xs transition-all ${
                        selectedFourth === subj 
                          ? 'border-brand-secondary bg-brand-secondary/5 text-brand-secondary shadow-sm' 
                          : 'border-transparent bg-brand-bg text-brand-text-s hover:bg-brand-surface disabled:opacity-30'
                      }`}
                    >
                      {subj}
                      {selectedFourth === subj && <CheckCircle2 size={16} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-4">
          {step > 1 && (
            <button 
              onClick={back} 
              className="flex-1 px-4 py-4 bg-brand-surface text-brand-text-p font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-brand-bg transition-all text-xs uppercase tracking-widest"
            >
              <ChevronLeft size={18} /> পিছনে
            </button>
          )}
          <button 
            onClick={step === 4 ? finish : next} 
            disabled={!isStepValid}
            className={`flex-[2] px-4 py-4 font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all text-xs uppercase tracking-widest disabled:opacity-30 disabled:grayscale ${step === 4 ? 'bg-brand-secondary text-white shadow-brand-secondary/20' : 'bg-brand-primary text-white shadow-brand-primary/20'}`}
          >
            {step === 4 ? 'পড়া শুরু করি' : 'পরবর্তী ধাপ'} <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
