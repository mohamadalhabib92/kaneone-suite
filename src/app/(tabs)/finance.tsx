import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/kit/theme';
import { Badge, Button, Card, Chip, Progress, Row, Screen, Section, Segmented, Stat, T, useToast } from '@/kit/ui';
import { fmtCompactEUR, fmtMoney, fmtNumber } from '@/kit/format';
import { exportText, printPage, toCSV } from '@/kit/files';
import { COUNTRIES, FINANCE_REPOS, SPVS, spvOf } from '@/data/demo';
import { buildLiasse } from '@/lib/finance';
import { closePeriod, store } from '@/state';
import { DemoNotice, TabHeader } from '@/components/common';

type Tab = 'synthese' | 'ecritures' | 'liasse';

export default function Finance() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const s = store.use();
  const [tab, setTab] = useState<Tab>('synthese');
  const [repo, setRepo] = useState<string | 'all'>('all');
  const period = closePeriod();
  const entries = s.entries.filter((e) => e.period === period && (repo === 'all' || spvOf(e.spvId)?.repoId === repo || (repo === 'ifrs-group' && e.interco)));
  const { lines, total } = buildLiasse(s.entries, period);
  const close = s.closes[period];
  const validated = s.entries.filter((e) => e.period === period && e.status === 'validée').length;
  const all = s.entries.filter((e) => e.period === period).length;

  const exportEntries = () =>
    exportText(
      `kaneone-ecritures-${period}-demo.csv`,
      toCSV([
        [`# Écritures ${period} — DONNÉES DE DÉMONSTRATION (Démo / Échantillon) — montants en devise locale`],
        ['SPV', 'Compte', 'Libellé', 'Débit', 'Crédit', 'Devise', 'Intragroupe', 'Statut'],
        ...s.entries
          .filter((e) => e.period === period)
          .map((e) => {
            const spv = spvOf(e.spvId)!;
            return [spv.name, e.account, e.label, e.debit, e.credit, COUNTRIES.find((c) => c.id === spv.countryId)!.currency, e.interco ? 'oui' : 'non', e.status];
          }),
      ]),
      'text/csv',
    ).then(() => toast('Export des écritures prêt', 'success'));

  return (
    <Screen header={<TabHeader title="Finance" subtitle="Référentiels, écritures, consolidation IFRS (EUR)" />}>
      <DemoNotice />
      <Row wrap gap={10}>
        <Stat label="Référentiels" value={String(FINANCE_REPOS.length)} />
        <Stat label={`EBITDA ${period}`} value={fmtCompactEUR(total.ebitda)} sub="consolidé, démo" demo color={t.primary} />
        <Stat label="Écritures validées" value={`${validated}/${all}`} />
        <Stat label="Clôture" value={close?.lockedAt ? 'Verrouillée' : `Étape ${(close?.step ?? 0) + 1}/6`} />
      </Row>
      <Card accent={t.primary} onPress={() => router.push('/close')} a11y="Ouvrir la clôture mensuelle guidée">
        <Row>
          <View style={{ flex: 1 }}>
            <T v="h3">Clôture mensuelle guidée — {period}</T>
            <T v="small" muted>
              Écritures → intragroupe → EUR → consolidation IFRS → liasse → export
            </T>
          </View>
          <Badge label={close?.lockedAt ? 'Terminée' : 'À faire'} color={close?.lockedAt ? t.success : t.warning} />
        </Row>
        <Progress value={(close?.step ?? 0) / 6} />
      </Card>
      <Segmented<Tab>
        options={[
          { key: 'synthese', label: 'Référentiels' },
          { key: 'ecritures', label: 'Écritures' },
          { key: 'liasse', label: 'Liasse' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'synthese'
        ? FINANCE_REPOS.map((r) => {
            const spvs = r.countryId ? SPVS.filter((x) => x.countryId === r.countryId) : SPVS;
            const n = s.entries.filter((e) => e.period === period && (r.countryId ? spvOf(e.spvId)?.countryId === r.countryId : true)).length;
            return (
              <Card
                key={r.id}
                onPress={() => {
                  setRepo(r.id);
                  setTab('ecritures');
                }}
                a11y={`Écritures du ${r.name}`}
              >
                <Row style={{ justifyContent: 'space-between' }}>
                  <T style={{ fontWeight: '700' }}>{r.name}</T>
                  <Badge label={r.standard} color={r.countryId ? t.info : t.primary} />
                </Row>
                <T v="small" muted>
                  {spvs.length} SPV · {n} écriture(s) {r.countryId ? `· devise ${COUNTRIES.find((c) => c.id === r.countryId)!.currency}` : '· consolidation EUR'}
                </T>
              </Card>
            );
          })
        : null}
      {tab === 'ecritures' ? (
        <>
          <Row wrap gap={6}>
            <Chip label="Tous" selected={repo === 'all'} onPress={() => setRepo('all')} />
            {FINANCE_REPOS.map((r) => (
              <Chip key={r.id} label={r.name.replace('Référentiel ', '')} selected={repo === r.id} onPress={() => setRepo(r.id)} />
            ))}
          </Row>
          <Row>
            <Button small kind="secondary" icon="download" title="Exporter CSV" onPress={exportEntries} />
          </Row>
          <Card style={{ paddingVertical: 4 }}>
            {entries.slice(0, 80).map((e) => {
              const spv = spvOf(e.spvId)!;
              const cur = COUNTRIES.find((c) => c.id === spv.countryId)!.currency;
              return (
                <Row key={e.id} style={{ paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: t.border }}>
                  <T v="mono" style={{ width: 28 }}>
                    {e.account}
                  </T>
                  <View style={{ flex: 1 }}>
                    <T v="small" style={{ fontWeight: '600' }} numberOfLines={1}>
                      {e.label}
                    </T>
                    <T v="caption" muted>
                      {spv.name} {e.interco ? '· intragroupe' : ''}
                    </T>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <T v="small" style={{ fontWeight: '700' }} color={e.credit ? t.success : t.text}>
                      {e.credit ? '+' : '−'}
                      {fmtMoney(e.credit || e.debit, cur, 0)}
                    </T>
                    <T v="caption" color={e.status === 'validée' ? t.success : t.warning}>
                      {e.status}
                    </T>
                  </View>
                </Row>
              );
            })}
            {entries.length > 80 ? <T v="small" muted>… {entries.length - 80} de plus (voir export)</T> : null}
          </Card>
        </>
      ) : null}
      {tab === 'liasse' ? <LiasseTable period={period} /> : null}
      <Row wrap>
        <Button small kind="ghost" icon="print" title="Imprimer / PDF" onPress={() => (printPage() ? null : toast('PDF mobile : Phase 2 (expo-print). Utilisez l’export CSV.', 'info'))} />
      </Row>
      <T v="small" muted>
        Aucun solde réel : montants générés pour la démonstration. Taux de change de démonstration (XOF : parité fixe).
      </T>
      {lines.length ? null : null}
    </Screen>
  );
}

export function LiasseTable({ period }: { period: string }) {
  const t = useTheme();
  const s = store.use();
  const { lines, total } = buildLiasse(s.entries, period);
  const cell = { flex: 1, textAlign: 'right' as const };
  return (
    <Card style={{ gap: 0 }}>
      <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
        <T v="h3">Liasse de consolidation {period}</T>
        <Badge label="EUR · IFRS · démo" color={t.accent} icon="flask" />
      </Row>
      <Row style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: t.border }}>
        <T v="caption" muted style={{ flex: 2 }}>
          Entité
        </T>
        <T v="caption" muted style={cell}>
          CA
        </T>
        <T v="caption" muted style={cell}>
          Charges
        </T>
        <T v="caption" muted style={cell}>
          EBITDA
        </T>
      </Row>
      {[...lines, total].map((l) => (
        <Row key={l.spvId} style={{ paddingVertical: 6, borderBottomWidth: l.spvId === 'total' ? 0 : 1, borderBottomColor: t.border }}>
          <View style={{ flex: 2 }}>
            <T v="small" style={{ fontWeight: l.spvId === 'total' ? '800' : '600' }} numberOfLines={1}>
              {l.name}
            </T>
            {l.spvId !== 'total' ? (
              <T v="caption" muted>
                {l.ownership} %
              </T>
            ) : null}
          </View>
          <T v="small" style={cell}>
            {fmtNumber(l.revenue / 1000, 1)}
          </T>
          <T v="small" style={cell}>
            {fmtNumber(l.charges / 1000, 1)}
          </T>
          <T v="small" style={{ ...cell, fontWeight: '700' }} color={l.ebitda < 0 ? t.danger : t.text}>
            {fmtNumber(l.ebitda / 1000, 1)}
          </T>
        </Row>
      ))}
      <T v="caption" muted style={{ marginTop: 6 }}>
        En k€, intragroupe éliminé. Quote-part groupe : {fmtNumber(total.share / 1000, 1)} k€.
      </T>
    </Card>
  );
}
