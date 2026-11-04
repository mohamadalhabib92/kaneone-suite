import React from 'react';
import { View, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/kit/theme';
import { Badge, Banner, Button, Card, Chip, Row, Screen, Section, T, ToggleRow, useToast, Ionicons, type IconName } from '@/kit/ui';
import { isConfigured, maskValue } from '@/kit/config';
import { CONFIG, DECISIONS, FLAGS, dbReady } from '@/config';
import { ROLES, can, roleLabel, store } from '@/state';
import { BackHeader } from '@/components/common';
import { haptic, setHapticsEnabled, useHapticsEnabled } from '@/kit/haptics';

export default function Settings() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const vibrations = useHapticsEnabled();
  const s = store.use();
  const missing = CONFIG.filter((c) => !isConfigured(c.value));
  const confirmReset = () => {
    const ok = Platform.OS === 'web' ? (globalThis as { confirm?: (m: string) => boolean }).confirm?.('Réinitialiser toutes les données de démo ?') ?? true : true;
    if (!ok) return;
    store.reset().then((done) => {
      if (!done) {
        toast('Réinitialisation impossible tant que les données locales ne sont pas chargées.', 'error');
        return;
      }
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
            value={s.mode === 'real' && dbReady()}
            disabled={!dbReady()}
            onChange={(v) => store.set((x) => ({ ...x, mode: v ? 'real' : 'demo' }))}
          />
        </Card>
      </Section>
      <Section title="Apparence">
        <Row wrap gap={6}>
          <Chip label="Système" selected={(s.appearance ?? 'system') === 'system'} onPress={() => store.set((x) => ({ ...x, appearance: 'system' }))} />
          <Chip label="Sombre" selected={s.appearance === 'dark'} onPress={() => store.set((x) => ({ ...x, appearance: 'dark' }))} />
          <Chip label="Clair" selected={s.appearance === 'light'} onPress={() => store.set((x) => ({ ...x, appearance: 'light' }))} />
        </Row>
      </Section>
      <Section title="Confort et accessibilité">
        <Card>
          <ToggleRow
            label="Vibrations"
            sub="Retour tactile lors des validations et des actions."
            value={vibrations}
            onChange={(on) => {
              setHapticsEnabled(on);
              if (on) haptic.select();
            }}
          />
        </Card>
      </Section>
      <Section title="Densité">
        <Row wrap gap={6}>
          <Chip label="Confortable" selected={(s.density ?? 'comfortable') === 'comfortable'} onPress={() => store.set((x) => ({ ...x, density: 'comfortable' }))} />
          <Chip label="Compacte" selected={s.density === 'compact'} onPress={() => store.set((x) => ({ ...x, density: 'compact' }))} />
        </Row>
      </Section>
      {can(s.role, 'admin') ? (
        <Section title="Configuration">
          {missing.length ? <Banner kind="warning" title="Configuration manquante" text={`${missing.length} variable(s) à renseigner dans .env (voir README). L’application reste utilisable en démo locale. Réservé à l’administrateur.`} /> : null}
          <Card>
            {CONFIG.map((c) => (
              <View key={c.name} style={{ paddingVertical: 6, gap: 2 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T v="mono" style={{ flex: 1 }}>
                    {c.name}
                  </T>
                  {c.phase && !isConfigured(c.value) ? <Badge label={c.phase} /> : <Badge label={isConfigured(c.value) ? 'OK' : 'manquant'} color={isConfigured(c.value) ? t.success : t.warning} />}
                </Row>
                <T v="caption" muted>
                  {maskValue(c)} — {c.note}
                </T>
              </View>
            ))}
            {Object.entries(FLAGS).map(([name, on]) => (
              <Row key={name} style={{ paddingVertical: 6, justifyContent: 'space-between' }}>
                <T v="mono">{name}</T>
                <Badge label={on ? 'actif' : 'désactivé'} color={on ? t.warning : t.success} />
              </Row>
            ))}
          </Card>
          <Card>
            <T style={{ fontWeight: '700' }}>Décisions — à valider</T>
            {DECISIONS.map((d) => (
              <View key={d.name} style={{ paddingVertical: 4 }}>
                <T v="mono">{d.name}</T>
                <T v="caption" muted>
                  {d.note}
                </T>
              </View>
            ))}
          </Card>
        </Section>
      ) : (
        <Banner kind="info" title="Configuration réservée à l’administrateur" text="Le détail des variables et des décisions n’est pas affiché pour ce rôle. L’application reste en mode démo local." />
      )}
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
          <T v="small">• Les assistants IA, la synchro bancaire, la signature et les notifications push sont désactivés (Phase 2, côté serveur pour l’IA).</T>
          <T v="small">• Données de démo stockées uniquement sur cet appareil. Support : YOUR_SUPPORT_EMAIL — à renseigner.</T>
          <T v="small">• Politique de confidentialité et conditions d’utilisation : à valider (nLPD). Cette version n’envoie aucune donnée.</T>
        </Card>
      </Section>
      <Button title="Réinitialiser les données de démo" icon="refresh" kind="danger" onPress={confirmReset} />
    </Screen>
  );
}
