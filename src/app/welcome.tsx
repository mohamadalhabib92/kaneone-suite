import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, alpha } from '@/kit/theme';
import { Banner, Card, DemoBadge, Ionicons, Row, Screen, T, type IconName } from '@/kit/ui';
import { ROLES, store } from '@/state';
import { dbReady } from '@/config';

export default function Welcome() {
  const t = useTheme();
  const router = useRouter();
  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: 8, paddingTop: 24 }}>
        <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: alpha(t.primary, 0.14), borderWidth: 2, borderColor: t.primary, alignItems: 'center', justifyContent: 'center' }}>
          <T v="h1" color={t.text}>
            K1
          </T>
        </View>
        <T v="display" center>
          KaneOne Suite
        </T>
        <T muted center>
          OS family-office & multi-holding — pilotage, actifs, mobilité, finance, dossier.
        </T>
        <DemoBadge label="Mode démo — données d’échantillon" />
      </View>
      {!dbReady() ? (
        <Banner
          kind="info"
          title="Connexion non configurée"
          text="Authentification et base de données (Supabase + RLS) non branchées : l’app fonctionne entièrement sur cet appareil avec des données de démonstration. Choisissez un rôle pour explorer."
        />
      ) : null}
      <T v="label" muted>
        Entrer avec le rôle…
      </T>
      {ROLES.map((r) => (
        <Card
          key={r.id}
          a11y={`Entrer en tant que ${r.label}`}
          onPress={() => {
            store.set((s) => ({ ...s, role: r.id }));
            router.replace(r.id === 'portail' ? '/portail' : '/pilotage');
          }}
        >
          <Row>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={r.icon as IconName} size={22} color={t.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <T style={{ fontWeight: '700' }}>{r.label}</T>
              <T v="small" muted>
                {r.sub}
              </T>
            </View>
            <Ionicons name="chevron-forward" size={18} color={t.textMuted} />
          </Row>
        </Card>
      ))}
      <T v="small" muted center>
        Démo : le choix du rôle remplace la connexion. En production, le rôle provient du compte (politiques RLS).
      </T>
    </Screen>
  );
}
