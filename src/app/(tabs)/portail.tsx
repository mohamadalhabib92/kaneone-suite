import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, alpha } from '@/kit/theme';
import { Banner, Button, Card, Chip, EmptyState, Field, Ionicons, Row, Screen, Section, Stat, T } from '@/kit/ui';
import { ScreenBoundary } from '@/kit/error-boundary';
import { fmtCompactEUR, fmtDate, fmtDateTime } from '@/kit/format';
import { DOSSIER_MODULES, GROUP, siteOf } from '@/data/demo';
import { can, logAccess, postMessage, store } from '@/state';
import { DemoNotice, Figure, TabHeader } from '@/components/common';
import { dbReady } from '@/config';
import { modStats } from './dossier';

export default function Portail() {
  return (
    <ScreenBoundary title="Portail" allowBack>
      <PortailBody />
    </ScreenBoundary>
  );
}

function PortailBody() {
  const t = useTheme();
  const router = useRouter();
  const s = store.use();
  const [msg, setMsg] = useState('');
  const [preview, setPreview] = useState<string>('all');
  const restricted = s.role === 'portail';
  const actorId = restricted ? s.portalActorId || s.portalUsers[0]?.id : preview;
  const actor = s.portalUsers.find((u) => u.id === actorId);
  const filtering = restricted || preview !== 'all';
  const allow = (label: string) => !filtering || !!actor?.access.includes(label);
  const dossier = modStats(s.reqStatus);
  const reports = s.docs.filter((d) => d.kind === 'Liasse' || d.kind === 'Rapport');
  const otherDocs = s.docs.filter((d) => d.kind !== 'Liasse' && d.kind !== 'Rapport');
  const log = s.accessLog ?? [];

  useEffect(() => {
    const who = filtering ? (actor?.name ?? 'Portail (démo)') : 'aperçu interne';
    logAccess(`Consultation du portail — ${who}`);
  }, [filtering, actor?.id]);

  return (
    <Screen header={<TabHeader title="Portail famille & partenaires" subtitle="Lecture seule — périmètre partagé, rapports et messages" />}>
      <DemoNotice />
      {!dbReady() ? (
        <Banner
          kind="warning"
          title="Authentification non configurée"
          text="En production, chaque membre ou partenaire se connecte avec son compte (Supabase Auth + RLS) et ne voit que ce qui lui est partagé. Ici : accès de démonstration, filtré par le périmètre choisi."
          icon="lock-closed"
        />
      ) : null}
      {!restricted ? (
        <Banner kind="info" title="Aperçu interne" text="Le rôle Portail ne voit que le périmètre coché pour l’identité choisie. Les autres modules restent hors de sa vue." />
      ) : (
        <T v="small" muted>
          Votre consultation est journalisée et visible par l’administrateur.
        </T>
      )}

      <Section title="Identité de démonstration">
        <Row wrap gap={6}>
          {!restricted ? <Chip label="Vue complète" selected={preview === 'all'} onPress={() => setPreview('all')} /> : null}
          {s.portalUsers.map((u) => (
            <Chip
              key={u.id}
              label={u.name.replace(' (démo)', '')}
              icon={u.kind === 'famille' ? 'home' : 'briefcase'}
              selected={actorId === u.id && (restricted || preview !== 'all')}
              onPress={() => {
                if (restricted) store.set((x) => ({ ...x, portalActorId: u.id }));
                else setPreview(u.id);
              }}
            />
          ))}
        </Row>
      </Section>

      <Section title="Périmètre partagé">
        <Card>
          <T style={{ fontWeight: '700' }}>{filtering ? (actor?.name ?? 'Identité') : 'Vue interne complète'}</T>
          <T v="small" muted>
            {filtering ? (actor?.access.length ? actor.access.join(' · ') : 'Aucun partage') : 'KPIs, dossier, liasse, projets, documents et messages'}
          </T>
        </Card>
      </Section>

      {allow('KPIs groupe') ? (
        <Row wrap gap={10}>
          <Stat label="EBITDA annuel groupe" value={fmtCompactEUR(GROUP.ebitdaK * 1000)} demo />
          <Stat label="Sites" value={`${GROUP.activeSites}/${GROUP.sites}`} sub="opérationnels" demo />
          <Stat label="Effectif" value={String(GROUP.headcount)} demo />
        </Row>
      ) : null}

      {allow('Dossier Kane One') ? (
        <Stat label="Dossier Kane One" value={`${Math.round((dossier.validated / Math.max(1, dossier.total)) * 100)} %`} sub={`${DOSSIER_MODULES.length} modules · Démo`} demo />
      ) : null}

      {allow('Projets immobiliers') ? (
        <Section title="Projets immobiliers partagés">
          {s.projects.length === 0 ? <EmptyState icon="business" title="Aucun projet partagé" text="Les projets apparaissent ici lorsqu’ils sont au périmètre de cette identité." /> : null}
          {s.projects.map((p) => (
            <Card key={p.id} onPress={() => router.push(`/project/${p.id}`)} a11y={`Projet ${p.name}`}>
              <T style={{ fontWeight: '700' }}>{p.name}</T>
              <T v="small" muted>
                {siteOf(p.siteId)?.city ?? 'Site'} · lecture seule
              </T>
              <Figure amount={p.budgetK * 1000} text={`Budget ${fmtCompactEUR(p.budgetK * 1000)} · engagé ${fmtCompactEUR(p.spentK * 1000)}`} />
            </Card>
          ))}
        </Section>
      ) : null}

      {allow('Liasse') ? (
        <Section title="Rapports publiés">
          {reports.length === 0 ? (
            <EmptyState
              icon="document-text"
              title="Aucun rapport publié"
              text="La liasse de clôture apparaît ici après génération par le directeur financier."
              action={can(s.role, 'finance.close') ? <Button title="Ouvrir la clôture" icon="lock-closed" onPress={() => router.push('/close')} /> : undefined}
            />
          ) : (
            reports.map((d) => (
              <Card key={d.id}>
                <Row>
                  <Ionicons name="document-text" size={22} color={t.primary} />
                  <View style={{ flex: 1 }}>
                    <T style={{ fontWeight: '600' }}>{d.title}</T>
                    <T v="caption" muted>
                      {d.kind} · {fmtDate(d.at)} · Démo
                    </T>
                  </View>
                </Row>
              </Card>
            ))
          )}
        </Section>
      ) : null}

      {allow('Dossier Kane One') || !filtering ? (
        <Section title="Documents partagés">
          {otherDocs.length === 0 ? <EmptyState icon="document-text" title="Aucun document partagé" text="Les pièces explicitement partagées avec cette identité s’affichent ici." /> : null}
          {(filtering ? otherDocs.filter((d) => allow(d.kind) || allow('Dossier Kane One')) : otherDocs).map((d) => (
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
      ) : null}

      <Section title="Messages">
        <Card style={{ gap: 8 }}>
          {s.messages.length === 0 ? <T v="small" muted>Aucun message. Écrivez au family office : le texte reste sur cet appareil.</T> : null}
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
              postMessage(msg.trim(), 'portail');
              setMsg('');
            }}
          />
        </Card>
      </Section>

      {can(s.role, 'admin') ? (
        <Section title="Journal d’accès">
          {log.length === 0 ? <EmptyState icon="list" title="Aucune consultation" text="Les ouvertures du portail s’ajoutent ici." /> : null}
          {log.map((e) => (
            <Card key={e.id}>
              <T style={{ fontWeight: '600' }}>{e.action}</T>
              <T v="caption" muted>
                {e.actor} · {fmtDateTime(e.at)}
              </T>
            </Card>
          ))}
          <T v="small" muted>
            Journal local de démonstration. L’audit serveur append-only (conservation 10 ans) est prévu avec le backend — à valider.
          </T>
        </Section>
      ) : null}
    </Screen>
  );
}
