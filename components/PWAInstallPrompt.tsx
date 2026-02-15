import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if prompt is already available on window (stashed by index.tsx)
    const checkPrompt = () => {
      if ((window as any).deferredPrompt) {
        // Show prompt after a small delay if available
        const timer = setTimeout(() => setShow(true), 5000);
        return () => clearTimeout(timer);
      }
    };

    checkPrompt();
    window.addEventListener('pwa-install-ready', checkPrompt);
    return () => window.removeEventListener('pwa-install-ready', checkPrompt);
  }, []);

  const handleInstall = async () => {
    const promptEvent = (window as any).deferredPrompt;
    if (!promptEvent) return;

    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    
    if (outcome === 'accepted') {
      (window as any).deferredPrompt = null;
      setShow(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-24 md:bottom-8 left-4 right-4 md:left-auto md:right-8 md:w-80 z-[100] animate-in slide-in-from-bottom duration-500">
      <div className="bg-white dark:bg-brand-surface p-6 rounded-[2.5rem] shadow-2xl border border-brand-text-s/10">
        <button onClick={() => setShow(false)} className="absolute top-4 right-4 text-brand-text-s hover:text-brand-text-p">
          <X size={18} />
        </button>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
            <Smartphone size={24} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase text-brand-text-p">অ্যাপ ইনস্টল করুন</h4>
            <p className="text-[10px] font-medium text-brand-text-s leading-tight">হোম স্ক্রিনে সরাসরি ব্যবহার এবং অফলাইন সাপোর্ট পান।</p>
          </div>
        </div>
        <button 
          onClick={handleInstall}
          className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20"
        >
          <Download size={16} /> ইনস্টল
        </button>
      </div>
    </div>
  );
};