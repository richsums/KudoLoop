import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CreateChoreScreen } from '../screens/CreateChoreScreen';
import { ManageKidScreen } from '../screens/ManageKidScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { RootTabs } from './RootTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={RootTabs} />
      <Stack.Screen name="CreateChore" component={CreateChoreScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="ManageKid" component={ManageKidScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}
