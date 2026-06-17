import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../components/Card';
import { formatRewardAmount } from '../domain/rewards';
import { generateWeeklyReport } from '../domain/weeklyReport';
import { useKudoLoopStore } from '../store/useKudoLoopStore';
import { colors, radius, spacing } from '../theme/tokens';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function WeeklyReportScreen() {
  const users = useKudoLoopStore((state) => state.users);
  const children = useKudoLoopStore((state) => state.children);
  const ledger = useKudoLoopStore((state) => state.ledger);

  const report = useMemo(
    () => generateWeeklyReport({ users, children, ledger }, new Date(Date.now() - WEEK_MS).toISOString()),
    [users, children, ledger],
  );

  return (
    <View style={styles.stack}>
      <Card tone="mint">
        <Text style={styles.sectionTitle}>This week’s family win</Text>
        <Text style={styles.body}>
          {report.totalApprovals === 0
            ? 'No approvals yet this week — approve a quest to kick off the streak.'
            : `${report.totalApprovals} ${report.totalApprovals === 1 ? 'quest' : 'quests'} approved` +
              (report.topEarnerName ? ` · ${report.topEarnerName} is leading the way 🎉` : '')}
        </Text>
      </Card>

      <Text style={styles.heading}>Per kid</Text>
      {report.children.length === 0 ? (
        <Card>
          <Text style={styles.meta}>No kids yet — add one during setup.</Text>
        </Card>
      ) : (
        report.children.map((child) => (
          <Card key={child.childId}>
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{child.displayName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>{child.displayName}</Text>
                <Text style={styles.meta}>
                  {child.approvals} {child.approvals === 1 ? 'approval' : 'approvals'} · {child.streakDays} day streak
                </Text>
              </View>
            </View>
            <View style={styles.grid}>
              <Metric label="Screen" value={formatRewardAmount('screen_minutes', child.earned.screen_minutes)} />
              <Metric label="Allowance" value={formatRewardAmount('money', child.earned.money)} />
              <Metric label="Points" value={formatRewardAmount('points', child.earned.points)} />
            </View>
            <Text style={styles.caption}>Earned in the last 7 days</Text>
          </Card>
        ))
      )}
    </View>
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
    marginTop: spacing.xs,
  },
  caption: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing.sm,
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
  grid: {
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
    fontSize: 16,
    fontWeight: '900',
  },
  metricLabel: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: '700',
  },
});
