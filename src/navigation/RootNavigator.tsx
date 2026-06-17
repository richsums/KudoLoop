import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CreateChoreScreen } from '../screens/CreateChoreScreen';
import { RootTabs } from './RootTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={RootTabs} />
      <Stack.Screen name="CreateChore" component={CreateChoreScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
