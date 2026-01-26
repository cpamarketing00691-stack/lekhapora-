
import React, { useState, useEffect, useRef } from 'react';
import { UserState, Group, Religion, Medium, UserProfile, Subject, Language as LangType, ActiveTimerState, StudySession } from './types';
import { COMPULSORY_SUBJECTS, GROUP_SUBJECTS, CHAPTER_LISTS } from './constants';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Tracker from './components/Tracker';
import AISidebar from './components/AISidebar';
import Auth from './components/Auth';
import Settings from './components/Settings';
import SyllabusManager from './components/SyllabusManager';
import { Layout } from './components/Layout';

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
      language: 'bn',
      activeTimer: null
    };
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'tracker' | 'syllabus' | 'ai' | 'settings'>('dashboard');
  const timerIntervalRef = useRef<number | null>(null);

  // Persistence effect
  useEffect(() => {
    localStorage.setItem('hsc_study_tracker_state', JSON.stringify(userState));
  }, [userState]);

  /**
   * GLOBAL TIMER LOGIC
   * This effect runs continuously if there is an active timer session.
   * It uses timestamps to calculate delta time, ensuring accuracy even if intervals lag.
   */
  useEffect(() => {
    if (userState.activeTimer) {
      if (!timerIntervalRef.current) {
        timerIntervalRef.current = window.setInterval(() => {
          setUserState(prev => {
            if (!prev.activeTimer) return prev;
            
            const now = Date.now();
            const delta = Math.floor((now - prev.activeTimer.lastTimestamp) / 1000);
            if (delta < 1) return prev;

            const updatedTimer = { ...prev.activeTimer, lastTimestamp: now };

            // If focus is active, increment focus seconds.
            // Otherwise, increment break seconds (Auto-Break logic).
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
      if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    };
  }, [userState.activeTimer?.isFocusActive, !!userState.activeTimer]);

  /**
   * AUTO-PAUSE LOGIC
   * Whenever the user navigates away from the tracker, focus is paused.
   * Pausing focus automatically triggers break time accumulation in the main interval.
   */
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
      language: 'bn',
      activeTimer: null
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
