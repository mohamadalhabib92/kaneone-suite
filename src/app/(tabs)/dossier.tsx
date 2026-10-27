import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/kit/theme';
import { Badge, Button, Card, Progress, Row, Screen, Stat, T, useToast } from '@/kit/ui';
import { exportText, printPage, toCSV } from '@/kit/files';
import { fmtDate } from '@/kit/format';
import { DOSSIER_MODULES, GROUP, REQUIREMENTS } from '@/data/demo';
import { roleLabel, store, type ReqStatus } from '@/state';
import { DemoNotice, TabHeader } from '@/components/common';

export const modStats = (reqStatus: Record<string, ReqStatus>, moduleId?: string) => {
  const reqs = moduleId ? REQUIREMENTS.filter((r) => r.moduleId === moduleId) : REQUIREMENTS;
  const v = reqs.filter((r) => reqStatus[r.id] === 'validé').length;
  const p = reqs.filter((r) => reqStatus[r.id] === 'en cours').length;
  return { total: reqs.length, validated: v, progress: p, open: reqs.length - v - p };
};

export default function Dossier() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const s = store.use();
  const all = modStats(s.reqStatus);
  const exportPack = () =>
    exportText(
      `kaneone-pack-comite-${new Date().toISOString().slice(0, 10)}-demo.csv`,
      toCSV([
        ['# Pack comité d’investissement — Dossier Kane One — DONNÉES DE DÉMONSTRATION (Démo / Échantillon)'],
        [`# Généré le ${fmtDate(new Date())} — ${all.validated}/${all.total} exigences validées — ${GROUP.sites} sites, ${GROUP.activeSites} actifs`],
        ['Module', 'Exigence', 'Statut', 'Responsable'],
        ...REQUIREMENTS.map((r) => {
          const m = DOSSIER_MODULES.find((x) => x.id === r.moduleId)!;
          return [m.title, `${r.id} — ${r.title}`, s.reqStatus[r.id] ?? 'ouvert', roleLabel(m.owner as never)];
        }),
      ]),
      'text/csv',
    ).then(() => toast('Pack comité exporté', 'success'));
  return (
    <Screen header={<TabHeader title="Dossier Kane One" subtitle={`${DOSSIER_MODULES.length} modules · ${REQUIREMENTS.length} exigences`} />}>
      <DemoNotice />
      <Row wrap gap={10}>
        <Stat label="Validées" value={`${all.validated}`} sub={`sur ${all.total}`} color={t.success} />
        <Stat label="En cours" value={`${all.progress}`} color={t.warning} />
        <Stat label="Ouvertes" value={`${all.open}`} />
      </Row>
      <Progress value={all.validated / all.total} color={t.success} />
      <Row wrap>
        <Button title="Exporter le pack comité (CSV)" icon="download" kind="secondary" onPress={exportPack} />
        <Button title="Imprimer / PDF" icon="print" kind="ghost" onPress={() => (printPage() ? null : toast('PDF mobile : Phase 2 (expo-print). Utilisez l’export CSV.', 'info'))} />
      </Row>
      {DOSSIER_MODULES.map((m, i) => {
        const st = modStats(s.reqStatus, m.id);
        const done = st.validated === st.total;
        return (
          <Card key={m.id} onPress={() => router.push(`/module/${m.id}`)} a11y={`Module ${m.title}`}>
            <Row>
              <T v="mono" muted style={{ width: 30 }}>
                {String(i + 1).padStart(2, '0')}
              </T>
              <View style={{ flex: 1, gap: 4 }}>
                <T style={{ fontWeight: '700' }}>{m.title}</T>
                <Progress value={st.validated / st.total} color={done ? t.success : t.primary} />
              </View>
              <Badge label={`${st.validated}/${st.total}`} color={done ? t.success : undefined} />
            </Row>
          </Card>
        );
      })}
    </Screen>
  );
}
