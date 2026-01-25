
import React, { useState, useEffect } from 'react';
import { UserState, Group, Religion, Medium, UserProfile, Subject, Language as LangType } from './types';
import { COMPULSORY_SUBJECTS, GROUP_SUBJECTS, CHAPTER_LISTS } from './constants';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Tracker from './components/Tracker';
import AISidebar from './components/AISidebar';
import Auth from './components/Auth';
import Settings from './components/Settings';
import SyllabusManager from './components/SyllabusManager';
import { Layout } from './components/Layout';
import { Calendar } from 'lucide-react';

const App: React.FC = () => {
  const [userState, setUserState] = useState<UserState>(() => {
    const saved = localStorage.getItem('hsc_study_tracker_state');
    return saved ? JSON.parse(saved) : {
      isAuthenticated: false,
      profile: null,
      studyHistory: [],
      subjects: [],
      streaks: 0,
      badges: [],
      currentMood: 'Great',
      language: 'bn'
    };
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'tracker' | 'syllabus' | 'ai' | 'settings'>('dashboard');

  useEffect(() => {
    localStorage.setItem('hsc_study_tracker_state', JSON.stringify(userState));
  }, [userState]);

  const handleAuth = (success: boolean) => {
    setUserState(prev => ({ ...prev, isAuthenticated: success }));
  };

  const handleLogout = () => {
    setUserState({
      isAuthenticated: false,
      profile: null,
      studyHistory: [],
      subjects: [],
      streaks: 0,
      badges: [],
      currentMood: 'Great',
      language: 'bn'
    });
    localStorage.removeItem('hsc_study_tracker_state');
  };

  const handleProfileComplete = (profile: UserProfile) => {
    const compulsory = COMPULSORY_SUBJECTS.map((s, idx) => ({
      id: `comp-${idx}`,
      name: s.name!,
      paper: s.paper as 1|2,
      chapters: (CHAPTER_LISTS[s.name!] || ['Introduction', 'Core Concepts']).map((ch, cidx) => ({
        id: `ch-${idx}-${cidx}`,
        name: ch,
        isCompleted: false
      }))
    }));

    const specific = GROUP_SUBJECTS[profile.group].map((s, idx) => ({
      id: `group-${idx}`,
      name: s.name!,
      paper: s.paper as 1|2,
      chapters: (CHAPTER_LISTS[s.name!] || ['Basic Theory', 'Advanced Problems']).map((ch, cidx) => ({
        id: `group-ch-${idx}-${cidx}`,
        name: ch,
        isCompleted: false
      }))
    }));

    setUserState(prev => ({
      ...prev,
      profile,
      subjects: [...compulsory, ...specific]
    }));
  };

  const t = (bn: string, en: string) => userState.language === 'bn' ? bn : en;

  if (!userState.isAuthenticated) {
    return <Auth onAuthSuccess={() => handleAuth(true)} />;
  }

  if (!userState.profile) {
    return <Onboarding onComplete={handleProfileComplete} />;
  }

  return (
    <Layout 
      userProfile={userState.profile} 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      language={userState.language}
    >
      <div className="h-full">
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
