import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/kit/theme';
import { Badge, Button, Card, Chip, EmptyState, Field, Row, Screen, Section, T, useToast } from '@/kit/ui';
import { fmtDateTime } from '@/kit/format';
import { PEOPLE, equipmentOf, personOf, siteOf } from '@/data/demo';
import { assignWO, can, closeWO, escalateWO, resolveWO, slaState, startWO, store } from '@/state';
import { BackHeader, DemoNotice, KV, NeedPerm, statusColor } from '@/components/common';

export default function WOScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const toast = useToast();
  const s = store.use();
  const w = s.wos.find((x) => x.id === id);
  const [note, setNote] = useState('');
  const [esc, setEsc] = useState(false);
  if (!w) {
    return (
      <Screen header={<BackHeader title="Ordre de travail" />}>
        <EmptyState icon="alert-circle" title="OT introuvable" />
      </Screen>
    );
  }
  const edit = can(s.role, 'wo.manage');
  const sla = slaState(w);
  const techs = PEOPLE.filter((p) => p.role === 'ops');
  return (
    <Screen header={<BackHeader title={w.ref} subtitle={w.title} />}>
      <DemoNotice />
      <Row wrap gap={6}>
        <Badge label={w.status} color={statusColor(t, w.status)} />
        <Badge label={`Priorité ${w.priority}`} />
        <Badge label={sla.label} color={sla.late ? t.danger : t.success} icon="timer" />
      </Row>
      <Card>
        <KV k="Site" v={`${siteOf(w.siteId)?.name} — ${siteOf(w.siteId)?.city}`} />
        <KV k="Équipement" v={equipmentOf(w.equipmentId)?.name ?? '—'} />
        <KV k="Type" v={w.kind} />
        <KV k="Créé le" v={fmtDateTime(w.createdAt)} />
        <KV k="Échéance SLA" v={fmtDateTime(w.dueAt)} />
        <KV k="Assigné à" v={personOf(w.assignee)?.name ?? 'Non assigné'} />
        {w.escalatedTo ? <KV k="Escaladé à" v={w.escalatedTo} /> : null}
      </Card>
      <NeedPerm perm="wo.manage" what="traiter cet OT" />
      {edit && w.status !== 'clôturé' ? (
        <Card style={{ gap: 10 }}>
          {w.status === 'nouveau' || w.status === 'escaladé' ? (
            <>
              <T v="h3">Assigner</T>
              <Row wrap gap={6}>
                {techs.map((p) => (
                  <Chip key={p.id} label={p.name} icon="person" selected={w.assignee === p.id} onPress={() => assignWO(w.id, p.id, p.name)} />
                ))}
              </Row>
            </>
          ) : null}
          <Row wrap>
            {w.status === 'assigné' ? <Button title="Démarrer l’intervention" icon="play" onPress={() => startWO(w.id)} /> : null}
            {w.status !== 'résolu' && w.status !== 'escaladé' ? <Button title="Escalader" icon="arrow-up" kind="secondary" onPress={() => setEsc(true)} /> : null}
            {w.status === 'résolu' ? (
              <Button
                title="Clôturer l’OT"
                icon="lock-closed"
                kind="success"
                onPress={() => {
                  closeWO(w.id);
                  toast('OT clôturé', 'success');
                }}
              />
            ) : null}
          </Row>
          {esc ? (
            <Row wrap>
              {['Responsable maintenance groupe', 'Prestataire externe', 'Direction site'].map((x) => (
                <Chip
                  key={x}
                  label={x}
                  onPress={() => {
                    escalateWO(w.id, x, note.trim() || 'besoin d’expertise');
                    setEsc(false);
                    toast('OT escaladé', 'info');
                  }}
                />
              ))}
            </Row>
          ) : null}
          {w.status === 'en cours' || w.status === 'assigné' ? (
            <>
              <Field label="Note d’intervention" value={note} onChangeText={setNote} placeholder="Travaux réalisés…" multiline />
              <Button
                title="Marquer résolu"
                icon="checkmark"
                kind="success"
                onPress={() => {
                  resolveWO(w.id, note.trim() || 'Intervention réalisée');
                  setNote('');
                  toast('OT résolu', 'success');
                }}
              />
            </>
          ) : null}
        </Card>
      ) : null}
      <Section title="Historique">
        <Card>
          {w.history.map((h, i) => (
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
