import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '../components/Card';
import { SegmentedTabs } from '../components/SegmentedTabs';
import { formatRewardAmount, rewardSummary } from '../domain/rewards';
import type { TaskInstance } from '../domain/types';
import { isSupabaseConfigured } from '../lib/env';
import { pickProofImage, uploadProofImage } from '../lib/proof';
import { useKudoLoopStore } from '../store/useKudoLoopStore';
import { colors, radius, spacing } from '../theme/tokens';

export function ChildDashboard() {
  const childUsers = useKudoLoopStore((state) => state.users.filter((candidate) => candidate.role === 'child'));
  const templates = useKudoLoopStore((state) => state.templates);
  const children = useKudoLoopStore((state) => state.children);
  const allTasks = useKudoLoopStore((state) => state.tasks);
  const allRedemptions = useKudoLoopStore((state) => state.redemptions);
  const familyId = useKudoLoopStore((state) => state.family.id);
  const submitTaskProof = useKudoLoopStore((state) => state.submitTaskProof);
  const requestRedemption = useKudoLoopStore((state) => state.requestRedemption);

  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const activeChildId = selectedChildId ?? childUsers[0]?.id ?? null;

  const child = children.find((candidate) => candidate.userId === activeChildId);
  const user = childUsers.find((candidate) => candidate.id === activeChildId);
  const tasks = allTasks.filter((task) => task.childId === activeChildId);
  const redemptions = allRedemptions.filter((item) => item.childId === activeChildId);

  if (!child || !user || !activeChildId) {
    return (
      <Card>
        <Text style={styles.cardTitle}>No kids yet</Text>
        <Text style={styles.body}>Add a child during setup to see their quest board here.</Text>
      </Card>
    );
  }

  const childId = activeChildId;

  const handleSubmit = async (task: TaskInstance, needsProof: boolean) => {
    // When the backend is configured, a proof task uploads a real private image
    // before flipping the task to "submitted". Otherwise we simulate locally.
    if (needsProof && isSupabaseConfigured) {
      try {
        const uri = await pickProofImage();
        if (!uri) {
          return;
        }
        await uploadProofImage({ familyId, taskId: task.id, uploaderId: childId, localUri: uri });
      } catch (error) {
        console.warn('Proof upload failed', error);
        return;
      }
    }

    submitTaskProof(task.id, childId, needsProof ? 'Proof photo uploaded.' : 'Marked done in kid mode.');
  };

  return (
    <View style={styles.stack}>
      {childUsers.length > 1 ? (
        <SegmentedTabs
          selected={activeChildId}
          tabs={childUsers.map((candidate) => ({ label: candidate.displayName, value: candidate.id }))}
          onSelect={setSelectedChildId}
        />
      ) : null}
      <Card tone="sunny">
        <Text style={styles.heroTitle}>Hi {user.displayName}, earn your next 20 minutes.</Text>
        <Text style={styles.body}>Finish quests, send proof when needed, and watch your screen bank grow.</Text>
        <View style={styles.balanceRow}>
          <Balance label="Screen" value={formatRewardAmount('screen_minutes', child.balances.screen_minutes)} />
          <Balance label="Allowance" value={formatRewardAmount('money', child.balances.money)} />
          <Balance label="Streak" value={`${child.streakDays} days`} />
        </View>
        <Pressable
          style={styles.primaryButton}
          onPress={() => requestRedemption(activeChildId, 'screen_minutes', 15, 'iPad')}
        >
          <Text style={styles.primaryButtonText}>Ask for 15 iPad minutes</Text>
        </Pressable>
      </Card>

      <Text style={styles.heading}>Today’s quest board</Text>
      {tasks.map((task) => {
        const template = templates.find((candidate) => candidate.id === task.templateId);
        const needsProof = template?.defaultProofRequired;

        return (
          <Card key={task.id}>
            <View style={styles.taskHeader}>
              <View style={[styles.statusDot, statusColor(task.status)]} />
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>{template?.title}</Text>
                <Text style={styles.meta}>{template ? rewardSummary(template.rewardRules) : 'Family habit'}</Text>
              </View>
            </View>
            <Text style={styles.body}>
              {needsProof ? 'Photo proof required before parent approval.' : 'Parent approval adds your points.'}
            </Text>
            <Text style={styles.badge}>{task.status === 'submitted' ? 'Parent review needed' : task.status}</Text>
            {task.status === 'todo' ? (
              <Pressable
                style={styles.secondaryButton}
                onPress={() => {
                  void handleSubmit(task, Boolean(needsProof));
                }}
              >
                <Text style={styles.secondaryButtonText}>{needsProof ? 'Send proof photo' : 'Mark done'}</Text>
              </Pressable>
            ) : null}
          </Card>
        );
      })}

      <Text style={styles.heading}>Reward store</Text>
      <Card tone="mint">
        <Text style={styles.cardTitle}>Screen-time rewards</Text>
        <Text style={styles.body}>Redeem approved minutes for iPad, PS5, phone, or computer time.</Text>
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Custom family perk</Text>
        <Text style={styles.body}>Trade points for parent-created incentives like movie pick or dessert helper.</Text>
      </Card>

      <Text style={styles.heading}>Requests</Text>
      {redemptions.slice(0, 3).map((redemption) => (
        <Card key={redemption.id}>
          <Text style={styles.cardTitle}>{redemption.amount} minutes for {redemption.targetDevice}</Text>
          <Text style={styles.meta}>Status: {redemption.status}</Text>
        </Card>
      ))}
    </View>
  );
}

function Balance({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.balance}>
      <Text style={styles.balanceValue}>{value}</Text>
      <Text style={styles.balanceLabel}>{label}</Text>
    </View>
  );
}

function statusColor(status: string) {
  if (status === 'approved') {
    return { backgroundColor: colors.green };
  }

  if (status === 'submitted') {
    return { backgroundColor: colors.sunny };
  }

  if (status === 'rejected') {
    return { backgroundColor: colors.red };
  }

  return { backgroundColor: colors.teal };
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
  },
  heroTitle: {
    color: colors.navy,
    fontSize: 24,
    fontWeight: '900',
  },
  heading: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: '900',
    marginTop: spacing.sm,
  },
  cardTitle: {
    color: colors.navy,
    fontSize: 17,
    fontWeight: '900',
  },
  body: {
    color: colors.gray,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  meta: {
    color: colors.gray,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  flex: {
    flex: 1,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  balance: {
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    flex: 1,
    padding: spacing.sm,
  },
  balanceValue: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '900',
  },
  balanceLabel: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: '700',
  },
  taskHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  statusDot: {
    borderRadius: 8,
    height: 16,
    width: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cloud,
    borderRadius: radius.sm,
    color: colors.navy,
    fontSize: 12,
    fontWeight: '900',
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textTransform: 'uppercase',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.teal,
    borderRadius: radius.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.teal,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.tealDark,
    fontWeight: '900',
  },
});
