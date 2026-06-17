import { describe, expect, it } from 'vitest';

import { buildChore, type NewChoreInput } from '../../domain/chores';

const baseInput: NewChoreInput = {
  title: '  Walk the dog  ',
  category: 'paid_chore',
  rewardType: 'money',
  rewardAmount: 3,
  proofRequired: true,
  childIds: ['kid-1', 'kid-2'],
};

describe('buildChore', () => {
  it('creates a template with a trimmed title and a single reward rule', () => {
    const { template } = buildChore(baseInput, 'family-1', 'seed', '2026-06-16T12:00:00.000Z');

    expect(template.id).toBe('template-seed');
    expect(template.familyId).toBe('family-1');
    expect(template.title).toBe('Walk the dog');
    expect(template.category).toBe('paid_chore');
    expect(template.defaultProofRequired).toBe(true);
    expect(template.approvalMode).toBe('parent_required');
    expect(template.rewardRules).toEqual([
      { id: 'reward-template-seed', rewardType: 'money', amount: 3, label: 'allowance' },
    ]);
  });

  it('creates one todo task per assigned child', () => {
    const { tasks } = buildChore(baseInput, 'family-1', 'seed', '2026-06-16T12:00:00.000Z');

    expect(tasks).toHaveLength(2);
    expect(tasks.map((task) => task.childId)).toEqual(['kid-1', 'kid-2']);
    expect(tasks.every((task) => task.status === 'todo')).toBe(true);
    expect(tasks[0].id).toBe('task-template-seed-kid-1');
    expect(tasks[0].dueAt).toBe('2026-06-16T12:00:00.000Z');
  });

  it('applies a default recurrence per category and guards non-positive amounts', () => {
    const { template } = buildChore(
      { ...baseInput, category: 'bonus_screen_time', rewardAmount: -5 },
      'family-1',
      'seed',
      '2026-06-16T12:00:00.000Z',
    );

    expect(template.recurrenceRule).toBe('FREQ=WEEKLY;BYDAY=MO,TU,WE,TH');
    expect(template.rewardRules[0].amount).toBe(0);
  });

  it('honors an explicit recurrence override', () => {
    const { template } = buildChore(
      { ...baseInput, recurrenceRule: 'FREQ=MONTHLY' },
      'family-1',
      'seed',
      '2026-06-16T12:00:00.000Z',
    );

    expect(template.recurrenceRule).toBe('FREQ=MONTHLY');
  });
});
