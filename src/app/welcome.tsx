import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, alpha } from '@/kit/theme';
import { useReduceTransparency } from '@/kit/a11y';
import { glassPaint } from '@/kit/verre';
import { Banner, Card, DemoBadge, Ionicons, Row, Screen, T, type IconName } from '@/kit/ui';
import { ROLES, store } from '@/state';
import { dbReady } from '@/config';
import { FadeIn, Pop } from '@/kit/premium';

export default function Welcome() {
  const t = useTheme();
  const router = useRouter();
  const mark = glassPaint(t, useReduceTransparency());
  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: 8, paddingTop: 24 }}>
        <Pop>
          <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: alpha(t.primary, 0.14), borderWidth: 1, borderColor: mark.borderColor, borderTopColor: mark.borderTopColor, borderTopWidth: 1, alignItems: 'center', justifyContent: 'center' }}>
            <T v="h1" color={t.text}>
              K1
            </T>
          </View>
        </Pop>
        <T v="display" center accessibilityRole="header">
          KaneOne Suite
        </T>
        <T muted center>
          OS family-office & multi-holding — pilotage, actifs, mobilité, finance, dossier.
        </T>
        <DemoBadge label="Données d’exemple" />
      </View>
      {!dbReady() ? (
        <Banner
          kind="info"
          title="Connexion non configurée"
          text="Authentification et base de données non branchées : l’app fonctionne sur cet appareil avec des données d’exemple. Choisissez un rôle pour entrer."
        />
      ) : null}
      <T v="label" muted>
        Entrer avec le rôle…
      </T>
      {ROLES.map((r, i) => (
        <FadeIn key={r.id} index={i}>
        <Card
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
        </FadeIn>
      ))}
      <T v="small" muted center>
        Le rôle choisi ouvre les écrans. Avec un compte, il viendra du compte.
      </T>
    </Screen>
  );
}
