
import { Group, Subject } from './types';

export const BOARDS = [
  'Dhaka', 'Rajshahi', 'Comilla', 'Jessore', 'Chittagong', 'Barisal', 'Sylhet', 'Dinajpur', 'Mymensingh', 'Madrasah', 'Technical'
];

export const YEARS = ['2025', '2026', '2027'];

export const COMPULSORY_SUBJECTS: Partial<Subject>[] = [
  { name: 'Bangla', paper: 1 },
  { name: 'Bangla', paper: 2 },
  { name: 'English', paper: 1 },
  { name: 'English', paper: 2 },
  { name: 'ICT', paper: 1 }
];

export const GROUP_SUBJECTS: Record<Group, Partial<Subject>[]> = {
  [Group.SCIENCE]: [
    { name: 'Physics', paper: 1 },
    { name: 'Physics', paper: 2 },
    { name: 'Chemistry', paper: 1 },
    { name: 'Chemistry', paper: 2 },
    { name: 'Biology', paper: 1 },
    { name: 'Biology', paper: 2 },
    { name: 'Higher Math', paper: 1 },
    { name: 'Higher Math', paper: 2 },
  ],
  [Group.COMMERCE]: [
    { name: 'Accounting', paper: 1 },
    { name: 'Accounting', paper: 2 },
    { name: 'Business Org & Mgmt', paper: 1 },
    { name: 'Business Org & Mgmt', paper: 2 },
    { name: 'Finance, Banking & Insurance', paper: 1 },
    { name: 'Finance, Banking & Insurance', paper: 2 },
    { name: 'Economics', paper: 1 },
    { name: 'Economics', paper: 2 },
  ],
  [Group.ARTS]: [
    { name: 'History', paper: 1 },
    { name: 'History', paper: 2 },
    { name: 'Civics & Good Governance', paper: 1 },
    { name: 'Civics & Good Governance', paper: 2 },
    { name: 'Logic', paper: 1 },
    { name: 'Logic', paper: 2 },
    { name: 'Sociology', paper: 1 },
    { name: 'Sociology', paper: 2 },
  ]
};

// Simplified Mock Syllabus Chapters for Demo
export const CHAPTER_LISTS: Record<string, string[]> = {
  'Physics': ['Physical World and Measurement', 'Vector', 'Dynamics', 'Newtonian Mechanics', 'Work, Energy and Power', 'Gravitation'],
  'Chemistry': ['Laboratory Safety', 'Qualitative Chemistry', 'Periodic Table', 'Chemical Change'],
  'Bangla': ['Old Poetry', 'Modern Prose', 'Drama', 'Novel'],
  'English': ['Grammar', 'Composition', 'Listening', 'Speaking'],
  'ICT': ['Information & Communication Technology', 'Communication Systems & Networking', 'Number Systems & Digital Device']
};
