import type { OnboardingDraft } from '../store/useOnboardingStore';
import {
  DEFAULT_REWARD_CONFIG,
  type ChildProfile,
  type KudoLoopStateSnapshot,
  type TaskInstance,
  type TaskTemplate,
  type UserProfile,
} from './types';

export const PARENT_ID = 'parent-1';
export const FAMILY_ID = 'family-1';

const DEFAULT_TIMEZONE = 'America/Los_Angeles';

/** Starter task templates seeded into every new family. */
function starterTemplates(familyId: string): TaskTemplate[] {
  return [
    {
      id: 'template-bed',
      familyId,
      title: 'Make your bed',
      category: 'routine_chore',
      recurrenceRule: 'FREQ=DAILY',
      defaultProofRequired: false,
      approvalMode: 'parent_required',
      active: true,
      rewardRules: [{ id: 'reward-bed-points', rewardType: 'points', amount: 10, label: 'habit points' }],
    },
    {
      id: 'template-homework',
      familyId,
      title: 'Homework finished and checked',
      category: 'bonus_screen_time',
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH',
      defaultProofRequired: true,
      approvalMode: 'parent_required',
      active: true,
      rewardRules: [{ id: 'reward-homework-time', rewardType: 'screen_minutes', amount: 20, label: 'screen time' }],
    },
    {
      id: 'template-trash',
      familyId,
      title: 'Take out trash and recycling',
      category: 'paid_chore',
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=FR',
      defaultProofRequired: true,
      approvalMode: 'parent_required',
      active: true,
      rewardRules: [{ id: 'reward-trash-money', rewardType: 'money', amount: 2, label: 'allowance' }],
    },
  ];
}

function avatarFor(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

/**
 * Pure transform from the onboarding draft to a full KudoLoop snapshot used to
 * hydrate the domain store. Children start with zero balances and a couple of
 * starter quests so the dashboards are immediately meaningful.
 */
export function buildFamilyFromOnboarding(
  draft: OnboardingDraft,
  options: { nowIso?: string; timezone?: string } = {},
): KudoLoopStateSnapshot {
  const nowIso = options.nowIso ?? new Date().toISOString();
  const timezone = options.timezone ?? DEFAULT_TIMEZONE;

  const parent: UserProfile = {
    id: PARENT_ID,
    familyId: FAMILY_ID,
    role: 'parent',
    displayName: draft.parentName.trim() || 'Parent',
    avatar: avatarFor(draft.parentName),
    authUserId: `auth-${PARENT_ID}`,
  };

  const childUsers: UserProfile[] = draft.kids.map((kid) => ({
    id: kid.id,
    familyId: FAMILY_ID,
    role: 'child',
    displayName: kid.name,
    avatar: avatarFor(kid.name),
    authUserId: `auth-${kid.id}`,
  }));

  const children: ChildProfile[] = draft.kids.map((kid) => ({
    userId: kid.id,
    defaultDailyMinutes: kid.dailyMinutes,
    bedtimeWindow: '8:30 PM - 7:00 AM',
    schoolNightRules: 'Homework and chores before screens.',
    allowanceCurrency: 'USD',
    streakDays: 0,
    balances: {
      screen_minutes: 0,
      money: 0,
      points: 0,
      custom: 0,
    },
  }));

  const templates = starterTemplates(FAMILY_ID);
  const seededTemplateIds = ['template-bed', 'template-homework'];

  const tasks: TaskInstance[] = draft.kids.flatMap((kid) =>
    seededTemplateIds.map((templateId) => ({
      id: `task-${templateId}-${kid.id}`,
      templateId,
      childId: kid.id,
      dueAt: nowIso,
      status: 'todo' as const,
      proofAssets: [],
    })),
  );

  return {
    family: {
      id: FAMILY_ID,
      name: draft.familyName.trim() || 'My Family',
      timezone,
      subscriptionTier: 'free',
      createdByParentId: PARENT_ID,
    },
    users: [parent, ...childUsers],
    children,
    templates,
    tasks,
    ledger: [],
    redemptions: [],
    incentives: [],
    wishlist: [],
    notifications: [],
    rewardConfig: DEFAULT_REWARD_CONFIG,
  };
}
