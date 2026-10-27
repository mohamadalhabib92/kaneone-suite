import React from 'react';
import { useRouter } from 'expo-router';
import { Card, ListItem, Screen, T } from '@/kit/ui';
import { can, store } from '@/state';
import { TabHeader } from '@/components/common';
import { SCENARIOS, scenarioProgress } from '@/lib/scenarios';

export default function Plus() {
  const router = useRouter();
  const s = store.use();
  const internal = can(s.role, 'internal');
  const passed = SCENARIOS.filter((x) => scenarioProgress(x, s).passed).length;
  return (
    <Screen header={<TabHeader title="Plus" subtitle="Modules et réglages" />}>
      {internal ? (
        <Card style={{ paddingVertical: 4 }}>
          <ListItem icon="construct" title="GMAO" sub="Ordres de travail, inventaire, préventif, SLA" onPress={() => router.push('/gmao')} />
          <ListItem icon="business" title="Kane Immo" sub="Projets, phases, budget, jalons, risques" onPress={() => router.push('/immo')} />
          <ListItem icon="lock-closed" title="Clôture mensuelle" sub="Guidée, 6 étapes (CFO)" onPress={() => router.push('/close')} />
          <ListItem icon="people" title="Portail famille & partenaires" sub="Aperçu de la vue externe" onPress={() => router.push('/portail')} />
          <ListItem icon="play-circle" title="Scénarios de démonstration" sub={`${passed}/${SCENARIOS.length} validés`} onPress={() => router.push('/scenarios')} />
        </Card>
      ) : null}
      <Card style={{ paddingVertical: 4 }}>
        <ListItem icon="settings" title="Paramètres" sub="Rôle, configuration, données de démo" onPress={() => router.push('/settings')} />
      </Card>
      <T v="small" muted center>
        KaneOne Suite — démonstration locale. Aucune donnée n’est envoyée à un serveur.
      </T>
    </Screen>
  );
}
