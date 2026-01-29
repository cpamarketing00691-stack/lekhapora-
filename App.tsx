
import React, { useState, useEffect, useRef } from 'react';
import { UserState, Group, Religion, Medium, UserProfile, Subject, Language as LangType, ActiveTimerState, StudySession, Reminder, TestAttempt } from './types';
import { CHAPTER_LISTS } from './constants';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Tracker from './components/Tracker';
import Auth from './components/Auth';
import Settings from './components/Settings';
import SyllabusManager from './components/SyllabusManager';
import TestSection from './components/TestSection';
import { Layout } from './components/Layout';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';

// VAPID Public Key for Web Push (Your provided certificate)
const VAPID_PUBLIC_KEY = "BOQS5jGeY1uyMDkK7BocruEAkQVcWx3sSPe7VBVvoj_UpNT5FZmr52hu9izrT9i6M5J2ScIJhOd6AYhzWHRiAyI";

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
        const state = { ...DEFAULT_STATE, ...parsed };
        
        if (state.activeTimer) {
          const now = Date.now();
          const elapsedMs = now - state.activeTimer.lastTimestamp;
          const deltaSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
          
          if (deltaSeconds > 0) {
            const isFocus = state.activeTimer.isFocusActive;
            state.activeTimer = {
              ...state.activeTimer,
              lastTimestamp: state.activeTimer.lastTimestamp + (deltaSeconds * 1000),
              accumulatedFocusSeconds: isFocus 
                ? state.activeTimer.accumulatedFocusSeconds + deltaSeconds 
                : state.activeTimer.accumulatedFocusSeconds,
              accumulatedBreakSeconds: !isFocus 
                ? state.activeTimer.accumulatedBreakSeconds + deltaSeconds 
                : state.activeTimer.accumulatedBreakSeconds
            };
          }
        }
        return state;
      } catch (e) {
        console.error("Local storage recovery failed:", e);
      }
    }
    return DEFAULT_STATE;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'tracker' | 'syllabus' | 'test' | 'settings'>('dashboard');
  const [testContext, setTestContext] = useState<{ subjectId: string; chapterId: string } | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const timerIntervalRef = useRef<number>(null);
  const reminderIntervalRef = useRef<number>(null);
  const lastCloudSaveRef = useRef<number>(Date.now());

  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (isInitialLoading) setIsInitialLoading(false);
    }, 4000);

    const initApp = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          setUserState(prev => ({ ...prev, isAuthenticated: true }));
          await backgroundSync(data.session.user.id);
          
          // OneSignal User Login
          const OneSignal = (window as any).OneSignal;
          if (OneSignal) {
            OneSignal.login(data.session.user.id);
          }
        }
      } catch (error) {
        console.error("Auth init failed:", error);
      } finally {
        setIsInitialLoading(false);
        clearTimeout(safetyTimeout);
      }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUserState(prev => ({ ...prev, isAuthenticated: true }));
        backgroundSync(session.user.id);
        
        // Ensure OneSignal login on state change
        const OneSignal = (window as any).OneSignal;
        if (OneSignal) {
          OneSignal.login(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setUserState(DEFAULT_STATE);
        localStorage.removeItem('hsc_study_tracker_state');
        
        // Logout from OneSignal
        const OneSignal = (window as any).OneSignal;
        if (OneSignal) {
          OneSignal.logout();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // GLOBAL REMINDER HEARTBEAT
  useEffect(() => {
    const pollReminders = async () => {
      if (!userState.isAuthenticated || !userState.notificationsEnabled) return;
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const now = new Date().toISOString();
        
        const { data: dueReminders, error } = await supabase
          .from('reminders')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_done', false)
          .lte('reminder_datetime', now);

        if (error) throw error;

        if (dueReminders && dueReminders.length > 0) {
          for (const rem of dueReminders) {
            if (Notification.permission === 'granted') {
              new Notification('HSC Study Tracker', {
                body: `Study Time: ${rem.title}`,
                icon: '/favicon.ico',
                tag: rem.id, 
                requireInteraction: true 
              });
            } else {
              alert(`Study Reminder: ${rem.title}`);
            }

            await supabase
              .from('reminders')
              .update({ is_done: true })
              .eq('id', rem.id);
          }
          
          backgroundSync(user.id);
        }
      } catch (err) {
        console.warn("Heartbeat Error:", err);
      }
    };

    reminderIntervalRef.current = window.setInterval(pollReminders, 30000); 
    pollReminders(); 

    return () => { if (reminderIntervalRef.current) clearInterval(reminderIntervalRef.current); };
  }, [userState.isAuthenticated, userState.notificationsEnabled]);

  // Streak Calculation
  useEffect(() => {
    if (!userState.isAuthenticated || !userState.studyHistory.length) return;

    const calculateStreak = () => {
      const today = new Date().setHours(0, 0, 0, 0);
      const yesterday = today - 86400000;
      const studyDates = Array.from(new Set(
        userState.studyHistory.map(s => new Date(s.startTime).setHours(0, 0, 0, 0))
      )).sort((a: any, b: any) => (b as number) - (a as number));

      if (studyDates.length === 0) return 0;
      const lastStudyDate = studyDates[0];

      if (lastStudyDate === undefined || (lastStudyDate as number) < yesterday) {
        return 0;
      }

      let streak = 0;
      let checkDate: number = lastStudyDate as number;
      const dateSet = new Set(studyDates);

      while (dateSet.has(checkDate)) {
        streak++;
        checkDate -= 86400000;
      }
      return streak;
    };

    const newStreak = calculateStreak();
    if (newStreak !== userState.streaks) {
      setUserState(prev => ({ ...prev, streaks: newStreak }));
    }
  }, [userState.studyHistory.length, userState.isAuthenticated]);

  const backgroundSync = async (userId: string) => {
    try {
      const { data } = await supabase.from('user_data').select('state').eq('user_id', userId).maybeSingle();
      if (data?.state) {
        const cloudState = data.state as unknown as Partial<UserState>;
        setUserState(prev => {
          if (prev.activeTimer) {
            const cloudTimer = cloudState.activeTimer;
            if (!cloudTimer || Number(cloudTimer.lastTimestamp) < (prev.activeTimer?.lastTimestamp || 0)) {
              return { ...prev, ...cloudState, activeTimer: prev.activeTimer, isAuthenticated: true };
            }
          }
          const newState = { ...prev, ...cloudState, isAuthenticated: true } as UserState;
          if (newState.activeTimer) {
             const now = Date.now();
             const elapsedMs = now - Number(newState.activeTimer.lastTimestamp);
             const deltaSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
             if (deltaSeconds > 0) {
               newState.activeTimer.accumulatedFocusSeconds += newState.activeTimer.isFocusActive ? deltaSeconds : 0;
               newState.activeTimer.accumulatedBreakSeconds += !newState.activeTimer.isFocusActive ? deltaSeconds : 0;
               newState.activeTimer.lastTimestamp += (deltaSeconds * 1000);
             }
          }
          return newState;
        });
      }
    } catch (e) { console.warn("Background sync failed"); }
  };

  const saveUserData = async (state: UserState) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { isAuthenticated, ...stateToSave } = state; 
      await supabase.from('user_data').upsert({ 
        user_id: user.id, 
        state: stateToSave, 
        updated_at: new Date().toISOString() 
      }, { onConflict: 'user_id' });
      lastCloudSaveRef.current = Date.now();
    } catch (e) { }
  };

  useEffect(() => {
    localStorage.setItem('hsc_study_tracker_state', JSON.stringify(userState));
    if (userState.isAuthenticated) {
      const timeSinceLastSave = Date.now() - lastCloudSaveRef.current;
      const isTimerRunning = !!userState.activeTimer;
      if (isTimerRunning && timeSinceLastSave > 30000) {
        saveUserData(userState);
      } else {
        const timeoutId = setTimeout(() => saveUserData(userState), 3000);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [userState]);

  useEffect(() => {
    if (userState.activeTimer) {
      if (!timerIntervalRef.current) {
        timerIntervalRef.current = window.setInterval(() => {
          setUserState(prev => {
            if (!prev.activeTimer) return prev;
            const now = Date.now();
            const elapsedMs = now - prev.activeTimer.lastTimestamp;
            const deltaSeconds = Math.floor(elapsedMs / 1000);
            if (deltaSeconds < 1) return prev;
            const isFocus = prev.activeTimer.isFocusActive;
            const updatedTimer = {
              ...prev.activeTimer,
              lastTimestamp: prev.activeTimer.lastTimestamp + (deltaSeconds * 1000),
              accumulatedFocusSeconds: isFocus 
                ? prev.activeTimer.accumulatedFocusSeconds + deltaSeconds 
                : prev.activeTimer.accumulatedFocusSeconds,
              accumulatedBreakSeconds: !isFocus 
                ? prev.activeTimer.accumulatedBreakSeconds + deltaSeconds 
                : prev.activeTimer.accumulatedBreakSeconds
            };
            return { ...prev, activeTimer: updatedTimer };
          });
        }, 1000);
      }
    } else {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        (timerIntervalRef as any).current = null;
      }
    }
    return () => { 
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        (timerIntervalRef as any).current = null;
      } 
    };
  }, [userState.activeTimer?.isFocusActive, !!userState.activeTimer]);

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
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text-s animate-pulse">Initializing System...</p>
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
    </Layout>
  );
};

export default App;
