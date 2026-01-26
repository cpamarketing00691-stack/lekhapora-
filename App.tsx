
import React, { useState, useEffect, useRef } from 'react';
import { UserState, Group, Religion, Medium, UserProfile, Subject, Language as LangType, ActiveTimerState, StudySession } from './types';
import { CHAPTER_LISTS } from './constants';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Tracker from './components/Tracker';
import AISidebar from './components/AISidebar';
import Auth from './components/Auth';
import Settings from './components/Settings';
import SyllabusManager from './components/SyllabusManager';
import { Layout } from './components/Layout';

const App: React.FC = () => {
  // Global single source of truth: initialized from localStorage and shared via props
  const [userState, setUserState] = useState<UserState>(() => {
    const saved = localStorage.getItem('hsc_study_tracker_state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse local storage", e);
      }
    }
    return {
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

  // Global persistence effect - syncs the entire userState whenever it changes
  useEffect(() => {
    localStorage.setItem('hsc_study_tracker_state', JSON.stringify(userState));
  }, [userState]);

  /**
   * GLOBAL TIMER LOGIC
   * Uses timestamps for delta calculation to prevent drift and ensure focus/break time is accurate.
   */
  useEffect(() => {
    if (userState.activeTimer) {
      if (!timerIntervalRef.current) {
        timerIntervalRef.current = window.setInterval(() => {
          setUserState(prev => {
            if (!prev.activeTimer) return prev;
            
            const now = Date.now();
            // Calculate real elapsed time in seconds
            const delta = Math.floor((now - prev.activeTimer.lastTimestamp) / 1000);
            if (delta < 1) return prev;

            // Increment appropriate counters based on current focus state
            const updatedTimer = { 
              ...prev.activeTimer, 
              lastTimestamp: prev.activeTimer.lastTimestamp + (delta * 1000) 
            };

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
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [userState.activeTimer?.isFocusActive, !!userState.activeTimer]);

  /**
   * AUTO-PAUSE LOGIC
   * Pauses active focus sessions when navigating away from the Tracker tab.
   * This ensures break time is automatically tracked.
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

  const handleProfileComplete = (onboardingData: UserProfile & { selectedSubjectNames: string[] }) => {
    const { selectedSubjectNames, ...profile } = onboardingData;

    // Map selected subject names to full Subject objects with localized paper 1/2 logic
    const finalSubjects: Subject[] = [];

    selectedSubjectNames.forEach((name, subIdx) => {
      // Compulsory subjects like Bangla, English usually have 2 papers in NCTB
      const needsTwoPapers = name === 'Bangla' || name === 'English' || 
                            name === 'Physics' || name === 'Chemistry' || 
                            name === 'Biology' || name === 'Higher Math' ||
                            name === 'Accounting' || name === 'Economics'; // etc.
      
      const papersToCreate = (name === 'ICT') ? [1] : (needsTwoPapers ? [1, 2] : [1]);

      papersToCreate.forEach(paperNum => {
        const chapters = (CHAPTER_LISTS[name] || ['সূচনা', 'মূল ধারণা', 'অ্যাডভান্সড প্রবলেম']).map((ch, chIdx) => ({
          id: `ch-${subIdx}-${paperNum}-${chIdx}`,
          name: ch,
          isCompleted: false
        }));

        finalSubjects.push({
          id: `sub-${subIdx}-${paperNum}-${Date.now()}`,
          name: name,
          paper: paperNum as 1 | 2,
          chapters: chapters
        });
      });
    });

    setUserState(prev => ({
      ...prev,
      profile,
      subjects: finalSubjects
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
