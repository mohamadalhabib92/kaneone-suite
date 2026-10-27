import React, { useState } from 'react';
import { View } from 'react-native';
import { useTheme, alpha } from '@/kit/theme';
import { Banner, Button, Card, EmptyState, Field, Ionicons, Row, Screen, Section, Stat, T } from '@/kit/ui';
import { fmtCompactEUR, fmtDate, fmtDateTime } from '@/kit/format';
import { DOSSIER_MODULES, GROUP } from '@/data/demo';
import { postMessage, store } from '@/state';
import { DemoNotice, TabHeader } from '@/components/common';
import { dbReady } from '@/config';
import { modStats } from './dossier';

export default function Portail() {
  const t = useTheme();
  const s = store.use();
  const [msg, setMsg] = useState('');
  const dossier = modStats(s.reqStatus);
  return (
    <Screen header={<TabHeader title="Portail famille & partenaires" subtitle="Lecture seule — indicateurs et documents partagés" />}>
      <DemoNotice />
      {!dbReady() ? (
        <Banner kind="warning" title="Authentification non configurée" text="En production, chaque membre ou partenaire se connecte avec son compte (Supabase Auth + RLS) et ne voit que ce qui lui est partagé. Ici : accès de démonstration." icon="lock-closed" />
      ) : null}
      <Row wrap gap={10}>
        <Stat label="EBITDA annuel groupe" value={fmtCompactEUR(GROUP.ebitdaK * 1000)} demo />
        <Stat label="Sites" value={`${GROUP.activeSites}/${GROUP.sites}`} sub="opérationnels" demo />
        <Stat label="Effectif" value={String(GROUP.headcount)} demo />
        <Stat label="Dossier Kane One" value={`${Math.round((dossier.validated / dossier.total) * 100)} %`} sub={`${DOSSIER_MODULES.length} modules`} />
      </Row>
      <Section title="Documents partagés">
        {s.docs.length === 0 ? <EmptyState icon="document-text" title="Aucun document partagé" text="La liasse apparaît ici une fois la clôture mensuelle générée." /> : null}
        {s.docs.map((d) => (
          <Card key={d.id}>
            <Row>
              <Ionicons name="document-text" size={22} color={t.primary} />
              <View style={{ flex: 1 }}>
                <T style={{ fontWeight: '600' }}>{d.title}</T>
                <T v="caption" muted>
                  {d.kind} · {fmtDate(d.at)}
                </T>
              </View>
            </Row>
          </Card>
        ))}
      </Section>
      <Section title="Messages">
        <Card style={{ gap: 8 }}>
          {s.messages.map((m) => (
            <View key={m.id} style={{ padding: 10, borderRadius: 10, backgroundColor: alpha(t.primary, 0.08) }}>
              <T v="small" style={{ fontWeight: '700' }}>
                {m.from}
              </T>
              <T v="small">{m.text}</T>
              <T v="caption" muted>
                {fmtDateTime(m.at)}
              </T>
            </View>
          ))}
          <Field label="Écrire au family office" value={msg} onChangeText={setMsg} multiline placeholder="Votre message (stocké localement en démo)" />
          <Button
            small
            title="Envoyer"
            icon="send"
            disabled={!msg.trim()}
            onPress={() => {
              postMessage(msg.trim());
              setMsg('');
            }}
          />
        </Card>
      </Section>
    </Screen>
  );
}
