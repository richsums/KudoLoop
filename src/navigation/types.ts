export type RootStackParamList = {
  Tabs: undefined;
  CreateChore: undefined;
};

// Make `useNavigation()` aware of the stack routes app-wide so navigate()/goBack
// are type-checked without threading generics through every screen.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
