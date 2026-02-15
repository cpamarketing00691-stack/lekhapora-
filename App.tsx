
import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { supabase, withTimeout } from './lib/supabase';
import { UserState, UserProfile } from './types';
import { useLekhapora } from './contexts/LekhaporaContext';
import { useAuth } from './contexts/AuthContext';
// Import Loader2 from lucide-react to fix the reference error on line 134
import { Loader2 } from 'lucide-react';

// Components & UI
import { MarketingLayout as PublicLayout } from './components/MarketingLayout';
import PanelLayout from './layouts/PanelLayout';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthCallback } from './components/AuthCallback';
import { BrowserWarning } from './components/BrowserWarning';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
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

// Public Pages
const FAQPanel = lazy(() => import('./pages/FAQ'));
const ContactPanel = lazy(() => import('./pages/Contact'));
const PrivacyPanel = lazy(() => import('./pages/PrivacyPolicy'));
const TermsPanel = lazy(() => import('./pages/Terms'));

import { AdminLogin } from './components/AdminLogin';

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
  const { user, loading: authLoading } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const syncUserData = useCallback(async (userId: string) => {
    setSyncing(true);
    try {
      const response: any = await withTimeout(
        supabase.from('user_data').select('state').eq('user_id', userId).maybeSingle(),
        8000
      );

      if (response.data?.state) {
        dispatch({ type: 'SET_INITIAL_STATE', payload: response.data.state });
      }
    } catch (e) { 
      console.error("Sync Error:", e);
    } finally { 
      setSyncing(false); 
    }
  }, [dispatch]);

  useEffect(() => {
    if (user && !syncing && !contextState.user.profile) {
      syncUserData(user.id);
    }
  }, [user, syncing, contextState.user.profile, syncUserData]);

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
      user: { id: user?.id || '', profile: profileData }, 
      subjects: initialSubjects 
    };

    try {
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

  // Bridge for legacy components
  const legacyUserState: UserState = {
    isAuthenticated: !!user,
    profile: contextState.user.profile,
    studyHistory: contextState.studyHistory,
    testHistory: contextState.testHistory,
    subjects: contextState.subjects,
    dailyTasks: contextState.tasks,
    streaks: 0,
    badges: [],
    currentMood: 'Great',
    language: contextState.settings.language,
    activeTimer: null,
    reminders: [],
    notificationsEnabled: contextState.settings.notificationsEnabled
  };

  if (authLoading && !location.pathname.startsWith('/admin') && location.pathname !== '/auth/callback') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-brand-bg">
        <Loader2 className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase text-brand-text-s tracking-widest animate-pulse">Establishing Secure Socket...</p>
      </div>
    );
  }

  return (
    <>
      <BrowserWarning />
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Public Marketing Routes */}
        <Route element={<PublicLayout isAuthenticated={!!user} />}>
          <Route path="/about" element={<Suspense fallback={<PanelSkeleton />}><AboutPanel userState={legacyUserState} /></Suspense>} />
          <Route path="/faq" element={<Suspense fallback={<PanelSkeleton />}><FAQPanel /></Suspense>} />
          <Route path="/contact" element={<Suspense fallback={<PanelSkeleton />}><ContactPanel /></Suspense>} />
          <Route path="/privacy-policy" element={<Suspense fallback={<PanelSkeleton />}><PrivacyPanel /></Suspense>} />
          <Route path="/terms" element={<Suspense fallback={<PanelSkeleton />}><TermsPanel /></Suspense>} />
          <Route path="/login" element={user ? <Navigate to="/app/dashboard" replace /> : <Suspense fallback={<PanelSkeleton />}><AuthPanel mode="signin" /></Suspense>} />
          <Route path="/register" element={user ? <Navigate to="/app/dashboard" replace /> : <Suspense fallback={<PanelSkeleton />}><AuthPanel mode="signup" /></Suspense>} />
          <Route path="/" element={<Navigate to="/about" replace />} />
        </Route>

        {/* Onboarding */}
        <Route 
          path="/onboarding" 
          element={
            <ProtectedRoute>
              {contextState.user.profile ? <Navigate to="/app/dashboard" replace /> : <Onboarding onComplete={handleOnboardingComplete} language={contextState.settings.language} />}
            </ProtectedRoute>
          } 
        />

        {/* Admin Portal */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route 
          path="/admin/*" 
          element={
            <ProtectedAdminRoute>
              <PanelLayout userState={legacyUserState} onUpdateState={() => {}}>
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

        {/* Application Core */}
        <Route 
          path="/app/*" 
          element={
            <ProtectedRoute>
              {!contextState.user.profile && !syncing ? <Navigate to="/onboarding" replace /> : (
                <PanelLayout userState={legacyUserState} onUpdateState={() => {}}>
                  <Suspense fallback={<PanelSkeleton />}>
                    <Routes>
                      <Route path="dashboard" element={<DashboardPanel />} />
                      <Route path="syllabus" element={<SyllabusPanel userState={legacyUserState} onUpdateState={() => {}} />} />
                      <Route path="tracker" element={<TrackerPanel userState={legacyUserState} onUpdateState={() => {}} />} />
                      <Route path="exams" element={<ExamsPanel userState={legacyUserState} onUpdateState={() => {}} />} />
                      <Route path="calendar" element={<CalendarPanel userState={legacyUserState} onUpdateState={() => {}} />} />
                      <Route path="ai" element={<AIPanel userState={legacyUserState} onUpdateState={() => {}} />} />
                      <Route path="analytics" element={<AnalyticsPanel userState={legacyUserState} />} />
                      <Route path="settings" element={<SettingsPanel userState={legacyUserState} onUpdateState={() => {}} onLogout={() => supabase.auth.signOut()} />} />
                      <Route path="ocr" element={<OCRPanel userState={legacyUserState} onUpdateState={() => {}} />} />
                      <Route path="system" element={<SystemPanel userState={legacyUserState} onUpdateState={() => {}} />} />
                      <Route index element={<Navigate to="dashboard" replace />} />
                    </Routes>
                  </Suspense>
                </PanelLayout>
              )}
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<div className="p-20 text-center font-black">404 - PROTOCOL BREACH</div>} />
      </Routes>
      <PWAInstallPrompt />
    </>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AppContent />
  </BrowserRouter>
);

export default App;
