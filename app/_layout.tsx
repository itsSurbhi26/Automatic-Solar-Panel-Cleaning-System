/**
 * Root layout – wraps the entire app with gesture handler and providers.
 * Sets up expo-router file-based navigation.
 */

import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSolarStore } from '../src/store/useSolarStore';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const darkMode = useSolarStore((s) => s.settings.darkMode);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
