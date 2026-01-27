
import React, { useState, useRef, useEffect } from 'react';
import { UserState } from '../types';
import { Send, Bot, Sparkles, Loader2, User, AlertCircle, Lightbulb } from 'lucide-react';
// Fix: Import supabase to fetch userId
import { supabase } from '../lib/supabase';

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

  // Auto-scroll to bottom on new messages or when loading status changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  /**
   * Handles sending messages to the /api/chat endpoint.
   */
  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading) return;
    
    // UI Setup
    if (!customText) setInput('');
    setError(null);
    
    // Add user message to local state
    const userMessage = { role: 'user' as const, text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    
    // Show loading state
    setIsLoading(true);

    try {
      // Create system instruction for context
      const systemInstruction = `You are a supportive, human-like study buddy for a Bangladesh HSC student named ${userState.profile?.fullName}. 
      Your name is ${userState.profile?.aiName}. Use a friendly "big brother/sister" tone in conversational Bangla/Banglish.`;

      // Filter out system messages and map to a format expected by the API if necessary,
      // though the current api/chat.ts handles raw history.
      const chatHistoryForAPI = messages.map(msg => ({
        role: msg.role === 'ai' ? 'ai' : 'user', // Ensure roles are 'ai' or 'user' for history
        text: msg.text
      }));

      // Fix: Get userId from Supabase auth directly as UserProfile does not contain an 'id'
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Fetch from backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: chatHistoryForAPI, // Send existing messages as history
          systemInstruction: systemInstruction,
          // Fix: Use the userId obtained directly from Supabase
          userId: userId // Include userId for logging
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI server');
      }

      const data = await response.json();
      
      // Add AI reply to UI
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: data.reply || "দুঃখিত, আমি তোমার কথা বুঝতে পারিনি।" 
      }]);
    } catch (err: any) {
      console.error("Chat API Error:", err);
      setError("সার্ভারের সাথে যোগাযোগ করতে সমস্যা হয়েছে।");
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: "দুঃখিত, আমার সার্ভারে সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করো।" 
      }]);
    } finally {
      // Hide loading state
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
        
        {/* Loading Indicator */}
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
        
        {/* Error State */}
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
        {/* Quick Action Suggestions */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button 
            onClick={() => handleSend("আমাকে পড়ার জন্য কিছু টিপস দাও")}
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

        {/* Input Control */}
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
