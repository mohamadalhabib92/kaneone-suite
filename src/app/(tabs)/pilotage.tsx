import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/kit/theme';
import { Badge, Button, Card, Chip, ListItem, Progress, Row, Screen, Section, Stat, T, useToast } from '@/kit/ui';
import { fmtCompactEUR, fmtDateTime, fmtNumber } from '@/kit/format';
import { exportText, toCSV } from '@/kit/files';
import { COUNTRIES, GROUP, SEASONALITY, SITES, SITE_STATUS, countryOf, siteOf, type CountryId } from '@/data/demo';
import { monthlyEbitdaSeries } from '@/lib/finance';
import { SCENARIOS, scenarioProgress } from '@/lib/scenarios';
import { closePeriod, store } from '@/state';
import { Bars, DemoNotice, TabHeader, statusColor } from '@/components/common';

export default function Pilotage() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const s = store.use();
  const [country, setCountry] = useState<CountryId | 'all'>('all');
  const series = useMemo(() => monthlyEbitdaSeries(SEASONALITY), []);
  const sites = SITES.filter((x) => country === 'all' || x.countryId === country);
  const openWOs = s.wos.filter((w) => w.status !== 'clôturé');
  const critical = openWOs.filter((w) => w.priority === 'critique' || w.status === 'escaladé');
  const upcoming = s.missions.filter((m) => m.status === 'planifiée' || m.status === 'confirmée' || m.status === 'en cours');
  const recent = [...s.wos].sort((a, b) => (b.history.at(-1)?.at ?? 0) - (a.history.at(-1)?.at ?? 0)).slice(0, 5);
  const close = s.closes[closePeriod()];
  const passed = SCENARIOS.filter((sc) => scenarioProgress(sc, s).passed).length;

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ['# KaneOne Suite — Pilotage groupe — DONNÉES DE DÉMONSTRATION (Démo / Échantillon)'],
      ['Site', 'Ville', 'Pays', 'Statut', 'Effectif', 'CA 12 mois (k€)', 'EBITDA 12 mois (k€)'],
      ...SITES.map((x) => [x.name, x.city, countryOf(x.countryId).name, SITE_STATUS[x.status], x.headcount, x.revenueK, x.ebitdaK]),
      ['Total', '', '', `${GROUP.activeSites}/${GROUP.sites} actifs`, GROUP.headcount, SITES.reduce((a, x) => a + x.revenueK, 0), GROUP.ebitdaK],
    ];
    exportText('kaneone-pilotage-demo.csv', toCSV(rows), 'text/csv').then(() => toast('Export CSV prêt (démo)', 'success'));
  };

  return (
    <Screen header={<TabHeader title="Pilotage groupe" subtitle="Vue consolidée multi-holding" />}>
      <DemoNotice />
      <Row wrap gap={10}>
        <Stat label="EBITDA cumulé 12 mois" value={fmtCompactEUR(GROUP.ebitdaK * 1000)} sub="Démo / Échantillon" demo color={t.primary} />
        <Stat label="Sites actifs" value={`${GROUP.activeSites}/${GROUP.sites}`} sub={`${COUNTRIES.length} pays`} demo />
        <Stat label="Effectif" value={fmtNumber(GROUP.headcount)} sub="agrégat démo" demo />
        <Stat label="OT ouverts" value={String(openWOs.length)} sub={critical.length ? `${critical.length} critique(s)/escaladé(s)` : 'aucun critique'} color={critical.length ? t.danger : undefined} />
      </Row>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="h3">EBITDA mensuel — 12 mois glissants</T>
          <Badge label="Démo" color={t.accent} icon="flask" />
        </Row>
        <Bars data={series} format={(n) => fmtCompactEUR(n)} />
        <T v="small" muted>
          Total {fmtCompactEUR(series.reduce((a, d) => a + d.value, 0))} — répartition saisonnière illustrative.
        </T>
      </Card>

      <Section title="Sites par pays" action={<Button small kind="ghost" icon="download" title="CSV" onPress={exportCsv} />}>
        <Row wrap gap={6}>
          <Chip label="Tous" selected={country === 'all'} onPress={() => setCountry('all')} />
          {COUNTRIES.map((c) => (
            <Chip key={c.id} label={`${c.flag} ${c.name}`} selected={country === c.id} onPress={() => setCountry(c.id)} />
          ))}
        </Row>
        <Card style={{ paddingVertical: 4 }}>
          {sites.map((x) => (
            <ListItem
              key={x.id}
              title={x.name}
              sub={`${countryOf(x.countryId).flag} ${x.city} · ${x.activity} · ${x.headcount} pers.`}
              icon="location"
              iconColor={statusColor(t, x.status)}
              onPress={() => router.push(`/site/${x.id}`)}
              right={
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  <T v="small" style={{ fontWeight: '700' }} color={x.ebitdaK < 0 ? t.danger : t.text}>
                    {fmtCompactEUR(x.ebitdaK * 1000)}
                  </T>
                  <T v="caption" color={statusColor(t, x.status)}>
                    {SITE_STATUS[x.status]}
                  </T>
                </View>
              }
            />
          ))}
        </Card>
      </Section>

      <Section title="Activité opérations" action={<Button small kind="ghost" title="GMAO" icon="construct" onPress={() => router.push('/gmao')} />}>
        <Card style={{ paddingVertical: 4 }}>
          {recent.map((w) => (
            <ListItem
              key={w.id}
              title={`${w.ref} · ${w.title}`}
              sub={`${siteOf(w.siteId)?.city} · ${fmtDateTime(w.history.at(-1)?.at ?? w.createdAt)} · ${w.history.at(-1)?.text ?? ''}`}
              icon={w.status === 'clôturé' ? 'checkmark-circle' : 'construct'}
              iconColor={statusColor(t, w.status === 'nouveau' ? w.priority : w.status)}
              onPress={() => router.push(`/wo/${w.id}`)}
              right={<Badge label={w.status} color={statusColor(t, w.status)} />}
            />
          ))}
        </Card>
      </Section>

      <Row wrap gap={10}>
        <Card style={{ flexGrow: 1, flexBasis: 240 }} onPress={() => router.push('/mobilite')} a11y="Ouvrir la mobilité">
          <T v="caption" muted>
            Mobilité
          </T>
          <T v="h2">{upcoming.length} mission(s) actives</T>
          <T v="small" muted>
            Planifiées, confirmées ou en cours
          </T>
        </Card>
        <Card style={{ flexGrow: 1, flexBasis: 240 }} onPress={() => router.push('/close')} a11y="Ouvrir la clôture mensuelle">
          <T v="caption" muted>
            Clôture {closePeriod()}
          </T>
          <T v="h2">{close?.lockedAt ? 'Verrouillée' : `Étape ${(close?.step ?? 0) + 1}/6`}</T>
          <Progress value={(close?.step ?? 0) / 6} />
        </Card>
      </Row>

      <Card onPress={() => router.push('/scenarios')} accent={t.primary} a11y="Ouvrir les scénarios d’acceptation">
        <Row>
          <View style={{ flex: 1 }}>
            <T v="h3">Scénarios d’acceptation E2E</T>
            <T v="small" muted>
              Saly, Nouakchott, mission blindée, Taghazout, multi-pays, clôture mensuelle
            </T>
          </View>
          <Badge label={`${passed}/6 validés`} color={passed === 6 ? t.success : t.info} />
        </Row>
      </Card>
    </Screen>
  );
}
