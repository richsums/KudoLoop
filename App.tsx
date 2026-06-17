import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './src/navigation/RootNavigator';
import { OnboardingFlow } from './src/screens/OnboardingFlow';
import { useOnboardingStore } from './src/store/useOnboardingStore';
import { colors } from './src/theme/tokens';

const navTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.cloud,
    card: colors.white,
    border: colors.line,
    primary: colors.teal,
    text: colors.navy,
  },
};

export default function App() {
  const queryClient = useMemo(() => new QueryClient(), []);
  const setupComplete = useOnboardingStore((state) => state.setupComplete);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        {setupComplete ? (
          <NavigationContainer theme={navTheme}>
            <RootNavigator />
          </NavigationContainer>
        ) : (
          <OnboardingFlow />
        )}
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
