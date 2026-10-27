import React, { useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/kit/theme';
import { BootGate, OfflineBadge, ToastProvider } from '@/kit/ui';
import { kane } from '@/theme';
import { store } from '@/state';

export default function RootLayout() {
  const hydrate = useCallback(() => store.hydrate(), []);
  return (
    <SafeAreaProvider>
      <ThemeProvider value={kane}>
        <ToastProvider>
          <StatusBar style="light" />
          <BootGate hydrate={hydrate} appName="KaneOne Suite">
            <OfflineBadge text="Hors ligne — mode démo local, rien n’est perdu" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: kane.bg } }} />
          </BootGate>
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
