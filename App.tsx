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
import StudyCalendar from './components/StudyCalendar';
import ProExamSystem from './components/ProExamSystem';
import { Layout } from './components/Layout';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';

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

  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'tracker' | 'syllabus' | 'test' | 'settings'>('dashboard');
  const [testContext, setTestContext] = useState<{ subjectId: string; chapterId: string } | null>(null);
  const [activeModelExamId, setActiveModelExamId] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const timerIntervalRef = useRef<number>(null);
  const reminderIntervalRef = useRef<number>(null);
  const lastCloudSaveRef = useRef<number>(Date.now());

  useEffect(() => {
    const initApp = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          setUserState(prev => ({ ...prev, isAuthenticated: true }));
          await backgroundSync(data.session.user.id);
        }
      } catch (error) {
        console.error("Auth init failed:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };
    initApp();
  }, []);

  const backgroundSync = async (userId: string) => {
    try {
      const { data } = await supabase.from('user_data').select('state').eq('user_id', userId).maybeSingle();
      if (data?.state) {
        const cloudState = data.state as unknown as Partial<UserState>;
        setUserState(prev => ({ ...prev, ...cloudState, isAuthenticated: true }));
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
      const timeoutId = setTimeout(() => saveUserData(userState), 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [userState]);

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
      {activeTab === 'calendar' && <StudyCalendar userState={userState} onUpdateState={setUserState} onTabChange={setActiveTab} />}
      {activeTab === 'tracker' && <Tracker userState={userState} onUpdateState={setUserState} />}
      {activeTab === 'syllabus' && <SyllabusManager userState={userState} onUpdateState={setUserState} onTriggerTest={handleTriggerTest} />}
      {activeTab === 'test' && <TestSection userState={userState} onUpdateState={setUserState} initialContext={testContext} clearContext={() => setTestContext(null)} onTriggerModelExam={(id) => setActiveModelExamId(id)} />}
      {activeTab === 'settings' && <Settings userState={userState} onUpdateState={setUserState} onLogout={() => setUserState(DEFAULT_STATE)} />}
      
      {activeModelExamId && (
        <ProExamSystem examId={activeModelExamId} onClose={() => setActiveModelExamId(null)} />
      )}
    </Layout>
  );
};

export default App;