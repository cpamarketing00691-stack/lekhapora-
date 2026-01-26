
import { Group, Subject } from './types';

export const BOARDS = [
  'Dhaka', 'Rajshahi', 'Comilla', 'Jessore', 'Chittagong', 'Barisal', 'Sylhet', 'Dinajpur', 'Mymensingh', 'Madrasah', 'Technical'
];

export const YEARS = ['2025', '2026', '2027'];

export const COMPULSORY_SUBJECTS_LIST: string[] = ['Bangla', 'English', 'ICT'];

// Expanded lists to allow full flexibility for any college curriculum under NCTB
export const SUBJECT_OPTIONS: Record<Group, string[]> = {
  [Group.SCIENCE]: [
    'Physics', 'Chemistry', 'Biology', 'Higher Math', 'Statistics', 
    'Geography', 'Psychology', 'Agriculture Studies', 'Sports', 'Home Science'
  ],
  [Group.COMMERCE]: [
    'Accounting', 'Business Organization & Management', 'Finance, Banking & Insurance', 
    'Production Management & Marketing', 'Economics', 'Statistics', 
    'Geography', 'Secretarial Science & Office Management', 'Agriculture Studies', 'Computer Studies'
  ],
  [Group.ARTS]: [
    'History', 'Islamic History & Culture', 'Civics & Good Governance', 
    'Sociology', 'Social Work', 'Logic', 'Economics', 'Islamic Studies', 
    'Geography', 'Psychology', 'Statistics', 'Home Science', 'Agriculture Studies', 'Music', 'Arts & Crafts'
  ]
};

// Full Chapter Lists for NCTB Subjects
export const CHAPTER_LISTS: Record<string, string[]> = {
  'Physics': ['Physical World and Measurement', 'Vector', 'Dynamics', 'Newtonian Mechanics', 'Work, Energy and Power', 'Gravitation', 'Structural Properties of Matter', 'Periodic Motion', 'Waves', 'Ideal Gas and Kinetic Theory of Gases'],
  'Chemistry': ['Laboratory Safety', 'Qualitative Chemistry', 'Periodic Table', 'Chemical Change', 'Working Chemistry', 'Environmental Chemistry', 'Organic Chemistry', 'Quantitative Chemistry', 'Electrochemistry'],
  'Biology': ['Cell and its Structure', 'Cell Division', 'Microbiology', 'Pteridophyta and Gymnosperm', 'Morphology and Taxonomy of Angiosperms', 'Tissue and Tissue System', 'Plant Physiology', 'Plant Reproduction', 'Animal Diversity and Classification', 'Animal Physiology', 'Genetics and Evolution'],
  'Higher Math': ['Matrix and Determinants', 'Vector', 'Straight Lines', 'Circle', 'Trigonometric Ratios', 'Functions and Graphs', 'Differentiation', 'Integration', 'Real Numbers and Inequalities', 'Complex Numbers', 'Polynomials'],
  'Accounting': ['Introduction to Accounting', 'Books of Accounts', 'Bank Reconciliation Statement', 'Work Sheet', 'Accounting for Receivables', 'Accounting for Fixed Assets', 'Financial Statements'],
  'Business Organization & Management': ['Basic Concepts of Business', 'Ownership Structures', 'Business Environment', 'Legal Aspects', 'Planning', 'Organizing', 'Directing', 'Controlling'],
  'Finance, Banking & Insurance': ['Introduction to Finance', 'Time Value of Money', 'Risk and Return', 'Capital Budgeting', 'Bank Structure', 'Commercial Banking', 'Principles of Insurance', 'Life Insurance'],
  'Production Management & Marketing': ['Production', 'Production Planning', 'Quality Control', 'Marketing Introduction', 'Marketing Mix', 'Product Policy', 'Pricing'],
  'Economics': ['Basic Economic Problems', 'Utility, Demand, Supply', 'Production and Cost', 'Market Structure', 'National Income', 'Money and Banking', 'Public Finance', 'International Trade'],
  'Bangla': ['গল্প ও প্রবন্ধ (Prose)', 'কবিতা (Poetry)', 'নাটক: সিরাজউদ্দৌলা', 'উপন্যাস: লালসালু', 'ব্যাকরণ (Grammar)', 'নির্মান (Composition)'],
  'English': ['Reading Skills', 'Writing Skills', 'Grammar and Usage', 'Vocabulary', 'Literature (Selected Poems & Stories)'],
  'ICT': ['Information & Communication Technology', 'Communication Systems & Networking', 'Number Systems & Digital Device', 'Web Design and HTML', 'Programming Language (C)', 'Database Management System'],
  'Logic': ['Nature of Logic', 'Terms and Propositions', 'Rules of Definition', 'Classification', 'Induction and Deduction'],
  'Sociology': ['Definition and Nature of Sociology', 'Sociology in Bangladesh', 'Social Institutions', 'Social Stratification', 'Social Change'],
  'Civics & Good Governance': ['Concept of Civics', 'Good Governance', 'Values, Law, Liberty and Equality', 'Rights and Duties', 'Political Parties', 'Constitution of Bangladesh'],
  'History': ['Arrival of Europeans in India', 'British Rule in India', 'Pakistan Period (1947-1971)', 'Language Movement', 'Liberation War of Bangladesh'],
  'Islamic History & Culture': ['Pre-Islamic Arabia', 'The Prophet (SM)', 'Khilafat-e-Rasheda', 'Umayyads', 'Abbasids', 'Muslim Rule in India'],
  'Islamic Studies': ['Quran and Hadith', 'Ibadat', 'Social Life in Islam', 'Economic System of Islam', 'Human Rights in Islam'],
  'Geography': ['Physical Geography', 'Atmosphere', 'Hydrosphere', 'Human Geography', 'Map Reading', 'Resources of Bangladesh'],
  'Psychology': ['Introduction to Psychology', 'Biological Basis of Behavior', 'Sensation and Perception', 'Learning and Memory', 'Emotion and Motivation'],
  'Statistics': ['Data Collection', 'Measures of Central Tendency', 'Measures of Dispersion', 'Probability', 'Correlation and Regression'],
  'Home Science': ['Home Management', 'Resource Management', 'Food and Nutrition', 'Child Development', 'Clothing and Textiles'],
  'Agriculture Studies': ['Agricultural Technology', 'Crop Production', 'Livestock and Poultry', 'Fisheries', 'Agricultural Economics']
};
