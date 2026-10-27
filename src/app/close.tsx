import React from 'react';
import { View } from 'react-native';
import { useTheme, alpha } from '@/kit/theme';
import { Badge, Banner, Button, Card, Ionicons, Progress, Row, Screen, Section, T, useToast } from '@/kit/ui';
import { fmtDateTime } from '@/kit/format';
import { exportText, toCSV } from '@/kit/files';
import { buildLiasse } from '@/lib/finance';
import { CLOSE_STEPS, can, closePeriod, closeStep, store } from '@/state';
import { BackHeader, DemoNotice, NeedPerm } from '@/components/common';
import { LiasseTable } from './(tabs)/finance';

export function exportLiasse(period: string) {
  const { lines, total } = buildLiasse(store.get().entries, period);
  return exportText(
    `kaneone-liasse-${period}-demo.csv`,
    toCSV([
      [`# Liasse de consolidation ${period} — IFRS — EUR — DONNÉES DE DÉMONSTRATION (Démo / Échantillon)`],
      ['Entité', 'Pays', 'Détention %', 'CA (EUR)', 'Charges (EUR)', 'EBITDA (EUR)', 'Quote-part groupe (EUR)'],
      ...[...lines, total].map((l) => [l.name, l.country, l.ownership, Math.round(l.revenue), Math.round(l.charges), Math.round(l.ebitda), Math.round(l.share)]),
    ]),
    'text/csv',
  );
}

export default function CloseScreen() {
  const t = useTheme();
  const toast = useToast();
  const s = store.use();
  const period = closePeriod();
  const c = s.closes[period];
  const step = c?.step ?? 0;
  const ok = can(s.role, 'finance.close');
  const pending = s.entries.filter((e) => e.period === period && e.status === 'brouillon').length;
  const interco = s.entries.filter((e) => e.period === period && e.interco).length;
  const run = async (i: number) => {
    if (i === 5) await exportLiasse(period);
    closeStep(period, i);
    toast(i === 5 ? `Période ${period} verrouillée` : `Étape ${i + 1} terminée`, 'success');
  };
  return (
    <Screen header={<BackHeader title={`Clôture ${period}`} subtitle="Clôture mensuelle guidée — rôle CFO" />}>
      <DemoNotice />
      <NeedPerm perm="finance.close" what="exécuter la clôture (réservée au CFO)" />
      <Progress value={step / CLOSE_STEPS.length} />
      {c?.lockedAt ? <Banner kind="success" title="Période verrouillée" text={`Clôture terminée le ${fmtDateTime(c.lockedAt)}. La liasse est partagée dans le Portail.`} /> : null}
      {CLOSE_STEPS.map((st, i) => {
        const done = step > i;
        const current = step === i && !c?.lockedAt;
        const detail = i === 0 ? `${pending} écriture(s) en brouillon` : i === 1 ? `${interco} écriture(s) intragroupe` : st.sub;
        return (
          <Card key={st.key} accent={current ? t.primary : undefined}>
            <Row>
              <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? alpha(t.success, 0.2) : t.surface2 }}>
                {done ? <Ionicons name="checkmark" size={18} color={t.success} /> : <T style={{ fontWeight: '800' }}>{i + 1}</T>}
              </View>
              <View style={{ flex: 1 }}>
                <T style={{ fontWeight: '700' }}>{st.label}</T>
                <T v="small" muted>
                  {done ? st.sub : detail}
                </T>
              </View>
              {done ? <Badge label="Fait" color={t.success} /> : null}
            </Row>
            {current ? (
              <Button
                title={i === 5 ? 'Exporter la liasse (CSV) et verrouiller' : 'Exécuter cette étape'}
                icon={i === 5 ? 'lock-closed' : 'play'}
                disabled={!ok}
                onPress={() => run(i)}
                style={{ marginTop: 8 }}
              />
            ) : null}
          </Card>
        );
      })}
      {step >= 4 ? (
        <Section title="Liasse">
          <LiasseTable period={period} />
          <Button small kind="secondary" icon="download" title="Télécharger la liasse (CSV)" onPress={() => exportLiasse(period).then(() => toast('Liasse exportée', 'success'))} />
        </Section>
      ) : null}
      {c?.log.length ? (
        <Section title="Journal de clôture">
          <Card>
            {c.log.map((h, i) => (
              <T key={i} v="small">
                {fmtDateTime(h.at)} — {h.text} ({h.by})
              </T>
            ))}
          </Card>
        </Section>
      ) : null}
    </Screen>
  );
}
