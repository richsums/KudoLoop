import { describe, expect, it } from 'vitest';

import { badgeStatuses, computeStreak, lifetimePoints, totalApprovals } from '../../domain/streaks';
import type { RewardLedgerEntry } from '../../domain/types';

function approval(childId: string, sourceId: string, createdAt: string, delta = 10): RewardLedgerEntry {
  return {
    id: `l-${sourceId}-${createdAt}`,
    childId,
    sourceType: 'task_approval',
    sourceId,
    rewardType: 'points',
    delta,
    balanceAfter: delta,
    createdBy: 'p1',
    createdAt,
    reason: 'Approved',
    requestId: `r-${sourceId}-${createdAt}`,
  };
}

const NOW = '2026-06-19T12:00:00.000Z'; // Friday

describe('computeStreak', () => {
  it('counts consecutive days ending today', () => {
    const ledger = [
      approval('k1', 'a', '2026-06-17T09:00:00.000Z'),
      approval('k1', 'b', '2026-06-18T09:00:00.000Z'),
      approval('k1', 'c', '2026-06-19T09:00:00.000Z'),
    ];
    expect(computeStreak(ledger, 'k1', NOW)).toBe(3);
  });

  it('anchors on yesterday when nothing approved today yet', () => {
    const ledger = [
      approval('k1', 'a', '2026-06-17T09:00:00.000Z'),
      approval('k1', 'b', '2026-06-18T09:00:00.000Z'),
    ];
    expect(computeStreak(ledger, 'k1', NOW)).toBe(2);
  });

  it('returns 0 when the most recent approval is older than yesterday', () => {
    const ledger = [approval('k1', 'a', '2026-06-15T09:00:00.000Z')];
    expect(computeStreak(ledger, 'k1', NOW)).toBe(0);
  });

  it('stops at a gap', () => {
    const ledger = [
      approval('k1', 'a', '2026-06-16T09:00:00.000Z'),
      // gap on the 17th
      approval('k1', 'b', '2026-06-18T09:00:00.000Z'),
      approval('k1', 'c', '2026-06-19T09:00:00.000Z'),
    ];
    expect(computeStreak(ledger, 'k1', NOW)).toBe(2);
  });
});

describe('totals and badges', () => {
  const ledger = [
    approval('k1', 'task-a', '2026-06-19T09:00:00.000Z', 60),
    approval('k1', 'task-a', '2026-06-19T09:00:00.000Z', 5), // same task, 2nd reward rule
    approval('k1', 'task-b', '2026-06-19T10:00:00.000Z', 40),
  ];

  it('counts distinct approvals and sums positive points', () => {
    expect(totalApprovals(ledger, 'k1')).toBe(2);
    expect(lifetimePoints(ledger, 'k1')).toBe(105);
  });

  it('marks badges earned and reports progress to the next', () => {
    const statuses = badgeStatuses({ streak: 3, approvals: 2, points: 105 });
    const streak3 = statuses.find((s) => s.badge.id === 'streak-3')!;
    const streak7 = statuses.find((s) => s.badge.id === 'streak-7')!;
    const points100 = statuses.find((s) => s.badge.id === 'points-100')!;

    expect(streak3.earned).toBe(true);
    expect(streak7.earned).toBe(false);
    expect(streak7.progress).toBeCloseTo(3 / 7);
    expect(points100.earned).toBe(true);
  });
});
