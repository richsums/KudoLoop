import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKudoLoopStore } from '../store/useKudoLoopStore';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { colors, spacing } from '../theme/tokens';

export function BrandHeader() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const familyName = useKudoLoopStore((state) => state.family.name);
  const unread = useKudoLoopStore((state) => state.notifications.filter((item) => !item.read).length);
  const restart = useOnboardingStore((state) => state.restart);

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.headerText}>
        <Text style={styles.eyebrow}>KudoLoop</Text>
        <Text style={styles.title} numberOfLines={1}>
          {familyName}
        </Text>
        <Pressable accessibilityRole="button" onPress={restart} hitSlop={8}>
          <Text style={styles.reset}>Restart setup</Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
        onPress={() => navigation.navigate('Notifications')}
        style={styles.bell}
        hitSlop={8}
      >
        <Text style={styles.bellIcon}>🔔</Text>
        {unread > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        ) : null}
      </Pressable>
      <View style={styles.logo}>
        <Text style={styles.logoText}>KL</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    backgroundColor: colors.cloud,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: colors.teal,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    color: colors.navy,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },
  reset: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  bell: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  bellIcon: {
    fontSize: 22,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: colors.coral,
    borderRadius: 9,
    minWidth: 18,
    paddingHorizontal: 4,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '900',
  },
  logo: {
    alignItems: 'center',
    backgroundColor: colors.sunny,
    borderColor: colors.navy,
    borderRadius: 16,
    borderWidth: 2,
    height: 48,
    justifyContent: 'center',
    marginLeft: spacing.md,
    width: 48,
  },
  logoText: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '900',
  },
});
