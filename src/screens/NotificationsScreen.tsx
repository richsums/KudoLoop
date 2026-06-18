import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Card } from '../components/Card';
import type { AppNotification } from '../domain/types';
import { useKudoLoopStore } from '../store/useKudoLoopStore';
import { colors, radius, spacing } from '../theme/tokens';

export function NotificationsScreen() {
  const navigation = useNavigation();
  const notifications = useKudoLoopStore((state) => state.notifications);
  const markNotificationRead = useKudoLoopStore((state) => state.markNotificationRead);
  const markAllNotificationsRead = useKudoLoopStore((state) => state.markAllNotificationsRead);

  const unread = notifications.filter((item) => !item.read).length;

  const handleOpen = (notification: AppNotification) => {
    markNotificationRead(notification.id);

    // Deep-link to where the parent can act on the item.
    if (notification.targetType === 'wishlist') {
      navigation.navigate('ManageKid', { childId: notification.childId });
      return;
    }

    // Tasks, redemptions, cash-outs and screen-time all surface in the parent
    // dashboard's approval queues.
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
          notifications.map((notification) => (
            <Pressable key={notification.id} onPress={() => handleOpen(notification)} accessibilityRole="button">
              <Card tone={notification.read ? 'plain' : 'mint'}>
                <View style={styles.row}>
                  {notification.read ? null : <View style={styles.dot} />}
                  <View style={styles.flex}>
                    <Text style={styles.message}>{notification.message}</Text>
                    <Text style={styles.meta}>{labelForType(notification.type)} · tap to review</Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          ))
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
});
