
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { UserState, Subject, Chapter } from './types';
import { CHAPTER_LISTS } from './constants';

// Layouts
import { MarketingLayout as PublicLayout } from './components/MarketingLayout';
import PanelLayout from './layouts/PanelLayout';

// Modular Panels
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
import { Loader2 } from 'lucide-react';

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

const PanelLoader = () => (
  <div className="h-full w-full flex items-center justify-center opacity-50 bg-brand-bg/50">
    <Loader2 className="animate-spin text-brand-primary" size={32} />
  </div>
);

const AppContent: React.FC = () => {
  const [userState, setUserState] = useState<UserState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const syncUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('state')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (data?.state) {
        setUserState({ ...DEFAULT_STATE, ...data.state, isAuthenticated: true });
      } else {
        setUserState(prev => ({ ...prev, isAuthenticated: true }));
      }
    } catch (e) {
      console.error("Sync Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const safetyTimeout = setTimeout(() => setLoading(false), 3000);

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await syncUserData(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await syncUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUserState(DEFAULT_STATE);
        setLoading(false);
        const publicPaths = ['/about', '/faq', '/contact', '/privacy-policy', '/terms', '/login'];
        if (!publicPaths.some(p => location.pathname.includes(p))) {
          navigate('/about');
        }
      }
    });

    initSession();
    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-brand-bg">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-brand-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 font-black text-brand-primary uppercase tracking-[0.3em] text-[9px] animate-pulse italic">Lekhapora Architect Init...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Pages Layout */}
      <Route element={<PublicLayout isAuthenticated={userState.isAuthenticated} />}>
        <Route path="/about" element={<Suspense fallback={<PanelLoader />}><AboutPanel userState={userState} /></Suspense>} />
        <Route path="/login" element={userState.isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <Suspense fallback={<PanelLoader />}><AuthPanel mode="signin" /></Suspense>} />
        <Route path="/register" element={userState.isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <Suspense fallback={<PanelLoader />}><AuthPanel mode="signup" /></Suspense>} />
        <Route path="/" element={<Navigate to="/about" replace />} />
      </Route>

      {/* Legacy Redirection */}
      <Route path="/loging" element={<Navigate to="/login" replace />} />

      {/* Onboarding Flow */}
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
                    const chapters: Chapter[] = (CHAPTER_LISTS[name] || ['Chapter 1']).map((ch, chIdx) => ({
                      id: `ch-${idx}-${paperNum}-${chIdx}-${Date.now()}`,
                      name: ch,
                      isCompleted: false
                    }));
                    finalSubjects.push({ id: `sub-${idx}-${paperNum}-${Date.now()}`, name, paper: paperNum as 1 | 2, chapters });
                  });
                });
                setUserState(prev => ({ ...prev, profile: p, subjects: finalSubjects }));
                navigate('/app/dashboard');
              }} 
            />
          ) : <Navigate to="/app/dashboard" replace />
        }
      />

      {/* Protected App Dashboard Layout */}
      <Route 
        path="/app/*" 
        element={
          userState.isAuthenticated ? (
            !userState.profile ? <Navigate to="/onboarding" replace /> : (
              <PanelLayout userState={userState} onUpdateState={setUserState}>
                <Suspense fallback={<PanelLoader />}>
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
                    <Route path="about" element={<AboutPanel userState={userState} isAppPanel />} />
                    <Route index element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </Suspense>
              </PanelLayout>
            )
          ) : <Navigate to="/login" state={{ from: location }} replace />
        }
      />

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to={userState.isAuthenticated ? "/app/dashboard" : "/about"} replace />} />
    </Routes>
  );
};

// Basename detection for multi-tenant / sub-path environments
const getBasename = () => {
  const path = window.location.pathname;
  const parts = path.split('/').filter(Boolean);
  return (parts.length > 0 && parts[0].length > 20) ? `/${parts[0]}` : '';
};

const App: React.FC = () => {
  return (
    <BrowserRouter basename={getBasename()}>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
