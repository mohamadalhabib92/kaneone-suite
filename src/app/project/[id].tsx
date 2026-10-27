import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/kit/theme';
import { Badge, Button, Card, Chip, EmptyState, Field, Ionicons, Progress, Row, Screen, Section, T, useToast } from '@/kit/ui';
import { fmtCompactEUR, fmtDate, fmtDateTime, isoDay } from '@/kit/format';
import { uid } from '@/kit/store';
import { siteOf, spvOf } from '@/data/demo';
import { DAY_MS, advancePhase, can, store, updateProject } from '@/state';
import { BackHeader, DemoNotice, KV, NeedPerm } from '@/components/common';

type Level = 'faible' | 'moyen' | 'élevé';

export default function ProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const s = store.use();
  const p = s.projects.find((x) => x.id === id);
  const [ms, setMs] = useState('');
  const [risk, setRisk] = useState('');
  const [level, setLevel] = useState<Level>('moyen');
  const [spend, setSpend] = useState('');
  if (!p) {
    return (
      <Screen header={<BackHeader title="Projet" />}>
        <EmptyState icon="alert-circle" title="Projet introuvable" />
      </Screen>
    );
  }
  const edit = can(s.role, 'immo.manage');
  const site = siteOf(p.siteId);
  const cur = p.phases.findIndex((x) => x.status === 'en cours');
  const lc = (l: Level) => (l === 'élevé' ? t.danger : l === 'moyen' ? t.warning : t.success);
  return (
    <Screen header={<BackHeader title={p.name} subtitle={`${site?.name ?? ''} · ${spvOf(p.spvId)?.name ?? ''}`} />}>
      <DemoNotice />
      <Card>
        <KV k="Budget" v={fmtCompactEUR(p.budgetK * 1000)} />
        <KV k="Engagé" v={fmtCompactEUR(p.spentK * 1000)} strong />
        <Progress value={p.budgetK ? p.spentK / p.budgetK : 0} color={p.spentK > p.budgetK ? t.danger : t.primary} />
        <KV k="SPV" v={spvOf(p.spvId)?.name ?? '—'} />
      </Card>
      <Row wrap>
        <Button small kind="ghost" icon="location" title="Site" onPress={() => router.push(`/site/${p.siteId}`)} />
      </Row>
      <NeedPerm perm="immo.manage" what="modifier ce projet" />
      <Section title="Phases">
        <Card>
          {p.phases.map((ph, i) => (
            <Row key={i} style={{ paddingVertical: 5 }}>
              <Ionicons name={ph.status === 'terminée' ? 'checkmark-circle' : ph.status === 'en cours' ? 'radio-button-on' : 'ellipse-outline'} size={20} color={ph.status === 'terminée' ? t.success : ph.status === 'en cours' ? t.primary : t.textMuted} />
              <T style={{ flex: 1, fontWeight: ph.status === 'en cours' ? '700' : '400' }}>{ph.name}</T>
              <T v="caption" muted>
                {ph.status}
              </T>
            </Row>
          ))}
          {edit && cur >= 0 ? (
            <Button
              title={cur === p.phases.length - 1 ? 'Marquer livré' : `Terminer « ${p.phases[cur].name} »`}
              icon="arrow-forward"
              onPress={() => {
                advancePhase(p.id);
                toast('Phase mise à jour', 'success');
              }}
              style={{ marginTop: 8 }}
            />
          ) : null}
        </Card>
      </Section>
      {edit ? (
        <Card style={{ gap: 8 }}>
          <Field label="Ajouter une dépense engagée (k€)" value={spend} onChangeText={setSpend} keyboardType="number-pad" />
          <Button
            small
            kind="secondary"
            title="Enregistrer"
            disabled={!(Number(spend) > 0)}
            onPress={() => {
              updateProject(p.id, (x) => ({ ...x, spentK: x.spentK + Number(spend) }), `Dépense +${spend} k€`);
              setSpend('');
            }}
          />
        </Card>
      ) : null}
      <Section title="Jalons">
        <Card>
          {p.milestones.length === 0 ? <T v="small" muted>Aucun jalon.</T> : null}
          {p.milestones.map((m) => (
            <Row key={m.id} style={{ paddingVertical: 5 }}>
              <Chip
                label={m.done ? 'Fait' : 'À faire'}
                selected={m.done}
                icon={m.done ? 'checkmark' : 'time'}
                onPress={edit ? () => updateProject(p.id, (x) => ({ ...x, milestones: x.milestones.map((y) => (y.id === m.id ? { ...y, done: !y.done } : y)) }), `Jalon « ${m.title} » ${m.done ? 'rouvert' : 'atteint'}`) : undefined}
              />
              <View style={{ flex: 1 }}>
                <T style={{ fontWeight: '600' }}>{m.title}</T>
                <T v="caption" color={!m.done && m.due < isoDay(new Date()) ? t.danger : t.textMuted}>
                  Échéance {fmtDate(m.due)}
                </T>
              </View>
            </Row>
          ))}
          {edit ? (
            <Row>
              <View style={{ flex: 1 }}>
                <Field label="Nouveau jalon (échéance J+30)" value={ms} onChangeText={setMs} />
              </View>
              <Button
                small
                title="Ajouter"
                disabled={!ms.trim()}
                onPress={() => {
                  updateProject(p.id, (x) => ({ ...x, milestones: [...x.milestones, { id: uid('ms'), title: ms.trim(), due: isoDay(new Date(Date.now() + 30 * DAY_MS)), done: false }] }), `Jalon ajouté : ${ms.trim()}`);
                  setMs('');
                }}
              />
            </Row>
          ) : null}
        </Card>
      </Section>
      <Section title="Risques">
        <Card>
          {p.risks.length === 0 ? <T v="small" muted>Aucun risque identifié.</T> : null}
          {p.risks.map((r) => (
            <View key={r.id} style={{ paddingVertical: 5 }}>
              <Row>
                <Badge label={r.level} color={lc(r.level)} />
                <T style={{ fontWeight: '600', flex: 1 }}>{r.title}</T>
              </Row>
              <T v="small" muted>
                Mitigation : {r.mitigation || '—'}
              </T>
            </View>
          ))}
          {edit ? (
            <>
              <Field label="Nouveau risque" value={risk} onChangeText={setRisk} />
              <Row wrap gap={6}>
                {(['faible', 'moyen', 'élevé'] as Level[]).map((l) => (
                  <Chip key={l} label={l} selected={level === l} onPress={() => setLevel(l)} />
                ))}
                <Button
                  small
                  title="Ajouter"
                  disabled={!risk.trim()}
                  onPress={() => {
                    updateProject(p.id, (x) => ({ ...x, risks: [...x.risks, { id: uid('rk'), title: risk.trim(), level, mitigation: 'À définir' }] }), `Risque ajouté : ${risk.trim()}`);
                    setRisk('');
                  }}
                />
              </Row>
            </>
          ) : null}
        </Card>
      </Section>
      <Section title="Historique">
        <Card>
          {p.history.map((h, i) => (
            <T key={i} v="small">
              {fmtDateTime(h.at)} — {h.text} ({h.by})
            </T>
          ))}
        </Card>
      </Section>
    </Screen>
  );
}
