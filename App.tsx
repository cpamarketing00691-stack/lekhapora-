
import React, { useState, useEffect } from 'react';
import { UserState, Group, Religion, Medium, UserProfile, Subject, Language as LangType } from './types';
import { COMPULSORY_SUBJECTS, GROUP_SUBJECTS, CHAPTER_LISTS } from './constants';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Tracker from './components/Tracker';
import AISidebar from './components/AISidebar';
import Auth from './components/Auth';
import Settings from './components/Settings';
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
             <div className="space-y-6">
               <h2 className="text-3xl font-black">{t('NCTB সিলেবাস', 'NCTB Syllabus')}</h2>
               {userState.subjects.map(sub => (
                 <div key={sub.id} className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
                   <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                      <div className="flex flex-col">
                        <h3 className="font-bold text-xl">{sub.name} <span className="text-slate-400 text-sm font-normal ml-2">{t('পত্র', 'Paper')} {sub.paper}</span></h3>
                        <div className="flex items-center gap-2 mt-2">
                           <Calendar size={14} className="text-slate-400" />
                           <input 
                             type="date" 
                             value={sub.examDate || ''}
                             onChange={(e) => {
                               setUserState(prev => ({
                                 ...prev,
                                 subjects: prev.subjects.map(s => s.id === sub.id ? { ...s, examDate: e.target.value } : s)
                               }));
                             }}
                             className="text-xs bg-slate-50 dark:bg-slate-900 border-0 rounded-lg p-1 px-2 focus:ring-1 focus:ring-emerald-500"
                           />
                           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('পরীক্ষার তারিখ', 'Exam Date')}</span>
                        </div>
                      </div>
                      <div className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-bold self-start">
                        {sub.chapters.filter(c => c.isCompleted).length} / {sub.chapters.length} {t('সম্পন্ন', 'DONE')}
                      </div>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     {sub.chapters.map(ch => (
                       <label key={ch.id} className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border-2 ${ch.isCompleted ? 'bg-emerald-50 border-emerald-100' : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 hover:border-slate-200'}`}>
                         <input 
                            type="checkbox" 
                            checked={ch.isCompleted} 
                            onChange={() => {
                              setUserState(prev => ({
                                ...prev,
                                subjects: prev.subjects.map(s => s.id === sub.id ? {
                                  ...s,
                                  chapters: s.chapters.map(c => c.id === ch.id ? { ...c, isCompleted: !c.isCompleted } : c)
                                } : s)
                              }));
                            }}
                            className="w-6 h-6 rounded-lg border-slate-200 text-emerald-500 focus:ring-emerald-500"
                          />
                         <div className="flex flex-col">
                           <span className={`font-bold text-sm ${ch.isCompleted ? 'text-emerald-700 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{ch.name}</span>
                           {ch.testScore !== undefined && <span className="text-[10px] text-emerald-500 font-bold">{t('স্কোর', 'Score')}: {ch.testScore}/30</span>}
                         </div>
                       </label>
                     ))}
                   </div>
                 </div>
               ))}
             </div>
          )}
      </div>
    </Layout>
  );
};

export default App;
