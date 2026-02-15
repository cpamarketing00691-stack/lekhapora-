import React, { useState, useEffect } from 'react';
import { isBrowserSupported } from '../utils/browserCheck';
import { AlertTriangle, X } from 'lucide-react';

export const BrowserWarning: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isBrowserSupported()) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[999] bg-orange-500 text-white p-4 shadow-xl animate-in slide-in-from-top duration-500">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle size={20} className="shrink-0" />
          <p className="text-xs font-bold leading-tight">
            আপনার ব্রাউজারটি পুরনো। সেরা অভিজ্ঞতার জন্য Chrome বা Safari-এর সর্বশেষ সংস্করণ ব্যবহার করুন।
          </p>
        </div>
        <button onClick={() => setShow(false)} className="p-2 hover:bg-white/20 rounded-lg">
          <X size={18} />
        </button>
      </div>
    </div>
  );
};