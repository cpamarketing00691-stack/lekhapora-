
import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { UserState, Subject, Chapter } from './types';
import { CHAPTER_LISTS } from './constants';

// Layouts
import { MarketingLayout as PublicLayout } from './components/MarketingLayout';
import PanelLayout from './layouts/PanelLayout';

// Optimized Panel Loading
const AboutPanel = lazy(() => import('./panels/AboutPanel'));
const AuthPanel = lazy(() => import('./panels/AuthPanel'));
const DashboardPanel = lazy(() => import('./panels/DashboardPanel'));
const SyllabusPanel = lazy(() => import('./panels/SyllabusPanel'));
const TrackerPanel = lazy(() => import('./panels/TrackerPanel'));
const ExamsPanel = lazy(() => import('./panels/ExamsPanel'));
const CalendarPanel = lazy(() => import('./panels/CalendarPanel'));
const AIPanel = lazy(() => import('./panels/AIPanel'));
const AnalyticsPanel = lazy(() => import('./panels/AnalyticsPanel'));
const SettingsPanel = lazy(() => import('./panels/SettingsPanel'));
const OCRPanel = lazy(() => import('./panels/OCRPanel'));
const SystemPanel = lazy(() => import('./panels/SystemPanel'));

// Components
import Onboarding from './components/Onboarding';

const STATE_CACHE_KEY = 'lekhapora_user_state_v1';

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

const PanelSkeleton = () => (
  <div className="w-full h-screen animate-pulse p-8 space-y-6">
    <div className="h-12 bg-brand-surface rounded-3xl w-1/4 mb-10" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="h-48 bg-brand-surface rounded-[2.5rem] col-span-2" />
      <div className="h-48 bg-brand-surface rounded-[2.5rem]" />
    </div>
    <div className="h-64 bg-brand-surface rounded-[3rem] w-full" />
  </div>
);

const AppContent: React.FC = () => {
  // 1. Initial State from Cache (Fastest Path)
  const [userState, setUserState] = useState<UserState>(() => {
    const cached = localStorage.getItem(STATE_CACHE_KEY);
    if (cached) {
      try {
        return { ...JSON.parse(cached), isAuthenticated: false }; // Set auth false until verified
      } catch (e) {
        return DEFAULT_STATE;
      }
    }
    return DEFAULT_STATE;
  });

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // 2. Optimized Sync
  const syncUserData = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_data')
        .select('state')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (data?.state) {
        const newState = { ...DEFAULT_STATE, ...data.state, isAuthenticated: true };
        setUserState(newState);
        localStorage.setItem(STATE_CACHE_KEY, JSON.stringify(newState));
      } else {
        setUserState(prev => ({ ...prev, isAuthenticated: true }));
      }
    } catch (e) {
      console.error("Sync Error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let authSubscription: any;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await syncUserData(session.user.id);
      } else {
        setLoading(false);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
          await syncUserData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem(STATE_CACHE_KEY);
          setUserState(DEFAULT_STATE);
          if (location.pathname.startsWith('/app')) navigate('/about');
          setLoading(false);
        }
      });
      authSubscription = subscription;
    };

    init();
    return () => authSubscription?.unsubscribe();
  }, [syncUserData, navigate]);

  if (loading && !userState.profile) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-brand-bg">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<PublicLayout isAuthenticated={userState.isAuthenticated} />}>
        <Route path="/about" element={<Suspense fallback={<PanelSkeleton />}><AboutPanel userState={userState} /></Suspense>} />
        <Route path="/login" element={userState.isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <Suspense fallback={<PanelSkeleton />}><AuthPanel mode="signin" /></Suspense>} />
        <Route path="/register" element={userState.isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <Suspense fallback={<PanelSkeleton />}><AuthPanel mode="signup" /></Suspense>} />
        <Route path="/" element={<Navigate to="/about" replace />} />
      </Route>

      <Route 
        path="/onboarding" 
        element={
          userState.isAuthenticated && !userState.profile ? (
            <Onboarding 
              language={userState.language}
              onComplete={(profile) => {
                const { selectedSubjectNames, ...p } = profile;
                const finalSubjects: Subject[] = [];
                selectedSubjectNames.forEach((name, idx) => {
                  [1, 2].forEach(paperNum => {
                    // Added status and studyTimeSeconds to fix Chapter object creation
                    const chapters: Chapter[] = (CHAPTER_LISTS[name] || ['Chapter 1']).map((ch, chIdx) => ({
                      id: `ch-${idx}-${paperNum}-${chIdx}-${Date.now()}`,
                      name: ch,
                      isCompleted: false,
                      status: 'not-started',
                      studyTimeSeconds: 0
                    }));
                    finalSubjects.push({ id: `sub-${idx}-${paperNum}-${Date.now()}`, name, paper: paperNum as 1 | 2, chapters });
                  });
                });
                const newState = { ...userState, profile: p, subjects: finalSubjects };
                setUserState(newState);
                localStorage.setItem(STATE_CACHE_KEY, JSON.stringify(newState));
                navigate('/app/dashboard');
              }} 
            />
          ) : <Navigate to="/app/dashboard" replace />
        }
      />

      <Route 
        path="/app/*" 
        element={
          userState.isAuthenticated ? (
            !userState.profile ? <Navigate to="/onboarding" replace /> : (
              <PanelLayout userState={userState} onUpdateState={setUserState}>
                <Suspense fallback={<PanelSkeleton />}>
                  <Routes>
                    <Route path="dashboard" element={<DashboardPanel userState={userState} onUpdateState={setUserState} />} />
                    <Route path="syllabus" element={<SyllabusPanel userState={userState} onUpdateState={setUserState} />} />
                    <Route path="tracker" element={<TrackerPanel userState={userState} onUpdateState={setUserState} />} />
                    <Route path="exams" element={<ExamsPanel userState={userState} onUpdateState={setUserState} />} />
                    <Route path="calendar" element={<CalendarPanel userState={userState} onUpdateState={setUserState} />} />
                    <Route path="ai" element={<AIPanel userState={userState} onUpdateState={setUserState} />} />
                    <Route path="analytics" element={<AnalyticsPanel userState={userState} />} />
                    <Route path="settings" element={<SettingsPanel userState={userState} onUpdateState={setUserState} onLogout={() => supabase.auth.signOut()} />} />
                    <Route path="ocr" element={<OCRPanel userState={userState} onUpdateState={setUserState} />} />
                    <Route path="system" element={<SystemPanel userState={userState} onUpdateState={setUserState} />} />
                    <Route index element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </Suspense>
              </PanelLayout>
            )
          ) : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AppContent />
  </BrowserRouter>
);

export default App;
