
import React, { useState, useEffect, useRef } from 'react';
import { UserState, Group, Religion, Medium, UserProfile, Subject, Language as LangType, ActiveTimerState, StudySession } from './types';
import { CHAPTER_LISTS } from './constants';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Tracker from './components/Tracker';
import AISidebar from './components/AISidebar';
import Auth from './components/Auth';
import Settings from './components/Settings';
import SyllabusManager from './components/SyllabusManager';
import { Layout } from './components/Layout';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';

const DEFAULT_STATE: UserState = {
  isAuthenticated: false,
  profile: null,
  studyHistory: [],
  subjects: [],
  dailyTasks: [],
  streaks: 0,
  badges: [],
  currentMood: 'Great',
  language: 'bn',
  activeTimer: null
};

const App: React.FC = () => {
  const [userState, setUserState] = useState<UserState>(() => {
    const saved = localStorage.getItem('hsc_study_tracker_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_STATE, ...parsed };
      } catch (e) {
        console.error("Local storage corrupt:", e);
      }
    }
    return DEFAULT_STATE;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'tracker' | 'syllabus' | 'ai' | 'settings'>('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (isInitialLoading) {
        console.warn("Safety timeout triggered: Forcing app to render.");
        setIsInitialLoading(false);
      }
    }, 4000);

    const initApp = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Auth Timeout')), 2500));
        
        const result = await Promise.race([sessionPromise, timeoutPromise]) as any;

        if (result && result.data && result.data.session) {
          const session = result.data.session;
          setUserState(prev => ({ ...prev, isAuthenticated: true }));
          backgroundSync(session.user.id);
        } else {
          setUserState(prev => ({ ...prev, isAuthenticated: false }));
        }
      } catch (error) {
        console.error("Init failed, proceeding with local data:", error);
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
      } else if (event === 'SIGNED_OUT') {
        setUserState(DEFAULT_STATE);
        localStorage.removeItem('hsc_study_tracker_state');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const backgroundSync = async (userId: string) => {
    if (!userId) return;
    setIsSyncing(true);
    try {
      let remoteUserData = null;
      try {
        const { data } = await supabase.from('user_data').select('state').eq('user_id', userId).maybeSingle();
        remoteUserData = data;
      } catch (e) { console.warn("Sync: user_data unreachable"); }

      let remoteProfile = null;
      try {
        const { data } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
        remoteProfile = data;
      } catch (e) { console.warn("Sync: users unreachable"); }

      setUserState(prev => {
        const newState = { ...prev, ...(remoteUserData?.state || {}) };
        if (remoteProfile) {
          newState.profile = {
            ...(newState.profile || {}),
            fullName: remoteProfile.full_name,
            group: newState.profile?.group || Group.SCIENCE
          } as UserProfile;
        }
        return { ...newState, isAuthenticated: true };
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const saveUserData = async (state: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { isAuthenticated, ...stateToSave } = state; 
      await supabase.from('user_data').upsert({ 
        user_id: user.id, 
        state: stateToSave, 
        updated_at: new Date().toISOString() 
      }, { onConflict: 'user_id' });
    } catch (e) { console.warn("Cloud save failed (silently)"); }
  };

  useEffect(() => {
    localStorage.setItem('hsc_study_tracker_state', JSON.stringify(userState));
    if (userState.isAuthenticated) {
      const timeoutId = setTimeout(() => saveUserData(userState), 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [userState]);

  useEffect(() => {
    if (userState.activeTimer) {
      if (!timerIntervalRef.current) {
        timerIntervalRef.current = window.setInterval(() => {
          setUserState(prev => {
            if (!prev.activeTimer) return prev;
            const now = Date.now();
            const delta = Math.floor((now - prev.activeTimer.lastTimestamp) / 1000);
            if (delta < 1) return prev;

            const isFocus = prev.activeTimer.isFocusActive;
            return {
              ...prev,
              activeTimer: {
                ...prev.activeTimer,
                lastTimestamp: prev.activeTimer.lastTimestamp + (delta * 1000),
                accumulatedFocusSeconds: isFocus 
                  ? prev.activeTimer.accumulatedFocusSeconds + delta 
                  : prev.activeTimer.accumulatedFocusSeconds,
                accumulatedBreakSeconds: !isFocus 
                  ? prev.activeTimer.accumulatedBreakSeconds + delta 
                  : prev.activeTimer.accumulatedBreakSeconds
              }
            };
          });
        }, 1000);
      }
    } else {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => { if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current); };
  }, [userState.activeTimer?.isFocusActive, !!userState.activeTimer]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserState(DEFAULT_STATE);
    localStorage.removeItem('hsc_study_tracker_state');
  };

  const handleProfileComplete = (onboardingData: UserProfile & { selectedSubjectNames: string[] }) => {
    const { selectedSubjectNames, ...profile } = onboardingData;
    const finalSubjects: Subject[] = [];
    selectedSubjectNames.forEach((name, idx) => {
      const chapters = (CHAPTER_LISTS[name] || ['Chapter 1']).map((ch, chIdx) => ({
        id: `ch-${idx}-${chIdx}-${Date.now()}`,
        name: ch,
        isCompleted: false
      }));
      finalSubjects.push({ id: `sub-${idx}-${Date.now()}`, name, paper: 1, chapters });
    });

    setUserState(prev => ({ ...prev, profile, subjects: finalSubjects }));
  };

  if (isInitialLoading) {
    return (
      <div className="h-full w-full bg-brand-bg flex flex-col items-center justify-center gap-4">
        <Loader2 size={32} className="animate-spin text-brand-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text-s animate-pulse">Initializing System...</p>
      </div>
    );
  }

  if (!userState.isAuthenticated) {
    return <Auth onAuthSuccess={() => setUserState(prev => ({ ...prev, isAuthenticated: true }))} />;
  }

  if (!userState.profile) {
    return <Onboarding onComplete={handleProfileComplete} language={userState.language} />;
  }

  return (
    <Layout userProfile={userState.profile} activeTab={activeTab} onTabChange={setActiveTab} language={userState.language}>
      {activeTab === 'dashboard' && <Dashboard userState={userState} onUpdateState={setUserState} />}
      {activeTab === 'tracker' && <Tracker userState={userState} onUpdateState={setUserState} />}
      {activeTab === 'syllabus' && <SyllabusManager userState={userState} onUpdateState={setUserState} />}
      {activeTab === 'ai' && <div className="h-full"><AISidebar userState={userState} /></div>}
      {activeTab === 'settings' && <Settings userState={userState} onUpdateState={setUserState} onLogout={handleLogout} />}
    </Layout>
  );
};

export default App;
