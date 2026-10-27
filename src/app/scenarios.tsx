import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/kit/theme';
import { Badge, Button, Card, Ionicons, Progress, Row, Screen, T, useToast } from '@/kit/ui';
import { roleLabel, store } from '@/state';
import { SCENARIOS, scenarioProgress } from '@/lib/scenarios';
import { BackHeader, DemoNotice } from '@/components/common';

export default function Scenarios() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const s = store.use();
  const runNext = (id: string) => {
    const sc = SCENARIOS.find((x) => x.id === id)!;
    if (store.get().role !== sc.role) store.set((x) => ({ ...x, role: sc.role }));
    const step = sc.steps.find((st) => !st.done(store.get()));
    if (!step) return;
    try {
      step.run();
      toast(step.label, 'success');
    } catch {
      toast('Étape impossible dans l’état actuel — réinitialisez les données de démo.', 'error');
    }
  };
  const passed = SCENARIOS.filter((x) => scenarioProgress(x, s).passed).length;
  return (
    <Screen header={<BackHeader title="Scénarios de démonstration" subtitle={`${passed}/${SCENARIOS.length} validés`} />}>
      <DemoNotice />
      <T v="small" muted>
        Chaque scénario s’exécute pas à pas avec le rôle indiqué (le rôle actif est changé automatiquement). Les actions modifient les données locales de démo.
      </T>
      {SCENARIOS.map((sc) => {
        const pr = scenarioProgress(sc, s);
        return (
          <Card key={sc.id} accent={pr.passed ? t.success : undefined}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T v="h3" style={{ flex: 1 }}>
                {sc.n}. {sc.title}
              </T>
              <Badge label={pr.passed ? 'Validé' : `${pr.done}/${pr.total}`} color={pr.passed ? t.success : undefined} />
            </Row>
            <T v="small" muted>
              {sc.summary}
            </T>
            <T v="caption" muted>
              Rôle : {roleLabel(sc.role)}
            </T>
            <Progress value={pr.done / pr.total} color={pr.passed ? t.success : t.primary} />
            {sc.steps.map((st, i) => {
              const d = st.done(s);
              return (
                <Row key={i} style={{ paddingVertical: 2 }}>
                  <Ionicons name={d ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={d ? t.success : t.textMuted} />
                  <View style={{ flex: 1 }}>
                    <T v="small" muted={!d}>
                      {st.label}
                    </T>
                  </View>
                </Row>
              );
            })}
            {pr.passed ? <T v="small" color={t.success}>Résultat : {sc.result}</T> : null}
            <Row wrap>
              {!pr.passed ? <Button small title="Étape suivante" icon="play" onPress={() => runNext(sc.id)} /> : null}
              <Button small kind="ghost" title="Voir le module" icon="open" onPress={() => router.push(sc.link as never)} />
            </Row>
          </Card>
        );
      })}
    </Screen>
  );
}
