
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
        return {
          ...DEFAULT_STATE,
          ...parsed,
          studyHistory: parsed.studyHistory || [],
          subjects: parsed.subjects || [],
          dailyTasks: parsed.dailyTasks || [],
          badges: parsed.badges || []
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
  const timerIntervalRef = useRef<number | null>(null);

  // 1. Auth Listener
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserState(prev => ({ ...prev, isAuthenticated: true }));
        await fetchUserData(session.user.id);
      }
      setIsInitialLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUserState(prev => ({ ...prev, isAuthenticated: true }));
        await fetchUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUserState(DEFAULT_STATE);
        localStorage.removeItem('hsc_study_tracker_state');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch Data from Supabase
  const fetchUserData = async (userId: string) => {
    setIsSyncing(true);
    try {
      // First, get study state from user_data
      const { data: userData, error: userDataError } = await supabase
        .from('user_data')
        .select('state')
        .eq('user_id', userId)
        .maybeSingle();

      // Second, get profile info from users table (as requested)
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userDataError) throw userDataError;

      setUserState(prev => {
        const remoteState = userData?.state || {};
        
        const newState = {
          ...prev,
          ...remoteState,
          isAuthenticated: true,
          dailyTasks: remoteState.dailyTasks || prev.dailyTasks || [],
          studyHistory: remoteState.studyHistory || prev.studyHistory || [],
          subjects: remoteState.subjects || prev.subjects || []
        };
        
        // If we have profile in 'users' table, use it to populate the UI profile if it's missing or update name
        if (profileData) {
           if (!newState.profile) {
             newState.profile = {
               fullName: profileData.full_name,
               college: '',
               group: Group.SCIENCE,
               board: 'Dhaka',
               medium: Medium.BANGLA,
               targetYear: '2025',
               religion: Religion.ISLAM,
               aiName: `${profileData.full_name.split(' ')[0]} AI`
             };
           } else {
             newState.profile.fullName = profileData.full_name;
           }
        }

        return newState;
      });

      // If remote is empty, check local for migration
      if (!userData?.state) {
        const local = localStorage.getItem('hsc_study_tracker_state');
        if (local) {
          const parsed = JSON.parse(local);
          saveUserData(userId, parsed);
        }
      }
    } catch (err) {
      console.error("Sync fetch error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // 3. Save Data to Supabase
  const saveUserData = async (userId: string, state: any) => {
    setIsSyncing(true);
    try {
      const { error } = await supabase
        .from('user_data')
        .upsert({ 
          user_id: userId, 
          state: state,
          updated_at: new Date().toISOString() 
        });
      if (error) throw error;
    } catch (err) {
      console.error("Sync save error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // 4. Persistence Effect
  useEffect(() => {
    localStorage.setItem('hsc_study_tracker_state', JSON.stringify(userState));
    
    // Remote sync
    const syncRemote = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        saveUserData(user.id, userState);
      }
    };

    if (userState.isAuthenticated) {
      const timeoutId = setTimeout(syncRemote, 1500); // Debounced save
      return () => clearTimeout(timeoutId);
    }
  }, [userState]);

  // Global Timer Logic
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
    } else {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
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
  };

  const handleProfileComplete = (onboardingData: UserProfile & { selectedSubjectNames: string[] }) => {
    const { selectedSubjectNames, ...profile } = onboardingData;
    const finalSubjects: Subject[] = [];

    selectedSubjectNames.forEach((name, subIdx) => {
      const needsTwoPapers = name === 'Bangla' || name === 'English' || 
                            name === 'Physics' || name === 'Chemistry' || 
                            name === 'Biology' || name === 'Higher Math' ||
                            name === 'Accounting' || name === 'Economics';
      
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

    setUserState(prev => ({
      ...prev,
      profile,
      subjects: finalSubjects,
      dailyTasks: []
    }));
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!userState.isAuthenticated) {
    return <Auth onAuthSuccess={() => {}} />;
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
      <div className="h-full relative">
          {isSyncing && (
            <div className="absolute top-0 right-0 z-50 p-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full border border-brand-primary/20 backdrop-blur-sm shadow-sm animate-pulse">
                <Loader2 size={10} className="animate-spin" />
                <span className="text-[8px] font-black uppercase tracking-widest">Cloud Syncing</span>
              </div>
            </div>
          )}
          
          {activeTab === 'dashboard' && (
            <Dashboard 
              userState={userState} 
              onUpdateState={setUserState} 
            />
          )}
          {activeTab === 'tracker' && (
            <Tracker 
              userState={userState} 
              onUpdateState={setUserState} 
            />
          )}
          {activeTab === 'ai' && (
            <div className="h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)]">
              <AISidebar 
                userState={userState} 
              />
            </div>
          )}
          {activeTab === 'settings' && (
            <Settings 
              userState={userState} 
              onUpdateState={setUserState}
              onLogout={handleLogout}
            />
          )}
          {activeTab === 'syllabus' && (
             <SyllabusManager 
               userState={userState} 
               onUpdateState={setUserState} 
             />
          )}
      </div>
    </Layout>
  );
};

export default App;
