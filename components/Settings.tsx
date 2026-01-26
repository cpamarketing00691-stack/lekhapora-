
import React, { useState } from 'react';
import { UserState, UserProfile, Religion, Medium, Group, CollegeExam } from '../types';
import { User, LogOut, Languages, Palette, ShieldCheck, Calendar, School, Plus, Trash2, GraduationCap } from 'lucide-react';
import { BOARDS, YEARS } from '../constants';

interface SettingsProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ userState, onUpdateState, onLogout }) => {
  const [newExam, setNewExam] = useState({ name: '', date: '' });
  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  const updateProfile = (updates: Partial<UserProfile>) => {
    onUpdateState(prev => ({
      ...prev,
      profile: prev.profile ? { ...prev.profile, ...updates } : null
    }));
  };

  const addExam = () => {
    if (!newExam.name || !newExam.date) return;
    onUpdateState(prev => ({
      ...prev,
      profile: prev.profile ? {
        ...prev.profile,
        collegeExams: [...(prev.profile.collegeExams || []), { id: `exam-${Date.now()}`, name: newExam.name, date: newExam.date }]
      } : null
    }));
    setNewExam({ name: '', date: '' });
  };

  const removeExam = (id: string) => {
    onUpdateState(prev => ({
      ...prev,
      profile: prev.profile ? {
        ...prev.profile,
        collegeExams: (prev.profile.collegeExams || []).filter(ex => ex.id !== id)
      } : null
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h2 className="text-3xl font-black">{t('সেটিংস ও প্রোফাইল', 'Settings & Profile')}</h2>
        <p className="text-brand-text-s font-medium mt-1">{t('তোমার অ্যাকাউন্ট এবং অ্যাপের পছন্দগুলি পরিচালনা করো।', 'Manage your account and app preferences.')}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Card */}
        <section className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <User className="text-brand-primary" size={20} />
            <h3 className="font-bold text-lg">{t('ব্যক্তিগত তথ্য', 'Personal Info')}</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-widest mb-1">{t('পুরো নাম', 'Full Name')}</label>
              <input type="text" value={userState.profile?.fullName || ''} onChange={(e) => updateProfile({ fullName: e.target.value })} className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-xl px-4 py-3 font-bold transition-all outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-widest mb-1">{t('কলেজের নাম', 'College')}</label>
              <div className="relative">
                <School className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-s" size={16} />
                <input type="text" value={userState.profile?.college || ''} onChange={(e) => updateProfile({ college: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-xl font-bold transition-all outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-widest mb-1">{t('বিভাগ', 'Group')}</label>
                <select value={userState.profile?.group} onChange={(e) => updateProfile({ group: e.target.value as Group })} className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-xl px-4 py-3 text-sm font-bold transition-all outline-none">
                  {Object.values(Group).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-widest mb-1">{t('বোর্ড', 'Board')}</label>
                <select value={userState.profile?.board} onChange={(e) => updateProfile({ board: e.target.value })} className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-xl px-4 py-3 text-sm font-bold transition-all outline-none">
                  {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-widest mb-1">{t('ধর্ম', 'Religion')}</label>
              <select value={userState.profile?.religion} onChange={(e) => updateProfile({ religion: e.target.value as Religion })} className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-xl px-4 py-3 text-sm font-bold transition-all outline-none">
                {Object.values(Religion).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </section>

        <div className="space-y-8">
          {/* Exam Manager Section */}
          <section className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="text-brand-primary" size={20} />
              <h3 className="font-bold text-lg">{t('কলেজ পরীক্ষা তালিকা', 'College Exams')}</h3>
            </div>
            
            <div className="space-y-4">
               <div className="p-4 bg-brand-bg rounded-2xl border border-brand-primary/20 space-y-3">
                  <input type="text" value={newExam.name} onChange={e => setNewExam({...newExam, name: e.target.value})} placeholder={t("পরীক্ষার নাম", "Exam Name")} className="w-full bg-brand-surface px-3 py-2 rounded-lg text-xs font-bold outline-none" />
                  <input type="date" value={newExam.date} onChange={e => setNewExam({...newExam, date: e.target.value})} className="w-full bg-brand-surface px-3 py-2 rounded-lg text-xs font-bold outline-none cursor-pointer" />
                  <button onClick={addExam} className="w-full py-2 bg-brand-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"><Plus size={14} />{t('অ্যাড', 'Add')}</button>
               </div>
               
               <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-hide">
                 {(userState.profile?.collegeExams || []).map(ex => (
                    <div key={ex.id} className="flex items-center justify-between p-3 bg-brand-bg rounded-xl group border border-transparent hover:border-brand-primary/20 transition-all">
                       <div>
                         <p className="text-[10px] font-black text-brand-text-p">{ex.name}</p>
                         <p className="text-[8px] font-bold text-brand-text-s uppercase">{ex.date}</p>
                       </div>
                       <button onClick={() => removeExam(ex.id)} className="text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                    </div>
                 ))}
               </div>
            </div>
            
            <div className="pt-4 border-t border-brand-text-s/10">
              <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-widest mb-1">{t('এইচএসসি লক্ষ্য তারিখ', 'Main HSC Date')}</label>
              <input type="date" value={userState.profile?.targetExamDate || ''} onChange={(e) => updateProfile({ targetExamDate: e.target.value })} className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-xl px-4 py-3 font-bold transition-all outline-none cursor-pointer" />
            </div>
          </section>

          {/* Preferences */}
          <section className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Languages className="text-brand-secondary" size={20} />
              <h3 className="font-bold text-lg">{t('পছন্দসমূহ', 'Preferences')}</h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">{t('ভাষা', 'Language')}</p>
                <p className="text-xs text-brand-text-s">{t('অ্যাপের ভাষা পরিবর্তন করো', 'Change language')}</p>
              </div>
              <div className="flex bg-brand-bg p-1 rounded-xl">
                <button onClick={() => onUpdateState(prev => ({ ...prev, language: 'bn' }))} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${userState.language === 'bn' ? 'bg-brand-primary text-white shadow-sm' : 'text-brand-text-s'}`}>বাংলা</button>
                <button onClick={() => onUpdateState(prev => ({ ...prev, language: 'en' }))} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${userState.language === 'en' ? 'bg-brand-primary text-white shadow-sm' : 'text-brand-text-s'}`}>English</button>
              </div>
            </div>
          </section>

          {/* Logout Zone */}
          <section className="bg-red-50 dark:bg-red-950/10 p-6 rounded-[2.5rem] border border-red-100 dark:border-red-900/20 space-y-4">
            <button onClick={onLogout} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-red-500/20 text-xs uppercase tracking-widest">
              {t('লগ আউট', 'Logout')}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
