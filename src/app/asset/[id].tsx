import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/kit/theme';
import { Badge, Button, Card, EmptyState, Row, Screen, Section, T } from '@/kit/ui';
import { fmtCompactEUR, fmtDate } from '@/kit/format';
import { ASSETS, ASSET_TYPE, FLEET, BASES, SITE_STATUS, countryOf, siteOf, spvOf, categoryOf } from '@/data/demo';
import { store } from '@/state';
import { BackHeader, DemoNotice, KV, statusColor } from '@/components/common';

export default function AssetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const router = useRouter();
  const s = store.use();
  const a = ASSETS.find((x) => x.id === id);
  if (!a) {
    return (
      <Screen header={<BackHeader title="Actif" />}>
        <EmptyState icon="alert-circle" title="Actif introuvable" />
      </Screen>
    );
  }
  const site = siteOf(a.siteId)!;
  const spv = spvOf(a.spvId)!;
  const c = countryOf(a.countryId);
  const siteBases = BASES.filter((b) => b.siteId === site.id).map((b) => b.id);
  const vehicles = a.type === 'mobilite' ? FLEET.filter((v) => siteBases.includes(v.baseId)) : [];
  const wos = s.wos.filter((w) => w.siteId === site.id);
  const [y, m] = a.acquired.split('-').map(Number);
  return (
    <Screen header={<BackHeader title={a.name} subtitle={`${c.flag} ${site.city} · ${ASSET_TYPE[a.type]}`} />}>
      <DemoNotice />
      <Row wrap gap={6}>
        <Badge label={SITE_STATUS[a.status]} color={statusColor(t, a.status)} />
        <Badge label={ASSET_TYPE[a.type]} />
      </Row>
      <Card>
        <T>{a.description}</T>
        <KV k="Valeur d’acquisition (démo)" v={fmtCompactEUR(a.valueK * 1000)} strong />
        <KV k="Acquis en" v={fmtDate(new Date(y, m - 1, 1)).replace(/^1 /, '')} />
        <KV k="SPV propriétaire" v={spv.name} />
        <KV k="Détention groupe" v={`${spv.ownership} %`} />
        <KV k="Quote-part groupe (démo)" v={fmtCompactEUR((a.valueK * 1000 * spv.ownership) / 100)} />
        <KV k="Pays / devise" v={`${c.name} · ${c.currency}`} />
        <KV k="Site" v={site.name} />
      </Card>
      {vehicles.length ? (
        <Section title="Flotte rattachée">
          <Card>
            {vehicles.map((v) => (
              <KV key={v.id} k={v.label} v={categoryOf(v.categoryId).label} />
            ))}
          </Card>
        </Section>
      ) : null}
      <Section title="Maintenance">
        <Card>
          <KV k="OT ouverts sur le site" v={String(wos.filter((w) => w.status !== 'clôturé').length)} />
          <KV k="OT clôturés" v={String(wos.filter((w) => w.status === 'clôturé').length)} />
        </Card>
      </Section>
      <Row wrap>
        <Button title="Voir le site" icon="location" kind="secondary" onPress={() => router.push(`/site/${site.id}`)} />
        <Button title="GMAO" icon="construct" kind="ghost" onPress={() => router.push('/gmao')} />
      </Row>
    </Screen>
  );
}
