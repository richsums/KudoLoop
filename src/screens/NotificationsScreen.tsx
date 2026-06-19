import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Card } from '../components/Card';
import { can, resolveActiveUser } from '../domain/permissions';
import type { AppNotification } from '../domain/types';
import { useKudoLoopStore } from '../store/useKudoLoopStore';
import { colors, radius, spacing } from '../theme/tokens';

export function NotificationsScreen() {
  const navigation = useNavigation();
  const notifications = useKudoLoopStore((state) => state.notifications);
  const tasks = useKudoLoopStore((state) => state.tasks);
  const redemptions = useKudoLoopStore((state) => state.redemptions);
  const users = useKudoLoopStore((state) => state.users);
  const creatorId = useKudoLoopStore((state) => state.family.createdByParentId);
  const activeUserId = useKudoLoopStore((state) => state.activeUserId);
  const markNotificationRead = useKudoLoopStore((state) => state.markNotificationRead);
  const markAllNotificationsRead = useKudoLoopStore((state) => state.markAllNotificationsRead);
  const approveTask = useKudoLoopStore((state) => state.approveTask);
  const rejectTask = useKudoLoopStore((state) => state.rejectTask);
  const approveRedemption = useKudoLoopStore((state) => state.approveRedemption);

  const activeUser = resolveActiveUser(users, activeUserId, creatorId);
  const actingId = activeUser?.id ?? creatorId;
  const canApprove = can(activeUser, 'approve_tasks');
  const unread = notifications.filter((item) => !item.read).length;

  const openContext = (notification: AppNotification) => {
    markNotificationRead(notification.id);
    if (notification.targetType === 'wishlist') {
      navigation.navigate('ManageKid', { childId: notification.childId });
      return;
    }
    navigation.navigate('Tabs', { screen: 'Parent' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} accessibilityRole="button">
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Notifications</Text>
          {unread > 0 ? (
            <Pressable onPress={markAllNotificationsRead} hitSlop={8} accessibilityRole="button">
              <Text style={styles.markAll}>Mark all read</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {notifications.length === 0 ? (
          <Card>
            <Text style={styles.meta}>No notifications yet. You’ll hear from the kids here.</Text>
          </Card>
        ) : (
          notifications.map((notification) => {
            const task =
              notification.targetType === 'task'
                ? tasks.find((candidate) => candidate.id === notification.targetId)
                : undefined;
            const redemption =
              notification.targetType === 'redemption'
                ? redemptions.find((candidate) => candidate.id === notification.targetId)
                : undefined;

            return (
              <Card key={notification.id} tone={notification.read ? 'plain' : 'mint'}>
                <Pressable onPress={() => openContext(notification)} accessibilityRole="button">
                  <View style={styles.row}>
                    {notification.read ? null : <View style={styles.dot} />}
                    <View style={styles.flex}>
                      <Text style={styles.message}>{notification.message}</Text>
                      <Text style={styles.meta}>{labelForType(notification.type)} · tap for context</Text>
                    </View>
                  </View>
                </Pressable>

                {/* Inline actions: act without leaving the feed. */}
                {task ? (
                  task.status === 'submitted' ? (
                    canApprove ? (
                      <View style={styles.actions}>
                        <Pressable
                          style={styles.primaryButton}
                          accessibilityRole="button"
                          onPress={() => {
                            approveTask(task.id, actingId);
                            markNotificationRead(notification.id);
                          }}
                        >
                          <Text style={styles.primaryButtonText}>Approve</Text>
                        </Pressable>
                        <Pressable
                          style={styles.secondaryButton}
                          accessibilityRole="button"
                          onPress={() => {
                            rejectTask(task.id, actingId, 'Please send a clearer photo.');
                            markNotificationRead(notification.id);
                          }}
                        >
                          <Text style={styles.secondaryButtonText}>Ask again</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Text style={styles.statusNote}>Needs “Approve tasks” permission.</Text>
                    )
                  ) : (
                    <Text style={styles.statusNote}>Already {task.status}.</Text>
                  )
                ) : null}

                {redemption ? (
                  redemption.status === 'requested' ? (
                    canApprove ? (
                      <View style={styles.actions}>
                        <Pressable
                          style={styles.primaryButton}
                          accessibilityRole="button"
                          onPress={() => {
                            approveRedemption(redemption.id, actingId);
                            markNotificationRead(notification.id);
                          }}
                        >
                          <Text style={styles.primaryButtonText}>Approve &amp; deduct</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Text style={styles.statusNote}>Needs “Approve tasks” permission.</Text>
                    )
                  ) : (
                    <Text style={styles.statusNote}>Already {redemption.status}.</Text>
                  )
                ) : null}
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function labelForType(type: AppNotification['type']): string {
  switch (type) {
    case 'task_completed':
      return 'Task completed';
    case 'wishlist_updated':
      return 'Wishlist updated';
    case 'cashout_request':
      return 'Cash-out request';
    case 'screentime_request':
      return 'Screen-time request';
    case 'redemption_request':
      return 'Redemption request';
    default:
      return 'Update';
  }
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.cloud, flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  back: { color: colors.teal, fontSize: 15, fontWeight: '800' },
  title: { color: colors.navy, fontSize: 24, fontWeight: '900', marginTop: spacing.xs },
  markAll: { color: colors.teal, fontSize: 13, fontWeight: '800' },
  content: { gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.xxl },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  dot: { backgroundColor: colors.coral, borderRadius: 5, height: 10, width: 10 },
  flex: { flex: 1 },
  message: { color: colors.navy, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  meta: { color: colors.gray, fontSize: 12, fontWeight: '600', marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  statusNote: { color: colors.gray, fontSize: 12, fontStyle: 'italic', marginTop: spacing.sm },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.teal,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  primaryButtonText: { color: colors.white, fontWeight: '900' },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.teal,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  secondaryButtonText: { color: colors.tealDark, fontWeight: '900' },
});
