import { describe, expect, it } from 'vitest';

import { applyRewardMutation, buildRequestId, formatRewardAmount } from '../../domain/rewards';
import type { ChildProfile } from '../../domain/types';

const child: ChildProfile = {
  userId: 'child-test',
  defaultDailyMinutes: 45,
  bedtimeWindow: '8:30 PM - 7:00 AM',
  schoolNightRules: 'Homework first.',
  allowanceCurrency: 'USD',
  streakDays: 2,
  balances: {
    screen_minutes: 10,
    money: 4,
    points: 25,
    custom: 0,
  },
};

describe('reward ledger behavior', () => {
  it('adds rewards and records the resulting balance', () => {
    const result = applyRewardMutation({
      child,
      rewardType: 'screen_minutes',
      delta: 20,
      sourceType: 'task_approval',
      sourceId: 'task-1',
      createdBy: 'parent-1',
      reason: 'Approved homework',
      requestId: buildRequestId('approve-screen_minutes', 'task-1'),
      nowIso: '2026-06-14T12:00:00.000Z',
    });

    expect(result.child.balances.screen_minutes).toBe(30);
    expect(result.ledgerEntry.balanceAfter).toBe(30);
    expect(result.ledgerEntry.requestId).toBe('approve-screen_minutes-task-1');
  });

  it('blocks negative balances', () => {
    expect(() =>
      applyRewardMutation({
        child,
        rewardType: 'screen_minutes',
        delta: -99,
        sourceType: 'redemption',
        sourceId: 'redeem-1',
        createdBy: 'parent-1',
        reason: 'Too much time',
        requestId: 'redeem-1',
      }),
    ).toThrow('screen_minutes balance cannot go below zero');
  });

  it('formats reward values for parent and child screens', () => {
    expect(formatRewardAmount('screen_minutes', 15)).toBe('15 min');
    expect(formatRewardAmount('money', 2)).toBe('$2.00');
    expect(formatRewardAmount('points', 25)).toBe('25 pts');
  });
});
