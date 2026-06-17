import { describe, expect, it } from 'vitest';

import type { RewardLedgerEntry, UserProfile } from '../../domain/types';
import { generateWeeklyReport } from '../../domain/weeklyReport';

const users: UserProfile[] = [
  { id: 'parent-1', familyId: 'f1', role: 'parent', displayName: 'Pat', avatar: 'P', authUserId: 'a-p' },
  { id: 'kid-1', familyId: 'f1', role: 'child', displayName: 'Maya', avatar: 'M', authUserId: 'a-1' },
  { id: 'kid-2', familyId: 'f1', role: 'child', displayName: 'Eli', avatar: 'E', authUserId: 'a-2' },
];

const children = [
  { userId: 'kid-1', defaultDailyMinutes: 45, bedtimeWindow: '', schoolNightRules: '', allowanceCurrency: 'USD', streakDays: 4, balances: { screen_minutes: 0, money: 0, points: 0, custom: 0 } },
  { userId: 'kid-2', defaultDailyMinutes: 60, bedtimeWindow: '', schoolNightRules: '', allowanceCurrency: 'USD', streakDays: 1, balances: { screen_minutes: 0, money: 0, points: 0, custom: 0 } },
];

function entry(partial: Partial<RewardLedgerEntry> & Pick<RewardLedgerEntry, 'childId' | 'rewardType' | 'delta' | 'createdAt'>): RewardLedgerEntry {
  return {
    id: `e-${Math.round(partial.delta)}-${partial.createdAt}`,
    sourceType: 'task_approval',
    sourceId: 'task-x',
    balanceAfter: 0,
    createdBy: 'parent-1',
    reason: 'test',
    requestId: `r-${partial.createdAt}-${partial.rewardType}`,
    ...partial,
  };
}

const SINCE = '2026-06-10T00:00:00.000Z';

describe('generateWeeklyReport', () => {
  it('sums positive deltas by reward type within the window', () => {
    const ledger: RewardLedgerEntry[] = [
      entry({ childId: 'kid-1', rewardType: 'screen_minutes', delta: 20, createdAt: '2026-06-12T10:00:00.000Z', sourceId: 'task-a' }),
      entry({ childId: 'kid-1', rewardType: 'points', delta: 10, createdAt: '2026-06-12T10:00:00.000Z', sourceId: 'task-a' }),
      entry({ childId: 'kid-1', rewardType: 'money', delta: 2, createdAt: '2026-06-13T10:00:00.000Z', sourceId: 'task-b' }),
    ];

    const report = generateWeeklyReport({ users, children, ledger }, SINCE);
    const maya = report.children.find((c) => c.childId === 'kid-1');

    expect(maya?.earned).toEqual({ screen_minutes: 20, money: 2, points: 10, custom: 0 });
    expect(maya?.streakDays).toBe(4);
  });

  it('counts approvals by distinct task source id, ignoring redemptions and deductions', () => {
    const ledger: RewardLedgerEntry[] = [
      entry({ childId: 'kid-1', rewardType: 'screen_minutes', delta: 20, createdAt: '2026-06-12T10:00:00.000Z', sourceId: 'task-a' }),
      entry({ childId: 'kid-1', rewardType: 'points', delta: 10, createdAt: '2026-06-12T10:00:00.000Z', sourceId: 'task-a' }),
      entry({ childId: 'kid-1', rewardType: 'money', delta: 2, createdAt: '2026-06-13T10:00:00.000Z', sourceId: 'task-b' }),
      entry({ childId: 'kid-1', rewardType: 'screen_minutes', delta: -15, createdAt: '2026-06-13T11:00:00.000Z', sourceType: 'redemption', sourceId: 'redeem-1' }),
    ];

    const report = generateWeeklyReport({ users, children, ledger }, SINCE);
    expect(report.children.find((c) => c.childId === 'kid-1')?.approvals).toBe(2);
  });

  it('excludes entries before the window and reports the top earner', () => {
    const ledger: RewardLedgerEntry[] = [
      entry({ childId: 'kid-1', rewardType: 'points', delta: 10, createdAt: '2026-06-12T10:00:00.000Z', sourceId: 'task-a' }),
      entry({ childId: 'kid-2', rewardType: 'points', delta: 10, createdAt: '2026-06-12T10:00:00.000Z', sourceId: 'task-b' }),
      entry({ childId: 'kid-2', rewardType: 'points', delta: 10, createdAt: '2026-06-13T10:00:00.000Z', sourceId: 'task-c' }),
      // before the window — ignored
      entry({ childId: 'kid-1', rewardType: 'points', delta: 99, createdAt: '2026-06-01T10:00:00.000Z', sourceId: 'task-old' }),
    ];

    const report = generateWeeklyReport({ users, children, ledger }, SINCE);
    expect(report.totalApprovals).toBe(3);
    expect(report.topEarnerName).toBe('Eli');
    expect(report.children.find((c) => c.childId === 'kid-1')?.earned.points).toBe(10);
  });

  it('returns no top earner when there is no activity', () => {
    const report = generateWeeklyReport({ users, children, ledger: [] }, SINCE);
    expect(report.totalApprovals).toBe(0);
    expect(report.topEarnerName).toBeNull();
  });
});
