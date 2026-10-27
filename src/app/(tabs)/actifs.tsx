import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/kit/theme';
import { Badge, Card, Chip, EmptyState, Button, Row, Screen, Stat, T, Ionicons, type IconName } from '@/kit/ui';
import { fmtCompactEUR } from '@/kit/format';
import { ASSETS, ASSET_TYPE, COUNTRIES, SITE_STATUS, SPVS, countryOf, siteOf, spvOf, type AssetType, type CountryId, type SiteStatus } from '@/data/demo';
import { DemoNotice, TabHeader, statusColor } from '@/components/common';

const TYPE_ICON: Record<AssetType, IconName> = { immobilier: 'business', mobilite: 'car-sport', autre: 'cube' };

export default function Actifs() {
  const t = useTheme();
  const router = useRouter();
  const [country, setCountry] = useState<CountryId | 'all'>('all');
  const [type, setType] = useState<AssetType | 'all'>('all');
  const [status, setStatus] = useState<SiteStatus | 'all'>('all');
  const list = ASSETS.filter((a) => (country === 'all' || a.countryId === country) && (type === 'all' || a.type === type) && (status === 'all' || a.status === status));
  const total = list.reduce((a, x) => a + x.valueK, 0);
  const reset = () => {
    setCountry('all');
    setType('all');
    setStatus('all');
  };
  return (
    <Screen header={<TabHeader title="Actifs" subtitle="Patrimoine par pays, SPV et type" />}>
      <DemoNotice />
      <Row wrap gap={10}>
        <Stat label="Actifs" value={String(ASSETS.length)} demo />
        <Stat label="Pays" value={String(COUNTRIES.length)} demo />
        <Stat label="SPV" value={String(SPVS.length)} demo />
        <Stat label="Valeur (filtre)" value={fmtCompactEUR(total * 1000)} sub="valeur d’acquisition démo" demo />
      </Row>
      <T v="caption" muted>
        Pays
      </T>
      <Row wrap gap={6}>
        <Chip label="Tous" selected={country === 'all'} onPress={() => setCountry('all')} />
        {COUNTRIES.map((c) => (
          <Chip key={c.id} label={`${c.flag} ${c.name}`} selected={country === c.id} onPress={() => setCountry(c.id)} />
        ))}
      </Row>
      <T v="caption" muted>
        Type
      </T>
      <Row wrap gap={6}>
        <Chip label="Tous" selected={type === 'all'} onPress={() => setType('all')} />
        {(Object.keys(ASSET_TYPE) as AssetType[]).map((k) => (
          <Chip key={k} label={ASSET_TYPE[k]} icon={TYPE_ICON[k]} selected={type === k} onPress={() => setType(k)} />
        ))}
      </Row>
      <T v="caption" muted>
        Statut
      </T>
      <Row wrap gap={6}>
        <Chip label="Tous" selected={status === 'all'} onPress={() => setStatus('all')} />
        {(Object.keys(SITE_STATUS) as SiteStatus[]).map((k) => (
          <Chip key={k} label={SITE_STATUS[k]} selected={status === k} onPress={() => setStatus(k)} />
        ))}
      </Row>
      {list.length === 0 ? (
        <EmptyState icon="filter" title="Aucun actif pour ces filtres" action={<Button title="Réinitialiser les filtres" kind="secondary" onPress={reset} />} />
      ) : (
        list.map((a) => {
          const c = countryOf(a.countryId);
          return (
            <Card key={a.id} onPress={() => router.push(`/asset/${a.id}`)} a11y={`Fiche actif ${a.name}`}>
              <Row>
                <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={TYPE_ICON[a.type]} size={22} color={t.primary} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <T style={{ fontWeight: '700' }}>{a.name}</T>
                  <T v="small" muted>
                    {c.flag} {siteOf(a.siteId)?.city} · {spvOf(a.spvId)?.name}
                  </T>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <T style={{ fontWeight: '700' }}>{fmtCompactEUR(a.valueK * 1000)}</T>
                  <Badge label={SITE_STATUS[a.status]} color={statusColor(t, a.status)} />
                </View>
              </Row>
            </Card>
          );
        })
      )}
    </Screen>
  );
}
