import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme/tokens';

type Tab<T extends string> = {
  label: string;
  value: T;
};

type SegmentedTabsProps<T extends string> = {
  selected: T;
  tabs: Tab<T>[];
  onSelect: (tab: T) => void;
};

export function SegmentedTabs<T extends string>({ selected, tabs, onSelect }: SegmentedTabsProps<T>) {
  return (
    <View style={styles.wrapper}>
      {tabs.map((tab) => {
        const isSelected = tab.value === selected;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            key={tab.value}
            onPress={() => onSelect(tab.value)}
            style={[styles.tab, isSelected ? styles.selectedTab : null]}
          >
            <Text style={[styles.label, isSelected ? styles.selectedLabel : null]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.xs,
  },
  tab: {
    alignItems: 'center',
    borderRadius: radius.md,
    flex: 1,
    paddingVertical: spacing.sm,
  },
  selectedTab: {
    backgroundColor: colors.teal,
  },
  label: {
    color: colors.gray,
    fontSize: 13,
    fontWeight: '800',
  },
  selectedLabel: {
    color: colors.white,
  },
});
