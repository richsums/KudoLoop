import type { KudoLoopStateSnapshot, TaskInstance } from './types';

export type Frequency = 'DAILY' | 'WEEKLY' | 'ADHOC';

export type ParsedRecurrence = {
  freq: Frequency;
  byDay?: string[]; // e.g. ['MO','TU','WE','TH','FR']
};

const WEEKDAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/** Parse the simple RRULE-style strings used in templates. */
export function parseRecurrence(rule: string): ParsedRecurrence {
  const parts = Object.fromEntries(
    rule
      .split(';')
      .map((token) => token.split('='))
      .filter((pair) => pair.length === 2)
      .map(([key, value]) => [key.trim().toUpperCase(), value.trim().toUpperCase()]),
  );

  const freqRaw = parts.FREQ;
  const freq: Frequency = freqRaw === 'DAILY' ? 'DAILY' : freqRaw === 'WEEKLY' ? 'WEEKLY' : 'ADHOC';
  const byDay = parts.BYDAY ? parts.BYDAY.split(',').map((day) => day.trim()) : undefined;

  return { freq, byDay };
}

function dateKey(nowIso: string): string {
  // 'YYYY-MM-DD' in UTC — deterministic and sortable.
  return nowIso.slice(0, 10);
}

/** ISO-8601 week key, e.g. '2026-W25'. */
export function isoWeekKey(nowIso: string): string {
  const date = new Date(nowIso);
  const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = tmp.getUTCDay() || 7; // Mon=1..Sun=7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day); // shift to Thursday of this week
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function weekdayCode(nowIso: string): string {
  return WEEKDAY_CODES[new Date(nowIso).getUTCDay()];
}

/**
 * The period key the current instance should carry, or null for ad-hoc
 * templates that never auto-generate.
 */
export function periodKeyFor(rule: string, nowIso: string): string | null {
  const { freq, byDay } = parseRecurrence(rule);
  if (freq === 'ADHOC') {
    return null;
  }
  if (freq === 'WEEKLY' && !byDay) {
    return isoWeekKey(nowIso);
  }
  // DAILY, or WEEKLY with specific weekdays → keyed by date.
  return dateKey(nowIso);
}

/** Whether a fresh instance should exist for "now" (respects BYDAY filters). */
export function isDueToday(rule: string, nowIso: string): boolean {
  const { freq, byDay } = parseRecurrence(rule);
  if (freq === 'ADHOC') {
    return false;
  }
  if (byDay && byDay.length > 0) {
    return byDay.includes(weekdayCode(nowIso));
  }
  return true;
}

/**
 * Roll recurring task instances forward to the current period:
 * - stamp legacy (period-less) todo instances with the current key so they
 *   aren't duplicated,
 * - expire stale todo instances from past periods,
 * - generate a fresh todo for the current period when one is due and missing.
 * Pure: returns a new tasks array. Ad-hoc templates and non-todo history are
 * left untouched.
 */
export function rollForward(
  snapshot: Pick<KudoLoopStateSnapshot, 'templates' | 'tasks'>,
  nowIso: string,
): TaskInstance[] {
  let tasks = [...snapshot.tasks];

  for (const template of snapshot.templates) {
    if (!template.active) {
      continue;
    }
    const currentKey = periodKeyFor(template.recurrenceRule, nowIso);
    if (currentKey === null) {
      continue; // ad-hoc — no recurrence
    }

    const assignedChildIds = [
      ...new Set(tasks.filter((task) => task.templateId === template.id).map((task) => task.childId)),
    ];

    for (const childId of assignedChildIds) {
      // Stamp period-less todos and expire past-period todos in one pass.
      tasks = tasks.map((task) => {
        if (task.templateId !== template.id || task.childId !== childId || task.status !== 'todo') {
          return task;
        }
        if (task.periodKey === undefined) {
          return { ...task, periodKey: currentKey };
        }
        if (task.periodKey < currentKey) {
          return { ...task, status: 'expired' as const };
        }
        return task;
      });

      const hasCurrent = tasks.some(
        (task) =>
          task.templateId === template.id &&
          task.childId === childId &&
          task.periodKey === currentKey,
      );

      if (isDueToday(template.recurrenceRule, nowIso) && !hasCurrent) {
        tasks = [
          {
            id: `task-${template.id}-${childId}-${currentKey}`,
            templateId: template.id,
            childId,
            dueAt: nowIso,
            status: 'todo',
            proofAssets: [],
            periodKey: currentKey,
          },
          ...tasks,
        ];
      }
    }
  }

  return tasks;
}
