import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Parent: undefined;
  Report: undefined;
  Kid: undefined;
  Devices: undefined;
  Brand: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  CreateChore: undefined;
  ManageKid: { childId: string };
  Notifications: undefined;
};

// Make `useNavigation()` aware of the stack routes app-wide so navigate()/goBack
// are type-checked without threading generics through every screen.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
