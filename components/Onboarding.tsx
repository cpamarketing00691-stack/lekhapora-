
import React, { useState } from 'react';
import { Group, Religion, Medium, UserProfile } from '../types';
import { BOARDS, YEARS } from '../constants';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<UserProfile>>({
    fullName: '',
    group: Group.SCIENCE,
    board: BOARDS[0],
    medium: Medium.BANGLA,
    targetYear: YEARS[0],
    religion: Religion.ISLAM,
  });

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const finish = () => {
    if (data.fullName && data.group && data.board && data.medium && data.targetYear && data.religion) {
      const finalProfile: UserProfile = {
        ...data as UserProfile,
        aiName: `${data.fullName.split(' ')[0]} AI`
      };
      onComplete(finalProfile);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-10 shadow-xl">
        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-emerald-500' : 'bg-slate-100 dark:bg-slate-800'}`} />
            ))}
          </div>
          <h2 className="text-2xl font-bold">Step {step}: Profile Completion</h2>
          <p className="text-slate-500">The AI needs these details to build your plan.</p>
        </div>

        <div className="min-h-[300px]">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">FULL NAME</label>
                <input 
                  type="text" 
                  value={data.fullName}
                  onChange={e => setData({...data, fullName: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-emerald-500" 
                  placeholder="Enter your real name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">TARGET HSC YEAR</label>
                <div className="grid grid-cols-3 gap-3">
                  {YEARS.map(y => (
                    <button 
                      key={y}
                      onClick={() => setData({...data, targetYear: y})}
                      className={`py-3 rounded-xl border-2 transition-all ${data.targetYear === y ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'border-slate-100 dark:border-slate-800'}`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">ACADEMIC GROUP</label>
                <div className="grid grid-cols-1 gap-3">
                  {Object.values(Group).map(g => (
                    <button 
                      key={g}
                      onClick={() => setData({...data, group: g})}
                      className={`px-4 py-3 text-left rounded-xl border-2 transition-all ${data.group === g ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'border-slate-100 dark:border-slate-800'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">MEDIUM</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.values(Medium).map(m => (
                    <button 
                      key={m}
                      onClick={() => setData({...data, medium: m})}
                      className={`py-3 rounded-xl border-2 transition-all ${data.medium === m ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'border-slate-100 dark:border-slate-800'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">RELIGION (FOR ROUTINE ADJUSTMENT)</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.values(Religion).map(r => (
                    <button 
                      key={r}
                      onClick={() => setData({...data, religion: r})}
                      className={`py-3 rounded-xl border-2 transition-all ${data.religion === r ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'border-slate-100 dark:border-slate-800'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">EDUCATION BOARD</label>
                <select 
                  value={data.board}
                  onChange={e => setData({...data, board: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-emerald-500"
                >
                  {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 flex gap-4">
          {step > 1 && (
            <button onClick={back} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl flex items-center justify-center gap-2">
              <ChevronLeft size={20} /> Back
            </button>
          )}
          <button 
            onClick={step === 3 ? finish : next} 
            className="flex-[2] px-4 py-3 bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            {step === 3 ? 'Get Started' : 'Continue'} <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
