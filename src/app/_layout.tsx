import React, { useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/kit/theme';
import { BootGate, OfflineBadge, ToastProvider } from '@/kit/ui';
import { AppErrorBoundary } from '@/kit/error-boundary';
import { DemoModeProvider } from '@/kit/demo';
import { usePrintMode, WebBaseline } from '@/kit/web';
import { kane, kanePrint, withDensity, type Density } from '@/theme';
import { figuresAreDemo } from '@/config';
import { store } from '@/state';

export default function RootLayout() {
  const hydrate = useCallback(() => store.hydrate(), []);
  return (
    <SafeAreaProvider>
      <ThemeProvider value={kane}>
        <AppErrorBoundary>
          <ToastProvider>
            <StatusBar style="light" />
            <WebBaseline />
            <BootGate hydrate={hydrate} appName="KaneOne Suite">
              <AppFrame />
            </BootGate>
          </ToastProvider>
        </AppErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppFrame() {
  const density = store.useSelect((s) => (s.density ?? 'comfortable') as Density);
  const mode = store.useSelect((s) => s.mode);
  const print = usePrintMode();
  const theme = withDensity(print ? kanePrint : kane, density);
  return (
    <ThemeProvider value={theme}>
      <DemoModeProvider value={figuresAreDemo(mode)}>
        <OfflineBadge text="Hors ligne — mode démo local, rien n’est perdu" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }} />
      </DemoModeProvider>
    </ThemeProvider>
  );
}
