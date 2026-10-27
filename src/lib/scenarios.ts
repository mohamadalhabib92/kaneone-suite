import { isoDay } from '@/kit/format';
import { uid } from '@/kit/store';
import { PEOPLE } from '@/data/demo';
import {
  CLOSE_STEPS,
  DAY_MS,
  assignWO,
  closePeriod,
  closeStep,
  closeWO,
  createMission,
  createProject,
  createWO,
  escalateWO,
  missionConflicts,
  resolveWO,
  startWO,
  store,
  updateMission,
  updateProject,
  advancePhase,
  type Role,
  type State,
} from '@/state';

export type Step = { label: string; run: () => void; done: (s: State) => boolean };
export type Scenario = { id: string; n: number; title: string; summary: string; role: Role; result: string; link: string; steps: Step[] };

const day = (o: number) => isoDay(new Date(Date.now() + o * DAY_MS));
const woBy = (s: State, tag: string) => s.wos.find((w) => w.tag === tag);
const msBy = (s: State, tag: string) => s.missions.find((m) => m.tag === tag);
const prBy = (s: State, tag: string) => s.projects.find((p) => p.tag === tag);
const person = (id: string) => PEOPLE.find((p) => p.id === id)!.name;

export const SCENARIOS: Scenario[] = [
  {
    id: 'saly',
    n: 1,
    title: 'Saly — ampoule grillée',
    summary: 'Incident d’éclairage à Saly : créer l’OT GMAO → assigner → clôturer → visible dans Pilotage.',
    role: 'ops',
    result: 'OT clôturé, visible dans « Activité opérations » du Pilotage.',
    link: '/gmao',
    steps: [
      { label: 'Créer l’OT « Ampoule grillée — couloir R+1 » (Saly)', run: () => createWO({ title: 'Ampoule grillée — couloir R+1', siteId: 'saly', equipmentId: 'eq-saly-light', priority: 'normale', tag: 'scn-saly' }), done: (s) => !!woBy(s, 'scn-saly') },
      { label: 'Assigner au technicien Saly', run: () => assignWO(woBy(store.get(), 'scn-saly')!.id, 'p-ops1', person('p-ops1')), done: (s) => !!woBy(s, 'scn-saly')?.assignee },
      {
        label: 'Intervenir et résoudre',
        run: () => {
          const id = woBy(store.get(), 'scn-saly')!.id;
          startWO(id);
          resolveWO(id, 'Ampoule LED remplacée');
        },
        done: (s) => ['résolu', 'clôturé'].includes(woBy(s, 'scn-saly')?.status ?? ''),
      },
      { label: 'Clôturer l’OT', run: () => closeWO(woBy(store.get(), 'scn-saly')!.id), done: (s) => woBy(s, 'scn-saly')?.status === 'clôturé' },
    ],
  },
  {
    id: 'nkc',
    n: 2,
    title: 'Nouakchott — panne congélateur',
    summary: 'OT critique sur le congélateur négatif CF-01 : escalade, résolution, historique complet.',
    role: 'ops',
    result: 'OT critique clôturé avec historique (création, assignation, escalade, résolution, clôture).',
    link: '/gmao',
    steps: [
      { label: 'Créer l’OT critique « Congélateur CF-01 : température −8 °C »', run: () => createWO({ title: 'Congélateur CF-01 : température −8 °C', siteId: 'nkc', equipmentId: 'eq-nkc-frz1', priority: 'critique', tag: 'scn-nkc' }), done: (s) => !!woBy(s, 'scn-nkc') },
      { label: 'Assigner au frigoriste Nouakchott', run: () => assignWO(woBy(store.get(), 'scn-nkc')!.id, 'p-ops2', person('p-ops2')), done: (s) => !!woBy(s, 'scn-nkc')?.assignee },
      { label: 'Escalader au responsable maintenance groupe', run: () => escalateWO(woBy(store.get(), 'scn-nkc')!.id, person('p-ops3'), 'compresseur hors service, pièce à commander'), done: (s) => !!woBy(s, 'scn-nkc')?.escalatedTo },
      { label: 'Résoudre (compresseur remplacé, −18 °C rétabli)', run: () => resolveWO(woBy(store.get(), 'scn-nkc')!.id, 'compresseur remplacé, −18 °C rétabli'), done: (s) => ['résolu', 'clôturé'].includes(woBy(s, 'scn-nkc')?.status ?? '') },
      { label: 'Clôturer et vérifier l’historique', run: () => closeWO(woBy(store.get(), 'scn-nkc')!.id), done: (s) => woBy(s, 'scn-nkc')?.status === 'clôturé' && (woBy(s, 'scn-nkc')?.history.length ?? 0) >= 5 },
    ],
  },
  {
    id: 'armored',
    n: 3,
    title: 'Mission VIP — SUV blindé',
    summary: 'Créer une mission mobilité en SUV blindé depuis la base Dakar, suivre son statut, produire le rapport.',
    role: 'mobility',
    result: 'Mission terminée avec rapport, comptée dans le reporting Mobilité.',
    link: '/mobilite',
    steps: [
      {
        label: 'Créer la mission (base Dakar, SUV blindé B-01)',
        run: () => createMission({ title: 'Escorte VIP aéroport → Plateau', client: 'Client VIP #C21 (démo)', categoryId: 'armored', pax: 2, notes: 'Protocole sécurité renforcé', legs: [{ baseId: 'b-dkr', date: day(2), from: 'Aéroport AIBD', to: 'Bureaux Plateau', vehicleIds: ['v-a1'] }], tag: 'scn-armored' }),
        done: (s) => !!msBy(s, 'scn-armored'),
      },
      { label: 'Confirmer la mission', run: () => updateMission(msBy(store.get(), 'scn-armored')!.id, { status: 'confirmée' }, 'Mission confirmée'), done: (s) => ['confirmée', 'en cours', 'terminée'].includes(msBy(s, 'scn-armored')?.status ?? '') },
      { label: 'Démarrer la mission', run: () => updateMission(msBy(store.get(), 'scn-armored')!.id, { status: 'en cours' }, 'Mission démarrée'), done: (s) => ['en cours', 'terminée'].includes(msBy(s, 'scn-armored')?.status ?? '') },
      { label: 'Terminer et saisir le rapport', run: () => updateMission(msBy(store.get(), 'scn-armored')!.id, { status: 'terminée', report: 'RAS — itinéraire principal, 42 min.' }, 'Mission terminée + rapport'), done: (s) => msBy(s, 'scn-armored')?.status === 'terminée' && !!msBy(s, 'scn-armored')?.report },
    ],
  },
  {
    id: 'tgz',
    n: 4,
    title: 'Taghazout — travaux',
    summary: 'Projet de développement immobilier lié au site Taghazout : jalons, budget, risques, avancement.',
    role: 'ops',
    result: 'Projet lié au site et à la SPV Taghazout, jalons et budget suivis.',
    link: '/immo',
    steps: [
      { label: 'Créer le projet « Villas Taghazout — tranche 2 » (1 200 k€)', run: () => createProject({ name: 'Villas Taghazout — tranche 2', siteId: 'tgz', budgetK: 1200, tag: 'scn-tgz' }), done: (s) => !!prBy(s, 'scn-tgz') },
      {
        label: 'Planifier les jalons',
        run: () =>
          updateProject(
            prBy(store.get(), 'scn-tgz')!.id,
            (p) => ({ ...p, milestones: [{ id: uid('ms'), title: 'Fondations', due: day(30), done: false }, { id: uid('ms'), title: 'Clos-couvert', due: day(120), done: false }, { id: uid('ms'), title: 'Livraison', due: day(240), done: false }] }),
            '3 jalons planifiés',
          ),
        done: (s) => (prBy(s, 'scn-tgz')?.milestones.length ?? 0) >= 3,
      },
      {
        label: 'Enregistrer un risque',
        run: () => updateProject(prBy(store.get(), 'scn-tgz')!.id, (p) => ({ ...p, risks: [...p.risks, { id: uid('rk'), title: 'Hausse du coût des matériaux', level: 'moyen', mitigation: 'Achats groupés tranche 1 + 2' }] }), 'Risque ajouté'),
        done: (s) => (prBy(s, 'scn-tgz')?.risks.length ?? 0) >= 1,
      },
      {
        label: 'Passer en phase « Permis » et engager 180 k€',
        run: () => {
          const id = prBy(store.get(), 'scn-tgz')!.id;
          advancePhase(id);
          updateProject(id, (p) => ({ ...p, spentK: p.spentK + 180 }), 'Dépense engagée : 180 k€');
        },
        done: (s) => (prBy(s, 'scn-tgz')?.spentK ?? 0) >= 180,
      },
      {
        label: 'Valider le premier jalon',
        run: () => updateProject(prBy(store.get(), 'scn-tgz')!.id, (p) => ({ ...p, milestones: p.milestones.map((m, i) => (i === 0 ? { ...m, done: true } : m)) }), 'Jalon « Fondations » atteint'),
        done: (s) => !!prBy(s, 'scn-tgz')?.milestones[0]?.done,
      },
    ],
  },
  {
    id: 'multi',
    n: 5,
    title: 'Itinéraire multi-pays',
    summary: 'Une mission sur 4 bases et 4 pays, flotte mixte (van, SUV blindé, berline, yacht), planning sans conflit.',
    role: 'mobility',
    result: 'Mission confirmée, 4 étapes / 4 pays, aucun conflit de véhicule.',
    link: '/mobilite',
    steps: [
      {
        label: 'Créer l’itinéraire Saly → Nouakchott → Marrakech → Dubaï',
        run: () =>
          createMission({
            title: 'Tournée investisseurs multi-pays',
            client: 'Délégation #D04 (démo)',
            categoryId: 'van',
            pax: 5,
            notes: 'Flotte mixte',
            tag: 'scn-multi',
            legs: [
              { baseId: 'b-saly', date: day(20), from: 'Aéroport AIBD', to: 'Résidence Saly Océan', vehicleIds: ['v-v1'] },
              { baseId: 'b-nkc', date: day(21), from: 'Aéroport de Nouakchott', to: 'Entrepôt froid', vehicleIds: ['v-a2'] },
              { baseId: 'b-rak', date: day(22), from: 'Aéroport de Marrakech', to: 'Riad Médina', vehicleIds: ['v-s4'] },
              { baseId: 'b-dxb', date: day(24), from: 'Marina Dubaï', to: 'Croisière côtière', vehicleIds: ['v-y1', 'v-s3'] },
            ],
          }),
        done: (s) => !!msBy(s, 'scn-multi'),
      },
      { label: 'Contrôler les conflits de planning', run: () => updateMission(msBy(store.get(), 'scn-multi')!.id, {}, 'Contrôle planning : aucun conflit'), done: (s) => !!msBy(s, 'scn-multi') && !missionConflicts(s.missions)[msBy(s, 'scn-multi')!.id] && msBy(s, 'scn-multi')!.history.length >= 2 },
      { label: 'Confirmer la mission', run: () => updateMission(msBy(store.get(), 'scn-multi')!.id, { status: 'confirmée' }, 'Mission confirmée'), done: (s) => msBy(s, 'scn-multi')?.status === 'confirmée' || msBy(s, 'scn-multi')?.status === 'terminée' },
    ],
  },
  {
    id: 'close',
    n: 6,
    title: 'Clôture mensuelle',
    summary: 'Écritures → élimination intragroupe → conversion EUR → consolidation IFRS → liasse → export & verrouillage (rôle CFO).',
    role: 'cfo',
    result: 'Période verrouillée, liasse générée et partagée dans le Portail.',
    link: '/close',
    steps: CLOSE_STEPS.map((st, i) => ({
      label: st.label,
      run: () => closeStep(closePeriod(), i),
      done: (s: State) => (s.closes[closePeriod()]?.step ?? 0) > i,
    })),
  },
];

export function scenarioProgress(sc: Scenario, s: State) {
  const done = sc.steps.filter((st) => st.done(s)).length;
  return { done, total: sc.steps.length, passed: done === sc.steps.length };
}
