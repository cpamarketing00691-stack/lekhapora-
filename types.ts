export enum Group { SCIENCE = 'Science', COMMERCE = 'Commerce', ARTS = 'Arts' }
export enum Medium { BANGLA = 'Bangla', ENGLISH = 'English' }
export enum Religion { ISLAM = 'Islam', HINDUISM = 'Hinduism', BUDDHISM = 'Buddhism', CHRISTIANITY = 'Christianity', OTHER = 'Other' }
export enum TaskSource { COLLEGE = 'College', COACHING = 'Coaching', BATCH = 'Batch', TUTOR = 'Home Tutor', PERSONAL = 'Personal' }

export type Mood = 'Great' | 'Tired' | 'Stressed' | 'Focused' | 'Burnt Out';
export type Language = 'bn' | 'en';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type UserRole = 'student' | 'admin' | 'super_admin' | 'editor';

export interface AdminPermissions {
  can_publish: boolean;
  can_delete: boolean;
  can_manage_admins: boolean;
}

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  role: UserRole;
  permissions: AdminPermissions;
}

export interface PostBlock {
  id: string;
  type: 'heading' | 'paragraph' | 'image' | 'mcq' | 'divider';
  content: any;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  category: string;
  blocks: PostBlock[];
  isPublished: boolean;
  authorId: string;
  createdAt: number;
  updatedAt: number;
}

/* 
 * Core Application Interfaces 
 */

export interface CollegeExam {
  id: string;
  name: string;
  date: string;
}

export interface UserProfile {
  fullName: string;
  college: string;
  group: Group;
  board: string;
  medium: Medium;
  targetYear: string;
  religion: Religion;
  collegeExams: CollegeExam[];
  targetExamDate?: string;
  role?: UserRole;
}

export interface Chapter {
  id: string;
  name: string;
  isCompleted: boolean;
  studyTimeSeconds?: number;
  testScore?: number;
  status?: 'not-started' | 'completed';
}

export interface Subject {
  id: string;
  name: string;
  paper: 1 | 2;
  chapters: Chapter[];
}

export interface Task {
  id: string;
  name: string;
  source: TaskSource;
  isCompleted: boolean;
  subjectId?: string;
  chapterId?: string;
  createdAt: number;
}

export interface Reminder {
  id: string;
  title: string;
  time: number;
  isTriggered: boolean;
  isDone: boolean;
  repeatType: 'none' | 'daily' | 'weekly';
}

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

export interface ActiveTimer {
  subjectId: string;
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

export interface StudySession {
  id: string;
  subjectId: string;
  taskId?: string;
  chapterId?: string;
  startTime: number;
  endTime?: number;
  durationSeconds: number;
  breakSeconds?: number;
  numBreaks?: number;
  mood: Mood;
  isRevision: boolean;
}

export interface UserState {
  isAuthenticated: boolean;
  profile: UserProfile | null;
  studyHistory: StudySession[];
  testHistory: TestAttempt[];
  subjects: Subject[];
  dailyTasks: Task[];
  streaks: number;
  badges: any[];
  currentMood: Mood;
  language: Language;
  activeTimer: ActiveTimer | null;
  reminders: Reminder[];
  notificationsEnabled: boolean;
}

export interface LekhaporaState {
  user: { id: string; profile: UserProfile | null };
  subjects: Subject[];
  studyHistory: StudySession[];
  testHistory: TestAttempt[];
  tasks: Task[];
  cmsPosts: Post[];
  settings: {
    language: Language;
    focusGoalSeconds: number;
    notificationsEnabled: boolean;
    theme: 'light' | 'dark';
  };
  lastSynced: number;
}

export type LekhaporaAction = 
  | { type: 'SET_INITIAL_STATE'; payload: LekhaporaState }
  | { type: 'UPDATE_PROFILE'; payload: UserProfile }
  | { type: 'TOGGLE_CHAPTER'; payload: { subjectId: string; chapterId: string } }
  | { type: 'ADD_STUDY_SESSION'; payload: StudySession }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'SYNC_COMPLETE'; payload: number }
  | { type: 'SAVE_POST'; payload: Post }
  | { type: 'DELETE_POST'; payload: string };