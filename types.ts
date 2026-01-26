
export enum Group {
  SCIENCE = 'Science',
  COMMERCE = 'Commerce',
  ARTS = 'Arts'
}

export enum Medium {
  BANGLA = 'Bangla',
  ENGLISH = 'English'
}

export enum Religion {
  ISLAM = 'Islam',
  HINDUISM = 'Hinduism',
  BUDDHISM = 'Buddhism',
  CHRISTIANITY = 'Christianity',
  OTHER = 'Other'
}

export type Mood = 'Great' | 'Tired' | 'Stressed' | 'Focused' | 'Burnt Out';
export type Language = 'bn' | 'en';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface UserProfile {
  fullName: string;
  college: string; // Added college info
  group: Group;
  board: string;
  medium: Medium;
  targetYear: string;
  religion: Religion;
  aiName: string;
  targetExamDate?: string; // Main HSC Start Date
}

export interface Chapter {
  id: string;
  name: string;
  isCompleted: boolean;
  testScore?: number; // 0-30 MCQ score
  difficulty?: Difficulty;
}

export interface Subject {
  id: string;
  name: string;
  paper: 1 | 2;
  chapters: Chapter[];
  examDate?: string; // ISO string
}

export interface StudySession {
  id: string;
  subjectId: string;
  startTime: number;
  endTime?: number;
  durationSeconds: number;
  breakSeconds: number;
  numBreaks: number;
  focusLevel: number; // 1-10
  mood: Mood;
  isRevision: boolean;
}

export interface ActiveTimerState {
  subjectId: string;
  isFocusActive: boolean;
  isRevision: boolean;
  accumulatedFocusSeconds: number;
  accumulatedBreakSeconds: number;
  numBreaks: number;
  lastTimestamp: number;
  sessionStartTime: number;
}

export interface UserState {
  isAuthenticated: boolean;
  profile: UserProfile | null;
  studyHistory: StudySession[];
  subjects: Subject[];
  streaks: number;
  badges: string[];
  currentMood: Mood;
  language: Language;
  activeTimer: ActiveTimerState | null;
}
