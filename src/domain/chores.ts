import type { RewardType, TaskCategory, TaskInstance, TaskTemplate } from './types';

export type NewChoreInput = {
  title: string;
  category: TaskCategory;
  rewardType: RewardType;
  rewardAmount: number;
  proofRequired: boolean;
  childIds: string[];
  recurrenceRule?: string;
};

const rewardLabels: Record<RewardType, string> = {
  screen_minutes: 'screen time',
  money: 'allowance',
  points: 'habit points',
  custom: 'custom perk',
};

/** Sensible default recurrence per category when the form doesn't override it. */
const categoryRecurrence: Record<TaskCategory, string> = {
  routine_chore: 'FREQ=DAILY',
  bonus_screen_time: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH',
  paid_chore: 'FREQ=WEEKLY',
  school_achievement: 'FREQ=ADHOC',
  custom_goal: 'FREQ=ADHOC',
};

/**
 * Pure transform from a parent's "new chore" form into a TaskTemplate plus one
 * TaskInstance per assigned child. `idSeed` keeps ids deterministic for tests;
 * the store passes a timestamp at runtime.
 */
export function buildChore(
  input: NewChoreInput,
  familyId: string,
  idSeed: string,
  nowIso: string,
): { template: TaskTemplate; tasks: TaskInstance[] } {
  const templateId = `template-${idSeed}`;
  const amount = Number.isFinite(input.rewardAmount) && input.rewardAmount > 0 ? input.rewardAmount : 0;

  const template: TaskTemplate = {
    id: templateId,
    familyId,
    title: input.title.trim(),
    category: input.category,
    recurrenceRule: input.recurrenceRule ?? categoryRecurrence[input.category],
    defaultProofRequired: input.proofRequired,
    approvalMode: 'parent_required',
    active: true,
    rewardRules: [
      {
        id: `reward-${templateId}`,
        rewardType: input.rewardType,
        amount,
        label: rewardLabels[input.rewardType],
      },
    ],
  };

  const tasks: TaskInstance[] = input.childIds.map((childId) => ({
    id: `task-${templateId}-${childId}`,
    templateId,
    childId,
    dueAt: nowIso,
    status: 'todo',
    proofAssets: [],
  }));

  return { template, tasks };
}
