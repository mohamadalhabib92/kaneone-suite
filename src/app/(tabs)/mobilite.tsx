import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/kit/theme';
import { Badge, Button, Card, Chip, EmptyState, Field, Ionicons, Row, Screen, Section, Segmented, Sheet, Stat, T, useToast, type IconName } from '@/kit/ui';
import { fmtDate, isoDay } from '@/kit/format';
import { BASES, COUNTRIES, FLEET, VEHICLE_CATEGORIES, baseOf, categoryOf, countryOf, type VehicleCategoryId } from '@/data/demo';
import { DAY_MS, can, createMission, missionConflicts, store, type Leg } from '@/state';
import { DemoNotice, NeedPerm, TabHeader, statusColor } from '@/components/common';

type Tab = 'missions' | 'flotte' | 'bases';

export default function Mobilite() {
  const t = useTheme();
  const router = useRouter();
  const s = store.use();
  const [tab, setTab] = useState<Tab>('missions');
  const [open, setOpen] = useState(false);
  const conflicts = missionConflicts(s.missions);
  const active = s.missions.filter((m) => m.status !== 'terminée' && m.status !== 'annulée');
  const busy = new Set(active.flatMap((m) => m.legs.flatMap((l) => l.vehicleIds)));
  const sorted = [...s.missions].sort((a, b) => (a.legs[0]?.date ?? '').localeCompare(b.legs[0]?.date ?? ''));
  return (
    <Screen header={<TabHeader title="Mobilité" subtitle="Kane Prestige Mobility — missions, flotte, bases" />}>
      <DemoNotice />
      <Row wrap gap={10}>
        <Stat label="Missions actives" value={String(active.length)} />
        <Stat label="Terminées" value={String(s.missions.filter((m) => m.status === 'terminée').length)} />
        <Stat label="Flotte" value={String(FLEET.length)} sub={`${busy.size} engagé(s)`} demo />
        <Stat label="Bases" value={`${BASES.length}`} sub={`${COUNTRIES.length} pays`} demo />
      </Row>
      <Segmented<Tab>
        options={[
          { key: 'missions', label: 'Missions' },
          { key: 'flotte', label: 'Flotte' },
          { key: 'bases', label: 'Bases' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'missions' ? (
        <>
          <NeedPerm perm="mission.manage" what="créer ou modifier des missions" />
          {can(s.role, 'mission.manage') ? <Button title="Nouvelle mission" icon="add" full onPress={() => setOpen(true)} /> : null}
          {sorted.length === 0 ? <EmptyState icon="car-sport" title="Aucune mission" text="Créez la première mission." /> : null}
          {sorted.map((m) => {
            const countries = [...new Set(m.legs.map((l) => baseOf(l.baseId)?.countryId))].map((c) => (c ? countryOf(c).flag : ''));
            return (
              <Card key={m.id} onPress={() => router.push(`/mission/${m.id}`)} a11y={`Mission ${m.ref}`}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T v="caption" muted>
                    {m.ref} · {categoryOf(m.categoryId).label}
                  </T>
                  <Badge label={m.status} color={statusColor(t, m.status)} />
                </Row>
                <T style={{ fontWeight: '700' }}>{m.title}</T>
                <T v="small" muted>
                  {m.client} · {m.pax} pax · {m.legs.length} étape(s) {countries.join(' ')}
                </T>
                <T v="small" muted>
                  {m.legs[0] ? `${fmtDate(m.legs[0].date)} — ${baseOf(m.legs[0].baseId)?.name}` : ''}
                </T>
                {conflicts[m.id] ? <Badge label="Conflit véhicule" color={t.danger} icon="warning" /> : null}
              </Card>
            );
          })}
        </>
      ) : null}
      {tab === 'flotte' ? (
        VEHICLE_CATEGORIES.map((c) => (
          <Section key={c.id} title={c.label}>
            <Card>
              {FLEET.filter((v) => v.categoryId === c.id).map((v) => (
                <Row key={v.id} style={{ paddingVertical: 6 }}>
                  <Ionicons name={c.icon as IconName} size={20} color={t.primary} />
                  <View style={{ flex: 1 }}>
                    <T style={{ fontWeight: '600' }}>{v.label}</T>
                    <T v="small" muted>
                      {baseOf(v.baseId)?.name} {v.armorLevel ? `· blindage ${v.armorLevel}` : ''}
                    </T>
                  </View>
                  <Badge label={busy.has(v.id) ? 'Engagé' : 'Disponible'} color={busy.has(v.id) ? t.info : t.success} />
                </Row>
              ))}
            </Card>
          </Section>
        ))
      ) : null}
      {tab === 'bases' ? (
        COUNTRIES.map((c) => (
          <Section key={c.id} title={`${c.flag} ${c.name}`}>
            <Card>
              {BASES.filter((b) => b.countryId === c.id).map((b) => {
                const v = FLEET.filter((x) => x.baseId === b.id);
                return (
                  <Row key={b.id} style={{ paddingVertical: 6 }}>
                    <Ionicons name="flag" size={18} color={t.primary} />
                    <View style={{ flex: 1 }}>
                      <T style={{ fontWeight: '600' }}>{b.name}</T>
                      <T v="small" muted>
                        {v.length ? v.map((x) => x.label).join(', ') : 'Aucun véhicule basé'}
                      </T>
                    </View>
                  </Row>
                );
              })}
            </Card>
          </Section>
        ))
      ) : null}
      <NewMission visible={open} onClose={() => setOpen(false)} onCreated={(id) => router.push(`/mission/${id}`)} />
    </Screen>
  );
}

function NewMission({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const t = useTheme();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [pax, setPax] = useState('2');
  const [cat, setCat] = useState<VehicleCategoryId>('sedan');
  const [legs, setLegs] = useState<Leg[]>([]);
  const [base, setBase] = useState(BASES[0].id);
  const [date, setDate] = useState(isoDay(new Date(Date.now() + DAY_MS)));
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [veh, setVeh] = useState<string[]>([]);
  const vehicles = FLEET.filter((v) => v.baseId === base);
  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const addLeg = () => {
    if (!dateOk || !from.trim() || !to.trim() || veh.length === 0) {
      toast('Étape incomplète : date AAAA-MM-JJ, départ, arrivée et au moins un véhicule', 'error');
      return;
    }
    setLegs((l) => [...l, { baseId: base, date, from: from.trim(), to: to.trim(), vehicleIds: veh }]);
    setFrom('');
    setTo('');
    setVeh([]);
  };
  const submit = () => {
    if (!title.trim() || legs.length === 0) {
      toast('Titre et au moins une étape requis', 'error');
      return;
    }
    const id = createMission({ title: title.trim(), client: client.trim() || 'Client (non renseigné)', pax: Number(pax) || 1, categoryId: cat, legs, notes: '' });
    toast('Mission créée', 'success');
    setTitle('');
    setClient('');
    setLegs([]);
    onClose();
    onCreated(id);
  };
  return (
    <Sheet visible={visible} onClose={onClose} title="Nouvelle mission">
      <Field label="Titre" value={title} onChangeText={setTitle} placeholder="Ex. Transfert délégation" />
      <Field label="Client / référence" value={client} onChangeText={setClient} placeholder="Code client (pas de données sensibles)" />
      <Field label="Passagers" value={pax} onChangeText={setPax} keyboardType="number-pad" />
      <T v="caption" muted>
        Catégorie principale
      </T>
      <Row wrap gap={6}>
        {VEHICLE_CATEGORIES.map((c) => (
          <Chip key={c.id} label={c.label} icon={c.icon as IconName} selected={cat === c.id} onPress={() => setCat(c.id)} />
        ))}
      </Row>
      <Card style={{ gap: 8 }}>
        <T v="h3">Étapes ({legs.length})</T>
        {legs.map((l, i) => (
          <Row key={i} style={{ justifyContent: 'space-between' }}>
            <T v="small" style={{ flex: 1 }}>
              {i + 1}. {fmtDate(l.date)} · {baseOf(l.baseId)?.name} · {l.from} → {l.to} · {l.vehicleIds.length} véh.
            </T>
            <Button small kind="ghost" icon="trash" title="Retirer" onPress={() => setLegs((x) => x.filter((_, k) => k !== i))} />
          </Row>
        ))}
        <T v="caption" muted>
          Base
        </T>
        <Row wrap gap={6}>
          {BASES.map((b) => (
            <Chip
              key={b.id}
              label={`${countryOf(b.countryId).flag} ${b.name.replace('Base ', '')}`}
              selected={base === b.id}
              onPress={() => {
                setBase(b.id);
                setVeh([]);
              }}
            />
          ))}
        </Row>
        <Field label="Date (AAAA-MM-JJ)" value={date} onChangeText={setDate} error={dateOk ? undefined : 'Format attendu : 2026-11-15'} />
        <Field label="Départ" value={from} onChangeText={setFrom} />
        <Field label="Arrivée" value={to} onChangeText={setTo} />
        <T v="caption" muted>
          Véhicules de la base
        </T>
        <Row wrap gap={6}>
          {vehicles.length === 0 ? <T v="small" muted>Aucun véhicule sur cette base.</T> : null}
          {vehicles.map((v) => (
            <Chip key={v.id} label={v.label} selected={veh.includes(v.id)} onPress={() => setVeh((x) => (x.includes(v.id) ? x.filter((y) => y !== v.id) : [...x, v.id]))} />
          ))}
        </Row>
        <Button title="Ajouter l’étape" icon="add" kind="secondary" onPress={addLeg} />
      </Card>
      <Button title="Créer la mission" icon="checkmark" full onPress={submit} disabled={!title.trim() || legs.length === 0} />
      <T v="small" muted center style={{ color: t.textMuted }}>
        Données stockées localement (démo).
      </T>
    </Sheet>
  );
}
