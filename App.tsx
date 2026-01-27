
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
import { Loader2, AlertTriangle } from 'lucide-react';

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
        return {
          ...DEFAULT_STATE,
          ...parsed,
          studyHistory: Array.isArray(parsed.studyHistory) ? parsed.studyHistory : [],
          subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
          dailyTasks: Array.isArray(parsed.dailyTasks) ? parsed.dailyTasks : [],
          badges: Array.isArray(parsed.badges) ? parsed.badges : []
        };
      } catch (e) {
        console.error("Failed to parse local storage", e);
      }
    }
    return DEFAULT_STATE;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'tracker' | 'syllabus' | 'ai' | 'settings'>('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [fetchUserDataError, setFetchUserDataError] = useState<string | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  // 1. Auth Listener
  useEffect(() => {
    const initAuth = async () => {
      console.log("App.tsx: Initiating auth check...");
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session) {
          console.log("App.tsx: User session found. Authenticated.");
          setUserState(prev => ({ ...prev, isAuthenticated: true }));
          // We call fetchUserData but we don't 'await' it here to block the UI
          // Instead, we let it run and it will update state when done.
          fetchUserData(session.user.id);
        } else {
          console.log("App.tsx: No active session found.");
          setUserState(prev => ({ ...prev, isAuthenticated: false }));
        }
      } catch (error: any) {
        console.error("App.tsx: Auth check failed:", error);
        setFetchUserDataError(error.message);
      } finally {
        // Essential: Loading screen must clear regardless of fetch results
        setTimeout(() => setIsInitialLoading(false), 500);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUserState(prev => ({ ...prev, isAuthenticated: true }));
        fetchUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUserState(DEFAULT_STATE);
        localStorage.removeItem('hsc_study_tracker_state');
        setFetchUserDataError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch Data from Supabase
  const fetchUserData = async (userId: string) => {
    setIsSyncing(true);
    console.log("App.tsx: Fetching user data...");
    try {
      // Parallel fetch for efficiency
      const [userRes, profileRes] = await Promise.all([
        supabase.from('user_data').select('state').eq('user_id', userId).maybeSingle(),
        supabase.from('users').select('*').eq('id', userId).maybeSingle()
      ]);

      if (userRes.error) console.warn("Supabase user_data fetch error:", userRes.error.message);
      if (profileRes.error) console.warn("Supabase user profile fetch error:", profileRes.error.message);

      const userData = userRes.data;
      const profileData = profileRes.data;

      setUserState(prev => {
        const remoteState = userData?.state || {};
        
        const newState = {
          ...prev,
          ...remoteState,
          isAuthenticated: true,
          dailyTasks: Array.isArray(remoteState.dailyTasks) ? remoteState.dailyTasks : (Array.isArray(prev.dailyTasks) ? prev.dailyTasks : []),
          studyHistory: Array.isArray(remoteState.studyHistory) ? remoteState.studyHistory : (Array.isArray(prev.studyHistory) ? prev.studyHistory : []),
          subjects: Array.isArray(remoteState.subjects) ? remoteState.subjects : (Array.isArray(prev.subjects) ? prev.subjects : [])
        };
        
        if (profileData) {
          newState.profile = {
            ...(newState.profile || {}),
            fullName: profileData.full_name,
            aiName: newState.profile?.aiName || `${profileData.full_name.split(' ')[0]} AI`,
            group: newState.profile?.group || Group.SCIENCE,
            medium: newState.profile?.medium || Medium.BANGLA,
            board: newState.profile?.board || 'Dhaka',
            religion: newState.profile?.religion || Religion.ISLAM,
            targetYear: newState.profile?.targetYear || '2025',
            college: newState.profile?.college || ''
          };
        }
        return newState;
      });

      // If remote is empty but local has data, sync up
      if (!userData?.state) {
        const local = localStorage.getItem('hsc_study_tracker_state');
        if (local) {
          const parsed = JSON.parse(local);
          saveUserData(userId, parsed);
        }
      }
    } catch (err: any) {
      console.error("App.tsx: Silent sync failure:", err);
      // We don't set a hard error here so the app continues with local state
    } finally {
      setIsSyncing(false);
    }
  };

  const saveUserData = async (userId: string, state: any) => {
    try {
      const { isAuthenticated, ...stateToSave } = state; 
      await supabase
        .from('user_data')
        .upsert({ 
          user_id: userId, 
          state: stateToSave,
          updated_at: new Date().toISOString() 
        }, { onConflict: 'user_id' });
    } catch (err) {
      console.error("App.tsx: Sync save error:", err);
    }
  };

  useEffect(() => {
    localStorage.setItem('hsc_study_tracker_state', JSON.stringify(userState));
    
    const syncRemote = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        saveUserData(user.id, userState);
      }
    };

    if (userState.isAuthenticated) {
      const timeoutId = setTimeout(syncRemote, 2000); 
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
            const updatedTimer = { 
              ...prev.activeTimer, 
              lastTimestamp: prev.activeTimer.lastTimestamp + (delta * 1000) 
            };
            if (prev.activeTimer.isFocusActive) {
              updatedTimer.accumulatedFocusSeconds += delta;
            } else {
              updatedTimer.accumulatedBreakSeconds += delta;
            }
            return { ...prev, activeTimer: updatedTimer };
          });
        }, 1000);
      }
    } else if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    return () => { if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current); };
  }, [userState.activeTimer?.isFocusActive, !!userState.activeTimer]);

  useEffect(() => {
    if (activeTab !== 'tracker' && userState.activeTimer?.isFocusActive) {
      setUserState(prev => {
        if (!prev.activeTimer) return prev;
        return {
          ...prev,
          activeTimer: {
            ...prev.activeTimer,
            isFocusActive: false,
            numBreaks: prev.activeTimer.numBreaks + 1,
            lastTimestamp: Date.now()
          }
        };
      });
    }
  }, [activeTab]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserState(DEFAULT_STATE);
    localStorage.removeItem('hsc_study_tracker_state');
    setFetchUserDataError(null);
  };

  const handleProfileComplete = (onboardingData: UserProfile & { selectedSubjectNames: string[] }) => {
    const { selectedSubjectNames, ...profile } = onboardingData;
    const finalSubjects: Subject[] = [];

    if (Array.isArray(selectedSubjectNames)) {
      selectedSubjectNames.forEach((name, subIdx) => {
        const needsTwoPapers = ['Bangla', 'English', 'Physics', 'Chemistry', 'Biology', 'Higher Math', 'Accounting', 'Economics'].includes(name);
        const papersToCreate = (name === 'ICT') ? [1] : (needsTwoPapers ? [1, 2] : [1]);
        papersToCreate.forEach(paperNum => {
          const chapters = (CHAPTER_LISTS[name] || ['সূচনা', 'মূল ধারণা', 'অ্যাডভান্সড প্রবলেম']).map((ch, chIdx) => ({
            id: `ch-${subIdx}-${paperNum}-${chIdx}`,
            name: ch,
            isCompleted: false
          }));
          finalSubjects.push({
            id: `sub-${subIdx}-${paperNum}-${Date.now()}`,
            name: name,
            paper: paperNum as 1 | 2,
            chapters: chapters
          });
        });
      });
    }

    setUserState(prev => ({
      ...prev,
      profile,
      subjects: finalSubjects,
      dailyTasks: []
    }));

    const saveNewProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && profile) {
        await supabase.from('users').upsert({ id: user.id, full_name: profile.fullName }, { onConflict: 'id' });
        await saveUserData(user.id, { ...userState, profile, subjects: finalSubjects, dailyTasks: [] });
      }
    };
    saveNewProfile();
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-brand-primary" />
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
    <Layout 
      userProfile={userState.profile} 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      language={userState.language}
    >
      <div className="h-full relative overflow-x-hidden">
          {isSyncing && (
            <div className="absolute top-0 right-0 z-50 p-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full border border-brand-primary/20 backdrop-blur-sm shadow-sm animate-pulse">
                <Loader2 size={10} className="animate-spin" />
                <span className="text-[8px] font-black uppercase tracking-widest">Cloud Sync</span>
              </div>
            </div>
          )}
          
          {activeTab === 'dashboard' && <Dashboard userState={userState} onUpdateState={setUserState} />}
          {activeTab === 'tracker' && <Tracker userState={userState} onUpdateState={setUserState} />}
          {activeTab === 'ai' && (
            <div className="h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)]">
              <AISidebar userState={userState} />
            </div>
          )}
          {activeTab === 'settings' && <Settings userState={userState} onUpdateState={setUserState} onLogout={handleLogout} />}
          {activeTab === 'syllabus' && <SyllabusManager userState={userState} onUpdateState={setUserState} />}
      </div>
    </Layout>
  );
};

export default App;
