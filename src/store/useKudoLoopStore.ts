import { create } from 'zustand';

import { mockFamily } from '../data/mockFamily';
import type { ChoreCatalogItem, SchoolworkCatalogItem } from '../domain/catalog';
import { buildChore, type NewChoreInput } from '../domain/chores';
import { applyRewardMutation, buildRequestId } from '../domain/rewards';
import type {
  AppNotification,
  ChildProfile,
  Family,
  IncentiveGoal,
  IncentiveType,
  KudoLoopStateSnapshot,
  NotificationTarget,
  NotificationType,
  ProofAsset,
  Redemption,
  RewardConfig,
  RewardLedgerEntry,
  RewardType,
  TaskInstance,
  TaskTemplate,
  UserProfile,
  WishlistItem,
} from '../domain/types';

type StoreState = {
  family: Family;
  users: UserProfile[];
  templates: TaskTemplate[];
  children: ChildProfile[];
  tasks: TaskInstance[];
  ledger: RewardLedgerEntry[];
  redemptions: Redemption[];
  incentives: IncentiveGoal[];
  wishlist: WishlistItem[];
  notifications: AppNotification[];
  rewardConfig: RewardConfig;
  processedRequestIds: string[];
  hydrate: (snapshot: KudoLoopStateSnapshot) => void;
  addChore: (input: NewChoreInput) => void;
  assignCatalogChore: (childId: string, item: ChoreCatalogItem) => void;
  assignCatalogSchoolwork: (childId: string, item: SchoolworkCatalogItem) => void;
  addManualSchoolwork: (
    childId: string,
    input: { title: string; subject: string; points: number; durationMinutes: number; proofRequired: boolean },
  ) => void;
  removeTemplate: (templateId: string) => void;
  setTemplateActive: (templateId: string, active: boolean) => void;
  addIncentive: (
    input: { childId: string; title: string; type: IncentiveType; pointCost: number; imageUrl?: string },
    createdBy: string,
  ) => void;
  removeIncentive: (incentiveId: string) => void;
  addWishlistItem: (childId: string, title: string, note?: string) => void;
  removeWishlistItem: (wishlistItemId: string) => void;
  promoteWishlistItem: (wishlistItemId: string, pointCost: number, createdBy: string) => void;
  requestCashout: (childId: string, points: number) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
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
    incentives: snapshot.incentives,
    wishlist: snapshot.wishlist,
    notifications: snapshot.notifications,
    rewardConfig: snapshot.rewardConfig,
    processedRequestIds: snapshot.ledger.map((entry) => entry.requestId),
  };
}

function makeNotification(
  type: NotificationType,
  childId: string,
  targetType: NotificationTarget,
  targetId: string,
  message: string,
): AppNotification {
  return {
    id: `notif-${targetType}-${targetId}-${Date.now()}`,
    type,
    childId,
    targetType,
    targetId,
    message,
    createdAt: new Date().toISOString(),
    read: false,
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
  assignCatalogChore: (childId, item) => {
    get().addChore({
      title: item.title,
      category: item.category,
      rewardType: 'points',
      rewardAmount: item.suggestedPoints,
      proofRequired: false,
      childIds: [childId],
      recurrenceRule: item.defaultFrequency,
      estimatedDurationMinutes: item.suggestedDurationMinutes,
    });
  },
  assignCatalogSchoolwork: (childId, item) => {
    get().addChore({
      title: item.title,
      category: 'schoolwork',
      rewardType: 'points',
      rewardAmount: item.suggestedPoints,
      proofRequired: true,
      childIds: [childId],
      estimatedDurationMinutes: item.suggestedDurationMinutes,
      subject: item.subject,
    });
  },
  addManualSchoolwork: (childId, input) => {
    get().addChore({
      title: input.title,
      category: 'schoolwork',
      rewardType: 'points',
      rewardAmount: input.points,
      proofRequired: input.proofRequired,
      childIds: [childId],
      estimatedDurationMinutes: input.durationMinutes,
      subject: input.subject,
    });
  },
  removeTemplate: (templateId) => {
    set((state) => ({
      templates: state.templates.filter((template) => template.id !== templateId),
      tasks: state.tasks.filter((task) => task.templateId !== templateId),
    }));
  },
  setTemplateActive: (templateId, active) => {
    set((state) => ({
      templates: state.templates.map((template) =>
        template.id === templateId ? { ...template, active } : template,
      ),
    }));
  },
  addIncentive: (input, createdBy) => {
    const incentive: IncentiveGoal = {
      id: `incentive-${Date.now()}`,
      childId: input.childId,
      title: input.title,
      type: input.type,
      pointCost: input.pointCost,
      imageUrl: input.imageUrl,
      createdBy,
      createdAt: new Date().toISOString(),
      active: true,
    };
    set((state) => ({ incentives: [incentive, ...state.incentives] }));
  },
  removeIncentive: (incentiveId) => {
    set((state) => ({ incentives: state.incentives.filter((item) => item.id !== incentiveId) }));
  },
  addWishlistItem: (childId, title, note) => {
    const childName = get().users.find((candidate) => candidate.id === childId)?.displayName ?? 'A child';
    const item: WishlistItem = {
      id: `wish-${Date.now()}`,
      childId,
      title,
      note,
      createdAt: new Date().toISOString(),
      status: 'open',
    };
    const notification = makeNotification(
      'wishlist_updated',
      childId,
      'wishlist',
      item.id,
      `${childName} added “${title}” to their wishlist`,
    );
    set((state) => ({
      wishlist: [item, ...state.wishlist],
      notifications: [notification, ...state.notifications],
    }));
  },
  removeWishlistItem: (wishlistItemId) => {
    set((state) => ({ wishlist: state.wishlist.filter((item) => item.id !== wishlistItemId) }));
  },
  promoteWishlistItem: (wishlistItemId, pointCost, createdBy) => {
    const item = get().wishlist.find((candidate) => candidate.id === wishlistItemId);
    if (!item) {
      return;
    }
    const incentive: IncentiveGoal = {
      id: `incentive-${Date.now()}`,
      childId: item.childId,
      title: item.title,
      type: 'item',
      pointCost,
      createdBy,
      createdAt: new Date().toISOString(),
      active: true,
    };
    set((state) => ({
      incentives: [incentive, ...state.incentives],
      wishlist: state.wishlist.map((candidate) =>
        candidate.id === wishlistItemId ? { ...candidate, status: 'promoted' } : candidate,
      ),
    }));
  },
  requestCashout: (childId, points) => {
    const childName = get().users.find((candidate) => candidate.id === childId)?.displayName ?? 'A child';
    const redemption: Redemption = {
      id: `redemption-${Date.now()}`,
      childId,
      rewardType: 'points',
      amount: points,
      status: 'requested',
      requestedAt: new Date().toISOString(),
    };
    const notification = makeNotification(
      'cashout_request',
      childId,
      'redemption',
      redemption.id,
      `${childName} wants to cash out ${points} points`,
    );
    set((state) => ({
      redemptions: [redemption, ...state.redemptions],
      notifications: [notification, ...state.notifications],
    }));
  },
  markNotificationRead: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification,
      ),
    }));
  },
  markAllNotificationsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((notification) => ({ ...notification, read: true })),
    }));
  },
  submitTaskProof: (taskId, childId, note) => {
    const state = get();
    const familyId = state.family.id;
    const task = state.tasks.find((candidate) => candidate.id === taskId);
    const template = state.templates.find((candidate) => candidate.id === task?.templateId);
    const childName = state.users.find((candidate) => candidate.id === childId)?.displayName ?? 'A child';
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

    const notification = makeNotification(
      'task_completed',
      childId,
      'task',
      taskId,
      `${childName} completed “${template?.title ?? 'a task'}” — review needed`,
    );

    set((currentState) => ({
      tasks: currentState.tasks.map((candidate) =>
        candidate.id === taskId
          ? {
              ...candidate,
              status: 'submitted',
              submittedAt: new Date().toISOString(),
              notes: note,
              proofAssets: [proof, ...candidate.proofAssets],
            }
          : candidate,
      ),
      notifications: [notification, ...currentState.notifications],
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
    const childName = get().users.find((candidate) => candidate.id === childId)?.displayName ?? 'A child';
    const redemption: Redemption = {
      id: `redemption-${Date.now()}`,
      childId,
      rewardType,
      amount,
      targetDevice,
      status: 'requested',
      requestedAt: new Date().toISOString(),
    };

    const isScreenTime = rewardType === 'screen_minutes';
    const notification = makeNotification(
      isScreenTime ? 'screentime_request' : 'redemption_request',
      childId,
      'redemption',
      redemption.id,
      isScreenTime
        ? `${childName} requested ${amount} min on ${targetDevice ?? 'a device'}`
        : `${childName} requested to redeem ${amount}`,
    );

    set((state) => ({
      redemptions: [redemption, ...state.redemptions],
      notifications: [notification, ...state.notifications],
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
