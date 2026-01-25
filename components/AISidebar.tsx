
import React, { useState, useRef, useEffect } from 'react';
import { UserState } from '../types';
import { geminiService } from '../services/gemini';
import { Send, Bot, Sparkles, Loader2, User, AlertCircle, Key } from 'lucide-react';

interface AISidebarProps {
  userState: UserState;
}

const AISidebar: React.FC<AISidebarProps> = ({ userState }) => {
  const [messages, setMessages] = useState<{role: 'ai' | 'user', text: string}[]>([
    { role: 'ai', text: `কিরে ${userState.profile?.fullName}! কেমন আছো? আজ কি পড়ার প্ল্যান তোমার?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Check if API key is available in the environment
  useEffect(() => {
    const checkKey = async () => {
      if (typeof window !== 'undefined' && (window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
          setNeedsKey(true);
        }
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setNeedsKey(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userText = input;
    setInput('');
    setError(null);
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const response = await geminiService.chat(userState.profile, userText, messages);
      setMessages(prev => [...prev, { role: 'ai', text: response || "বুঝতে পারলাম না, আবার বলবে?" }]);
    } catch (err: any) {
      console.error("Chat UI Error:", err);
      // Check for common error patterns
      const msg = err.message || "";
      if (msg.includes("Requested entity was not found") || msg.includes("API_KEY")) {
        setNeedsKey(true);
        setError("API Key Selection Required");
      } else {
        setError(msg || "সমস্যা হয়েছে");
      }
      setMessages(prev => [...prev, { role: 'ai', text: "দুঃখিত, আমি এই মুহূর্তে কাজ করতে পারছি না। একটু পরে আবার চেষ্টা করো।" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800">
      <div className="p-5 bg-emerald-500 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Bot size={22} />
          </div>
          <div>
            <h3 className="font-bold leading-tight">{userState.profile?.aiName}</h3>
            <p className="text-[10px] opacity-80 uppercase tracking-widest font-bold">Online Buddy</p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-900/50">
        {needsKey && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-6 rounded-3xl text-center space-y-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center mx-auto text-amber-600">
              <Key size={24} />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 dark:text-amber-100">API Key Selection Required</h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">To use the AI buddy, you need to select a paid project API key. See <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline font-bold">billing docs</a>.</p>
            </div>
            <button 
              onClick={handleOpenKeySelector}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-amber-500/20"
            >
              Select API Key
            </button>
          </div>
        )}

        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
            {m.role === 'ai' && (
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Bot size={12} className="text-emerald-600" />
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm font-medium shadow-sm transition-all ${
              m.role === 'user' 
                ? 'bg-slate-900 text-white rounded-br-none' 
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-100 dark:border-slate-700'
            }`}>
              {m.text}
            </div>
            {m.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                <User size={12} className="text-slate-600" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
              <Bot size={12} className="text-emerald-600" />
            </div>
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none shadow-sm">
              <Loader2 className="animate-spin text-emerald-500" size={14} />
            </div>
          </div>
        )}
        {error && !needsKey && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 text-xs rounded-full border border-red-100">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <div className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={needsKey}
            placeholder={needsKey ? "Please select a key above" : "কিছু জানতে চাও?"}
            className="flex-1 bg-transparent border-0 px-3 py-2 text-sm focus:ring-0 placeholder:text-slate-400 disabled:opacity-50"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading || needsKey}
            className="bg-emerald-500 text-white p-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 shadow-lg shadow-emerald-500/20"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISidebar;
