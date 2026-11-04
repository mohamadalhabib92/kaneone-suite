import React, { useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/kit/theme';
import { BootGate, OfflineBadge, ToastProvider } from '@/kit/ui';
import { AppErrorBoundary } from '@/kit/error-boundary';
import { DemoModeProvider } from '@/kit/demo';
import { usePrintMode, WebBaseline } from '@/kit/web';
import { kanePrint, paletteFor, withDensity, type Density } from '@/theme';
import { DelightProvider } from '@/kit/premium';
import { figuresAreDemo } from '@/config';
import { StorageNotices } from '@/components/storage-notices';
import { store } from '@/state';

export default function RootLayout() {
  const hydrate = useCallback(() => store.hydrate(), []);
  // Avant hydratation, on suit seulement l’apparence système.
  const scheme = useColorScheme();
  return (
    <SafeAreaProvider>
      <ThemeProvider value={paletteFor(undefined, scheme)}>
        <AppErrorBoundary>
          <ToastProvider>
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
  const appearance = store.useSelect((s) => s.appearance);
  const scheme = useColorScheme();
  const print = usePrintMode();
  const theme = withDensity(print ? kanePrint : paletteFor(appearance, scheme), density);
  return (
    <ThemeProvider value={theme}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <WebBaseline color={theme.primary} />
      <DelightProvider>
      <DemoModeProvider value={figuresAreDemo(mode)}>
        <OfflineBadge text="Hors ligne — mode démo local, rien n’est perdu" />
        <StorageNotices />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }} />
      </DemoModeProvider>
      </DelightProvider>
    </ThemeProvider>
  );
}
