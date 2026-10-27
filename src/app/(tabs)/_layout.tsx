import React from 'react';
import type { ColorValue } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@/kit/ui';
import { kane } from '@/theme';
import { can, store } from '@/state';

export default function TabsLayout() {
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
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: kane.primary,
        tabBarInactiveTintColor: kane.textMuted,
        tabBarStyle: { backgroundColor: kane.surface, borderTopColor: kane.border, minHeight: 60 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="pilotage" options={{ title: 'Pilotage', tabBarIcon: icon('pulse'), href: internal ? undefined : null }} />
      <Tabs.Screen name="actifs" options={{ title: 'Actifs', tabBarIcon: icon('business'), href: internal ? undefined : null }} />
      <Tabs.Screen name="mobilite" options={{ title: 'Mobilité', tabBarIcon: icon('car-sport'), href: internal ? undefined : null }} />
      <Tabs.Screen name="finance" options={{ title: 'Finance', tabBarIcon: icon('stats-chart'), href: finance ? undefined : null }} />
      <Tabs.Screen name="dossier" options={{ title: 'Dossier', tabBarIcon: icon('folder-open'), href: internal ? undefined : null }} />
      <Tabs.Screen name="portail" options={{ title: 'Portail', tabBarIcon: icon('people'), href: internal ? null : undefined }} />
      <Tabs.Screen name="plus" options={{ title: 'Plus', tabBarIcon: icon('grid') }} />
    </Tabs>
  );
}
