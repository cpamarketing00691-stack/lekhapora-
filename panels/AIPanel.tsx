
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UserState } from '../types';
import { 
  Send, Loader2, Sparkles, Trash2, BrainCircuit, 
  Bot, User, AlertCircle, ChevronRight, BookOpen, 
  Zap, Atom, Calculator, MessageSquareText, Copy, Check
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
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
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

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input.trim();
    if (!textToSend || isLoading) return;

    setInput('');
    setError(null);
    
    const userMessage: Message = { role: 'user', text: textToSend };
    const currentHistory = [...messages];
    setMessages(prev => [...prev, userMessage]);
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
          history: currentHistory,
          userProfile: userState.profile
        })
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.reply || data.error || "Connection failed.");
      }

      setMessages(prev => [...prev, { role: 'model', text: data.reply }]);
    } catch (err: any) {
      console.error("AI Panel Error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    { icon: <Zap size={14} className="text-orange-500" />, text: t("এইচএসসি প্রস্তুতির জন্য স্টাডি টিপস দাও", "Study tips for HSC preparation"), val: "HSC প্রস্তুতির জন্য আমাকে কিছু কার্যকরী স্টাডি টিপস দাও।" },
    { icon: <Atom size={14} className="text-brand-primary" />, text: t("ফিজিক্স ১ম পত্রের ২য় অধ্যায় বুঝে দাও", "Explain Physics 1st Paper Ch 2"), val: "ফিজিক্স ১ম পত্রের ২য় অধ্যায় (ভেক্টর) এর মূল বিষয়গুলো সহজে বুঝিয়ে দাও।" },
    { icon: <Calculator size={14} className="text-brand-secondary" />, text: t("ক্যালকুলাস শেখার সেরা উপায় কী?", "Best way to learn calculus?"), val: "HSC তে ক্যালকুলাস সহজে শেখার উপায় কী?" },
    { icon: <MessageSquareText size={14} className="text-emerald-500" />, text: t("আমার ডেইলি রুটিন কেমন হওয়া উচিত?", "Suggest a daily routine"), val: "একজন HSC পরীক্ষার্থী হিসেবে আমার ডেইলি রুটিন কেমন হওয়া উচিত বলে মনে করো?" }
  ];

  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, i) => {
      let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return <li key={i} className="ml-4 mb-1 list-disc" dangerouslySetInnerHTML={{ __html: formatted.replace(/^[*-]\s/, '') }} />;
      }
      return <p key={i} className="mb-2 last:mb-0" dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col bg-brand-surface/40 backdrop-blur-xl rounded-[3rem] border border-brand-text-s/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-700">
      <header className="px-8 py-5 border-b border-brand-text-s/5 bg-brand-surface/80 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary border border-brand-primary/20 shadow-inner group overflow-hidden">
             <Bot size={28} className="group-hover:rotate-12 transition-transform duration-500" />
           </div>
           <div>
              <h3 className="font-black text-brand-text-p uppercase tracking-widest text-sm flex items-center gap-2">
                Lekhapora AI <Sparkles size={14} className="text-orange-500 animate-pulse" />
              </h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-brand-text-s uppercase tracking-widest opacity-60">Gemini Engine Active</span>
              </div>
           </div>
        </div>
        <button 
          onClick={() => { if(confirm(t('পুরো চ্যাট মুছে ফেলতে চাও?', 'Delete all messages?'))) setMessages([]); }} 
          title={t('ক্লিয়ার চ্যাট', 'Clear Chat')}
          className="p-3 text-brand-text-s hover:text-rose-500 transition-all bg-brand-bg/50 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 active:scale-95"
        >
          <Trash2 size={20}/>
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scroll-smooth scrollbar-hide">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-10 animate-in fade-in duration-1000 max-w-2xl mx-auto">
             <div className="relative">
                <div className="absolute inset-0 bg-brand-primary/20 blur-[100px] rounded-full" />
                <BrainCircuit size={100} className="text-brand-primary relative z-10 opacity-80" />
                <Sparkles size={32} className="absolute -top-4 -right-4 text-orange-500 animate-bounce" />
             </div>
             <div className="space-y-4 relative z-10">
               <h4 className="text-2xl font-black text-brand-text-p uppercase tracking-tighter italic">
                 {t('তোমার ব্যক্তিগত এআই পড়ার সঙ্গী', 'Your Personal Study Companion')}
               </h4>
               <p className="text-sm font-medium text-brand-text-s max-w-md mx-auto leading-relaxed">
                 {t('সিলেবাস, কঠিন ম্যাথ বা প্রস্তুতির রুটিন নিয়ে আমাকে যেকোনো প্রশ্ন করো। আমি তোমাকে সেরা উপায় বলে দেব।', 'Ask me anything about your syllabus, difficult math, or preparation strategy. I am here to guide you.')}
               </p>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full relative z-10">
                {suggestions.map((s, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSend(s.val)}
                    className="flex items-center gap-4 p-5 bg-white dark:bg-brand-surface/60 rounded-[1.5rem] border border-brand-text-s/10 hover:border-brand-primary/40 hover:scale-[1.02] hover:shadow-xl hover:shadow-brand-primary/5 transition-all text-left group"
                  >
                    <div className="shrink-0 p-3 bg-brand-bg rounded-xl group-hover:scale-110 transition-transform">{s.icon}</div>
                    <span className="text-[11px] font-bold text-brand-text-p uppercase tracking-tight leading-tight">{s.text}</span>
                    <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </button>
                ))}
             </div>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
            <div className={`max-w-[85%] sm:max-w-[80%] flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-brand-text-s/10 ${m.role === 'user' ? 'bg-brand-primary text-white' : 'bg-brand-surface text-brand-primary'}`}>
                 {m.role === 'user' ? <User size={20}/> : <Bot size={20}/>}
               </div>
               <div className="space-y-2 group relative">
                 <div className={`px-6 py-4 rounded-[2rem] text-sm font-medium leading-relaxed shadow-sm transition-all ${
                   m.role === 'user' 
                     ? 'bg-brand-primary text-white rounded-tr-none' 
                     : 'bg-white dark:bg-brand-surface border border-brand-text-s/5 rounded-tl-none text-brand-text-p'
                 }`}>
                   {m.role === 'model' ? renderFormattedText(m.text) : m.text}
                 </div>
                 {m.role === 'model' && (
                   <button 
                     onClick={() => handleCopy(m.text, i)}
                     className="absolute -bottom-2 -right-2 p-1.5 bg-brand-bg border border-brand-text-s/10 rounded-lg text-brand-text-s hover:text-brand-primary opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                   >
                     {copiedId === i ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                   </button>
                 )}
               </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-4 items-center animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary"><Bot size={20}/></div>
              <div className="px-6 py-4 rounded-[2rem] bg-brand-bg/50 border border-brand-text-s/5 rounded-tl-none flex items-center gap-3">
                <Loader2 size={16} className="animate-spin text-brand-primary" /> 
                <span className="text-xs font-black uppercase tracking-widest text-brand-text-s">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mx-auto max-w-lg p-5 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-3xl flex items-center gap-4 text-rose-600 animate-in shake duration-500">
             <div className="w-10 h-10 bg-rose-500/10 rounded-full flex items-center justify-center shrink-0">
               <AlertCircle size={24} />
             </div>
             <div>
               <p className="text-[11px] font-black uppercase tracking-wider mb-0.5">Connection Problem</p>
               <p className="text-xs font-bold opacity-80">{error}</p>
             </div>
          </div>
        )}
      </div>

      <footer className="p-6 md:p-10 pt-0 shrink-0">
        <div className="relative group max-w-4xl mx-auto">
          <div className="absolute inset-0 bg-brand-primary/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
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
            placeholder={t("যেকোনো প্রশ্ন লিখো বন্ধু...", "Ask anything, friend...")}
            className="w-full pl-8 pr-16 py-5 bg-white dark:bg-brand-bg rounded-[2.5rem] border-2 border-transparent focus:border-brand-primary/40 outline-none font-bold text-sm shadow-xl shadow-brand-primary/5 transition-all resize-none overflow-hidden relative z-10"
            style={{ minHeight: '64px' }}
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-14 h-14 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-brand-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale z-20"
          >
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} className="mr-1" />}
          </button>
        </div>
        <div className="flex items-center justify-center gap-6 mt-6 opacity-40">
           <p className="text-[9px] font-black uppercase text-brand-text-s tracking-[0.3em]">
            Strict NCTB Protocol • High Fidelity Explanations
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AIPanel;
