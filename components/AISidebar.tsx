
import React, { useState, useRef, useEffect } from 'react';
import { UserState } from '../types';
import { geminiService } from '../services/gemini';
import { Send, Bot, Sparkles, Loader2, User, AlertCircle, Lightbulb } from 'lucide-react';

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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or when loading begins
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  /**
   * Handles sending messages to the AI backend.
   * Connects to /api/chat via GeminiService.
   */
  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading) return;
    
    // UI Feedback: Clear input immediately if manual entry
    if (!customText) setInput('');
    setError(null);
    
    // Add user message to UI immediately
    const userMessage = { role: 'user' as const, text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    
    // Enter loading state
    setIsLoading(true);

    try {
      /**
       * Connect to /api/chat endpoint.
       * Logic encapsulated in GeminiService for cleaner architecture.
       */
      const response = await geminiService.chat(userState.profile, textToSend, messages);
      
      // Update UI with the AI reply from the backend
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: response || "দুঃখিত, আমি তোমার কথা বুঝতে পারিনি।" 
      }]);
    } catch (err: any) {
      console.error("Chat API Connection Error:", err);
      setError("সার্ভারের সাথে যোগাযোগ করতে সমস্যা হয়েছে।");
      
      // Fallback AI message for error states
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: "দুঃখিত, আমার সার্ভারে সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করো।" 
      }]);
    } finally {
      // Exit loading state
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-brand-surface rounded-[2rem] overflow-hidden border border-brand-text-s/10 shadow-sm">
      {/* Buddy Header */}
      <div className="p-5 bg-brand-primary text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
            <Bot size={22} />
          </div>
          <div>
            <h3 className="font-black text-sm tracking-tight">{userState.profile?.aiName}</h3>
            <p className="text-[10px] opacity-80 uppercase tracking-widest font-black">Study Buddy Active</p>
          </div>
        </div>
      </div>

      {/* Message List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-brand-bg/30 dark:bg-brand-bg/10">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2 animate-in fade-in slide-in-from-bottom-2`}>
            {m.role === 'ai' && (
              <div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 border border-brand-primary/20">
                <Bot size={12} className="text-brand-primary" />
              </div>
            )}
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium shadow-sm border transition-all ${
              m.role === 'user' 
                ? 'bg-brand-primary text-white border-brand-primary rounded-br-none' 
                : 'bg-white dark:bg-brand-surface text-brand-text-p rounded-bl-none border-brand-text-s/10'
            }`}>
              {m.text}
            </div>
            {m.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-brand-surface border border-brand-text-s/10 flex items-center justify-center shrink-0">
                <User size={12} className="text-brand-text-s" />
              </div>
            )}
          </div>
        ))}
        
        {/* API Loading Animation */}
        {isLoading && (
          <div className="flex justify-start items-center gap-2 animate-pulse">
            <div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center">
              <Bot size={12} className="text-brand-primary" />
            </div>
            <div className="bg-white dark:bg-brand-surface p-3 rounded-2xl rounded-bl-none shadow-sm border border-brand-text-s/10">
              <Loader2 className="animate-spin text-brand-primary" size={14} />
            </div>
          </div>
        )}
        
        {/* Error Messaging */}
        {error && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-red-100 dark:border-red-800">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Input Area */}
      <div className="p-4 bg-white dark:bg-brand-surface border-t border-brand-text-s/10 space-y-3">
        {/* Interaction Suggestions */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button 
            onClick={() => handleSend("আমাকে পড়ার জন্য কিছু টিপস বা স্ট্র্যাটেজি দাও তো আমার বর্তমান প্রগ্রেস অনুযায়ী।")}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-secondary/10 text-brand-secondary rounded-full border border-brand-secondary/20 text-[10px] font-black uppercase tracking-widest whitespace-nowrap hover:bg-brand-secondary/20 transition-all shrink-0 disabled:opacity-50"
          >
            <Lightbulb size={12} />
            Study Advice
          </button>
          <button 
            onClick={() => handleSend("আমার জন্য একটা রুটিন বানিয়ে দাও")}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-full border border-brand-primary/20 text-[10px] font-black uppercase tracking-widest whitespace-nowrap hover:bg-brand-primary/20 transition-all shrink-0 disabled:opacity-50"
          >
            <Sparkles size={12} />
            Routine Help
          </button>
        </div>

        {/* Text Entry Component */}
        <div className="flex gap-2 items-center bg-brand-bg dark:bg-brand-bg/50 p-2 rounded-2xl border border-brand-text-s/10 focus-within:border-brand-primary transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="কিছু জানতে চাও?"
            className="flex-1 bg-transparent border-0 px-3 py-2 text-sm focus:ring-0 placeholder:text-brand-text-s/50"
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="bg-brand-primary text-white p-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 shadow-lg shadow-brand-primary/20"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISidebar;
