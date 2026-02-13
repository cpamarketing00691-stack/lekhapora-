
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { UserState } from './types';
import { CHAPTER_LISTS } from './constants';

// Layouts
import { MarketingLayout } from './components/MarketingLayout';
import { Layout } from './components/Layout';

// Public Pages
import Home from './pages/Home';
import About from './pages/About';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import Login from './pages/Login';
import Register from './pages/Register';

// Dashboard Components
import Dashboard from './components/Dashboard';
import Tracker from './components/Tracker';
import SyllabusManager from './components/SyllabusManager';
import TestSection from './components/TestSection';
import Settings from './components/Settings';
import Onboarding from './components/Onboarding';
import StudyCalendar from './components/StudyCalendar';

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
    // Safety timeout to prevent infinite loading if network or Supabase hangs
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await syncUserData(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth Init Error:", err);
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await syncUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUserState(DEFAULT_STATE);
        setLoading(false);
        // Navigate to login only if not on a public page
        const publicPaths = ['/about', '/faq', '/contact', '/privacy-policy', '/terms', '/register'];
        if (!publicPaths.includes(location.pathname)) {
          navigate('/loging');
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
      <div className="h-screen w-full flex items-center justify-center bg-brand-bg transition-colors duration-500">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-brand-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="font-black text-brand-primary uppercase tracking-[0.3em] text-[10px] animate-pulse">Initializing Lekhapora...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<MarketingLayout isAuthenticated={userState.isAuthenticated} />}>
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/" element={<Navigate to="/about" replace />} />
      </Route>

      {/* Auth Routes */}
      <Route path="/loging" element={userState.isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/login" element={<Navigate to="/loging" replace />} />
      <Route path="/register" element={userState.isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} />

      {/* Protected Dashboard Routes */}
      <Route 
        path="/" 
        element={
          userState.isAuthenticated ? (
            !userState.profile ? (
              <Onboarding 
                language={userState.language}
                onComplete={(profile) => {
                  const { selectedSubjectNames, ...p } = profile;
                  const finalSubjects: any[] = [];
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
                  setUserState(prev => ({ ...prev, profile: p, subjects: finalSubjects }));
                }} 
              />
            ) : (
              <Layout 
                userProfile={userState.profile} 
                activeTab={location.pathname.replace('/', '') || 'dashboard'} 
                onTabChange={(tabId) => navigate(`/${tabId}`)} 
                language={userState.language} 
                userState={userState}
              />
            )
          ) : (
            <Navigate to="/loging" replace />
          )
        }
      >
        <Route path="dashboard" element={<Dashboard userState={userState} onUpdateState={setUserState} onTriggerTest={() => {}} />} />
        <Route path="calendar" element={<StudyCalendar userState={userState} onUpdateState={setUserState} onTabChange={(tab) => navigate(`/${tab}`)} />} />
        <Route path="tracker" element={<Tracker userState={userState} onUpdateState={setUserState} />} />
        <Route path="syllabus" element={<SyllabusManager userState={userState} onUpdateState={setUserState} onTriggerTest={() => {}} />} />
        <Route path="test" element={<TestSection userState={userState} onUpdateState={setUserState} initialContext={null} clearContext={() => {}} />} />
        <Route path="settings" element={<Settings userState={userState} onUpdateState={setUserState} onLogout={async () => await supabase.auth.signOut()} />} />
        <Route index element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Catch All */}
      <Route path="*" element={<Navigate to={userState.isAuthenticated ? "/dashboard" : "/about"} replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
