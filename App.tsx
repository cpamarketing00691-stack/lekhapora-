
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
import { Loader2, AlertTriangle } from 'lucide-react'; // Import AlertTriangle

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
  const [fetchUserDataError, setFetchUserDataError] = useState<string | null>(null); // New state for fetch errors
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
          await fetchUserData(session.user.id);
        } else {
          console.log("App.tsx: No active session found. User needs to authenticate.");
          setUserState(prev => ({ ...prev, isAuthenticated: false }));
        }
      } catch (error: any) {
        console.error("App.tsx: Initial auth check or user data fetch failed:", error);
        setFetchUserDataError(error.message || "Authentication check failed during startup.");
      } finally {
        setIsInitialLoading(false); // Ensure loading state is always resolved
        console.log("App.tsx: Initial loading resolved. isInitialLoading:", false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("App.tsx: Auth state change detected. Event:", event);
      if (session) {
        setUserState(prev => ({ ...prev, isAuthenticated: true }));
        await fetchUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUserState(DEFAULT_STATE);
        localStorage.removeItem('hsc_study_tracker_state');
        setFetchUserDataError(null); // Clear any previous fetch errors on sign out
        console.log("App.tsx: User signed out. State reset.");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch Data from Supabase
  const fetchUserData = async (userId: string) => {
    setIsSyncing(true);
    setFetchUserDataError(null); // Clear previous errors before new fetch
    console.log("App.tsx: Fetching user data for userId:", userId);
    try {
      const { data: userData, error: userDataError } = await supabase
        .from('user_data')
        .select('state')
        .eq('user_id', userId)
        .maybeSingle();

      if (userDataError) {
        console.error("App.tsx: Supabase user_data fetch error:", userDataError.message);
        throw userDataError; // Re-throw to be caught by the outer try-catch
      }
      console.log("App.tsx: User data fetched:", userData);

      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error("App.tsx: Supabase user profile fetch error:", profileError.message);
        throw profileError; // Re-throw to be caught by the outer try-catch
      }
      console.log("App.tsx: User profile fetched:", profileData);


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
             // Ensure full_name is always updated from the 'users' table if profile exists
             newState.profile.fullName = profileData.full_name;
           }
        } else {
          // If profileData is null, but we are authenticated, it means onboarding is needed.
          // Do not set fetchUserDataError here, as a missing profile just means onboarding.
          console.log("App.tsx: Profile data not found in 'users' table, likely new user or onboarding needed.");
        }
        console.log("App.tsx: Updated userState after fetch:", newState);
        return newState;
      });

      // If user_data was empty on Supabase, attempt to upload local state
      if (!userData?.state) {
        const local = localStorage.getItem('hsc_study_tracker_state');
        if (local) {
          const parsed = JSON.parse(local);
          console.log("App.tsx: No remote user_data, attempting to upload local state.");
          await saveUserData(userId, parsed);
        }
      }
    } catch (err: any) {
      console.error("App.tsx: Sync fetch error during fetchUserData:", err);
      setFetchUserDataError(err.message || "Failed to load user data from cloud."); // Set error state
    } finally {
      setIsSyncing(false);
      console.log("App.tsx: fetchUserData completed.");
    }
  };

  // 3. Save Data to Supabase
  const saveUserData = async (userId: string, state: any) => {
    setIsSyncing(true);
    console.log("App.tsx: Saving user data for userId:", userId);
    try {
      // Remove isAuthenticated from state before saving, as it's client-side only
      const { isAuthenticated, ...stateToSave } = state; 
      const { error } = await supabase
        .from('user_data')
        .upsert({ 
          user_id: userId, 
          state: stateToSave,
          updated_at: new Date().toISOString() 
        }, { onConflict: 'user_id' }); // Use onConflict for proper upsert behavior
      if (error) throw error;
      console.log("App.tsx: User data saved successfully.");
    } catch (err) {
      console.error("App.tsx: Sync save error:", err);
      // No need to set fetchUserDataError here, as this is a background save,
      // not critical for initial load display.
    } finally {
      setIsSyncing(false);
      console.log("App.tsx: saveUserData completed.");
    }
  };

  // 4. Persistence Effect
  useEffect(() => {
    localStorage.setItem('hsc_study_tracker_state', JSON.stringify(userState));
    
    const syncRemote = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        saveUserData(user.id, userState);
      }
    };

    if (userState.isAuthenticated) {
      const timeoutId = setTimeout(syncRemote, 1500); 
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
    console.log("App.tsx: Handling logout.");
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
    }

    setUserState(prev => ({
      ...prev,
      profile,
      subjects: finalSubjects,
      dailyTasks: []
    }));
    console.log("App.tsx: Onboarding complete. Profile and subjects set.");
    // After onboarding, immediately save the new profile to remote
    const saveNewProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && profile) {
        // Update the 'users' table with the full_name from onboarding
        const { error: profileUpdateError } = await supabase
          .from('users')
          .upsert({ id: user.id, full_name: profile.fullName }, { onConflict: 'id' });

        if (profileUpdateError) {
          console.error("App.tsx: Error updating user profile during onboarding completion:", profileUpdateError.message);
        } else {
          console.log("App.tsx: User full_name updated in 'users' table.");
        }
        // Save the rest of the userState
        await saveUserData(user.id, { ...userState, profile, subjects: finalSubjects, dailyTasks: [] });
      }
    };
    saveNewProfile();
  };

  if (isInitialLoading) {
    console.log("App.tsx: Rendering initial loading spinner.");
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-brand-primary" />
      </div>
    );
  }

  // Handle unauthenticated state
  if (!userState.isAuthenticated) {
    console.log("App.tsx: User not authenticated, rendering Auth component.");
    return <Auth onAuthSuccess={() => setUserState(prev => ({ ...prev, isAuthenticated: true }))} />;
  }

  // Handle specific error after authentication but before profile load
  if (fetchUserDataError && !userState.profile) {
    console.error("App.tsx: Rendering fetch data error screen:", fetchUserDataError);
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-4 text-center">
        <AlertTriangle size={60} className="text-red-500 mb-6" />
        <h2 className="text-xl md:text-2xl font-black text-brand-text-p mb-3">Error Loading Profile!</h2>
        <p className="text-brand-text-s max-w-sm">{fetchUserDataError}</p>
        <p className="text-brand-text-s mt-4">Please try logging out and back in, or contact support if the problem persists.</p>
        <button 
          onClick={handleLogout} 
          className="mt-8 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
        >
          Logout
        </button>
      </div>
    );
  }

  // Handle authenticated but no profile (onboarding needed)
  if (!userState.profile) {
    console.log("App.tsx: User authenticated but no profile, rendering Onboarding component.");
    return <Onboarding onComplete={handleProfileComplete} language={userState.language} />;
  }

  // Main app content
  console.log("App.tsx: User authenticated and profile loaded, rendering main Layout.");
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