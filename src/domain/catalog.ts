import type { TaskCategory } from './types';

export type ChoreCatalogItem = {
  id: string;
  title: string;
  category: Extract<TaskCategory, 'routine_chore' | 'paid_chore'>;
  group: string;
  suggestedPoints: number;
  suggestedDurationMinutes: number;
  defaultFrequency: string; // RRULE-style string
};

export type SchoolworkCatalogItem = {
  id: string;
  title: string;
  subject: string;
  suggestedPoints: number;
  suggestedDurationMinutes: number;
};

const DAILY = 'FREQ=DAILY';
const WEEKLY = 'FREQ=WEEKLY';
const SCHOOL_DAYS = 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR';

/** Comprehensive starter list of chores parents can assign to a kid. */
export const CHORE_CATALOG: ChoreCatalogItem[] = [
  // Kitchen
  { id: 'chore-dishes', title: 'Load / unload the dishwasher', category: 'routine_chore', group: 'Kitchen', suggestedPoints: 10, suggestedDurationMinutes: 10, defaultFrequency: DAILY },
  { id: 'chore-table', title: 'Set and clear the table', category: 'routine_chore', group: 'Kitchen', suggestedPoints: 5, suggestedDurationMinutes: 5, defaultFrequency: DAILY },
  { id: 'chore-counters', title: 'Wipe down counters', category: 'routine_chore', group: 'Kitchen', suggestedPoints: 5, suggestedDurationMinutes: 5, defaultFrequency: DAILY },
  { id: 'chore-pack-lunch', title: 'Pack lunch for school', category: 'routine_chore', group: 'Kitchen', suggestedPoints: 10, suggestedDurationMinutes: 10, defaultFrequency: SCHOOL_DAYS },
  // Bedroom
  { id: 'chore-bed', title: 'Make your bed', category: 'routine_chore', group: 'Bedroom', suggestedPoints: 5, suggestedDurationMinutes: 5, defaultFrequency: DAILY },
  { id: 'chore-tidy-room', title: 'Tidy your room', category: 'routine_chore', group: 'Bedroom', suggestedPoints: 10, suggestedDurationMinutes: 15, defaultFrequency: DAILY },
  { id: 'chore-laundry-away', title: 'Put away clean laundry', category: 'routine_chore', group: 'Bedroom', suggestedPoints: 10, suggestedDurationMinutes: 10, defaultFrequency: WEEKLY },
  // Cleaning
  { id: 'chore-vacuum', title: 'Vacuum a room', category: 'paid_chore', group: 'Cleaning', suggestedPoints: 15, suggestedDurationMinutes: 15, defaultFrequency: WEEKLY },
  { id: 'chore-bathroom', title: 'Clean the bathroom', category: 'paid_chore', group: 'Cleaning', suggestedPoints: 25, suggestedDurationMinutes: 25, defaultFrequency: WEEKLY },
  { id: 'chore-trash', title: 'Take out trash & recycling', category: 'routine_chore', group: 'Cleaning', suggestedPoints: 10, suggestedDurationMinutes: 5, defaultFrequency: WEEKLY },
  { id: 'chore-mop', title: 'Sweep / mop floors', category: 'paid_chore', group: 'Cleaning', suggestedPoints: 20, suggestedDurationMinutes: 20, defaultFrequency: WEEKLY },
  // Pets
  { id: 'chore-feed-pet', title: 'Feed the pet', category: 'routine_chore', group: 'Pets', suggestedPoints: 5, suggestedDurationMinutes: 5, defaultFrequency: DAILY },
  { id: 'chore-walk-dog', title: 'Walk the dog', category: 'routine_chore', group: 'Pets', suggestedPoints: 15, suggestedDurationMinutes: 20, defaultFrequency: DAILY },
  { id: 'chore-litter', title: 'Clean the litter box', category: 'paid_chore', group: 'Pets', suggestedPoints: 15, suggestedDurationMinutes: 10, defaultFrequency: WEEKLY },
  // Outdoor
  { id: 'chore-lawn', title: 'Mow the lawn', category: 'paid_chore', group: 'Outdoor', suggestedPoints: 40, suggestedDurationMinutes: 45, defaultFrequency: WEEKLY },
  { id: 'chore-leaves', title: 'Rake leaves', category: 'paid_chore', group: 'Outdoor', suggestedPoints: 25, suggestedDurationMinutes: 30, defaultFrequency: WEEKLY },
  { id: 'chore-water-plants', title: 'Water the plants', category: 'routine_chore', group: 'Outdoor', suggestedPoints: 5, suggestedDurationMinutes: 10, defaultFrequency: DAILY },
  // Self-care
  { id: 'chore-brush-teeth', title: 'Brush teeth morning & night', category: 'routine_chore', group: 'Self-care', suggestedPoints: 5, suggestedDurationMinutes: 5, defaultFrequency: DAILY },
  { id: 'chore-shower', title: 'Shower / bathe', category: 'routine_chore', group: 'Self-care', suggestedPoints: 5, suggestedDurationMinutes: 15, defaultFrequency: DAILY },
];

/** Comprehensive starter list of schoolwork tasks parents can schedule. */
export const SCHOOLWORK_CATALOG: SchoolworkCatalogItem[] = [
  { id: 'sw-math-homework', title: 'Math homework', subject: 'Math', suggestedPoints: 20, suggestedDurationMinutes: 30 },
  { id: 'sw-math-practice', title: 'Math fact practice', subject: 'Math', suggestedPoints: 10, suggestedDurationMinutes: 15 },
  { id: 'sw-reading', title: 'Independent reading', subject: 'Reading', suggestedPoints: 15, suggestedDurationMinutes: 20 },
  { id: 'sw-reading-log', title: 'Fill in reading log', subject: 'Reading', suggestedPoints: 5, suggestedDurationMinutes: 5 },
  { id: 'sw-writing', title: 'Writing / journal assignment', subject: 'Writing', suggestedPoints: 20, suggestedDurationMinutes: 30 },
  { id: 'sw-spelling', title: 'Spelling words practice', subject: 'Language Arts', suggestedPoints: 10, suggestedDurationMinutes: 15 },
  { id: 'sw-science', title: 'Science homework', subject: 'Science', suggestedPoints: 20, suggestedDurationMinutes: 30 },
  { id: 'sw-social-studies', title: 'Social studies homework', subject: 'Social Studies', suggestedPoints: 20, suggestedDurationMinutes: 30 },
  { id: 'sw-history-reading', title: 'History reading', subject: 'History', suggestedPoints: 15, suggestedDurationMinutes: 25 },
  { id: 'sw-foreign-language', title: 'Foreign language practice', subject: 'World Languages', suggestedPoints: 15, suggestedDurationMinutes: 20 },
  { id: 'sw-study-test', title: 'Study for a quiz or test', subject: 'Study', suggestedPoints: 25, suggestedDurationMinutes: 40 },
  { id: 'sw-project', title: 'Work on a class project', subject: 'Project', suggestedPoints: 30, suggestedDurationMinutes: 45 },
  { id: 'sw-instrument', title: 'Practice an instrument', subject: 'Music', suggestedPoints: 15, suggestedDurationMinutes: 30 },
  { id: 'sw-flashcards', title: 'Review flashcards', subject: 'Study', suggestedPoints: 10, suggestedDurationMinutes: 15 },
];

export const CHORE_GROUPS = [...new Set(CHORE_CATALOG.map((item) => item.group))];
