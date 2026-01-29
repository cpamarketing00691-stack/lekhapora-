
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

export enum TaskSource {
  COLLEGE = 'College',
  COACHING = 'Coaching',
  BATCH = 'Batch',
  TUTOR = 'Home Tutor',
  PERSONAL = 'Personal'
}

export type Mood = 'Great' | 'Tired' | 'Stressed' | 'Focused' | 'Burnt Out';
export type Language = 'bn' | 'en';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface MCQ {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
}

export interface TestAttempt {
  id: string;
  subjectId: string;
  chapterId: string;
  score: number;
  total: number;
  timeTakenSeconds: number;
  date: number;
  questions: MCQ[];
  userAnswers: number[];
}

export interface CollegeExam {
  id: string;
  name: string;
  date: string; // ISO YYYY-MM-DD
}

export interface Reminder {
  id: string;
  title: string;
  time: number; // Timestamp
  isTriggered: boolean;
  isDone?: boolean;
  repeatType?: 'none' | 'daily' | 'weekly';
}

export interface Task {
  id: string;
  name: string;
  source: TaskSource;
  isCompleted: boolean;
  subjectId?: string;
  chapterId?: string;
  customChapterName?: string;
  createdAt: number;
}

export interface UserProfile {
  fullName: string;
  college: string;
  group: Group;
  board: string;
  medium: Medium;
  targetYear: string;
  religion: Religion;
  targetExamDate?: string; // Main HSC Start Date
  collegeExams?: CollegeExam[];
}

export interface Chapter {
  id: string;
  name: string;
  isCompleted: boolean;
  testScore?: number;
  difficulty?: Difficulty;
}

export interface Subject {
  id: string;
  name: string;
  paper: 1 | 2;
  chapters: Chapter[];
  examDate?: string;
}

export interface StudySession {
  id: string;
  subjectId: string;
  examId?: string; 
  taskId?: string;
  chapterId?: string;
  startTime: number;
  endTime?: number;
  durationSeconds: number;
  breakSeconds: number;
  numBreaks: number;
  focusLevel: number;
  mood: Mood;
  isRevision: boolean;
}

export interface ActiveTimerState {
  subjectId: string;
  examId?: string;
  taskId?: string;
  chapterId?: string;
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
  testHistory: TestAttempt[];
  subjects: Subject[];
  dailyTasks: Task[];
  streaks: number;
  badges: string[];
  currentMood: Mood;
  language: Language;
  activeTimer: ActiveTimerState | null;
  reminders?: Reminder[];
  notificationsEnabled?: boolean;
}
