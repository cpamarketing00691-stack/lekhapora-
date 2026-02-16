import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { LekhaporaState, LekhaporaAction } from '../types';

const STORAGE_KEY = 'lekhapora_user_state_v1';

const initialState: LekhaporaState = {
  user: { id: '', profile: null },
  subjects: [],
  studyHistory: [],
  testHistory: [],
  tasks: [],
  cmsPosts: [],
  cmsPages: {},
  announcements: [],
  settings: {
    language: 'bn',
    focusGoalSeconds: 21600,
    notificationsEnabled: true,
    theme: 'light'
  },
  lastSynced: 0
};

function reducer(state: LekhaporaState, action: LekhaporaAction): LekhaporaState {
  let newState: LekhaporaState;

  switch (action.type) {
    case 'SET_INITIAL_STATE':
      return { ...initialState, ...action.payload };
    case 'UPDATE_PROFILE':
      newState = { ...state, user: { ...state.user, profile: action.payload } };
      break;
    case 'TOGGLE_CHAPTER':
      newState = {
        ...state,
        subjects: state.subjects.map(s => s.id === action.payload.subjectId ? {
          ...s,
          chapters: s.chapters.map(c => c.id === action.payload.chapterId ? {
            ...c,
            isCompleted: !c.isCompleted,
            status: !c.isCompleted ? 'completed' : 'not-started'
          } : c)
        } : s)
      };
      break;
    case 'ADD_STUDY_SESSION':
      newState = { ...state, studyHistory: [action.payload, ...state.studyHistory] };
      break;
    case 'SAVE_POST':
      const exists = state.cmsPosts.find(p => p.id === action.payload.id);
      newState = {
        ...state,
        cmsPosts: exists 
          ? state.cmsPosts.map(p => p.id === action.payload.id ? action.payload : p)
          : [...state.cmsPosts, action.payload]
      };
      break;
    case 'DELETE_POST':
      newState = { ...state, cmsPosts: state.cmsPosts.filter(p => p.id !== action.payload) };
      break;
    case 'UPDATE_PAGE':
      newState = { 
        ...state, 
        cmsPages: { ...state.cmsPages, [action.payload.slug]: action.payload } 
      };
      break;
    case 'SET_ANNOUNCEMENTS':
      newState = { ...state, announcements: action.payload };
      break;
    case 'SET_LANGUAGE':
      newState = { ...state, settings: { ...state.settings, language: action.payload } };
      break;
    case 'SYNC_COMPLETE':
      return { ...state, lastSynced: action.payload };
    default:
      return state;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  return newState;
}

const LekhaporaContext = createContext<{
  state: LekhaporaState;
  dispatch: React.Dispatch<LekhaporaAction>;
} | undefined>(undefined);

export const LekhaporaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        dispatch({ type: 'SET_INITIAL_STATE', payload: JSON.parse(cached) });
      } catch (e) {
        console.error("Failed to hydrate from storage", e);
      }
    }
  }, []);

  return (
    <div className={state.settings.theme}>
      <LekhaporaContext.Provider value={{ state, dispatch }}>
        {children}
      </LekhaporaContext.Provider>
    </div>
  );
};

export const useLekhapora = () => {
  const context = useContext(LekhaporaContext);
  if (!context) throw new Error('useLekhapora must be used within LekhaporaProvider');
  return context;
};