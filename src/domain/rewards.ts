import type { ChildProfile, RewardLedgerEntry, RewardRule, RewardType } from './types';

export type RewardMutationInput = {
  child: ChildProfile;
  rewardType: RewardType;
  delta: number;
  sourceType: string;
  sourceId: string;
  createdBy: string;
  reason: string;
  requestId: string;
  nowIso?: string;
};

export type RewardMutationResult = {
  child: ChildProfile;
  ledgerEntry: RewardLedgerEntry;
};

export function applyRewardMutation(input: RewardMutationInput): RewardMutationResult {
  const previousBalance = input.child.balances[input.rewardType] ?? 0;
  const balanceAfter = previousBalance + input.delta;

  if (balanceAfter < 0) {
    throw new Error(`${input.rewardType} balance cannot go below zero`);
  }

  const child = {
    ...input.child,
    balances: {
      ...input.child.balances,
      [input.rewardType]: balanceAfter,
    },
  };

  const ledgerEntry: RewardLedgerEntry = {
    id: `ledger-${input.requestId}`,
    childId: input.child.userId,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    rewardType: input.rewardType,
    delta: input.delta,
    balanceAfter,
    createdBy: input.createdBy,
    createdAt: input.nowIso ?? new Date().toISOString(),
    reason: input.reason,
    requestId: input.requestId,
  };

  return { child, ledgerEntry };
}

export function rewardSummary(rewardRules: RewardRule[]) {
  return rewardRules.map((rule) => `${formatRewardAmount(rule.rewardType, rule.amount)} ${rule.label}`).join(' + ');
}

export function formatRewardAmount(rewardType: RewardType, amount: number) {
  if (rewardType === 'screen_minutes') {
    return `${amount} min`;
  }

  if (rewardType === 'money') {
    return `$${amount.toFixed(2)}`;
  }

  if (rewardType === 'points') {
    return `${amount} pts`;
  }

  return `${amount}`;
}

export function buildRequestId(action: string, entityId: string) {
  return `${action}-${entityId}`;
}
