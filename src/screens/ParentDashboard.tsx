import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Card } from '../components/Card';
import { formatRewardAmount, rewardSummary } from '../domain/rewards';
import type { TaskInstance } from '../domain/types';
import { useKudoLoopStore } from '../store/useKudoLoopStore';
import { colors, radius, spacing } from '../theme/tokens';

export function ParentDashboard() {
  const navigation = useNavigation();
  const users = useKudoLoopStore((state) => state.users);
  const children = useKudoLoopStore((state) => state.children);
  const tasks = useKudoLoopStore((state) => state.tasks);
  const ledger = useKudoLoopStore((state) => state.ledger);
  const redemptions = useKudoLoopStore((state) => state.redemptions);
  const parentId = useKudoLoopStore((state) => state.family.createdByParentId);
  const approveTask = useKudoLoopStore((state) => state.approveTask);
  const rejectTask = useKudoLoopStore((state) => state.rejectTask);
  const awardManualBonus = useKudoLoopStore((state) => state.awardManualBonus);
  const approveRedemption = useKudoLoopStore((state) => state.approveRedemption);

  const submittedTasks = tasks.filter((task) => task.status === 'submitted');
  const overdueTasks = tasks.filter((task) => task.status === 'todo' && new Date(task.dueAt).getTime() < Date.now());
  const requestedRedemptions = redemptions.filter((redemption) => redemption.status === 'requested');

  return (
    <View style={styles.stack}>
      <Card tone="mint">
        <Text style={styles.sectionTitle}>Parent command center</Text>
        <Text style={styles.body}>
          Manage approvals, reward balances, allowance, and device setup without giving kids access to settings.
        </Text>
        <View style={styles.statsRow}>
          <Metric label="Approvals" value={String(submittedTasks.length)} />
          <Metric label="Overdue" value={String(overdueTasks.length)} />
          <Metric label="Requests" value={String(requestedRedemptions.length)} />
        </View>
        <Pressable
          style={styles.primaryButton}
          accessibilityRole="button"
          onPress={() => navigation.navigate('CreateChore')}
        >
          <Text style={styles.primaryButtonText}>+ New chore</Text>
        </Pressable>
      </Card>

      <Text style={styles.heading}>Children</Text>
      {children.map((child) => {
        const user = users.find((candidate) => candidate.id === child.userId);

        return (
          <Card key={child.userId}>
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.avatar}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>{user?.displayName}</Text>
                <Text style={styles.meta}>{child.streakDays} day streak · {child.schoolNightRules}</Text>
              </View>
            </View>
            <View style={styles.balanceGrid}>
              <Metric label="Screen" value={formatRewardAmount('screen_minutes', child.balances.screen_minutes)} />
              <Metric label="Allowance" value={formatRewardAmount('money', child.balances.money)} />
              <Metric label="Points" value={formatRewardAmount('points', child.balances.points)} />
            </View>
            <View style={styles.actions}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => awardManualBonus(child.userId, 'screen_minutes', 10, 'Parent quick bonus', parentId)}
              >
                <Text style={styles.secondaryButtonText}>Award 10 min</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                accessibilityRole="button"
                onPress={() => navigation.navigate('ManageKid', { childId: child.userId })}
              >
                <Text style={styles.secondaryButtonText}>Manage</Text>
              </Pressable>
            </View>
          </Card>
        );
      })}

      <Text style={styles.heading}>Approval queue</Text>
      {submittedTasks.length === 0 ? <EmptyState text="No proof waiting for review." /> : null}
      {submittedTasks.map((task) => (
        <TaskApprovalCard
          key={task.id}
          task={task}
          onApprove={() => approveTask(task.id, parentId)}
          onReject={() => rejectTask(task.id, parentId, 'Please send a clearer photo.')}
        />
      ))}

      <Text style={styles.heading}>Screen-time requests</Text>
      {requestedRedemptions.length === 0 ? <EmptyState text="No extra time requests right now." /> : null}
      {requestedRedemptions.map((redemption) => {
        const child = users.find((candidate) => candidate.id === redemption.childId);

        return (
          <Card key={redemption.id} tone="sunny">
            <Text style={styles.cardTitle}>{child?.displayName} wants {redemption.amount} minutes</Text>
            <Text style={styles.body}>Target device: {redemption.targetDevice ?? 'Any screen'}</Text>
            <Pressable style={styles.primaryButton} onPress={() => approveRedemption(redemption.id, parentId)}>
              <Text style={styles.primaryButtonText}>Approve and deduct balance</Text>
            </Pressable>
          </Card>
        );
      })}

      <Text style={styles.heading}>Audit trail</Text>
      {ledger.slice(0, 4).map((entry) => (
        <Card key={entry.id}>
          <Text style={styles.cardTitle}>{entry.reason}</Text>
          <Text style={styles.meta}>
            {formatRewardAmount(entry.rewardType, entry.delta)} · Balance {entry.balanceAfter} · {entry.requestId}
          </Text>
        </Card>
      ))}
    </View>
  );
}

function TaskApprovalCard({
  task,
  onApprove,
  onReject,
}: {
  task: TaskInstance;
  onApprove: () => void;
  onReject: () => void;
}) {
  const template = useKudoLoopStore((state) =>
    state.templates.find((candidate) => candidate.id === task.templateId),
  );
  const child = useKudoLoopStore((state) => state.users.find((candidate) => candidate.id === task.childId));

  return (
    <Card tone="coral">
      <Text style={styles.cardTitle}>{template?.title}</Text>
      <Text style={styles.body}>{child?.displayName} submitted proof: {task.notes}</Text>
      <Text style={styles.meta}>Reward: {template ? rewardSummary(template.rewardRules) : 'No reward'}</Text>
      <View style={styles.actions}>
        <Pressable style={styles.primaryButton} onPress={onApprove}>
          <Text style={styles.primaryButtonText}>Approve</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onReject}>
          <Text style={styles.secondaryButtonText}>Request resubmission</Text>
        </Pressable>
      </View>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card>
      <Text style={styles.meta}>{text}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.navy,
    fontSize: 22,
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
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.sunny,
    borderRadius: 18,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  avatarText: {
    color: colors.navy,
    fontWeight: '900',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  balanceGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  metric: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radius.sm,
    borderWidth: 1,
    flex: 1,
    padding: spacing.sm,
  },
  metricValue: {
    color: colors.navy,
    fontSize: 17,
    fontWeight: '900',
  },
  metricLabel: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
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
