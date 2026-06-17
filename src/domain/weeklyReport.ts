import type { KudoLoopStateSnapshot, RewardType } from './types';

export type ChildWeeklyReport = {
  childId: string;
  displayName: string;
  approvals: number;
  earned: Record<RewardType, number>;
  streakDays: number;
};

export type WeeklyReport = {
  sinceIso: string;
  children: ChildWeeklyReport[];
  totalApprovals: number;
  topEarnerName: string | null;
};

type ReportInput = Pick<KudoLoopStateSnapshot, 'users' | 'children' | 'ledger'>;

function emptyEarned(): Record<RewardType, number> {
  return { screen_minutes: 0, money: 0, points: 0, custom: 0 };
}

/**
 * Summarize family activity since `sinceIso` (typically the last 7 days). Pure
 * over the ledger so it is fully testable; the screen passes a cutoff timestamp.
 * Approvals are counted by distinct task source id (a single task approval may
 * write several ledger entries — one per reward rule).
 */
export function generateWeeklyReport(snapshot: ReportInput, sinceIso: string): WeeklyReport {
  const since = Date.parse(sinceIso);
  const childUsers = snapshot.users.filter((user) => user.role === 'child');

  const children: ChildWeeklyReport[] = childUsers.map((user) => {
    const profile = snapshot.children.find((candidate) => candidate.userId === user.id);
    const entries = snapshot.ledger.filter(
      (entry) => entry.childId === user.id && Date.parse(entry.createdAt) >= since,
    );

    const earned = emptyEarned();
    const approvalIds = new Set<string>();

    for (const entry of entries) {
      if (entry.delta > 0) {
        earned[entry.rewardType] += entry.delta;
      }
      if (entry.sourceType === 'task_approval') {
        approvalIds.add(entry.sourceId);
      }
    }

    return {
      childId: user.id,
      displayName: user.displayName,
      approvals: approvalIds.size,
      earned,
      streakDays: profile?.streakDays ?? 0,
    };
  });

  const totalApprovals = children.reduce((sum, child) => sum + child.approvals, 0);
  const topEarner = [...children].sort((a, b) => b.approvals - a.approvals)[0];

  return {
    sinceIso,
    children,
    totalApprovals,
    topEarnerName: totalApprovals > 0 && topEarner ? topEarner.displayName : null,
  };
}
