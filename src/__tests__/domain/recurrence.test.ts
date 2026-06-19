import { describe, expect, it } from 'vitest';

import {
  isDueToday,
  isoWeekKey,
  parseRecurrence,
  periodKeyFor,
  rollForward,
} from '../../domain/recurrence';
import type { TaskInstance, TaskTemplate } from '../../domain/types';

const FRIDAY = '2026-06-18T12:00:00.000Z';
const SUNDAY = '2026-06-20T12:00:00.000Z';

function tmpl(id: string, rule: string, active = true): TaskTemplate {
  return {
    id,
    familyId: 'f1',
    title: id,
    category: 'routine_chore',
    recurrenceRule: rule,
    defaultProofRequired: false,
    approvalMode: 'parent_required',
    active,
    rewardRules: [],
  };
}

function todo(templateId: string, childId: string, periodKey?: string): TaskInstance {
  return {
    id: `${templateId}-${childId}-${periodKey ?? 'init'}`,
    templateId,
    childId,
    dueAt: FRIDAY,
    status: 'todo',
    proofAssets: [],
    periodKey,
  };
}

describe('parseRecurrence / periodKeyFor / isDueToday', () => {
  it('parses freq and byday', () => {
    expect(parseRecurrence('FREQ=DAILY')).toEqual({ freq: 'DAILY', byDay: undefined });
    expect(parseRecurrence('FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR')).toEqual({
      freq: 'WEEKLY',
      byDay: ['MO', 'TU', 'WE', 'TH', 'FR'],
    });
    expect(parseRecurrence('FREQ=ADHOC').freq).toBe('ADHOC');
  });

  it('keys daily/by-day by date and plain weekly by ISO week', () => {
    expect(periodKeyFor('FREQ=DAILY', FRIDAY)).toBe('2026-06-18');
    expect(periodKeyFor('FREQ=WEEKLY;BYDAY=MO,FR', FRIDAY)).toBe('2026-06-18');
    expect(periodKeyFor('FREQ=WEEKLY', FRIDAY)).toBe(isoWeekKey(FRIDAY));
    expect(periodKeyFor('FREQ=ADHOC', FRIDAY)).toBeNull();
  });

  it('respects BYDAY when deciding if due', () => {
    expect(isDueToday('FREQ=DAILY', FRIDAY)).toBe(true);
    expect(isDueToday('FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', FRIDAY)).toBe(true); // Friday
    expect(isDueToday('FREQ=WEEKLY;BYDAY=SA,SU', FRIDAY)).toBe(false);
    expect(isDueToday('FREQ=ADHOC', FRIDAY)).toBe(false);
  });

  it('groups Mon–Fri of the same week under one key, next week differs', () => {
    expect(isoWeekKey('2026-06-15')).toBe(isoWeekKey('2026-06-18')); // Mon == Fri
    expect(isoWeekKey('2026-06-15')).not.toBe(isoWeekKey('2026-06-22')); // next Monday
  });
});

describe('rollForward', () => {
  it('stamps a legacy period-less todo with the current key without duplicating', () => {
    const tasks = rollForward({ templates: [tmpl('t1', 'FREQ=DAILY')], tasks: [todo('t1', 'k1')] }, FRIDAY);
    const t1 = tasks.filter((task) => task.templateId === 't1' && task.childId === 'k1');
    expect(t1).toHaveLength(1);
    expect(t1[0]).toMatchObject({ status: 'todo', periodKey: '2026-06-18' });
  });

  it('expires a past-period todo and generates a fresh one', () => {
    const tasks = rollForward(
      { templates: [tmpl('t1', 'FREQ=DAILY')], tasks: [todo('t1', 'k1', '2026-06-17')] },
      FRIDAY,
    );
    const t1 = tasks.filter((task) => task.templateId === 't1' && task.childId === 'k1');
    expect(t1).toHaveLength(2);
    expect(t1.find((t) => t.periodKey === '2026-06-17')?.status).toBe('expired');
    expect(t1.find((t) => t.periodKey === '2026-06-18')?.status).toBe('todo');
  });

  it('does not duplicate when the current period already has a todo', () => {
    const tasks = rollForward(
      { templates: [tmpl('t1', 'FREQ=DAILY')], tasks: [todo('t1', 'k1', '2026-06-18')] },
      FRIDAY,
    );
    expect(tasks.filter((task) => task.templateId === 't1')).toHaveLength(1);
  });

  it('leaves ad-hoc templates and inactive templates untouched', () => {
    const adhoc = rollForward({ templates: [tmpl('t1', 'FREQ=ADHOC')], tasks: [todo('t1', 'k1')] }, FRIDAY);
    expect(adhoc[0].periodKey).toBeUndefined();

    const inactive = rollForward({ templates: [tmpl('t1', 'FREQ=DAILY', false)], tasks: [todo('t1', 'k1')] }, FRIDAY);
    expect(inactive.filter((t) => t.templateId === 't1')).toHaveLength(1);
    expect(inactive[0].periodKey).toBeUndefined();
  });

  it('does not generate on a non-matching BYDAY weekday', () => {
    // Sunday with a Mon–Fri template: stamp the legacy todo but create nothing new.
    const tasks = rollForward(
      { templates: [tmpl('t1', 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR')], tasks: [todo('t1', 'k1', '2026-06-19')] },
      SUNDAY,
    );
    const todos = tasks.filter((task) => task.templateId === 't1' && task.status === 'todo');
    expect(todos).toHaveLength(0); // 06-19 (Fri) expired, none generated Sunday
    expect(tasks.find((t) => t.periodKey === '2026-06-19')?.status).toBe('expired');
  });
});
