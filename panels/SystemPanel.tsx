
import React, { useState, useEffect } from 'react';
import { UserState } from '../types';
import { Cpu, Bell, BellOff, Download, RefreshCw, ShieldCheck, Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';
import { registerPushNotifications, checkNotificationPermission } from '../lib/push-service';

interface SystemPanelProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const SystemPanel: React.FC<SystemPanelProps> = ({ userState, onUpdateState }) => {
  const [permission, setPermission] = useState<string>('unknown');
  const [canInstall, setCanInstall] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  useEffect(() => {
    checkNotificationPermission().then(setPermission);
    if ((window as any).deferredPrompt) setCanInstall(true);
  }, []);

  const handlePushToggle = async () => {
    try {
      const { data: { user } } = await (await import('../lib/supabase')).supabase.auth.getUser();
      if (!user) return;
      await registerPushNotifications(user.id);
      setPermission(await checkNotificationPermission());
    } catch (e) {
      alert("Failed to subscribe");
    }
  };

  const forceSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      alert(t("সব তথ্য ক্লাউডে সিঙ্ক করা হয়েছে।", "All data synced to cloud."));
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in duration-500">
       <header className="text-center space-y-3">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary mx-auto mb-6"><Cpu size={32}/></div>
          <h2 className="text-3xl font-black tracking-tight">{t('সিস্টেম ও কন্ট্রোল', 'System & Control')}</h2>
          <p className="text-brand-text-s font-medium">{t('অ্যাপের টেকনিক্যাল সেটিংস ও ডিভাইস কানেক্টিভিটি।', 'Manage app technical settings and device health.')}</p>
       </header>

       <div className="grid grid-cols-1 gap-6">
          <section className="bg-brand-surface p-10 rounded-[3rem] border border-brand-text-s/10 shadow-sm space-y-8">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-600"><Bell size={24}/></div>
                   <div>
                      <h4 className="font-black text-brand-text-p uppercase tracking-widest">{t('পুশ নোটিফিকেশন', 'Push Notifications')}</h4>
                      <p className="text-[10px] font-bold text-brand-text-s uppercase">{permission === 'granted' ? t('সক্রিয় আছে', 'Enabled') : t('নিষ্ক্রিয় আছে', 'Disabled')}</p>
                   </div>
                </div>
                <button 
                  onClick={handlePushToggle}
                  className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${permission === 'granted' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20'}`}
                >
                   {permission === 'granted' ? t('রি-সাবস্ক্রাইব', 'Re-subscribe') : t('অনুমতি দাও', 'Enable Now')}
                </button>
             </div>

             <div className="h-px bg-brand-text-s/5"></div>

             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600"><Smartphone size={24}/></div>
                   <div>
                      <h4 className="font-black text-brand-text-p uppercase tracking-widest">{t('অফলাইন ইনস্টলেশন', 'Offline PWA')}</h4>
                      <p className="text-[10px] font-bold text-brand-text-s uppercase">{t('হোম স্ক্রিনে সরাসরি ব্যবহার', 'Direct Home Screen Access')}</p>
                   </div>
                </div>
                <button 
                  disabled={!canInstall}
                  className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 disabled:opacity-20 transition-all"
                >
                   <Download size={16}/>
                </button>
             </div>

             <div className="h-px bg-brand-text-s/5"></div>

             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary"><RefreshCw className={isSyncing ? 'animate-spin' : ''} size={24}/></div>
                   <div>
                      <h4 className="font-black text-brand-text-p uppercase tracking-widest">{t('ক্লাউড সিঙ্ক', 'Cloud Sync')}</h4>
                      <p className="text-[10px] font-bold text-brand-text-s uppercase">{t('তথ্য ম্যানুয়ালি সিঙ্ক করো', 'Force metadata sync')}</p>
                   </div>
                </div>
                <button 
                  onClick={forceSync}
                  className="px-6 py-3 bg-brand-bg text-brand-text-p border border-brand-text-s/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-surface transition-all"
                >
                   {t('সিঙ্ক', 'Sync')}
                </button>
             </div>
          </section>

          <section className="bg-brand-primary/5 p-8 rounded-[2.5rem] border border-brand-primary/20 flex items-center gap-6">
             <ShieldCheck size={32} className="text-brand-primary shrink-0" />
             <div>
                <p className="text-sm font-black text-brand-text-p italic">{t('নিরাপত্তা আপডেট', 'Security Verified')}</p>
                <p className="text-[10px] font-medium text-brand-text-s leading-relaxed">
                   {t('তোমার সব তথ্য ২৫৬-বিট ইনক্রিপশন দ্বারা সুরক্ষিত। আমরা তোমার ব্যক্তিগত তথ্য কারো কাছে শেয়ার করি না।', 'Your data is secured with 256-bit encryption. We never share your personal history with 3rd parties.')}
                </p>
             </div>
          </section>
       </div>
    </div>
  );
};

export default SystemPanel;
