import React from 'react';
import { Platform, type ColorValue } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@/kit/ui';
import { useTheme } from '@/kit/theme';
import { useReduceTransparency } from '@/kit/a11y';
import { haptic } from '@/kit/haptics';
import { glassPaint, HIT } from '@/kit/verre';
import { can, store } from '@/state';

export default function TabsLayout() {
  const t = useTheme();
  const solid = useReduceTransparency();
  const g = glassPaint(t, solid);
  const role = store.useSelect((s) => s.role);
  if (!role) return <Redirect href="/welcome" />;
  const internal = can(role, 'internal');
  const finance = can(role, 'finance.view');
  const icon = (name: React.ComponentProps<typeof Ionicons>['name']) =>
    function TabIcon({ color, size }: { color: ColorValue; size: number }) {
      return <Ionicons name={name} color={color as string} size={size} />;
    };
  return (
    <Tabs
      screenListeners={{ tabPress: () => haptic.select() }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.textMuted,
        tabBarAllowFontScaling: true,
        tabBarStyle: {
          backgroundColor: g.backgroundColor,
          borderTopColor: g.borderTopColor,
          borderTopWidth: 1,
          minHeight: 56,
          elevation: solid ? 0 : 12,
          shadowColor: '#041018',
          shadowOpacity: solid ? 0 : t.dark ? 0.45 : 0.16,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -6 },
          ...(Platform.OS === 'web' && !solid ? { backdropFilter: 'blur(18px)' } : null),
        },
        tabBarItemStyle: { minHeight: HIT },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="pilotage" options={{ title: 'Pilotage', tabBarIcon: icon('pulse'), href: internal ? undefined : null }} />
      <Tabs.Screen name="actifs" options={{ title: 'Actifs', tabBarIcon: icon('business'), href: internal ? undefined : null }} />
      <Tabs.Screen name="mobilite" options={{ title: 'Mobilité', tabBarIcon: icon('car-sport'), href: internal ? undefined : null }} />
      <Tabs.Screen name="finance" options={{ title: 'Finance', tabBarIcon: icon('stats-chart'), href: finance ? undefined : null }} />
      <Tabs.Screen name="dossier" options={{ title: 'Dossier', tabBarIcon: icon('folder-open'), href: internal ? undefined : null }} />
      <Tabs.Screen
        name="portail"
        options={{
          title: 'Portail',
          tabBarIcon: icon('people'),
          // Masquer l’onglet pour les rôles internes sans le retirer du routeur :
          // href:null redirige vers Pilotage et rend le lien « Plus » inopérant.
          tabBarItemStyle: internal ? { display: 'none' } : undefined,
        }}
      />
      <Tabs.Screen name="plus" options={{ title: 'Plus', tabBarIcon: icon('grid') }} />
    </Tabs>
  );
}
