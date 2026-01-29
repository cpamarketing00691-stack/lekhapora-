
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
}

export interface Task {
  id: string;
  name: string;
  source: TaskSource;
  isCompleted: boolean;
  subjectId?: string; // Linked subject
  chapterId?: string; // Linked chapter ID (if matched in syllabus)
  customChapterName?: string; // Manual chapter name entered by user
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
  collegeExams?: CollegeExam[]; // Multiple college-specific exams
}

export interface Chapter {
  id: string;
  name: string;
  isCompleted: boolean;
  testScore?: number; // Highest 0-30 MCQ score
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
  examId?: string; 
  taskId?: string; // Link session to a specific focus task
  chapterId?: string; // Explicitly track which chapter was studied
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
  dailyTasks: Task[]; // Homework / Today's Focus tasks
  streaks: number;
  badges: string[];
  currentMood: Mood;
  language: Language;
  activeTimer: ActiveTimerState | null;
  reminders?: Reminder[];
  notificationsEnabled?: boolean;
}
