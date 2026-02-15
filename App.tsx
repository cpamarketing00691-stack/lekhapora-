import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { supabase, withTimeout } from './lib/supabase';
import { UserState, UserProfile } from './types';
import { LekhaporaProvider, useLekhapora } from './contexts/LekhaporaContext';

// Layouts
import { MarketingLayout as PublicLayout } from './components/MarketingLayout';
import PanelLayout from './layouts/PanelLayout';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute';
import { AuthCallback } from './components/AuthCallback';
import Onboarding from './components/Onboarding';

// Optimized Panel Loading
const AboutPanel = lazy(() => import('./panels/AboutPanel'));
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
const CMSDashboard = lazy(() => import('./panels/cms/CMSDashboard'));
const AuthPanel = lazy(() => import('./panels/AuthPanel'));

// Missing Public Panels
const FAQPanel = lazy(() => import('./pages/FAQ'));
const ContactPanel = lazy(() => import('./pages/Contact'));
const PrivacyPanel = lazy(() => import('./pages/PrivacyPolicy'));
const TermsPanel = lazy(() => import('./pages/Terms'));

import { AdminLogin } from './components/AdminLogin';

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
  const { state: contextState, dispatch } = useLekhapora();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const syncUserData = useCallback(async (userId: string) => {
    try {
      const response: any = await withTimeout(
        supabase.from('user_data').select('state').eq('user_id', userId).maybeSingle(),
        6000
      );

      if (response.data?.state) {
        dispatch({ type: 'SET_INITIAL_STATE', payload: response.data.state });
      }
    } catch (e) { 
      console.error("Sync Error:", e);
    } finally { 
      setLoading(false); 
    }
  }, [dispatch]);

  useEffect(() => {
    let authSubscription: any;
    
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          dispatch({ type: 'SET_INITIAL_STATE', payload: { ...contextState, user: { ...contextState.user, id: session.user.id } } as any });
          await syncUserData(session.user.id);
        } else {
          setLoading(false);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session) {
            dispatch({ type: 'SET_INITIAL_STATE', payload: { ...contextState, user: { ...contextState.user, id: session.user.id } } as any });
            await syncUserData(session.user.id);
          } else if (event === 'SIGNED_OUT') {
            localStorage.removeItem(STATE_CACHE_KEY);
            if (location.pathname.startsWith('/app')) navigate('/about');
            setLoading(false);
          }
        });
        authSubscription = subscription;
      } catch (err) {
        setLoading(false);
      }
    };

    init();
    return () => authSubscription?.unsubscribe();
  }, [syncUserData, navigate, location.pathname, dispatch]);

  const handleOnboardingComplete = async (profile: UserProfile & { selectedSubjectNames: string[] }) => {
    const { selectedSubjectNames, ...profileData } = profile;
    
    const initialSubjects = selectedSubjectNames.map((name, idx) => ({
      id: `sub-${Date.now()}-${idx}`,
      name,
      paper: 1 as 1 | 2,
      chapters: []
    }));

    const newState = { 
      ...contextState, 
      user: { ...contextState.user, profile: profileData }, 
      subjects: initialSubjects 
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_data').upsert({
          user_id: user.id,
          state: newState,
          updated_at: new Date().toISOString()
        });
      }
      dispatch({ type: 'SET_INITIAL_STATE', payload: newState as any });
      navigate('/app/dashboard');
    } catch (e) {
      alert("Error saving profile.");
    }
  };

  // Bridge for components expecting UserState
  const legacyUserState: UserState = {
    isAuthenticated: !!contextState.user.id,
    profile: contextState.user.profile,
    studyHistory: contextState.studyHistory,
    testHistory: contextState.testHistory,
    subjects: contextState.subjects,
    dailyTasks: contextState.tasks,
    streaks: 0, // Calculated in UI
    badges: [],
    currentMood: 'Great',
    language: contextState.settings.language,
    activeTimer: null,
    reminders: [],
    notificationsEnabled: contextState.settings.notificationsEnabled
  };

  const onUpdateLegacyState = (updater: any) => {
    // This is a bridge to handle components still using the functional update pattern
    console.warn("Legacy state updater called. Migration to Context required.");
  };

  if (loading && !contextState.user.profile && !location.pathname.startsWith('/admin') && location.pathname !== '/auth/callback') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-brand-bg gap-4">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase text-brand-text-s tracking-widest animate-pulse">Initializing Core...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route element={<PublicLayout isAuthenticated={legacyUserState.isAuthenticated} />}>
        <Route path="/about" element={<Suspense fallback={<PanelSkeleton />}><AboutPanel userState={legacyUserState} /></Suspense>} />
        <Route path="/faq" element={<Suspense fallback={<PanelSkeleton />}><FAQPanel /></Suspense>} />
        <Route path="/contact" element={<Suspense fallback={<PanelSkeleton />}><ContactPanel /></Suspense>} />
        <Route path="/privacy-policy" element={<Suspense fallback={<PanelSkeleton />}><PrivacyPanel /></Suspense>} />
        <Route path="/terms" element={<Suspense fallback={<PanelSkeleton />}><TermsPanel /></Suspense>} />
        <Route path="/login" element={legacyUserState.isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <Suspense fallback={<PanelSkeleton />}><AuthPanel mode="signin" /></Suspense>} />
        <Route path="/register" element={legacyUserState.isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <Suspense fallback={<PanelSkeleton />}><AuthPanel mode="signup" /></Suspense>} />
        <Route path="/" element={<Navigate to="/about" replace />} />
      </Route>

      <Route 
        path="/onboarding" 
        element={
          legacyUserState.isAuthenticated ? (
            legacyUserState.profile ? <Navigate to="/app/dashboard" replace /> : <Onboarding onComplete={handleOnboardingComplete} language={legacyUserState.language} />
          ) : <Navigate to="/login" replace />
        } 
      />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route 
        path="/admin/*" 
        element={
          <ProtectedAdminRoute>
            <PanelLayout userState={legacyUserState} onUpdateState={onUpdateLegacyState}>
              <Suspense fallback={<PanelSkeleton />}>
                <Routes>
                  <Route path="cms" element={<CMSDashboard />} />
                  <Route index element={<Navigate to="cms" replace />} />
                </Routes>
              </Suspense>
            </PanelLayout>
          </ProtectedAdminRoute>
        } 
      />

      <Route 
        path="/app/*" 
        element={
          legacyUserState.isAuthenticated ? (
            !legacyUserState.profile ? <Navigate to="/onboarding" replace /> : (
              <PanelLayout userState={legacyUserState} onUpdateState={onUpdateLegacyState}>
                <Suspense fallback={<PanelSkeleton />}>
                  <Routes>
                    <Route path="dashboard" element={<DashboardPanel />} />
                    <Route path="syllabus" element={<SyllabusPanel userState={legacyUserState} onUpdateState={onUpdateLegacyState} />} />
                    <Route path="tracker" element={<TrackerPanel userState={legacyUserState} onUpdateState={onUpdateLegacyState} />} />
                    <Route path="exams" element={<ExamsPanel userState={legacyUserState} onUpdateState={onUpdateLegacyState} />} />
                    <Route path="calendar" element={<CalendarPanel userState={legacyUserState} onUpdateState={onUpdateLegacyState} />} />
                    <Route path="ai" element={<AIPanel userState={legacyUserState} onUpdateState={onUpdateLegacyState} />} />
                    <Route path="analytics" element={<AnalyticsPanel userState={legacyUserState} />} />
                    <Route path="settings" element={<SettingsPanel userState={legacyUserState} onUpdateState={onUpdateLegacyState} onLogout={() => supabase.auth.signOut()} />} />
                    <Route path="ocr" element={<OCRPanel userState={legacyUserState} onUpdateState={onUpdateLegacyState} />} />
                    <Route path="system" element={<SystemPanel userState={legacyUserState} onUpdateState={onUpdateLegacyState} />} />
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
    <LekhaporaProvider>
      <AppContent />
    </LekhaporaProvider>
  </BrowserRouter>
);

export default App;