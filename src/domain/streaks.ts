import type { RewardLedgerEntry } from './types';

function dateKey(iso: string): string {
  return iso.slice(0, 10); // 'YYYY-MM-DD' (UTC)
}

/** Distinct days (UTC) on which the child had at least one approved task. */
function approvalDays(ledger: RewardLedgerEntry[], childId: string): Set<string> {
  return new Set(
    ledger
      .filter((entry) => entry.childId === childId && entry.sourceType === 'task_approval')
      .map((entry) => dateKey(entry.createdAt)),
  );
}

/**
 * Consecutive-day approval streak ending today (or yesterday if nothing has
 * been approved yet today). Returns 0 if the most recent approval is older.
 */
export function computeStreak(ledger: RewardLedgerEntry[], childId: string, nowIso: string): number {
  const days = approvalDays(ledger, childId);
  if (days.size === 0) {
    return 0;
  }

  const cursor = new Date(`${dateKey(nowIso)}T00:00:00.000Z`);
  const key = (date: Date) => date.toISOString().slice(0, 10);

  if (!days.has(key(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (!days.has(key(cursor))) {
      return 0;
    }
  }

  let streak = 0;
  while (days.has(key(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

/** Distinct approved tasks (a single approval may write several ledger rows). */
export function totalApprovals(ledger: RewardLedgerEntry[], childId: string): number {
  return new Set(
    ledger
      .filter((entry) => entry.childId === childId && entry.sourceType === 'task_approval')
      .map((entry) => entry.sourceId),
  ).size;
}

/** Lifetime points earned (positive point deltas only). */
export function lifetimePoints(ledger: RewardLedgerEntry[], childId: string): number {
  return ledger
    .filter((entry) => entry.childId === childId && entry.rewardType === 'points' && entry.delta > 0)
    .reduce((sum, entry) => sum + entry.delta, 0);
}

export type BadgeMetric = 'streak' | 'approvals' | 'points';
export type Badge = { id: string; label: string; emoji: string; metric: BadgeMetric; threshold: number };

export const BADGES: Badge[] = [
  { id: 'streak-3', label: '3-day streak', emoji: '🔥', metric: 'streak', threshold: 3 },
  { id: 'streak-7', label: '7-day streak', emoji: '⚡', metric: 'streak', threshold: 7 },
  { id: 'streak-30', label: '30-day streak', emoji: '🏆', metric: 'streak', threshold: 30 },
  { id: 'approve-1', label: 'First quest', emoji: '✅', metric: 'approvals', threshold: 1 },
  { id: 'approve-10', label: '10 quests', emoji: '💪', metric: 'approvals', threshold: 10 },
  { id: 'approve-50', label: '50 quests', emoji: '🌟', metric: 'approvals', threshold: 50 },
  { id: 'points-100', label: '100 points', emoji: '⭐', metric: 'points', threshold: 100 },
  { id: 'points-500', label: '500 points', emoji: '💎', metric: 'points', threshold: 500 },
];

export type BadgeStatus = { badge: Badge; current: number; earned: boolean; progress: number };

export function badgeStatuses(stats: { streak: number; approvals: number; points: number }): BadgeStatus[] {
  return BADGES.map((badge) => {
    const current =
      badge.metric === 'streak' ? stats.streak : badge.metric === 'approvals' ? stats.approvals : stats.points;
    return {
      badge,
      current,
      earned: current >= badge.threshold,
      progress: badge.threshold <= 0 ? 1 : Math.max(0, Math.min(1, current / badge.threshold)),
    };
  });
}
