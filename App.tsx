import React, { useState, useEffect, useRef } from 'react';
import { UserState, UserProfile, Subject, Language as LangType, StudySession, TestAttempt } from './types';
import { CHAPTER_LISTS } from './constants';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Tracker from './components/Tracker';
import Auth from './components/Auth';
import Settings from './components/Settings';
import SyllabusManager from './components/SyllabusManager';
import TestSection from './components/TestSection';
import AISidebar from './components/AISidebar';
import { Layout } from './components/Layout';
import { supabase } from './lib/supabase';
import { Loader2, Bot, X } from 'lucide-react';

const DEFAULT_STATE: UserState = {
  isAuthenticated: false,
  profile: null,
  studyHistory: [],
  testHistory: [],
  subjects: [],
  dailyTasks: [],
  streaks: 0,
  badges: [],
  currentMood: 'Great',
  language: 'bn',
  activeTimer: null,
  reminders: [],
  notificationsEnabled: false
};

const App: React.FC = () => {
  const [userState, setUserState] = useState<UserState>(() => {
    const saved = localStorage.getItem('hsc_study_tracker_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_STATE, ...parsed };
      } catch (e) {
        return DEFAULT_STATE;
      }
    }
    return DEFAULT_STATE;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'tracker' | 'syllabus' | 'test' | 'settings'>('dashboard');
  const [testContext, setTestContext] = useState<{ subjectId: string; chapterId: string } | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  
  const timerIntervalRef = useRef<number | null>(null);
  const reminderIntervalRef = useRef<number | null>(null);
  const lastCloudSaveRef = useRef<number>(Date.now());

  useEffect(() => {
    const initApp = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          setUserState(prev => ({ ...prev, isAuthenticated: true }));
          await backgroundSync(data.session.user.id);
          const OneSignal = (window as any).OneSignal;
          if (OneSignal) OneSignal.login(data.session.user.id);
        }
      } catch (error) {
        console.error("Init failed:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };
    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUserState(prev => ({ ...prev, isAuthenticated: true }));
        backgroundSync(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUserState(DEFAULT_STATE);
        localStorage.removeItem('hsc_study_tracker_state');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const pollReminders = async () => {
      if (!userState.isAuthenticated || !userState.notificationsEnabled) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const now = new Date().toISOString();
        const { data: dueReminders } = await supabase.from('reminders').select('*').eq('user_id', user.id).eq('is_done', false).lte('reminder_datetime', now);
        if (dueReminders?.length) {
          dueReminders.forEach(rem => {
            if (Notification.permission === 'granted') {
              new Notification('HSC Study Tracker', { body: `Study Time: ${rem.title}`, icon: '/favicon.ico' });
            } else {
              alert(`Study Reminder: ${rem.title}`);
            }
          });
          await supabase.from('reminders').update({ is_done: true }).in('id', dueReminders.map(r => r.id));
          backgroundSync(user.id);
        }
      } catch (err) {}
    };
    reminderIntervalRef.current = window.setInterval(pollReminders, 30000);
    return () => { if (reminderIntervalRef.current) clearInterval(reminderIntervalRef.current); };
  }, [userState.isAuthenticated, userState.notificationsEnabled]);

  const backgroundSync = async (userId: string) => {
    try {
      const { data } = await supabase.from('user_data').select('state').eq('user_id', userId).maybeSingle();
      if (data?.state) {
        const cloudState = data.state as Partial<UserState>;
        setUserState(prev => ({ ...prev, ...cloudState, isAuthenticated: true }));
      }
    } catch (e) {}
  };

  const saveUserData = async (state: UserState) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { isAuthenticated, ...stateToSave } = state; 
      await supabase.from('user_data').upsert({ user_id: user.id, state: stateToSave, updated_at: new Date().toISOString() });
      lastCloudSaveRef.current = Date.now();
    } catch (e) {}
  };

  useEffect(() => {
    localStorage.setItem('hsc_study_tracker_state', JSON.stringify(userState));
    if (userState.isAuthenticated) {
      const timeoutId = setTimeout(() => saveUserData(userState), 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [userState]);

  useEffect(() => {
    if (userState.activeTimer && userState.activeTimer.isFocusActive) {
      if (!timerIntervalRef.current) {
        timerIntervalRef.current = window.setInterval(() => {
          setUserState(prev => {
            if (!prev.activeTimer || !prev.activeTimer.isFocusActive) return prev;
            const now = Date.now();
            const delta = Math.floor((now - prev.activeTimer.lastTimestamp) / 1000);
            if (delta < 1) return prev;
            return {
              ...prev,
              activeTimer: {
                ...prev.activeTimer,
                lastTimestamp: prev.activeTimer.lastTimestamp + (delta * 1000),
                accumulatedFocusSeconds: prev.activeTimer.accumulatedFocusSeconds + delta
              }
            };
          });
        }, 1000);
      }
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [userState.activeTimer?.isFocusActive]);

  const handleProfileComplete = (onboardingData: UserProfile & { selectedSubjectNames: string[] }) => {
    const { selectedSubjectNames, ...profile } = onboardingData;
    const finalSubjects: Subject[] = [];
    selectedSubjectNames.forEach((name, idx) => {
      [1, 2].forEach(paperNum => {
        const chapters = (CHAPTER_LISTS[name] || ['Chapter 1']).map((ch, chIdx) => ({
          id: `ch-${idx}-${paperNum}-${chIdx}-${Date.now()}`,
          name: ch,
          isCompleted: false
        }));
        finalSubjects.push({ id: `sub-${idx}-${paperNum}-${Date.now()}`, name, paper: paperNum as 1 | 2, chapters });
      });
    });
    setUserState(prev => ({ ...prev, profile, subjects: finalSubjects }));
  };

  const handleTriggerTest = (subjectId: string, chapterId: string) => {
    setTestContext({ subjectId, chapterId });
    setActiveTab('test');
  };

  if (isInitialLoading) {
    return (
      <div className="h-full w-full bg-brand-bg flex flex-col items-center justify-center gap-4">
        <Loader2 size={32} className="animate-spin text-brand-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-s animate-pulse">System Booting...</p>
      </div>
    );
  }

  if (!userState.isAuthenticated) return <Auth onAuthSuccess={() => setUserState(prev => ({ ...prev, isAuthenticated: true }))} />;
  if (!userState.profile) return <Onboarding onComplete={handleProfileComplete} language={userState.language} />;

  return (
    <Layout userProfile={userState.profile} activeTab={activeTab} onTabChange={setActiveTab} language={userState.language}>
      {activeTab === 'dashboard' && <Dashboard userState={userState} onUpdateState={setUserState} onTriggerTest={handleTriggerTest} />}
      {activeTab === 'tracker' && <Tracker userState={userState} onUpdateState={setUserState} />}
      {activeTab === 'syllabus' && <SyllabusManager userState={userState} onUpdateState={setUserState} onTriggerTest={handleTriggerTest} />}
      {activeTab === 'test' && <TestSection userState={userState} onUpdateState={setUserState} initialContext={testContext} clearContext={() => setTestContext(null)} />}
      {activeTab === 'settings' && <Settings userState={userState} onUpdateState={setUserState} onLogout={() => setUserState(DEFAULT_STATE)} />}
      
      {/* Floating AI Bot Toggle */}
      <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-[200]">
        {isAIChatOpen ? (
          <div className="w-[320px] sm:w-[380px] h-[500px] shadow-2xl animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
            <div className="absolute top-4 right-4 z-10">
              <button onClick={() => setIsAIChatOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all">
                <X size={16} />
              </button>
            </div>
            <AISidebar userState={userState} />
          </div>
        ) : (
          <button onClick={() => setIsAIChatOpen(true)} className="w-14 h-14 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all group">
            <Bot size={28} className="group-hover:rotate-12 transition-transform" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
          </button>
        )}
      </div>
    </Layout>
  );
};

export default App;