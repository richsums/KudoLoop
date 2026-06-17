import { create } from 'zustand';

import { mockFamily } from '../data/mockFamily';
import { buildChore, type NewChoreInput } from '../domain/chores';
import { applyRewardMutation, buildRequestId } from '../domain/rewards';
import type {
  ChildProfile,
  Family,
  KudoLoopStateSnapshot,
  ProofAsset,
  Redemption,
  RewardLedgerEntry,
  RewardType,
  TaskInstance,
  TaskTemplate,
  UserProfile,
} from '../domain/types';

type StoreState = {
  family: Family;
  users: UserProfile[];
  templates: TaskTemplate[];
  children: ChildProfile[];
  tasks: TaskInstance[];
  ledger: RewardLedgerEntry[];
  redemptions: Redemption[];
  processedRequestIds: string[];
  hydrate: (snapshot: KudoLoopStateSnapshot) => void;
  addChore: (input: NewChoreInput) => void;
  submitTaskProof: (taskId: string, childId: string, note: string) => void;
  approveTask: (taskId: string, parentId: string) => void;
  rejectTask: (taskId: string, parentId: string, note: string) => void;
  awardManualBonus: (
    childId: string,
    rewardType: RewardType,
    amount: number,
    reason: string,
    parentId: string,
  ) => void;
  deductReward: (childId: string, rewardType: RewardType, amount: number, reason: string, parentId: string) => void;
  requestRedemption: (childId: string, rewardType: RewardType, amount: number, targetDevice?: string) => void;
  approveRedemption: (redemptionId: string, parentId: string) => void;
};

function mutateChildReward(
  state: StoreState,
  childId: string,
  rewardType: RewardType,
  amount: number,
  sourceType: string,
  sourceId: string,
  createdBy: string,
  reason: string,
  requestId: string,
) {
  if (state.processedRequestIds.includes(requestId)) {
    return state;
  }

  const child = state.children.find((candidate) => candidate.userId === childId);

  if (!child) {
    throw new Error(`Child ${childId} was not found`);
  }

  const { child: updatedChild, ledgerEntry } = applyRewardMutation({
    child,
    rewardType,
    delta: amount,
    sourceType,
    sourceId,
    createdBy,
    reason,
    requestId,
  });

  return {
    ...state,
    children: state.children.map((candidate) => (candidate.userId === childId ? updatedChild : candidate)),
    ledger: [ledgerEntry, ...state.ledger],
    processedRequestIds: [...state.processedRequestIds, requestId],
  };
}

function snapshotToState(snapshot: KudoLoopStateSnapshot) {
  return {
    family: snapshot.family,
    users: snapshot.users,
    templates: snapshot.templates,
    children: snapshot.children,
    tasks: snapshot.tasks,
    ledger: snapshot.ledger,
    redemptions: snapshot.redemptions,
    processedRequestIds: snapshot.ledger.map((entry) => entry.requestId),
  };
}

export const useKudoLoopStore = create<StoreState>((set, get) => ({
  ...snapshotToState(mockFamily),
  hydrate: (snapshot) => set(snapshotToState(snapshot)),
  addChore: (input) => {
    set((state) => {
      const { template, tasks } = buildChore(input, state.family.id, `${Date.now()}`, new Date().toISOString());
      return {
        templates: [template, ...state.templates],
        tasks: [...tasks, ...state.tasks],
      };
    });
  },
  submitTaskProof: (taskId, childId, note) => {
    const familyId = get().family.id;
    const proof: ProofAsset = {
      id: `proof-${taskId}-${Date.now()}`,
      taskInstanceId: taskId,
      uploaderId: childId,
      storagePath: `private/${familyId}/${taskId}/original.jpg`,
      thumbnailPath: `private/${familyId}/${taskId}/thumb.jpg`,
      mediaType: 'image/jpeg',
      createdAt: new Date().toISOString(),
      moderationStatus: 'pending',
    };

    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: 'submitted',
              submittedAt: new Date().toISOString(),
              notes: note,
              proofAssets: [proof, ...task.proofAssets],
            }
          : task,
      ),
    }));
  },
  approveTask: (taskId, parentId) => {
    const state = get();
    const task = state.tasks.find((candidate) => candidate.id === taskId);
    const template = state.templates.find((candidate) => candidate.id === task?.templateId);

    if (!task || !template || task.status === 'approved') {
      return;
    }

    set((currentState) => {
      let nextState: StoreState = {
        ...currentState,
        tasks: currentState.tasks.map((candidate) =>
          candidate.id === taskId
            ? {
                ...candidate,
                status: 'approved',
                approvedBy: parentId,
                proofAssets: candidate.proofAssets.map((proof) => ({ ...proof, moderationStatus: 'approved' })),
              }
            : candidate,
        ),
      };

      template.rewardRules.forEach((rule) => {
        nextState = mutateChildReward(
          nextState,
          task.childId,
          rule.rewardType,
          rule.amount,
          'task_approval',
          task.id,
          parentId,
          `Approved ${template.title}`,
          buildRequestId(`approve-${rule.rewardType}`, task.id),
        );
      });

      return nextState;
    });
  },
  rejectTask: (taskId, parentId, note) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: 'rejected',
              approvedBy: parentId,
              notes: note,
              proofAssets: task.proofAssets.map((proof) => ({ ...proof, moderationStatus: 'rejected' })),
            }
          : task,
      ),
    }));
  },
  awardManualBonus: (childId, rewardType, amount, reason, parentId) => {
    set((state) =>
      mutateChildReward(
        state,
        childId,
        rewardType,
        amount,
        'manual_bonus',
        `${childId}-${rewardType}`,
        parentId,
        reason,
        `${Date.now()}-${childId}-${rewardType}-bonus`,
      ),
    );
  },
  deductReward: (childId, rewardType, amount, reason, parentId) => {
    set((state) =>
      mutateChildReward(
        state,
        childId,
        rewardType,
        -amount,
        'manual_deduction',
        `${childId}-${rewardType}`,
        parentId,
        reason,
        `${Date.now()}-${childId}-${rewardType}-deduct`,
      ),
    );
  },
  requestRedemption: (childId, rewardType, amount, targetDevice) => {
    const redemption: Redemption = {
      id: `redemption-${Date.now()}`,
      childId,
      rewardType,
      amount,
      targetDevice,
      status: 'requested',
      requestedAt: new Date().toISOString(),
    };

    set((state) => ({
      redemptions: [redemption, ...state.redemptions],
    }));
  },
  approveRedemption: (redemptionId, parentId) => {
    const redemption = get().redemptions.find((candidate) => candidate.id === redemptionId);

    if (!redemption || redemption.status !== 'requested') {
      return;
    }

    set((state) => {
      const nextState = mutateChildReward(
        {
          ...state,
          redemptions: state.redemptions.map((candidate) =>
            candidate.id === redemptionId ? { ...candidate, status: 'approved', approvedBy: parentId } : candidate,
          ),
        },
        redemption.childId,
        redemption.rewardType,
        -redemption.amount,
        'redemption',
        redemption.id,
        parentId,
        `Approved ${redemption.targetDevice ?? 'screen'} redemption`,
        buildRequestId('redemption', redemption.id),
      );

      return nextState;
    });
  },
}));
