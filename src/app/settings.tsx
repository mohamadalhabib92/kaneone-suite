import React from 'react';
import { View, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/kit/theme';
import { Badge, Banner, Button, Card, Chip, Row, Screen, Section, T, ToggleRow, useToast, Ionicons, type IconName } from '@/kit/ui';
import { isConfigured, maskValue } from '@/kit/config';
import { CONFIG, dbReady } from '@/config';
import { ROLES, can, roleLabel, store } from '@/state';
import { BackHeader } from '@/components/common';

export default function Settings() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const s = store.use();
  const missing = CONFIG.filter((c) => !isConfigured(c.value));
  const confirmReset = () => {
    const ok = Platform.OS === 'web' ? (globalThis as { confirm?: (m: string) => boolean }).confirm?.('Réinitialiser toutes les données de démo ?') ?? true : true;
    if (!ok) return;
    store.reset().then(() => {
      toast('Données de démo réinitialisées', 'success');
      router.replace('/welcome');
    });
  };
  return (
    <Screen header={<BackHeader title="Paramètres" />}>
      <Section title="Rôle actif (démo)">
        <T v="small" muted>
          En démonstration, le rôle remplace l’authentification. Rôle actuel : {roleLabel(s.role)}.
        </T>
        <Row wrap gap={6}>
          {ROLES.map((r) => (
            <Chip key={r.id} label={r.label} icon={r.icon as IconName} selected={s.role === r.id} onPress={() => store.set((x) => ({ ...x, role: r.id }))} />
          ))}
        </Row>
      </Section>
      <Section title="Mode">
        <Card>
          <ToggleRow
            label="Mode réel (base de données)"
            sub={dbReady() ? 'Connexion Supabase configurée — synchronisation : Phase 2.' : 'Désactivé : configuration Supabase manquante.'}
            value={s.mode === 'real'}
            disabled={!dbReady()}
            onChange={(v) => store.set((x) => ({ ...x, mode: v ? 'real' : 'demo' }))}
          />
        </Card>
      </Section>
      <Section title="Configuration">
        {missing.length ? <Banner kind="warning" title="Configuration manquante" text={`${missing.length} variable(s) à renseigner dans .env (voir README). L’application reste utilisable en démo locale.`} /> : null}
        <Card>
          {CONFIG.map((c) => (
            <View key={c.name} style={{ paddingVertical: 6, gap: 2 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <T v="mono" style={{ flex: 1 }}>
                  {c.name}
                </T>
                {c.phase ? <Badge label={c.phase} /> : <Badge label={isConfigured(c.value) ? 'OK' : 'manquant'} color={isConfigured(c.value) ? t.success : t.warning} />}
              </Row>
              <T v="caption" muted>
                {maskValue(c)} — {c.note}
              </T>
            </View>
          ))}
        </Card>
      </Section>
      {can(s.role, 'admin') ? (
        <Section title="Accès portail (démo)">
          <Card>
            {s.portalUsers.map((u) => (
              <Row key={u.id} style={{ paddingVertical: 6 }}>
                <Ionicons name={u.kind === 'famille' ? 'home' : 'briefcase'} size={20} color={t.primary} />
                <View style={{ flex: 1 }}>
                  <T style={{ fontWeight: '600' }}>{u.name}</T>
                  <T v="caption" muted>
                    {u.access.join(' · ')}
                  </T>
                </View>
              </Row>
            ))}
          </Card>
        </Section>
      ) : null}
      <Section title="Sécurité">
        <Card>
          <T v="small">• Aucune clé secrète n’est embarquée : seules des variables publiques EXPO_PUBLIC_* sont lues.</T>
          <T v="small">• En production, l’isolation des données par rôle doit être assurée côté base (politiques RLS), pas seulement dans l’interface.</T>
          <T v="small">• Les assistants IA (OpenAI) sont prévus en Phase 2, côté serveur uniquement.</T>
          <T v="small">• Données de démo stockées uniquement sur cet appareil.</T>
        </Card>
      </Section>
      <Button title="Réinitialiser les données de démo" icon="refresh" kind="danger" onPress={confirmReset} />
    </Screen>
  );
}
