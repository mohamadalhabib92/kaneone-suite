import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, alpha } from '@/kit/theme';
import { Banner, Button, Chip, DemoBadge, Header, IconButton, Row, T } from '@/kit/ui';
import { can, roleLabel, store, type Perm } from '@/state';

export function BackHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  const router = useRouter();
  return (
    <Header
      title={title}
      subtitle={subtitle}
      left={<IconButton icon="chevron-back" a11y="Retour" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />}
      right={right ?? <DemoBadge label="Démo" />}
    />
  );
}

/** En-tête d'onglet : titre + badge démo + rôle courant. */
export function TabHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const router = useRouter();
  const role = store.useSelect((s) => s.role);
  return (
    <Header
      title={title}
      subtitle={subtitle}
      right={
        <Row gap={6}>
          <DemoBadge label="Démo" />
          <Chip label={roleLabel(role).split(' ')[0]} icon="person-circle" onPress={() => router.push('/settings')} />
        </Row>
      }
    />
  );
}

/** Bandeau affiché quand le rôle courant ne permet pas l'action. */
export function NeedPerm({ perm, what }: { perm: Perm; what: string }) {
  const role = store.useSelect((s) => s.role);
  const router = useRouter();
  if (can(role, perm)) return null;
  return (
    <Banner
      kind="warning"
      title="Lecture seule pour votre rôle"
      text={`Le rôle « ${roleLabel(role)} » ne peut pas ${what}. En démo, vous pouvez changer de rôle.`}
      action={<Button small kind="secondary" title="Changer de rôle" icon="swap-horizontal" onPress={() => router.push('/settings')} />}
    />
  );
}

export function DemoNotice() {
  return <Banner kind="demo" title="Données de démonstration" text="Démo / Échantillon : chiffres fictifs tant qu’aucune base réelle n’est branchée. Ne pas utiliser pour décider." />;
}

/** Histogramme simple (barres en View, sans dépendance). */
export function Bars({ data, format, color }: { data: { label: string; value: number }[]; format: (n: number) => string; color?: string }) {
  const t = useTheme();
  const max = Math.max(1, ...data.map((d) => Math.abs(d.value)));
  const c = color ?? t.primary;
  return (
    <View accessibilityRole="image" accessibilityLabel={`Histogramme : ${data.map((d) => `${d.label} ${format(d.value)}`).join(', ')}`}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 4 }}>
        {data.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
            <View style={{ width: '100%', height: `${Math.max(3, (Math.abs(d.value) / max) * 100)}%`, backgroundColor: d.value < 0 ? t.danger : i === data.length - 1 ? c : alpha(c, 0.55), borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
        {data.map((d, i) => (
          <T key={i} v="caption" muted center style={{ flex: 1 }}>
            {d.label}
          </T>
        ))}
      </View>
    </View>
  );
}

export function KV({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <Row style={{ justifyContent: 'space-between', paddingVertical: 4 }}>
      <T v="small" muted style={{ flex: 1 }}>
        {k}
      </T>
      <T v="small" style={{ fontWeight: strong ? '800' : '600', textAlign: 'right', flexShrink: 1 }}>
        {v}
      </T>
    </Row>
  );
}

export function statusColor(t: ReturnType<typeof useTheme>, s: string): string {
  if (['clôturé', 'terminée', 'validé', 'validée', 'actif', 'résolu'].includes(s)) return t.success;
  if (['en cours', 'assigné', 'confirmée', 'travaux'].includes(s)) return t.info;
  if (['escaladé', 'critique', 'élevé'].includes(s)) return t.danger;
  if (['haute', 'pause', 'moyen'].includes(s)) return t.warning;
  return t.textMuted;
}
