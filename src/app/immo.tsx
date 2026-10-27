import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '@/kit/theme';
import { Badge, Button, Card, Chip, EmptyState, Field, Progress, Row, Screen, Sheet, Stat, T, useToast } from '@/kit/ui';
import { fmtCompactEUR } from '@/kit/format';
import { SITES, countryOf, siteOf, spvOf } from '@/data/demo';
import { can, createProject, store } from '@/state';
import { BackHeader, DemoNotice, NeedPerm } from '@/components/common';

export default function Immo() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const s = store.use();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [site, setSite] = useState(SITES[0].id);
  const [budget, setBudget] = useState('500');
  const budgetTotal = s.projects.reduce((a, p) => a + p.budgetK, 0);
  const spent = s.projects.reduce((a, p) => a + p.spentK, 0);
  return (
    <Screen header={<BackHeader title="Kane Immo" subtitle="Projets immobiliers : phases, budget, jalons, risques" />}>
      <DemoNotice />
      <Row wrap gap={10}>
        <Stat label="Projets" value={String(s.projects.length)} />
        <Stat label="Budget total" value={fmtCompactEUR(budgetTotal * 1000)} demo />
        <Stat label="Engagé" value={fmtCompactEUR(spent * 1000)} sub={budgetTotal ? `${Math.round((spent / budgetTotal) * 100)} %` : ''} demo />
      </Row>
      <NeedPerm perm="immo.manage" what="créer ou faire avancer des projets" />
      {can(s.role, 'immo.manage') ? <Button title="Nouveau projet" icon="add" full onPress={() => setOpen(true)} /> : null}
      {s.projects.length === 0 ? <EmptyState icon="business" title="Aucun projet" /> : null}
      {s.projects.map((p) => {
        const cur = p.phases.find((x) => x.status === 'en cours');
        const done = p.phases.filter((x) => x.status === 'terminée').length;
        const site = siteOf(p.siteId);
        return (
          <Card key={p.id} onPress={() => router.push(`/project/${p.id}`)} a11y={`Projet ${p.name}`}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T style={{ fontWeight: '700', flex: 1 }}>{p.name}</T>
              <Badge label={cur ? cur.name : 'Livré'} color={cur ? t.info : t.success} />
            </Row>
            <T v="small" muted>
              {site ? `${countryOf(site.countryId).flag} ${site.city}` : ''} · {spvOf(p.spvId)?.name}
            </T>
            <Progress value={done / p.phases.length} />
            <T v="caption" muted>
              {done}/{p.phases.length} phases · budget {fmtCompactEUR(p.budgetK * 1000)} · engagé {fmtCompactEUR(p.spentK * 1000)}
            </T>
          </Card>
        );
      })}
      <Sheet visible={open} onClose={() => setOpen(false)} title="Nouveau projet immobilier">
        <Field label="Nom du projet" value={name} onChangeText={setName} />
        <T v="caption" muted>
          Site (SPV rattachée automatiquement)
        </T>
        <Row wrap gap={6}>
          {SITES.map((x) => (
            <Chip key={x.id} label={x.city} selected={site === x.id} onPress={() => setSite(x.id)} />
          ))}
        </Row>
        <Field label="Budget (k€)" value={budget} onChangeText={setBudget} keyboardType="number-pad" />
        <Button
          title="Créer le projet"
          icon="checkmark"
          full
          disabled={!name.trim() || !(Number(budget) > 0)}
          onPress={() => {
            const id = createProject({ name: name.trim(), siteId: site, budgetK: Number(budget) });
            setOpen(false);
            setName('');
            toast('Projet créé', 'success');
            router.push(`/project/${id}`);
          }}
        />
      </Sheet>
    </Screen>
  );
}
