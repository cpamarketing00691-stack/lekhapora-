
import React from 'react';
import { UserState, UserProfile, Religion, Medium, Group } from '../types';
import { User, LogOut, Languages, Palette, ShieldCheck, Calendar, School } from 'lucide-react';
import { BOARDS, YEARS } from '../constants';

interface SettingsProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ userState, onUpdateState, onLogout }) => {
  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  const updateProfile = (updates: Partial<UserProfile>) => {
    onUpdateState(prev => ({
      ...prev,
      profile: prev.profile ? { ...prev.profile, ...updates } : null
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
        <section className="bg-brand-surface p-6 sm:p-8 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <User className="text-brand-primary" size={20} />
            <h3 className="font-bold text-lg">{t('ব্যক্তিগত তথ্য', 'Personal Info')}</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-widest mb-1 ml-1">{t('পুরো নাম', 'Full Name')}</label>
              <input 
                type="text" 
                value={userState.profile?.fullName || ''}
                onChange={(e) => updateProfile({ fullName: e.target.value })}
                className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-xl px-4 py-3 font-bold transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-widest mb-1 ml-1">{t('কলেজের নাম', 'College')}</label>
              <div className="relative">
                <School className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-s" size={16} />
                <input 
                  type="text" 
                  value={userState.profile?.college || ''}
                  onChange={(e) => updateProfile({ college: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-xl font-bold transition-all outline-none"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-widest mb-1 ml-1">{t('বিভাগ', 'Group')}</label>
                <select 
                  value={userState.profile?.group}
                  onChange={(e) => updateProfile({ group: e.target.value as Group })}
                  className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-xl px-4 py-3 text-sm font-bold transition-all outline-none"
                >
                  {Object.values(Group).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-widest mb-1 ml-1">{t('বোর্ড', 'Board')}</label>
                <select 
                  value={userState.profile?.board}
                  onChange={(e) => updateProfile({ board: e.target.value })}
                  className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-xl px-4 py-3 text-sm font-bold transition-all outline-none"
                >
                  {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-widest mb-1 ml-1">{t('ধর্ম', 'Religion')}</label>
              <select 
                value={userState.profile?.religion}
                onChange={(e) => updateProfile({ religion: e.target.value as Religion })}
                className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-xl px-4 py-3 text-sm font-bold transition-all outline-none"
              >
                {Object.values(Religion).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </section>

        <div className="space-y-8">
          {/* Exam Target Date */}
          <section className="bg-brand-surface p-6 sm:p-8 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="text-brand-primary" size={20} />
              <h3 className="font-bold text-lg">{t('এইচএসসি লক্ষ্যমাত্রা', 'HSC Target')}</h3>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-widest mb-1 ml-1">{t('পরীক্ষা শুরুর তারিখ', 'HSC Start Date')}</label>
              <input 
                type="date" 
                value={userState.profile?.targetExamDate || ''}
                onChange={(e) => updateProfile({ targetExamDate: e.target.value })}
                className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-xl px-4 py-3 font-bold transition-all outline-none cursor-pointer"
              />
              <p className="text-[10px] text-brand-text-s mt-2 italic">{t('* এই তারিখ থেকে ড্যাশবোর্ডে কাউন্টডাউন শুরু হবে।', '* This date starts the main countdown on your dashboard.')}</p>
            </div>
          </section>

           {/* Preferences */}
          <section className="bg-brand-surface p-6 sm:p-8 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Languages className="text-brand-secondary" size={20} />
              <h3 className="font-bold text-lg">{t('পছন্দসমূহ', 'Preferences')}</h3>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{t('ভাষা', 'Language')}</p>
                  <p className="text-xs text-brand-text-s">{t('অ্যাপের ভাষা পরিবর্তন করো', 'Change the app language')}</p>
                </div>
                <div className="flex bg-brand-bg p-1 rounded-xl">
                  <button 
                    onClick={() => onUpdateState(prev => ({ ...prev, language: 'bn' }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${userState.language === 'bn' ? 'bg-brand-primary text-white shadow-sm' : 'text-brand-text-s'}`}
                  >
                    বাংলা
                  </button>
                  <button 
                    onClick={() => onUpdateState(prev => ({ ...prev, language: 'en' }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${userState.language === 'en' ? 'bg-brand-primary text-white shadow-sm' : 'text-brand-text-s'}`}
                  >
                    English
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-brand-text-s/10">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-brand-text-s" size={16} />
                  <p className="text-xs font-medium text-brand-text-s">{t('NCTB কমপ্লায়েন্স একটিভ', 'NCTB Compliance Active')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Logout Zone */}
          <section className="bg-red-50 dark:bg-red-950/10 p-6 sm:p-8 rounded-[2.5rem] border border-red-100 dark:border-red-900/20 space-y-4">
            <div>
              <h3 className="font-bold text-red-600 flex items-center gap-2">
                <LogOut size={18} /> {t('অ্যাকাউন্ট', 'Account')}
              </h3>
              <p className="text-xs text-red-500/70 mt-1 font-medium">{t('লগ আউট করলে তোমার সেশন মুছে যাবে কিন্তু ডাটা সেভ থাকবে।', 'Logging out will clear your session but data remains saved locally.')}</p>
            </div>
            <button 
              onClick={onLogout}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-red-500/20 active:scale-95 text-xs uppercase tracking-widest"
            >
              {t('লগ আউট', 'Logout')}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
