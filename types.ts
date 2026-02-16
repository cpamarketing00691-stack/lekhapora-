
export enum Group { SCIENCE = 'Science', COMMERCE = 'Commerce', ARTS = 'Arts' }
export enum Medium { BANGLA = 'Bangla', ENGLISH = 'English' }
export enum Religion { ISLAM = 'Islam', HINDUISM = 'Hinduism', BUDDHISM = 'Buddhism', CHRISTIANITY = 'Christianity', OTHER = 'Other' }
export enum TaskSource { COLLEGE = 'College', COACHING = 'Coaching', BATCH = 'Batch', TUTOR = 'Home Tutor', PERSONAL = 'Personal' }

export type Mood = 'Great' | 'Tired' | 'Stressed' | 'Focused' | 'Burnt Out';
export type Language = 'bn' | 'en';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type UserRole = 'student' | 'admin' | 'super_admin' | 'editor';

// Added missing Chapter interface
export interface Chapter {
  id: string;
  name: string;
  isCompleted: boolean;
  status?: 'completed' | 'in-progress' | 'not-started';
  studyTimeSeconds?: number;
}

// Added missing CollegeExam interface
export interface CollegeExam {
  id: string;
  name: string;
  date: string;
}

// Added missing StudySession interface
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

// Added missing Reminder interface
export interface Reminder {
  id: string;
  title: string;
  time: number;
  isTriggered: boolean;
  isDone: boolean;
  repeatType: 'none' | 'daily' | 'weekly';
}

// Added missing MCQ interface
export interface MCQ {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
}

// Added missing ActiveTimer interface
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

export interface CMSPage {
  slug: string;
  content: {
    hero_title: string;
    hero_subtitle: string;
    sections: any[];
  };
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  created_at: number;
}

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

// Added missing UserState interface for legacy bridge support
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
  cmsPages: Record<string, CMSPage>;
  announcements: Announcement[];
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
  | { type: 'DELETE_POST'; payload: string }
  | { type: 'UPDATE_PAGE'; payload: CMSPage }
  | { type: 'SET_ANNOUNCEMENTS'; payload: Announcement[] };
