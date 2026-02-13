
import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { UserState, Task, TaskSource } from '../types';
import { Send, Loader2, Bot, User, Sparkles, Zap, Trash2, BrainCircuit } from 'lucide-react';
import { getGeminiResponse } from '../services/gemini';

interface AIPanelProps {
  userState: UserState;
  onUpdateState: React.Dispatch<React.SetStateAction<UserState>>;
}

const ChatMessage = memo(({ m, isBn }: { m: { role: 'user' | 'model'; text: string }, isBn: boolean }) => (
  <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
    <div className={`max-w-[85%] sm:max-w-[70%] flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
       <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${m.role === 'user' ? 'bg-brand-primary text-white' : 'bg-brand-surface text-brand-primary border border-brand-text-s/10'}`}>
         {m.role === 'user' ? <User size={20}/> : <Sparkles size={20}/>}
       </div>
       <div className={`px-6 py-4 rounded-[2rem] text-sm font-medium leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-brand-primary text-white' : 'bg-white dark:bg-brand-bg text-brand-text-p'}`}>
         {m.text}
       </div>
    </div>
  </div>
));

const AIPanel: React.FC<AIPanelProps> = ({ userState, onUpdateState }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string; action?: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const isBn = userState.language === 'bn';
  const t = (bn: string, en: string) => isBn ? bn : en;

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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const context = `Student Info: Group: ${userState.profile?.group}, Board: ${userState.profile?.board}, Language: ${userState.language}. Streak: ${userState.streaks}. Mood: ${userState.currentMood}.`;
      
      const response = await getGeminiResponse(userMsg, history, context, userState.profile?.fullName || 'student-uid');
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      let cleanResponse = response;
      
      if (jsonMatch) {
        try {
          const actionObj = JSON.parse(jsonMatch[0]);
          if (actionObj.action === 'add_task') {
             const newTask: Task = {
               id: `ai-task-${Date.now()}`,
               name: actionObj.data.title,
               source: TaskSource.PERSONAL,
               isCompleted: false,
               createdAt: Date.now()
             };
             onUpdateState(prev => ({ ...prev, dailyTasks: [...(prev.dailyTasks || []), newTask] }));
             cleanResponse = actionObj.reply || t("টাস্কটি সেভ করেছি দোস্ত!", "I've saved that task for you!");
          }
        } catch (e) {}
      }

      setMessages(prev => [...prev, { role: 'model', text: cleanResponse }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: t("দুঃখিত দোস্ত, কানেকশন পাচ্ছে না।", "Sorry friend, connection failed.") }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-14rem)] flex flex-col bg-brand-surface/40 backdrop-blur-md rounded-[3.5rem] border border-brand-text-s/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
      <header className="px-8 py-6 border-b border-brand-text-s/5 bg-brand-bg/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary shadow-inner">
             <Bot size={28} />
           </div>
           <div>
              <h3 className="font-black text-brand-text-p uppercase tracking-widest">{t('লেখাপড়া বন্ধু', 'Study Friend')}</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[9px] font-black text-brand-text-s uppercase tracking-tighter">Gemini 3.1 Pro Engine</span>
              </div>
           </div>
        </div>
        <button onClick={() => setMessages([])} className="p-2.5 text-brand-text-s hover:text-rose-500 transition-colors"><Trash2 size={20}/></button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30">
             <BrainCircuit size={64} className="text-brand-primary" />
             <div className="space-y-2">
               <p className="text-sm font-black uppercase tracking-widest">{t('আমি তোমার পড়ার সাথি', 'I\'m your study companion')}</p>
               <p className="text-xs font-medium max-w-xs">{t('আমাকে তোমার সিলেবাস বা পড়া নিয়ে যেকোনো প্রশ্ন করতে পারো।', 'Ask me anything about your syllabus or study routine.')}</p>
             </div>
          </div>
        )}
        
        {messages.map((m, i) => <ChatMessage key={i} m={m} isBn={isBn} />)}
        
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-xl bg-brand-surface flex items-center justify-center text-brand-primary"><Bot size={20}/></div>
              <div className="px-6 py-4 rounded-[2rem] bg-white dark:bg-brand-bg text-brand-text-s italic text-xs">
                Thinking...
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="p-8 pt-0 shrink-0">
        <div className="relative group">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={t("কী জানতে চাও বন্ধু?", "What's on your mind, friend?")}
            className="w-full pl-8 pr-16 py-6 bg-brand-bg rounded-[2.5rem] border-2 border-transparent focus:border-brand-primary/20 outline-none font-bold text-sm shadow-inner transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default memo(AIPanel);
