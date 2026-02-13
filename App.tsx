
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { UserState } from './types';
import { CHAPTER_LISTS } from './constants';

// Layouts
import MarketingLayout from './components/MarketingLayout';
import { Layout } from './components/Layout';

// Public Pages
import Home from './pages/Home';
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

const App: React.FC = () => {
  const [userState, setUserState] = useState<UserState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await syncUserData(session.user.id);
      } else {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await syncUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUserState(DEFAULT_STATE);
        setLoading(false);
      }
    });

    initSession();
    return () => subscription.unsubscribe();
  }, []);

  const syncUserData = async (userId: string) => {
    try {
      const { data } = await supabase.from('user_data').select('state').eq('user_id', userId).maybeSingle();
      if (data?.state) {
        setUserState({ ...DEFAULT_STATE, ...data.state, isAuthenticated: true });
      } else {
        setUserState(prev => ({ ...prev, isAuthenticated: true }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userState.isAuthenticated) {
      const timeoutId = setTimeout(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { isAuthenticated, ...stateToSave } = userState;
          await supabase.from('user_data').upsert({ 
            user_id: user.id, 
            state: stateToSave, 
            updated_at: new Date().toISOString() 
          });
        }
      }, 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [userState]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-brand-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-black text-brand-primary uppercase tracking-widest text-[10px]">Initializing Lekhapora...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Marketing / Public Routes */}
        <Route element={<MarketingLayout isAuthenticated={userState.isAuthenticated} />}>
          <Route path="/" element={<Navigate to="/about" replace />} />
          <Route path="/about" element={<Home />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/loging" element={userState.isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/register" element={userState.isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />
        </Route>

        {/* Dashboard Routes (Protected) */}
        <Route path="/" element={
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
                activeTab={window.location.pathname.split('/')[1] || 'dashboard'} 
                onTabChange={(tabId) => window.location.assign(`/${tabId}`)} 
                language={userState.language} 
                userState={userState}
              />
            )
          ) : (
            <Navigate to="/loging" />
          )
        }>
          <Route path="dashboard" element={<Dashboard userState={userState} onUpdateState={setUserState} onTriggerTest={() => {}} />} />
          <Route path="calendar" element={<StudyCalendar userState={userState} onUpdateState={setUserState} onTabChange={(tab) => window.location.assign(`/${tab}`)} />} />
          <Route path="tracker" element={<Tracker userState={userState} onUpdateState={setUserState} />} />
          <Route path="syllabus" element={<SyllabusManager userState={userState} onUpdateState={setUserState} onTriggerTest={() => {}} />} />
          <Route path="test" element={<TestSection userState={userState} onUpdateState={setUserState} initialContext={null} clearContext={() => {}} />} />
          <Route path="settings" element={<Settings userState={userState} onUpdateState={setUserState} onLogout={async () => await supabase.auth.signOut()} />} />
          <Route index element={<Navigate to="/dashboard" />} />
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to={userState.isAuthenticated ? "/dashboard" : "/about"} />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
