import React, { useState, useEffect } from 'react';
import { UserState, UserProfile, Religion, Group } from '../types';
import { User, Languages, School, Plus, Trash2, GraduationCap, Bell, BellOff, ArrowRight } from 'lucide-react';
import { BOARDS } from '../constants';

interface SettingsProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ userState, onUpdateState, onLogout }) => {
  const [newExam, setNewExam] = useState({ name: '', date: '' });
  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  useEffect(() => {
    const OneSignal = (window as any).OneSignal;
    if (OneSignal && userState.notificationsEnabled) {
      const permission = OneSignal.Notifications?.permission;
      if (permission === false) {
        onUpdateState(prev => ({ ...prev, notificationsEnabled: false }));
      }
    }
  }, []);

  const updateProfile = (updates: Partial<UserProfile>) => {
    onUpdateState(prev => ({
      ...prev,
      profile: prev.profile ? { ...prev.profile, ...updates } : null
    }));
  };

  const toggleNotifications = async () => {
    const OneSignal = (window as any).OneSignal;
    if (!OneSignal) {
      alert(t("পুষ নোটিফিকেশন সিস্টেম লোড হচ্ছে, দয়া করে একটু অপেক্ষা করো।", "Notification system is loading, please wait a moment."));
      return;
    }

    if (!userState.notificationsEnabled) {
      try {
        await OneSignal.Notifications.requestPermission();
        if (OneSignal.Notifications.permission) {
          onUpdateState(prev => ({ ...prev, notificationsEnabled: true }));
        } else {
          alert(t("দয়া করে ব্রাউজার সেটিংস থেকে নোটিফিকেশন অ্যালাউ করো।", "Please allow notifications in your browser settings to use this feature."));
        }
      } catch (err) {
        console.error("OneSignal permission error:", err);
      }
    } else {
      onUpdateState(prev => ({ ...prev, notificationsEnabled: false }));
    }
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
        <h2 className="text-3xl font-black text-brand-text-p">{t('সেটিংস ও প্রোফাইল', 'Settings & Profile')}</h2>
        <p className="text-brand-text-s font-medium mt-1">{t('তোমার অ্যাকাউন্ট এবং অ্যাপের পছন্দগুলি পরিচালনা করো।', 'Manage your account and preferences.')}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                <select value={userState.profile?.group} onChange={(e) => updateProfile({ group: e.target.value as Group })} className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-xl px-4 py-3 text-sm font-bold transition-all outline-none appearance-none">
                  {Object.values(Group).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-brand-text-s tracking-widest mb-1">{t('বোর্ড', 'Board')}</label>
                <select value={userState.profile?.board} onChange={(e) => updateProfile({ board: e.target.value })} className="w-full bg-brand-bg border-2 border-transparent focus:border-brand-primary rounded-xl px-4 py-3 text-sm font-bold transition-all outline-none appearance-none">
                  {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-8">
          <section className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="text-brand-primary" size={20} />
              <h3 className="font-bold text-lg">{t('পরীক্ষা তালিকা', 'Exams')}</h3>
            </div>
            <div className="space-y-4">
               <div className="p-4 bg-brand-bg rounded-2xl border border-brand-primary/20 space-y-3">
                  <input type="text" value={newExam.name} onChange={e => setNewExam({...newExam, name: e.target.value})} placeholder={t("পরীক্ষার নাম", "Exam Name")} className="w-full bg-brand-surface px-3 py-2 rounded-lg text-xs font-bold outline-none" />
                  <input type="date" value={newExam.date} onChange={e => setNewExam({...newExam, date: e.target.value})} className="w-full bg-brand-surface px-3 py-2 rounded-lg text-xs font-bold outline-none cursor-pointer" />
                  <button onClick={addExam} className="w-full py-2 bg-brand-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"><Plus size={14} />{t('অ্যাড', 'Add')}</button>
               </div>
               <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-hide">
                 {(userState.profile?.collegeExams || []).map(ex => (
                    <div key={ex.id} className="flex items-center justify-between p-3 bg-brand-bg rounded-xl border border-transparent hover:border-brand-primary/20 transition-all group">
                       <div>
                         <p className="text-[10px] font-black text-brand-text-p">{ex.name}</p>
                         <p className="text-[8px] font-bold text-brand-text-s uppercase">{ex.date}</p>
                       </div>
                       <button onClick={() => removeExam(ex.id)} className="text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                    </div>
                 ))}
               </div>
            </div>
          </section>

          <section className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-text-s/10 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Languages className="text-brand-secondary" size={20} />
              <h3 className="font-bold text-lg">{t('পছন্দসমূহ', 'Preferences')}</h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">{t('ভাষা', 'Language')}</p>
              </div>
              <div className="flex bg-brand-bg p-1 rounded-xl">
                <button onClick={() => onUpdateState(prev => ({ ...prev, language: 'bn' }))} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${userState.language === 'bn' ? 'bg-brand-primary text-white shadow-md' : 'text-brand-text-s hover:bg-brand-surface'}`}>বাংলা</button>
                <button onClick={() => onUpdateState(prev => ({ ...prev, language: 'en' }))} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${userState.language === 'en' ? 'bg-brand-primary text-white shadow-md' : 'text-brand-text-s hover:bg-brand-surface'}`}>English</button>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-brand-text-s/10">
              <div>
                <p className="font-bold text-sm">{t('নোটিফিকেশন', 'Notifications')}</p>
              </div>
              <button 
                onClick={toggleNotifications}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all shadow-md active:scale-95 ${userState.notificationsEnabled ? 'bg-brand-primary text-white shadow-brand-primary/20' : 'bg-brand-bg text-brand-text-s border border-brand-text-s/10'}`}
              >
                {userState.notificationsEnabled ? <Bell size={14} /> : <BellOff size={14} />}
                {userState.notificationsEnabled ? t('চালু', 'ON') : t('বন্ধ', 'OFF')}
              </button>
            </div>
          </section>

          <button onClick={onLogout} className="w-full bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white border border-red-500/20 font-black py-4 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 uppercase tracking-widest text-xs active:scale-95">
             {t('লগ আউট', 'Logout')} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;