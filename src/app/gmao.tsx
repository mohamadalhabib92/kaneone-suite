import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/kit/theme';
import { Badge, Button, Card, Chip, EmptyState, Field, Row, Screen, Section, Segmented, Sheet, Stat, T, useToast } from '@/kit/ui';
import { fmtDate } from '@/kit/format';
import { EQUIPMENT, PREVENTIVE, SITES, equipmentOf, personOf, siteOf } from '@/data/demo';
import { DAY_MS, SLA_HOURS, can, createWO, slaState, store, type Priority } from '@/state';
import { BackHeader, DemoNotice, NeedPerm, statusColor } from '@/components/common';

type Tab = 'ot' | 'inventaire' | 'preventif';
const PRIOS: Priority[] = ['critique', 'haute', 'normale', 'basse'];

export function pmDue(id: string, pmDone: Record<string, number>) {
  const p = PREVENTIVE.find((x) => x.id === id)!;
  const last = pmDone[id];
  return last ? last + p.everyDays * DAY_MS : Date.now() + p.offsetDays * DAY_MS;
}

export function generatePM(id: string) {
  const p = PREVENTIVE.find((x) => x.id === id)!;
  const eq = equipmentOf(p.equipmentId)!;
  const woId = createWO({ title: `Préventif — ${p.task}`, siteId: eq.siteId, equipmentId: eq.id, priority: 'normale', kind: 'préventif' });
  store.set((s) => ({ ...s, pmDone: { ...s.pmDone, [id]: Date.now() } }));
  return woId;
}

export default function Gmao() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const s = store.use();
  const [tab, setTab] = useState<Tab>('ot');
  const [filter, setFilter] = useState<'ouverts' | 'tous'>('ouverts');
  const [open, setOpen] = useState(false);
  const edit = can(s.role, 'wo.manage');
  const openWos = s.wos.filter((w) => w.status !== 'clôturé');
  const late = openWos.filter((w) => slaState(w).late).length;
  const list = (filter === 'ouverts' ? openWos : s.wos).slice().sort((a, b) => a.dueAt - b.dueAt);
  return (
    <Screen header={<BackHeader title="GMAO" subtitle="Ordres de travail, inventaire, préventif, SLA" />}>
      <DemoNotice />
      <Row wrap gap={10}>
        <Stat label="OT ouverts" value={String(openWos.length)} />
        <Stat label="Hors SLA" value={String(late)} color={late ? t.danger : t.success} />
        <Stat label="Équipements" value={String(EQUIPMENT.length)} demo />
        <Stat label="Plans préventifs" value={String(PREVENTIVE.length)} demo />
      </Row>
      <Segmented<Tab>
        options={[
          { key: 'ot', label: 'Ordres de travail' },
          { key: 'inventaire', label: 'Inventaire' },
          { key: 'preventif', label: 'Préventif' },
        ]}
        value={tab}
        onChange={setTab}
      />
      <NeedPerm perm="wo.manage" what="créer ou traiter des OT" />
      {tab === 'ot' ? (
        <>
          <Row wrap>
            <Chip label="Ouverts" selected={filter === 'ouverts'} onPress={() => setFilter('ouverts')} />
            <Chip label="Tous" selected={filter === 'tous'} onPress={() => setFilter('tous')} />
            {edit ? <Button small title="Nouvel OT" icon="add" onPress={() => setOpen(true)} /> : null}
          </Row>
          {list.length === 0 ? <EmptyState icon="checkmark-done" title="Aucun OT ouvert" /> : null}
          {list.map((w) => {
            const sla = slaState(w);
            return (
              <Card key={w.id} onPress={() => router.push(`/wo/${w.id}`)} a11y={`OT ${w.ref}`}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T v="caption" muted>
                    {w.ref} · {siteOf(w.siteId)?.city} · {w.kind}
                  </T>
                  <Badge label={w.status} color={statusColor(t, w.status)} />
                </Row>
                <T style={{ fontWeight: '700' }}>{w.title}</T>
                <Row wrap gap={6}>
                  <Badge label={w.priority} color={w.priority === 'critique' || w.priority === 'haute' ? t.warning : undefined} />
                  <Badge label={sla.label} color={sla.late ? t.danger : t.success} icon="timer" />
                  {w.assignee ? <Badge label={personOf(w.assignee)?.name ?? ''} icon="person" /> : null}
                </Row>
              </Card>
            );
          })}
          <T v="small" muted>
            SLA : critique {SLA_HOURS.critique} h · haute {SLA_HOURS.haute} h · normale {SLA_HOURS.normale} h · basse {SLA_HOURS.basse} h.
          </T>
        </>
      ) : null}
      {tab === 'inventaire'
        ? SITES.filter((x) => EQUIPMENT.some((e) => e.siteId === x.id)).map((site) => (
            <Section key={site.id} title={`${site.name} — ${site.city}`}>
              <Card>
                {EQUIPMENT.filter((e) => e.siteId === site.id).map((e) => {
                  const n = openWos.filter((w) => w.equipmentId === e.id).length;
                  return (
                    <Row key={e.id} style={{ paddingVertical: 6 }}>
                      <View style={{ flex: 1 }}>
                        <T style={{ fontWeight: '600' }}>{e.name}</T>
                        <T v="small" muted>
                          {e.category} · criticité {e.criticality}
                        </T>
                      </View>
                      {n ? <Badge label={`${n} OT`} color={t.warning} /> : <Badge label="OK" color={t.success} />}
                    </Row>
                  );
                })}
              </Card>
            </Section>
          ))
        : null}
      {tab === 'preventif'
        ? PREVENTIVE.slice()
            .sort((a, b) => pmDue(a.id, s.pmDone) - pmDue(b.id, s.pmDone))
            .map((p) => {
              const eq = equipmentOf(p.equipmentId)!;
              const due = pmDue(p.id, s.pmDone);
              const overdue = due < Date.now();
              return (
                <Card key={p.id}>
                  <T style={{ fontWeight: '700' }}>{p.task}</T>
                  <T v="small" muted>
                    {eq.name} · {siteOf(eq.siteId)?.city} · tous les {p.everyDays} j
                  </T>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Badge label={overdue ? `En retard — prévu le ${fmtDate(due)}` : `Prochaine : ${fmtDate(due)}`} color={overdue ? t.danger : t.info} icon="calendar" />
                    {edit ? (
                      <Button
                        small
                        kind="secondary"
                        title="Générer OT"
                        icon="construct"
                        onPress={() => {
                          generatePM(p.id);
                          toast('OT préventif créé', 'success');
                        }}
                      />
                    ) : null}
                  </Row>
                </Card>
              );
            })
        : null}
      <NewWO visible={open} onClose={() => setOpen(false)} onCreated={(id) => router.push(`/wo/${id}`)} />
    </Screen>
  );
}

function NewWO({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [site, setSite] = useState(SITES[0].id);
  const [eq, setEq] = useState<string | undefined>();
  const [prio, setPrio] = useState<Priority>('normale');
  const eqs = EQUIPMENT.filter((e) => e.siteId === site);
  return (
    <Sheet visible={visible} onClose={onClose} title="Nouvel ordre de travail">
      <Field label="Description" value={title} onChangeText={setTitle} placeholder="Ex. Fuite climatisation chambre 4" />
      <T v="caption" muted>
        Site
      </T>
      <Row wrap gap={6}>
        {SITES.map((x) => (
          <Chip
            key={x.id}
            label={x.city}
            selected={site === x.id}
            onPress={() => {
              setSite(x.id);
              setEq(undefined);
            }}
          />
        ))}
      </Row>
      {eqs.length ? (
        <>
          <T v="caption" muted>
            Équipement (optionnel)
          </T>
          <Row wrap gap={6}>
            {eqs.map((e) => (
              <Chip key={e.id} label={e.name} selected={eq === e.id} onPress={() => setEq(eq === e.id ? undefined : e.id)} />
            ))}
          </Row>
        </>
      ) : null}
      <T v="caption" muted>
        Priorité (SLA)
      </T>
      <Row wrap gap={6}>
        {PRIOS.map((p) => (
          <Chip key={p} label={`${p} · ${SLA_HOURS[p]} h`} selected={prio === p} onPress={() => setPrio(p)} />
        ))}
      </Row>
      <Button
        title="Créer l’OT"
        icon="checkmark"
        full
        disabled={!title.trim()}
        onPress={() => {
          const id = createWO({ title: title.trim(), siteId: site, equipmentId: eq, priority: prio });
          toast('OT créé', 'success');
          setTitle('');
          onClose();
          onCreated(id);
        }}
      />
    </Sheet>
  );
}
