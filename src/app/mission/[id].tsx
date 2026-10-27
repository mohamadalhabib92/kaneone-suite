import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/kit/theme';
import { Badge, Button, Card, EmptyState, Field, Row, Screen, Section, T, useToast } from '@/kit/ui';
import { fmtDate, fmtDateTime } from '@/kit/format';
import { baseOf, categoryOf, countryOf, vehicleOf } from '@/data/demo';
import { MISSION_FLOW, can, missionConflicts, store, updateMission } from '@/state';
import { BackHeader, DemoNotice, NeedPerm, statusColor } from '@/components/common';

export default function MissionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const toast = useToast();
  const s = store.use();
  const m = s.missions.find((x) => x.id === id);
  const [report, setReport] = useState('');
  if (!m) {
    return (
      <Screen header={<BackHeader title="Mission" />}>
        <EmptyState icon="alert-circle" title="Mission introuvable" />
      </Screen>
    );
  }
  const edit = can(s.role, 'mission.manage');
  const conflicts = missionConflicts(s.missions)[m.id];
  const idx = MISSION_FLOW.indexOf(m.status);
  const next = idx >= 0 && idx < MISSION_FLOW.length - 1 ? MISSION_FLOW[idx + 1] : null;
  return (
    <Screen header={<BackHeader title={m.ref} subtitle={m.title} />}>
      <DemoNotice />
      <Row wrap gap={6}>
        <Badge label={m.status} color={statusColor(t, m.status)} />
        <Badge label={categoryOf(m.categoryId).label} />
        <Badge label={`${m.pax} pax`} />
      </Row>
      {conflicts ? <Badge label={`Conflit : ${conflicts.map((v) => vehicleOf(v)?.label).join(', ')} déjà engagé le même jour`} color={t.danger} icon="warning" /> : null}
      <T v="small" muted>
        {m.client}
      </T>
      <Section title={`Itinéraire — ${m.legs.length} étape(s)`}>
        {m.legs.map((l, i) => {
          const b = baseOf(l.baseId);
          return (
            <Card key={i}>
              <Row style={{ justifyContent: 'space-between' }}>
                <T style={{ fontWeight: '700' }}>
                  {i + 1}. {fmtDate(l.date)}
                </T>
                <T v="small" muted>
                  {b ? `${countryOf(b.countryId).flag} ${b.name}` : ''}
                </T>
              </Row>
              <T>
                {l.from} → {l.to}
              </T>
              <T v="small" muted>
                {l.vehicleIds.map((v) => vehicleOf(v)?.label).join(' · ')}
              </T>
            </Card>
          );
        })}
      </Section>
      <NeedPerm perm="mission.manage" what="modifier le statut d’une mission" />
      {edit && m.status !== 'terminée' && m.status !== 'annulée' ? (
        <Card style={{ gap: 10 }}>
          {next === 'terminée' ? <Field label="Rapport de mission" value={report} onChangeText={setReport} multiline placeholder="Déroulé, incidents, durée…" /> : null}
          <Row wrap>
            {next ? (
              <Button
                title={next === 'confirmée' ? 'Confirmer' : next === 'en cours' ? 'Démarrer' : 'Terminer'}
                icon="arrow-forward"
                kind={next === 'terminée' ? 'success' : 'primary'}
                disabled={next === 'confirmée' && !!conflicts}
                onPress={() => {
                  updateMission(m.id, { status: next, report: next === 'terminée' ? report.trim() || 'RAS' : m.report }, `Statut → ${next}`);
                  toast(`Mission ${next}`, 'success');
                }}
              />
            ) : null}
            <Button title="Annuler la mission" kind="danger" icon="close" onPress={() => updateMission(m.id, { status: 'annulée' }, 'Mission annulée')} />
          </Row>
          {next === 'confirmée' && conflicts ? <T v="small" color={t.danger}>Résolvez le conflit de véhicule avant de confirmer.</T> : null}
        </Card>
      ) : null}
      {m.report ? (
        <Section title="Rapport">
          <Card>
            <T>{m.report}</T>
          </Card>
        </Section>
      ) : null}
      <Section title="Historique">
        <Card>
          {m.history.map((h, i) => (
            <View key={i} style={{ paddingVertical: 4 }}>
              <T v="small" style={{ fontWeight: '600' }}>
                {h.text}
              </T>
              <T v="caption" muted>
                {fmtDateTime(h.at)} · {h.by}
              </T>
            </View>
          ))}
        </Card>
      </Section>
    </Screen>
  );
}
