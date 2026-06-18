import type { PropsWithChildren } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { BrandAndComplianceScreen } from '../screens/BrandAndComplianceScreen';
import { ChildDashboard } from '../screens/ChildDashboard';
import { DeviceSetupScreen } from '../screens/DeviceSetupScreen';
import { ParentDashboard } from '../screens/ParentDashboard';
import { WeeklyReportScreen } from '../screens/WeeklyReportScreen';
import { colors, spacing } from '../theme/tokens';
import { BrandHeader } from './BrandHeader';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

function Scrollable({ children }: PropsWithChildren) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

function ParentTab() {
  return (
    <Scrollable>
      <ParentDashboard />
    </Scrollable>
  );
}

function ChildTab() {
  return (
    <Scrollable>
      <ChildDashboard />
    </Scrollable>
  );
}

function DevicesTab() {
  return (
    <Scrollable>
      <DeviceSetupScreen />
    </Scrollable>
  );
}

function BrandTab() {
  return (
    <Scrollable>
      <BrandAndComplianceScreen />
    </Scrollable>
  );
}

function ReportTab() {
  return (
    <Scrollable>
      <WeeklyReportScreen />
    </Scrollable>
  );
}

const tabEmoji: Record<string, string> = {
  Parent: '🏠',
  Report: '📊',
  Kid: '⭐',
  Devices: '📱',
  Brand: '🎨',
};

export function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        header: () => <BrandHeader />,
        sceneStyle: { backgroundColor: colors.cloud },
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.gray,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ color }) => (
          <Text style={[styles.tabIcon, { color }]}>{tabEmoji[route.name] ?? '•'}</Text>
        ),
      })}
    >
      <Tab.Screen name="Parent" component={ParentTab} />
      <Tab.Screen name="Report" component={ReportTab} />
      <Tab.Screen name="Kid" component={ChildTab} />
      <Tab.Screen name="Devices" component={DevicesTab} />
      <Tab.Screen name="Brand" component={BrandTab} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  tabBar: {
    backgroundColor: colors.white,
    borderTopColor: colors.line,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  tabIcon: {
    fontSize: 18,
  },
});
