import React, { useState, useEffect, Suspense, lazy, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { supabase, withTimeout, testConnection } from './lib/supabase';
import { UserState } from './types';
import { LekhaporaProvider } from './contexts/LekhaporaContext';

// Layouts
import { MarketingLayout as PublicLayout } from './components/MarketingLayout';
import PanelLayout from './layouts/PanelLayout';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute';
import { AuthCallback } from './components/AuthCallback';

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
  const [userState, setUserState] = useState<UserState>(() => {
    const cached = localStorage.getItem(STATE_CACHE_KEY);
    if (cached) {
      try { 
        return { ...JSON.parse(cached), isAuthenticated: false }; 
      } catch (e) { 
        return DEFAULT_STATE; 
      }
    }
    return DEFAULT_STATE;
  });

  const [loading, setLoading] = useState(true);
  const [bootStatus, setBootStatus] = useState('Initializing Security...');
  const initFlagRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  const syncUserData = useCallback(async (userId: string) => {
    setBootStatus('Synchronizing Profile...');
    try {
      const response: any = await withTimeout(
        supabase.from('user_data').select('state').eq('user_id', userId).maybeSingle(),
        7000
      );

      if (response.data?.state) {
        const newState = { ...DEFAULT_STATE, ...response.data.state, isAuthenticated: true };
        setUserState(newState);
        localStorage.setItem(STATE_CACHE_KEY, JSON.stringify(newState));
      } else {
        setUserState(prev => ({ ...prev, isAuthenticated: true }));
      }
    } catch (e) { 
      console.error("🟢 APP: Boot sync error (likely slow network). Falling back to offline state.");
      if (userState.profile) {
        setUserState(prev => ({ ...prev, isAuthenticated: true }));
      }
    } finally { 
      setLoading(false); 
    }
  }, [userState.profile]);

  useEffect(() => {
    if (initFlagRef.current) return;
    initFlagRef.current = true;

    console.log('🟢 APP: Starting Fail-Safe Boot...');
    let authSubscription: any;
    
    // Nuclear Option: Safety "Dead Man's Switch"
    // If we are still loading in 12 seconds, we FORCE entry into whatever state we have.
    const safetyTimer = setTimeout(() => {
      if (loading) {
        console.warn("🔴 APP: Safety hard-stop triggered. Forcing UI render.");
        setLoading(false);
      }
    }, 12000);

    const init = async () => {
      try {
        setBootStatus('Verifying Gateway...');
        const { data: { session }, error }: any = await withTimeout(supabase.auth.getSession(), 6000);
        
        if (error) throw error;

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
      } catch (err: any) {
        console.error("🔴 APP: Boot Failure:", err.message);
        setLoading(false);
      } finally {
        clearTimeout(safetyTimer);
      }
    };

    init();
    return () => {
      clearTimeout(safetyTimer);
      authSubscription?.unsubscribe();
    };
  }, [syncUserData, navigate]);

  if (loading && !userState.profile && !location.pathname.startsWith('/admin') && location.pathname !== '/auth/callback') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-brand-bg gap-6 p-6 text-center">
        <div className="w-14 h-14 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase text-brand-primary tracking-[0.3em] animate-pulse">
            {bootStatus}
          </p>
          <p className="text-[9px] font-bold text-brand-text-s uppercase tracking-widest opacity-50">
            Secure Protocol v2.4
          </p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route element={<PublicLayout isAuthenticated={userState.isAuthenticated} />}>
        <Route path="/about" element={<Suspense fallback={<PanelSkeleton />}><AboutPanel userState={userState} /></Suspense>} />
        <Route path="/login" element={userState.isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <Suspense fallback={<PanelSkeleton />}><AuthPanel mode="signin" /></Suspense>} />
        <Route path="/register" element={userState.isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <Suspense fallback={<PanelSkeleton />}><AuthPanel mode="signup" /></Suspense>} />
        <Route path="/" element={<Navigate to="/about" replace />} />
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route 
        path="/admin/*" 
        element={
          <ProtectedAdminRoute>
            <PanelLayout userState={userState} onUpdateState={setUserState}>
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
          userState.isAuthenticated ? (
            !userState.profile ? <Navigate to="/onboarding" replace /> : (
              <PanelLayout userState={userState} onUpdateState={setUserState}>
                <Suspense fallback={<PanelSkeleton />}>
                  <Routes>
                    <Route path="dashboard" element={<DashboardPanel />} />
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
    <LekhaporaProvider>
      <AppContent />
    </LekhaporaProvider>
  </BrowserRouter>
);

export default App;