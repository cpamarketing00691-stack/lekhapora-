import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UserState } from '../types';
import { 
  Send, Loader2, Sparkles, Trash2, BrainCircuit, 
  Bot, User, AlertCircle, ChevronRight, BookOpen, 
  Zap, Atom, Calculator
} from 'lucide-react';

interface AIPanelProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AIPanel: React.FC<AIPanelProps> = ({ userState }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input.trim();
    if (!textToSend || isLoading) return;

    setInput('');
    setError(null);
    const newMessages: Message[] = [...messages, { role: 'user', text: textToSend }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          message: textToSend,
          history: messages // Pass existing history for context
        })
      });

      // Handle non-JSON responses (MIME type errors)
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("API configuration error. The server returned an invalid format.");
      }

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.response || "Connection failed to AI server.");
      }

      setMessages(prev => [...prev, { role: 'model', text: data.response }]);
    } catch (err: any) {
      console.error("AI Panel Error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    { icon: <Zap size={14} />, text: t("এইচএসসি প্রস্তুতির টিপস দাও", "Tips for HSC exam preparation"), val: "Give me some solid tips for HSC exam preparation." },
    { icon: <Atom size={14} />, text: t("নিউটনের গতিসূত্র বুঝিয়ে বলো", "Explain Newton's laws of motion"), val: "Explain Newton's laws of motion simply." },
    { icon: <Calculator size={14} />, text: t("দ্বিঘাত সমীকরণ সমাধানের নিয়ম", "Solve quadratic equations"), val: "How to solve quadratic equations step by step?" },
    { icon: <BookOpen size={14} />, text: t("সালোকসংশ্লেষণ কী?", "What is photosynthesis?"), val: "Explain the process of photosynthesis for biology." }
  ];

  return (
    <div className="h-[calc(100vh-14rem)] flex flex-col bg-brand-surface/40 backdrop-blur-md rounded-[3rem] border border-brand-text-s/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
      {/* Header */}
      <header className="px-8 py-6 border-b border-brand-text-s/5 bg-brand-bg/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary shadow-inner">
             <Bot size={28} />
           </div>
           <div>
              <h3 className="font-black text-brand-text-p uppercase tracking-widest text-sm">{t('এআই স্টাডি অ্যাসিস্ট্যান্ট', 'AI Study Assistant')}</h3>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[9px] font-black text-brand-text-s uppercase tracking-widest opacity-60">Powered by DeepSeek</span>
              </div>
           </div>
        </div>
        <button onClick={() => setMessages([])} className="p-2.5 text-brand-text-s hover:text-rose-500 transition-colors bg-brand-bg/50 rounded-xl">
          <Trash2 size={18}/>
        </button>
      </header>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-hide">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-1000">
             <div className="relative">
                <BrainCircuit size={80} className="text-brand-primary opacity-20" />
                <Sparkles size={24} className="absolute -top-2 -right-2 text-brand-primary animate-bounce" />
             </div>
             <div className="space-y-2">
               <p className="text-base font-black text-brand-text-p uppercase tracking-widest">{t('তোমার ব্যক্তিগত পড়ার সঙ্গী', 'Your Personal Study Mate')}</p>
               <p className="text-xs font-medium text-brand-text-s max-w-xs mx-auto leading-relaxed">
                 {t('সিলেবাস বা যেকোনো বিষয় নিয়ে প্রশ্ন করো। আমি তোমাকে বুঝিয়ে দেব।', 'Ask me anything about your syllabus or difficult topics. I am here to help.')}
               </p>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {suggestions.map((s, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSend(s.val)}
                    className="flex items-center gap-3 p-4 bg-white dark:bg-brand-bg/50 rounded-2xl border border-brand-text-s/10 hover:border-brand-primary/40 hover:scale-[1.02] transition-all text-left group"
                  >
                    <div className="text-brand-primary group-hover:scale-110 transition-transform">{s.icon}</div>
                    <span className="text-[10px] font-bold text-brand-text-p uppercase tracking-tight">{s.text}</span>
                    <ChevronRight size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
             </div>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] sm:max-w-[75%] flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${m.role === 'user' ? 'bg-brand-primary text-white' : 'bg-brand-surface text-brand-primary border border-brand-text-s/10'}`}>
                 {m.role === 'user' ? <User size={20}/> : <Bot size={20}/>}
               </div>
               <div className={`px-6 py-4 rounded-[2rem] text-sm font-medium leading-relaxed shadow-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-brand-primary text-white' : 'bg-white dark:bg-brand-bg text-brand-text-p border border-brand-text-s/5'}`}>
                 {m.text}
               </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-4 items-center animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-brand-surface flex items-center justify-center text-brand-primary"><Bot size={20}/></div>
              <div className="px-6 py-4 rounded-[2rem] bg-brand-bg/50 text-brand-text-s italic text-xs flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Thinking...
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mx-auto max-w-sm p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-rose-600 animate-in shake duration-300">
             <AlertCircle size={18} className="shrink-0" />
             <p className="text-[10px] font-bold uppercase tracking-tight">{error}</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <footer className="p-6 md:p-8 pt-0 shrink-0">
        <div className="relative group">
          <textarea 
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t("কী জানতে চাও বন্ধু?", "What's on your mind, friend?")}
            className="w-full pl-8 pr-16 py-5 bg-brand-bg rounded-[2.5rem] border-2 border-transparent focus:border-brand-primary/20 outline-none font-bold text-sm shadow-inner transition-all resize-none overflow-hidden"
            style={{ minHeight: '60px' }}
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
        <p className="text-[8px] font-black uppercase text-brand-text-s text-center mt-4 tracking-[0.2em] opacity-40">
          Lekhapora Intelligence Engine • Strict NCTB Protocol
        </p>
      </footer>
    </div>
  );
};

export default AIPanel;