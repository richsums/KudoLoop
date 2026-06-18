import { z } from 'zod';

export const roleSchema = z.enum(['parent', 'child', 'caregiver']);
export const permissionSchema = z.enum([
  'approve_tasks',
  'manage_rewards',
  'manage_members',
  'manage_assignments',
]);
export const taskCategorySchema = z.enum([
  'routine_chore',
  'bonus_screen_time',
  'paid_chore',
  'school_achievement',
  'custom_goal',
  'schoolwork',
  'special_project',
]);
export const taskStatusSchema = z.enum(['todo', 'submitted', 'approved', 'rejected', 'expired']);
export const rewardTypeSchema = z.enum(['screen_minutes', 'money', 'points', 'custom']);
export const redemptionStatusSchema = z.enum(['requested', 'approved', 'fulfilled', 'cancelled']);

export const rewardRuleSchema = z.object({
  id: z.string(),
  rewardType: rewardTypeSchema,
  amount: z.number(),
  label: z.string(),
  bonusCondition: z.string().optional(),
});

export const familySchema = z.object({
  id: z.string(),
  name: z.string(),
  timezone: z.string(),
  subscriptionTier: z.enum(['free', 'family_pro']),
  createdByParentId: z.string(),
});

export const userProfileSchema = z.object({
  id: z.string(),
  familyId: z.string(),
  role: roleSchema,
  displayName: z.string(),
  avatar: z.string(),
  birthYear: z.number().optional(),
  authUserId: z.string(),
  permissions: z.array(permissionSchema).optional(),
});

export const childProfileSchema = z.object({
  userId: z.string(),
  defaultDailyMinutes: z.number(),
  bedtimeWindow: z.string(),
  schoolNightRules: z.string(),
  allowanceCurrency: z.string(),
  streakDays: z.number(),
  balances: z.record(rewardTypeSchema, z.number()),
});

export const taskTemplateSchema = z.object({
  id: z.string(),
  familyId: z.string(),
  title: z.string(),
  category: taskCategorySchema,
  recurrenceRule: z.string(),
  defaultProofRequired: z.boolean(),
  rewardRules: z.array(rewardRuleSchema),
  approvalMode: z.enum(['parent_required', 'auto_approve']),
  active: z.boolean(),
  estimatedDurationMinutes: z.number().optional(),
  subject: z.string().optional(),
});

export const proofAssetSchema = z.object({
  id: z.string(),
  taskInstanceId: z.string(),
  uploaderId: z.string(),
  storagePath: z.string(),
  thumbnailPath: z.string(),
  mediaType: z.string(),
  createdAt: z.string(),
  moderationStatus: z.enum(['pending', 'approved', 'rejected']),
});

export const taskInstanceSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  childId: z.string(),
  dueAt: z.string(),
  status: taskStatusSchema,
  submittedAt: z.string().optional(),
  approvedBy: z.string().optional(),
  notes: z.string().optional(),
  proofAssets: z.array(proofAssetSchema),
});

export const rewardLedgerEntrySchema = z.object({
  id: z.string(),
  childId: z.string(),
  sourceType: z.string(),
  sourceId: z.string(),
  rewardType: rewardTypeSchema,
  delta: z.number(),
  balanceAfter: z.number(),
  createdBy: z.string(),
  createdAt: z.string(),
  reason: z.string(),
  requestId: z.string(),
});

export const redemptionSchema = z.object({
  id: z.string(),
  childId: z.string(),
  rewardType: rewardTypeSchema,
  amount: z.number(),
  targetDevice: z.string().optional(),
  status: redemptionStatusSchema,
  requestedAt: z.string(),
  approvedBy: z.string().optional(),
});

// Family-level conversion rates from points into cash or screen time.
export const rewardConfigSchema = z.object({
  pointsToMoneyRate: z.number(), // dollars earned per point
  pointsToScreenMinutesRate: z.number(), // screen minutes earned per point
});

export const incentiveTypeSchema = z.enum(['cash', 'item', 'screen_time']);
export const incentiveGoalSchema = z.object({
  id: z.string(),
  childId: z.string(),
  title: z.string(),
  type: incentiveTypeSchema,
  pointCost: z.number(),
  imageUrl: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.string(),
  active: z.boolean(),
});

export const wishlistStatusSchema = z.enum(['open', 'promoted', 'dismissed']);
export const wishlistItemSchema = z.object({
  id: z.string(),
  childId: z.string(),
  title: z.string(),
  note: z.string().optional(),
  createdAt: z.string(),
  status: wishlistStatusSchema,
});

export const notificationTypeSchema = z.enum([
  'task_completed',
  'wishlist_updated',
  'cashout_request',
  'screentime_request',
  'redemption_request',
]);
export const notificationTargetSchema = z.enum(['task', 'wishlist', 'redemption', 'incentive']);
export const appNotificationSchema = z.object({
  id: z.string(),
  type: notificationTypeSchema,
  childId: z.string(),
  targetType: notificationTargetSchema,
  targetId: z.string(),
  message: z.string(),
  createdAt: z.string(),
  read: z.boolean(),
});

export type Role = z.infer<typeof roleSchema>;
export type Permission = z.infer<typeof permissionSchema>;
export type TaskCategory = z.infer<typeof taskCategorySchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type RewardType = z.infer<typeof rewardTypeSchema>;
export type RewardRule = z.infer<typeof rewardRuleSchema>;
export type Family = z.infer<typeof familySchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type ChildProfile = z.infer<typeof childProfileSchema>;
export type TaskTemplate = z.infer<typeof taskTemplateSchema>;
export type ProofAsset = z.infer<typeof proofAssetSchema>;
export type TaskInstance = z.infer<typeof taskInstanceSchema>;
export type RewardLedgerEntry = z.infer<typeof rewardLedgerEntrySchema>;
export type Redemption = z.infer<typeof redemptionSchema>;
export type RewardConfig = z.infer<typeof rewardConfigSchema>;
export type IncentiveType = z.infer<typeof incentiveTypeSchema>;
export type IncentiveGoal = z.infer<typeof incentiveGoalSchema>;
export type WishlistStatus = z.infer<typeof wishlistStatusSchema>;
export type WishlistItem = z.infer<typeof wishlistItemSchema>;
export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type NotificationTarget = z.infer<typeof notificationTargetSchema>;
export type AppNotification = z.infer<typeof appNotificationSchema>;

export type KudoLoopStateSnapshot = {
  family: Family;
  users: UserProfile[];
  children: ChildProfile[];
  templates: TaskTemplate[];
  tasks: TaskInstance[];
  ledger: RewardLedgerEntry[];
  redemptions: Redemption[];
  incentives: IncentiveGoal[];
  wishlist: WishlistItem[];
  notifications: AppNotification[];
  rewardConfig: RewardConfig;
};

export const DEFAULT_REWARD_CONFIG: RewardConfig = {
  pointsToMoneyRate: 0.05, // 1 point = $0.05 (20 points = $1)
  pointsToScreenMinutesRate: 0.5, // 1 point = 30s (2 points = 1 min)
};
