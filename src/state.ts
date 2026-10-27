import { createPersistedStore, uid } from '@/kit/store';
import { isoDay } from '@/kit/format';
import { BASES, COUNTRIES, FLEET, REQUIREMENTS, SEASONALITY, SITES, SPVS, type VehicleCategoryId } from '@/data/demo';

export type Role = 'admin' | 'cfo' | 'ops' | 'mobility' | 'portail';
export const ROLES: { id: Role; label: string; sub: string; icon: string }[] = [
  { id: 'admin', label: 'Administrateur', sub: 'Configuration, utilisateurs, sécurité, bascule démo', icon: 'key' },
  { id: 'cfo', label: 'Directeur financier (CFO)', sub: 'Finance, consolidation, clôture, exports', icon: 'stats-chart' },
  { id: 'ops', label: 'Opérations', sub: 'Pilotage sites, GMAO, travaux, incidents', icon: 'construct' },
  { id: 'mobility', label: 'Kane Prestige Mobility', sub: 'Missions, flotte, bases, itinéraires', icon: 'car-sport' },
  { id: 'portail', label: 'Portail famille / partenaires', sub: 'Lecture seule : KPIs, dossiers partagés, messages', icon: 'people' },
];
export const roleLabel = (r?: Role) => ROLES.find((x) => x.id === r)?.label ?? '—';

export type Perm = 'wo.manage' | 'mission.manage' | 'finance.close' | 'finance.view' | 'immo.manage' | 'dossier.edit' | 'admin' | 'internal';
const PERMS: Record<Role, Perm[]> = {
  admin: ['wo.manage', 'mission.manage', 'finance.view', 'immo.manage', 'dossier.edit', 'admin', 'internal'],
  cfo: ['finance.close', 'finance.view', 'dossier.edit', 'internal'],
  ops: ['wo.manage', 'immo.manage', 'finance.view', 'internal'],
  mobility: ['mission.manage', 'internal'],
  portail: [],
};
export const can = (role: Role | undefined, p: Perm) => !!role && PERMS[role].includes(p);

export type Ev = { at: number; text: string; by: string };

export type Priority = 'basse' | 'normale' | 'haute' | 'critique';
export const SLA_HOURS: Record<Priority, number> = { critique: 4, haute: 24, normale: 72, basse: 168 };
export type WOStatus = 'nouveau' | 'assigné' | 'en cours' | 'escaladé' | 'résolu' | 'clôturé';
export const WO_FLOW: WOStatus[] = ['nouveau', 'assigné', 'en cours', 'résolu', 'clôturé'];
export type WorkOrder = {
  id: string;
  ref: string;
  title: string;
  siteId: string;
  equipmentId?: string;
  kind: 'curatif' | 'préventif';
  priority: Priority;
  status: WOStatus;
  assignee?: string;
  escalatedTo?: string;
  createdAt: number;
  dueAt: number;
  resolvedAt?: number;
  closedAt?: number;
  tag?: string;
  history: Ev[];
};

export type MissionStatus = 'planifiée' | 'confirmée' | 'en cours' | 'terminée' | 'annulée';
export const MISSION_FLOW: MissionStatus[] = ['planifiée', 'confirmée', 'en cours', 'terminée'];
export type Leg = { baseId: string; date: string; from: string; to: string; vehicleIds: string[] };
export type Mission = {
  id: string;
  ref: string;
  title: string;
  client: string;
  categoryId: VehicleCategoryId;
  legs: Leg[];
  status: MissionStatus;
  pax: number;
  notes: string;
  report?: string;
  createdAt: number;
  tag?: string;
  history: Ev[];
};

export type PhaseStatus = 'à venir' | 'en cours' | 'terminée';
export type Project = {
  id: string;
  name: string;
  siteId: string;
  spvId: string;
  budgetK: number;
  spentK: number;
  phases: { name: string; status: PhaseStatus }[];
  milestones: { id: string; title: string; due: string; done: boolean }[];
  risks: { id: string; title: string; level: 'faible' | 'moyen' | 'élevé'; mitigation: string }[];
  tag?: string;
  history: Ev[];
};

export type Entry = {
  id: string;
  period: string;
  spvId: string;
  account: string;
  label: string;
  debit: number;
  credit: number;
  interco?: boolean;
  status: 'brouillon' | 'validée';
};

export const CLOSE_STEPS = [
  { key: 'entries', label: 'Valider les écritures du mois', sub: 'Toutes les écritures en brouillon passent en « validée ».' },
  { key: 'interco', label: 'Rapprocher et éliminer l’intragroupe', sub: 'Frais de gestion facturés par le siège neutralisés.' },
  { key: 'fx', label: 'Convertir en EUR', sub: 'Taux de clôture (démo) appliqués à chaque devise locale.' },
  { key: 'conso', label: 'Consolider (IFRS, EUR)', sub: 'Agrégation des SPV selon le pourcentage de détention.' },
  { key: 'liasse', label: 'Générer la liasse de consolidation', sub: 'Compte de résultat par entité + total groupe.' },
  { key: 'export', label: 'Exporter et verrouiller la période', sub: 'Export CSV de la liasse puis verrouillage (CFO).' },
] as const;
export type Close = { period: string; step: number; lockedAt?: number; log: Ev[] };

export type ReqStatus = 'ouvert' | 'en cours' | 'validé';
export type Message = { id: string; at: number; from: string; text: string; tag?: string };
export type PortalUser = { id: string; name: string; kind: 'famille' | 'partenaire'; access: string[] };
export type SharedDoc = { id: string; title: string; at: number; kind: string };

export type State = {
  role?: Role;
  mode: 'demo' | 'real';
  wos: WorkOrder[];
  missions: Mission[];
  projects: Project[];
  entries: Entry[];
  closes: Record<string, Close>;
  reqStatus: Record<string, ReqStatus>;
  messages: Message[];
  portalUsers: PortalUser[];
  docs: SharedDoc[];
  pmDone: Record<string, number>;
  woSeq: number;
  missionSeq: number;
};

const H = 3600_000;
const D = 24 * H;

/** Période à clôturer : le mois précédent. */
export function closePeriod(now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function seedEntries(period: string): Entry[] {
  const month = Number(period.slice(5, 7)) - 1;
  const w = SEASONALITY[month];
  const out: Entry[] = [];
  SPVS.forEach((spv) => {
    const site = SITES.find((s) => s.id === spv.siteId)!;
    const fx = COUNTRIES.find((c) => c.id === spv.countryId)!.fxToEur;
    const rev = Math.round(site.revenueK * 1000 * w * fx);
    const ebitda = Math.round(site.ebitdaK * 1000 * w * fx);
    const fee = spv.siteId === 'gva' ? 0 : Math.round(rev * 0.02);
    const charges = rev - ebitda - fee;
    if (rev > 0) out.push({ id: uid('e'), period, spvId: spv.id, account: '70', label: 'Chiffre d’affaires', debit: 0, credit: rev, status: 'brouillon' });
    if (charges !== 0) out.push({ id: uid('e'), period, spvId: spv.id, account: '60', label: 'Charges d’exploitation', debit: charges, credit: 0, status: 'brouillon' });
    if (fee > 0) {
      out.push({ id: uid('e'), period, spvId: spv.id, account: '62', label: 'Frais de gestion siège (intragroupe)', debit: fee, credit: 0, interco: true, status: 'brouillon' });
      const gvaFx = COUNTRIES.find((c) => c.id === 'ch')!.fxToEur;
      out.push({ id: uid('e'), period, spvId: 'spv-gva', account: '70', label: `Frais de gestion refacturés — ${spv.name}`, debit: 0, credit: Math.round((fee / fx) * gvaFx), interco: true, status: 'brouillon' });
    }
  });
  // quelques écritures déjà validées pour illustrer
  return out.map((e, i) => (i % 4 === 0 ? { ...e, status: 'validée' } : e));
}

function seedReqStatus(): Record<string, ReqStatus> {
  const r: Record<string, ReqStatus> = {};
  REQUIREMENTS.forEach((q, i) => {
    const k = (i * 7) % 10;
    r[q.id] = k < 5 ? 'validé' : k < 8 ? 'en cours' : 'ouvert';
  });
  return r;
}

const ev = (text: string, by = 'Démo', at = Date.now()): Ev => ({ at, text, by });

function initial(): State {
  const now = Date.now();
  const today = new Date();
  const day = (o: number) => isoDay(new Date(today.getTime() + o * D));
  return {
    role: undefined,
    mode: 'demo',
    woSeq: 4,
    missionSeq: 3,
    wos: [
      { id: 'wo-1', ref: 'OT-0001', title: 'Fuite robinet chambre 12', siteId: 'saly', kind: 'curatif', priority: 'normale', status: 'clôturé', assignee: 'p-ops1', createdAt: now - 6 * D, dueAt: now - 3 * D, resolvedAt: now - 5 * D, closedAt: now - 5 * D, history: [ev('OT créé', 'Démo', now - 6 * D), ev('Clôturé', 'Démo', now - 5 * D)] },
      { id: 'wo-2', ref: 'OT-0002', title: 'Groupe électrogène : alarme température', siteId: 'nkc', equipmentId: 'eq-nkc-gen', kind: 'curatif', priority: 'haute', status: 'en cours', assignee: 'p-ops2', createdAt: now - 10 * H, dueAt: now + 14 * H, history: [ev('OT créé', 'Démo', now - 10 * H), ev('Assigné', 'Démo', now - 9 * H)] },
      { id: 'wo-3', ref: 'OT-0003', title: 'Ascenseur A : bruit anormal', siteId: 'dakar', equipmentId: 'eq-dkr-elev', kind: 'curatif', priority: 'haute', status: 'nouveau', createdAt: now - 30 * H, dueAt: now - 6 * H, history: [ev('OT créé', 'Démo', now - 30 * H)] },
      { id: 'wo-4', ref: 'OT-0004', title: 'Bornes quai : remplacement prise', siteId: 'dxb', equipmentId: 'eq-dxb-dock', kind: 'curatif', priority: 'basse', status: 'assigné', assignee: 'p-ops3', createdAt: now - 2 * D, dueAt: now + 5 * D, history: [ev('OT créé', 'Démo', now - 2 * D)] },
    ],
    missions: [
      { id: 'm-1', ref: 'MS-0001', title: 'Transfert délégation aéroport → siège', client: 'Client VIP #A12 (démo)', categoryId: 'sedan', pax: 2, status: 'terminée', notes: '', legs: [{ baseId: 'b-gva', date: day(-3), from: 'Aéroport de Genève', to: 'Siège Genève', vehicleIds: ['v-s1'] }], createdAt: now - 5 * D, history: [ev('Mission créée', 'Démo', now - 5 * D)] },
      { id: 'm-2', ref: 'MS-0002', title: 'Croisière côtière invités', client: 'Client VIP #B07 (démo)', categoryId: 'yacht', pax: 8, status: 'confirmée', notes: 'Équipage 4 personnes', legs: [{ baseId: 'b-dxb', date: day(4), from: 'Marina Dubaï', to: 'Côte (aller-retour)', vehicleIds: ['v-y1'] }], createdAt: now - 2 * D, history: [ev('Mission créée', 'Démo', now - 2 * D)] },
      { id: 'm-3', ref: 'MS-0003', title: 'Visite de site Agadir', client: 'Partenaire #P03 (démo)', categoryId: 'van', pax: 5, status: 'planifiée', notes: '', legs: [{ baseId: 'b-aga', date: day(9), from: 'Aéroport d’Agadir', to: 'Showroom Agadir', vehicleIds: ['v-v2'] }], createdAt: now - D, history: [ev('Mission créée', 'Démo', now - D)] },
    ],
    projects: [
      {
        id: 'pr-stl', name: 'Rénovation Lodge du Fleuve', siteId: 'stlouis', spvId: 'spv-stlouis', budgetK: 850, spentK: 410,
        phases: [{ name: 'Études', status: 'terminée' }, { name: 'Permis', status: 'terminée' }, { name: 'Gros œuvre', status: 'terminée' }, { name: 'Second œuvre', status: 'en cours' }, { name: 'Livraison', status: 'à venir' }],
        milestones: [{ id: 'ms1', title: 'Clos-couvert', due: day(-20), done: true }, { id: 'ms2', title: 'Réception lots techniques', due: day(35), done: false }],
        risks: [{ id: 'r1', title: 'Crue saisonnière', level: 'moyen', mitigation: 'Planning hors saison des pluies' }],
        history: [ev('Projet créé')],
      },
      {
        id: 'pr-dkh', name: 'Lodge kitesurf Dakhla', siteId: 'dkh', spvId: 'spv-dkh', budgetK: 1900, spentK: 120,
        phases: [{ name: 'Études', status: 'en cours' }, { name: 'Permis', status: 'à venir' }, { name: 'Gros œuvre', status: 'à venir' }, { name: 'Second œuvre', status: 'à venir' }, { name: 'Livraison', status: 'à venir' }],
        milestones: [{ id: 'ms1', title: 'Esquisse validée', due: day(15), done: false }],
        risks: [{ id: 'r1', title: 'Délai d’autorisation', level: 'élevé', mitigation: 'Dossier préparé avec conseil local' }],
        history: [ev('Projet créé')],
      },
      {
        id: 'pr-atar', name: 'Camp écotouristique Atar', siteId: 'atar', spvId: 'spv-atar', budgetK: 640, spentK: 35,
        phases: [{ name: 'Études', status: 'en cours' }, { name: 'Permis', status: 'à venir' }, { name: 'Gros œuvre', status: 'à venir' }, { name: 'Second œuvre', status: 'à venir' }, { name: 'Livraison', status: 'à venir' }],
        milestones: [{ id: 'ms1', title: 'Étude d’impact', due: day(40), done: false }],
        risks: [{ id: 'r1', title: 'Accès eau', level: 'moyen', mitigation: 'Forage + stockage' }],
        history: [ev('Projet créé')],
      },
    ],
    entries: seedEntries(closePeriod()),
    closes: {},
    reqStatus: seedReqStatus(),
    messages: [
      { id: 'msg-1', at: now - 3 * D, from: 'Family office (démo)', text: 'Bienvenue sur le portail. Les indicateurs affichés sont des données de démonstration.' },
    ],
    portalUsers: [
      { id: 'pu-1', name: 'Membre famille #1 (démo)', kind: 'famille', access: ['KPIs groupe', 'Dossier Kane One'] },
      { id: 'pu-2', name: 'Partenaire bancaire (démo)', kind: 'partenaire', access: ['KPIs groupe', 'Liasse'] },
      { id: 'pu-3', name: 'Partenaire immobilier (démo)', kind: 'partenaire', access: ['Projets immobiliers'] },
    ],
    docs: [],
    pmDone: {},
  };
}

export const store = createPersistedStore<State>('kaneone-suite', initial, 1);

/* ---------------- Actions ---------------- */
const who = () => roleLabel(store.get().role);

export function createWO(input: { title: string; siteId: string; equipmentId?: string; priority: Priority; kind?: WorkOrder['kind']; tag?: string }): string {
  const id = uid('wo');
  store.set((s) => {
    const seq = s.woSeq + 1;
    const now = Date.now();
    const wo: WorkOrder = {
      id,
      ref: `OT-${String(seq).padStart(4, '0')}`,
      title: input.title,
      siteId: input.siteId,
      equipmentId: input.equipmentId,
      kind: input.kind ?? 'curatif',
      priority: input.priority,
      status: 'nouveau',
      createdAt: now,
      dueAt: now + SLA_HOURS[input.priority] * H,
      tag: input.tag,
      history: [ev(`OT créé (priorité ${input.priority})`, who())],
    };
    return { ...s, woSeq: seq, wos: [wo, ...s.wos] };
  });
  return id;
}

export function updateWO(id: string, patch: Partial<WorkOrder>, log: string) {
  store.set((s) => ({ ...s, wos: s.wos.map((w) => (w.id === id ? { ...w, ...patch, history: [...w.history, ev(log, who())] } : w)) }));
}

export const assignWO = (id: string, personId: string, name: string) => updateWO(id, { assignee: personId, status: 'assigné' }, `Assigné à ${name}`);
export const startWO = (id: string) => updateWO(id, { status: 'en cours' }, 'Intervention démarrée');
export const escalateWO = (id: string, to: string, reason: string) => updateWO(id, { status: 'escaladé', escalatedTo: to }, `Escaladé à ${to} — ${reason}`);
export const resolveWO = (id: string, note: string) => updateWO(id, { status: 'résolu', resolvedAt: Date.now() }, `Résolu — ${note}`);
export const closeWO = (id: string) => updateWO(id, { status: 'clôturé', closedAt: Date.now() }, 'OT clôturé');

export function slaState(w: WorkOrder): { label: string; late: boolean } {
  const end = w.resolvedAt ?? w.closedAt ?? Date.now();
  const late = end > w.dueAt;
  if (w.status === 'résolu' || w.status === 'clôturé') return { label: late ? 'SLA dépassé' : 'Dans le SLA', late };
  const left = w.dueAt - Date.now();
  if (left < 0) return { label: `En retard de ${Math.ceil(-left / H)} h`, late: true };
  return { label: `${Math.floor(left / H)} h restantes`, late: false };
}

export function createMission(input: Omit<Mission, 'id' | 'ref' | 'status' | 'createdAt' | 'history'>): string {
  const id = uid('ms');
  store.set((s) => {
    const seq = s.missionSeq + 1;
    const m: Mission = { ...input, id, ref: `MS-${String(seq).padStart(4, '0')}`, status: 'planifiée', createdAt: Date.now(), history: [ev('Mission créée', who())] };
    return { ...s, missionSeq: seq, missions: [m, ...s.missions] };
  });
  return id;
}

export function updateMission(id: string, patch: Partial<Mission>, log: string) {
  store.set((s) => ({ ...s, missions: s.missions.map((m) => (m.id === id ? { ...m, ...patch, history: [...m.history, ev(log, who())] } : m)) }));
}

/** Conflits de planning : un même véhicule engagé deux fois le même jour. */
export function missionConflicts(missions: Mission[]): Record<string, string[]> {
  const usage: Record<string, string[]> = {};
  missions
    .filter((m) => m.status !== 'annulée' && m.status !== 'terminée')
    .forEach((m) => m.legs.forEach((l) => l.vehicleIds.forEach((v) => (usage[`${v}|${l.date}`] = [...(usage[`${v}|${l.date}`] ?? []), m.id]))));
  const out: Record<string, string[]> = {};
  Object.entries(usage).forEach(([k, ids]) => {
    if (ids.length > 1) ids.forEach((id) => (out[id] = [...(out[id] ?? []), k.split('|')[0]]));
  });
  return out;
}

export function createProject(input: { name: string; siteId: string; budgetK: number; tag?: string }): string {
  const id = uid('pr');
  const spv = SPVS.find((x) => x.siteId === input.siteId)!;
  store.set((s) => ({
    ...s,
    projects: [
      {
        id,
        name: input.name,
        siteId: input.siteId,
        spvId: spv.id,
        budgetK: input.budgetK,
        spentK: 0,
        phases: ['Études', 'Permis', 'Gros œuvre', 'Second œuvre', 'Livraison'].map((n, i) => ({ name: n, status: i === 0 ? 'en cours' : 'à venir' })),
        milestones: [],
        risks: [],
        tag: input.tag,
        history: [ev('Projet créé', who())],
      },
      ...s.projects,
    ],
  }));
  return id;
}

export function updateProject(id: string, fn: (p: Project) => Project, log: string) {
  store.set((s) => ({ ...s, projects: s.projects.map((p) => (p.id === id ? { ...fn(p), history: [...p.history, ev(log, who())] } : p)) }));
}

export function advancePhase(id: string) {
  updateProject(
    id,
    (p) => {
      const i = p.phases.findIndex((x) => x.status === 'en cours');
      const phases = p.phases.map((x, k) => (k === i ? { ...x, status: 'terminée' as const } : k === i + 1 ? { ...x, status: 'en cours' as const } : x));
      return { ...p, phases };
    },
    'Phase suivante',
  );
}

export function closeStep(period: string, stepIndex: number) {
  store.set((s) => {
    const c = s.closes[period] ?? { period, step: 0, log: [] };
    if (c.lockedAt || stepIndex !== c.step) return s;
    let entries = s.entries;
    if (stepIndex === 0) entries = entries.map((e) => (e.period === period ? { ...e, status: 'validée' as const } : e));
    const done: Close = {
      ...c,
      step: c.step + 1,
      lockedAt: stepIndex === CLOSE_STEPS.length - 1 ? Date.now() : undefined,
      log: [...c.log, ev(CLOSE_STEPS[stepIndex].label, who())],
    };
    const docs =
      stepIndex === 4
        ? [{ id: uid('doc'), title: `Liasse de consolidation ${period} (démo)`, at: Date.now(), kind: 'Liasse' }, ...s.docs]
        : s.docs;
    return { ...s, entries, docs, closes: { ...s.closes, [period]: done } };
  });
}

export function setReq(id: string, st: ReqStatus) {
  store.set((s) => ({ ...s, reqStatus: { ...s.reqStatus, [id]: st } }));
}

export function postMessage(text: string, tag?: string) {
  store.set((s) => ({ ...s, messages: [...s.messages, { id: uid('msg'), at: Date.now(), from: who(), text, tag }] }));
}

export function shareDoc(title: string, kind: string) {
  store.set((s) => ({ ...s, docs: [{ id: uid('doc'), title, at: Date.now(), kind }, ...s.docs] }));
}

export const fleetForCategory = (c: VehicleCategoryId) => FLEET.filter((v) => v.categoryId === c);
export const basesInCountry = (cid: string) => BASES.filter((b) => b.countryId === cid);
export { D as DAY_MS, H as HOUR_MS };
