
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { UserState, UserProfile, StudySession } from './types';
import { CHAPTER_LISTS } from './constants';
import { supabase } from './lib/supabase';
import { Loader2, Menu, X, ArrowRight, Github, Facebook, Twitter, Mail } from 'lucide-react';

// Shared Layouts & Components
import { Layout } from './components/Layout';
import BackgroundGrid from './components/BackgroundGrid';

// Public Pages
import Landing from './pages/Landing';
import About from './pages/About';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import LoginPage from './pages/LoginPage';

// App Views (Dashboard)
import Dashboard from './components/Dashboard';
import Tracker from './components/Tracker';
import SyllabusManager from './components/SyllabusManager';
import TestSection from './components/TestSection';
import StudyCalendar from './components/StudyCalendar';
import Settings from './components/Settings';
import ProExamSystem from './components/ProExamSystem';
import Onboarding from './components/Onboarding';

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

const calculateStreak = (history: StudySession[]): number => {
  if (!history || history.length === 0) return 0;
  const studyDates = new Set(history.map(s => new Date(s.startTime).toDateString()));
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (!studyDates.has(today.toDateString()) && !studyDates.has(yesterday.toDateString())) return 0;
  let streakCount = 0;
  let checkDate = new Date();
  if (!studyDates.has(today.toDateString())) checkDate.setDate(checkDate.getDate() - 1);
  while (studyDates.has(checkDate.toDateString())) {
    streakCount++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  return streakCount;
};

// --- Navbar Component ---
const GlobalNavbar: React.FC<{ user: UserState }> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  if (isDashboard) return null;

  const links = [
    { name: 'About', path: '/about' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav className="sticky top-0 z-[100] w-full bg-brand-bg/80 backdrop-blur-md border-b border-brand-text-s/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="text-2xl font-black text-brand-primary italic tracking-tight">LEKHAPORA</Link>
        
        <div className="hidden md:flex items-center gap-10">
          {links.map(l => (
            <Link key={l.path} to={l.path} className="text-sm font-bold text-brand-text-s hover:text-brand-primary transition-colors">{l.name}</Link>
          ))}
          {user.isAuthenticated ? (
            <Link to="/dashboard" className="px-6 py-2.5 bg-brand-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all">Go to Dashboard</Link>
          ) : (
            <Link to="/login" className="px-6 py-2.5 bg-brand-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all">Login</Link>
          )}
        </div>

        <button className="md:hidden text-brand-text-p" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-brand-surface border-b border-brand-text-s/10 p-6 space-y-4 animate-in slide-in-from-top-4">
          {links.map(l => (
            <Link key={l.path} to={l.path} onClick={() => setIsOpen(false)} className="block text-lg font-bold text-brand-text-p">{l.name}</Link>
          ))}
          <Link to={user.isAuthenticated ? "/dashboard" : "/login"} onClick={() => setIsOpen(false)} className="block w-full py-4 bg-brand-primary text-white text-center rounded-2xl font-black uppercase tracking-widest">
            {user.isAuthenticated ? 'Dashboard' : 'Login'}
          </Link>
        </div>
      )}
    </nav>
  );
};

// --- Footer Component ---
const GlobalFooter: React.FC = () => {
  const location = useLocation();
  if (location.pathname.startsWith('/dashboard')) return null;

  return (
    <footer className="bg-brand-surface border-t border-brand-text-s/10 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-6 col-span-1 md:col-span-2">
          <h2 className="text-3xl font-black text-brand-primary italic">LEKHAPORA</h2>
          <p className="text-brand-text-s font-medium max-w-sm">Empowering Bangladesh's students with digital-first education and smart preparation tools.</p>
          <div className="flex gap-4">
            <Facebook className="text-brand-text-s hover:text-brand-primary cursor-pointer" />
            <Twitter className="text-brand-text-s hover:text-brand-primary cursor-pointer" />
            <Github className="text-brand-text-s hover:text-brand-primary cursor-pointer" />
          </div>
        </div>
        <div>
          <h4 className="font-black text-brand-text-p uppercase tracking-widest text-xs mb-6">Product</h4>
          <ul className="space-y-4 text-sm font-bold text-brand-text-s">
            <li><Link to="/about" className="hover:text-brand-primary transition-colors">About Us</Link></li>
            <li><Link to="/faq" className="hover:text-brand-primary transition-colors">FAQ</Link></li>
            <li><Link to="/contact" className="hover:text-brand-primary transition-colors">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-black text-brand-text-p uppercase tracking-widest text-xs mb-6">Legal</h4>
          <ul className="space-y-4 text-sm font-bold text-brand-text-s">
            <li><Link to="/privacy-policy" className="hover:text-brand-primary transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-brand-primary transition-colors">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-brand-text-s/5 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-s">© 2026 LEKHAPORA. ALL RIGHTS RESERVED.</p>
      </div>
    </footer>
  );
};

// --- Main App Component ---
const App: React.FC = () => {
  const [userState, setUserState] = useState<UserState>(() => {
    const saved = localStorage.getItem('hsc_study_tracker_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_STATE, ...parsed, isAuthenticated: false };
      } catch (e) {
        console.error("Local storage recovery failed:", e);
      }
    }
    return DEFAULT_STATE;
  });

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const isDataFetched = useRef(false);
  const lastSavedJson = useRef<string>("");

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session) await backgroundSync(session.user.id);
        else setIsInitialLoading(false);
      } catch (err) {
        setIsInitialLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        await backgroundSync(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        isDataFetched.current = false;
        setUserState(DEFAULT_STATE);
        localStorage.removeItem('hsc_study_tracker_state');
        setIsInitialLoading(false);
      }
    });

    checkSession();
    return () => subscription.unsubscribe();
  }, []);

  const backgroundSync = async (userId: string) => {
    try {
      const { data } = await supabase.from('user_data').select('state').eq('user_id', userId).maybeSingle();
      if (data?.state) {
        const cloudState = data.state as unknown as Partial<UserState>;
        const mergedState = { ...DEFAULT_STATE, ...cloudState, isAuthenticated: true };
        mergedState.streaks = calculateStreak(mergedState.studyHistory);
        setUserState(mergedState);
        lastSavedJson.current = JSON.stringify(cloudState);
      } else {
        setUserState(prev => ({ ...prev, isAuthenticated: true }));
      }
    } finally {
      isDataFetched.current = true;
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    if (userState.isAuthenticated) {
      localStorage.setItem('hsc_study_tracker_state', JSON.stringify(userState));
      const timeoutId = setTimeout(async () => {
        if (!isDataFetched.current) return;
        const { isAuthenticated, ...stateToSave } = userState;
        const currentStateJson = JSON.stringify(stateToSave);
        if (currentStateJson === lastSavedJson.current) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { error } = await supabase.from('user_data').upsert({ user_id: user.id, state: stateToSave, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
        if (!error) lastSavedJson.current = currentStateJson;
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [userState]);

  if (isInitialLoading) {
    return (
      <div className="h-screen w-full bg-brand-bg flex flex-col items-center justify-center gap-4">
        <Loader2 size={32} className="animate-spin text-brand-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text-s animate-pulse">Initializing Platform...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <GlobalNavbar user={userState} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy-policy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/login" element={userState.isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage mode="signin" />} />
        <Route path="/register" element={userState.isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage mode="signup" />} />
        
        {/* Protected Dashboard Route */}
        <Route path="/dashboard/*" element={
          !userState.isAuthenticated ? <Navigate to="/login" /> : 
          !userState.profile ? <Onboarding onComplete={(profile) => {
            const { selectedSubjectNames, ...p } = profile;
            const finalSubjects: any[] = [];
            selectedSubjectNames.forEach((name, idx) => {
              [1, 2].forEach(paperNum => {
                const chapters = (CHAPTER_LISTS[name] || ['Chapter 1']).map((ch, chIdx) => ({ id: `ch-${idx}-${paperNum}-${chIdx}-${Date.now()}`, name: ch, isCompleted: false }));
                finalSubjects.push({ id: `sub-${idx}-${paperNum}-${Date.now()}`, name, paper: paperNum as 1 | 2, chapters });
              });
            });
            setUserState(prev => ({ ...prev, profile: p, subjects: finalSubjects }));
          }} language={userState.language} /> :
          <DashboardRoutes userState={userState} setUserState={setUserState} />
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <GlobalFooter />
    </BrowserRouter>
  );
};

// Sub-component for Dashboard Internal Routing
const DashboardRoutes: React.FC<{ userState: UserState; setUserState: React.Dispatch<React.SetStateAction<UserState>> }> = ({ userState, setUserState }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'tracker' | 'syllabus' | 'test' | 'settings'>('dashboard');
  const [activeModelExamId, setActiveModelExamId] = useState<string | null>(null);

  return (
    <Layout userProfile={userState.profile!} activeTab={activeTab} onTabChange={setActiveTab} language={userState.language} userState={userState}>
      {activeTab === 'dashboard' && <Dashboard userState={userState} onUpdateState={setUserState} onTriggerTest={(s, c) => setActiveTab('test')} />}
      {activeTab === 'calendar' && <StudyCalendar userState={userState} onUpdateState={setUserState} onTabChange={setActiveTab} />}
      {activeTab === 'tracker' && <Tracker userState={userState} onUpdateState={setUserState} />}
      {activeTab === 'syllabus' && <SyllabusManager userState={userState} onUpdateState={setUserState} onTriggerTest={(s, c) => setActiveTab('test')} />}
      {activeTab === 'test' && <TestSection userState={userState} onUpdateState={setUserState} initialContext={null} clearContext={() => {}} onTriggerModelExam={(id) => setActiveModelExamId(id)} />}
      {activeTab === 'settings' && <Settings userState={userState} onUpdateState={setUserState} onLogout={async () => { await supabase.auth.signOut(); }} />}
      
      {activeModelExamId && (
        <ProExamSystem 
          key={activeModelExamId} 
          examId={activeModelExamId} 
          onClose={() => setActiveModelExamId(null)} 
          onUpdateState={setUserState}
          language={userState.language}
        />
      )}
    </Layout>
  );
};

export default App;
