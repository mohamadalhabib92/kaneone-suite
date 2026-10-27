import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/kit/theme';
import { Badge, Card, EmptyState, ListItem, Row, Screen, Section, Stat, T } from '@/kit/ui';
import { fmtCompactEUR, fmtNumber } from '@/kit/format';
import { ASSETS, ASSET_TYPE, BASES, EQUIPMENT, SITE_STATUS, SPVS, countryOf, siteOf } from '@/data/demo';
import { store } from '@/state';
import { BackHeader, DemoNotice, KV, statusColor } from '@/components/common';

export default function SiteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const router = useRouter();
  const s = store.use();
  const site = siteOf(String(id));
  if (!site) {
    return (
      <Screen header={<BackHeader title="Site" />}>
        <EmptyState icon="alert-circle" title="Site introuvable" text="Ce site n’existe pas dans le jeu de démonstration." />
      </Screen>
    );
  }
  const spv = SPVS.find((x) => x.siteId === site.id)!;
  const assets = ASSETS.filter((a) => a.siteId === site.id);
  const wos = s.wos.filter((w) => w.siteId === site.id);
  const bases = BASES.filter((b) => b.siteId === site.id);
  const projects = s.projects.filter((p) => p.siteId === site.id);
  const c = countryOf(site.countryId);
  const margin = site.revenueK > 0 ? (site.ebitdaK / site.revenueK) * 100 : null;
  return (
    <Screen header={<BackHeader title={site.name} subtitle={`${c.flag} ${site.city}, ${c.name}`} />}>
      <DemoNotice />
      <Row wrap gap={6}>
        <Badge label={SITE_STATUS[site.status]} color={statusColor(t, site.status)} />
        <Badge label={site.activity} />
      </Row>
      <T v="caption" muted>
        Site → SPV → KPIs
      </T>
      <Card>
        <T v="h3">{spv.name}</T>
        <KV k="Forme juridique" v={spv.legalForm} />
        <KV k="Détention groupe" v={`${spv.ownership} %`} />
        <KV k="Devise locale" v={c.currency} />
        <KV k="Référentiel comptable" v={spv.repoId} />
      </Card>
      <Row wrap gap={10}>
        <Stat label="CA 12 mois" value={fmtCompactEUR(site.revenueK * 1000)} demo />
        <Stat label="EBITDA 12 mois" value={fmtCompactEUR(site.ebitdaK * 1000)} color={site.ebitdaK < 0 ? t.danger : t.primary} demo />
        <Stat label="Marge EBITDA" value={margin === null ? '—' : `${fmtNumber(margin, 1)} %`} demo />
        <Stat label="Effectif" value={String(site.headcount)} demo />
        {site.occupancy ? <Stat label="Occupation" value={`${site.occupancy} %`} demo /> : null}
        <Stat label="OT ouverts" value={String(wos.filter((w) => w.status !== 'clôturé').length)} />
      </Row>
      <Section title="Actifs">
        {assets.map((a) => (
          <Card key={a.id} onPress={() => router.push(`/asset/${a.id}`)} a11y={`Fiche actif ${a.name}`}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <T style={{ fontWeight: '700' }}>{a.name}</T>
                <T v="small" muted>
                  {ASSET_TYPE[a.type]} · valeur {fmtCompactEUR(a.valueK * 1000)} (démo)
                </T>
              </View>
            </Row>
          </Card>
        ))}
      </Section>
      <Section title="Équipements & OT">
        <Card style={{ paddingVertical: 4 }}>
          {EQUIPMENT.filter((e) => e.siteId === site.id).map((e) => (
            <ListItem key={e.id} title={e.name} sub={`${e.category} · criticité ${e.criticality}`} icon="hardware-chip" />
          ))}
          {wos.map((w) => (
            <ListItem key={w.id} title={`${w.ref} · ${w.title}`} sub={w.status} icon="construct" iconColor={statusColor(t, w.status)} onPress={() => router.push(`/wo/${w.id}`)} />
          ))}
          {!wos.length && !EQUIPMENT.some((e) => e.siteId === site.id) ? <T v="small" muted style={{ padding: 8 }}>Aucun équipement ni OT.</T> : null}
        </Card>
      </Section>
      {bases.length || projects.length ? (
        <Section title="Liens">
          <Card style={{ paddingVertical: 4 }}>
            {bases.map((b) => (
              <ListItem key={b.id} title={b.name} sub="Base mobilité" icon="car-sport" onPress={() => router.push('/mobilite')} />
            ))}
            {projects.map((p) => (
              <ListItem key={p.id} title={p.name} sub="Projet immobilier" icon="hammer" onPress={() => router.push(`/project/${p.id}`)} />
            ))}
          </Card>
        </Section>
      ) : null}
    </Screen>
  );
}
