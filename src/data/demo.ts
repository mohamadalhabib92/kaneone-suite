/**
 * JEU DE DONNÉES DE DÉMONSTRATION — « Démo / Échantillon ».
 * Tous les noms, montants et effectifs ci-dessous sont fictifs et servent
 * uniquement à illustrer l'application tant qu'aucune base réelle n'est branchée.
 */

export type CountryId = 'sn' | 'mr' | 'ma' | 'ch' | 'ae';
export type Country = { id: CountryId; name: string; flag: string; currency: string; fxToEur: number };

/** Taux de conversion DÉMO (1 EUR = x devise locale). XOF : parité fixe officielle. */
export const COUNTRIES: Country[] = [
  { id: 'sn', name: 'Sénégal', flag: '🇸🇳', currency: 'XOF', fxToEur: 655.957 },
  { id: 'mr', name: 'Mauritanie', flag: '🇲🇷', currency: 'MRU', fxToEur: 43 },
  { id: 'ma', name: 'Maroc', flag: '🇲🇦', currency: 'MAD', fxToEur: 10.8 },
  { id: 'ch', name: 'Suisse', flag: '🇨🇭', currency: 'CHF', fxToEur: 0.94 },
  { id: 'ae', name: 'Émirats arabes unis', flag: '🇦🇪', currency: 'AED', fxToEur: 3.97 },
];

export type SiteStatus = 'actif' | 'travaux' | 'projet' | 'pause';
export const SITE_STATUS: Record<SiteStatus, string> = { actif: 'Opérationnel', travaux: 'En travaux', projet: 'En projet', pause: 'En pause' };

export type Site = {
  id: string;
  name: string;
  city: string;
  countryId: CountryId;
  activity: string;
  status: SiteStatus;
  headcount: number;
  revenueK: number; // CA annuel démo (k€)
  ebitdaK: number; // EBITDA 12 mois démo (k€)
  occupancy?: number; // %
};

export const SITES: Site[] = [
  { id: 'saly', name: 'Résidence Saly Océan', city: 'Saly', countryId: 'sn', activity: 'Hôtellerie', status: 'actif', headcount: 62, revenueK: 1840, ebitdaK: 520, occupancy: 71 },
  { id: 'dakar', name: 'Bureaux Plateau', city: 'Dakar', countryId: 'sn', activity: 'Immobilier tertiaire', status: 'actif', headcount: 28, revenueK: 640, ebitdaK: 210, occupancy: 88 },
  { id: 'stlouis', name: 'Lodge du Fleuve', city: 'Saint-Louis', countryId: 'sn', activity: 'Hôtellerie', status: 'travaux', headcount: 6, revenueK: 40, ebitdaK: -40 },
  { id: 'nkc', name: 'Entrepôt froid Nouakchott', city: 'Nouakchott', countryId: 'mr', activity: 'Logistique froid', status: 'actif', headcount: 41, revenueK: 960, ebitdaK: 310 },
  { id: 'ndb', name: 'Base logistique Nouadhibou', city: 'Nouadhibou', countryId: 'mr', activity: 'Logistique & mobilité', status: 'actif', headcount: 33, revenueK: 780, ebitdaK: 260 },
  { id: 'atar', name: 'Camp désert Atar', city: 'Atar', countryId: 'mr', activity: 'Écotourisme', status: 'projet', headcount: 0, revenueK: 0, ebitdaK: -15 },
  { id: 'tgz', name: 'Villas Taghazout', city: 'Taghazout', countryId: 'ma', activity: 'Résidentiel locatif', status: 'travaux', headcount: 12, revenueK: 90, ebitdaK: -60 },
  { id: 'rak', name: 'Riad Médina', city: 'Marrakech', countryId: 'ma', activity: 'Hôtellerie', status: 'actif', headcount: 36, revenueK: 1050, ebitdaK: 330, occupancy: 76 },
  { id: 'aga', name: 'Showroom Agadir', city: 'Agadir', countryId: 'ma', activity: 'Commerce', status: 'actif', headcount: 14, revenueK: 420, ebitdaK: 95 },
  { id: 'dkh', name: 'Lodge Dakhla', city: 'Dakhla', countryId: 'ma', activity: 'Écotourisme', status: 'projet', headcount: 0, revenueK: 0, ebitdaK: -10 },
  { id: 'gva', name: 'Siège Genève', city: 'Genève', countryId: 'ch', activity: 'Holding & services', status: 'actif', headcount: 22, revenueK: 900, ebitdaK: 180 },
  { id: 'lsn', name: 'Back-office Lausanne', city: 'Lausanne', countryId: 'ch', activity: 'Services partagés', status: 'actif', headcount: 9, revenueK: 260, ebitdaK: 80 },
  { id: 'dxb', name: 'Marina Dubaï', city: 'Dubaï', countryId: 'ae', activity: 'Mobilité premium & yachting', status: 'actif', headcount: 47, revenueK: 2100, ebitdaK: 690 },
  { id: 'auh', name: 'Bureaux Abu Dhabi', city: 'Abu Dhabi', countryId: 'ae', activity: 'Bureau de représentation', status: 'projet', headcount: 3, revenueK: 0, ebitdaK: -25 },
  { id: 'rkt', name: 'Hangar Ras Al Khaimah', city: 'Ras Al Khaimah', countryId: 'ae', activity: 'Maintenance flotte', status: 'pause', headcount: 5, revenueK: 180, ebitdaK: 55 },
];

export type SPV = { id: string; name: string; siteId: string; countryId: CountryId; legalForm: string; ownership: number; repoId: string };

const LEGAL: Record<CountryId, string> = { sn: 'SAS', mr: 'SARL', ma: 'SARL', ch: 'SA', ae: 'LLC' };
const REPO: Record<CountryId, string> = { sn: 'syscohada-sn', mr: 'pcm-mr', ma: 'cgnc-ma', ch: 'co-ch', ae: 'ifrs-ae' };

export const SPVS: SPV[] = SITES.map((s, i) => ({
  id: `spv-${s.id}`,
  name: `KO ${s.city} ${LEGAL[s.countryId]}`,
  siteId: s.id,
  countryId: s.countryId,
  legalForm: LEGAL[s.countryId],
  ownership: [100, 100, 80, 100, 100, 60, 75, 100, 100, 51, 100, 100, 90, 100, 100][i],
  repoId: REPO[s.countryId],
}));

export type AssetType = 'immobilier' | 'mobilite' | 'autre';
export const ASSET_TYPE: Record<AssetType, string> = { immobilier: 'Immobilier', mobilite: 'Mobilité', autre: 'Autre' };
export type Asset = { id: string; name: string; type: AssetType; spvId: string; siteId: string; countryId: CountryId; valueK: number; acquired: string; status: SiteStatus; description: string };

const ASSET_DEF: [string, AssetType, number, string, string][] = [
  ['Résidence hôtelière 24 clés', 'immobilier', 6200, '2019-04', 'Résidence en front de mer, piscine, restaurant.'],
  ['Plateau de bureaux 1 800 m²', 'immobilier', 3900, '2018-09', 'Bureaux loués à des locataires tiers.'],
  ['Lodge 12 bungalows', 'immobilier', 1100, '2023-02', 'Rénovation complète en cours.'],
  ['Entrepôt froid 2 400 m³', 'autre', 2700, '2020-06', 'Chambres froides positives et négatives.'],
  ['Flotte 4x4 & utilitaires', 'mobilite', 980, '2021-11', 'Véhicules de liaison et 4x4 désert.'],
  ['Terrain 6 ha', 'immobilier', 420, '2024-03', 'Foncier pour camp écotouristique.'],
  ['Ensemble de 6 villas', 'immobilier', 3100, '2022-07', 'Chantier de construction en cours.'],
  ['Riad 14 chambres', 'immobilier', 2600, '2017-05', 'Maison d’hôtes en médina.'],
  ['Showroom 600 m²', 'immobilier', 1300, '2021-01', 'Surface commerciale.'],
  ['Terrain littoral 3 ha', 'immobilier', 650, '2024-09', 'Projet de lodge kitesurf.'],
  ['Flotte berlines de luxe', 'mobilite', 760, '2022-03', 'Berlines avec chauffeurs pour le siège.'],
  ['Équipements IT & licences', 'autre', 190, '2023-06', 'Infrastructure des services partagés.'],
  ['Yacht 24 m', 'mobilite', 3400, '2021-08', 'Unité de croisière côtière avec équipage.'],
  ['Bureaux 300 m²', 'immobilier', 870, '2025-02', 'Bureau de représentation (aménagement).'],
  ['Hangar maintenance 1 200 m²', 'autre', 940, '2020-10', 'Atelier flotte, activité réduite.'],
];

export const ASSETS: Asset[] = SITES.map((s, i) => ({
  id: `a-${s.id}`,
  name: ASSET_DEF[i][0],
  type: ASSET_DEF[i][1],
  valueK: ASSET_DEF[i][2],
  acquired: ASSET_DEF[i][3],
  description: ASSET_DEF[i][4],
  spvId: `spv-${s.id}`,
  siteId: s.id,
  countryId: s.countryId,
  status: s.status,
}));

/** Saisonnalité démo (somme = 1) pour répartir l'EBITDA sur 12 mois glissants. */
export const SEASONALITY = [0.07, 0.075, 0.085, 0.09, 0.085, 0.08, 0.09, 0.095, 0.08, 0.08, 0.08, 0.09];

/* ---------------- Mobilité ---------------- */
export type VehicleCategoryId = 'sedan' | 'armored' | 'van' | 'desert' | 'yacht';
export const VEHICLE_CATEGORIES: { id: VehicleCategoryId; label: string; icon: string; seats: number }[] = [
  { id: 'sedan', label: 'Berlines de luxe', icon: 'car-sport', seats: 3 },
  { id: 'armored', label: 'SUV blindés', icon: 'shield', seats: 4 },
  { id: 'van', label: 'Vans VIP', icon: 'bus', seats: 7 },
  { id: 'desert', label: '4x4 désert', icon: 'compass', seats: 4 },
  { id: 'yacht', label: 'Yachts', icon: 'boat', seats: 10 },
];

export type MobilityBase = { id: string; name: string; countryId: CountryId; siteId?: string };
export const BASES: MobilityBase[] = [
  { id: 'b-dkr', name: 'Base Dakar', countryId: 'sn', siteId: 'dakar' },
  { id: 'b-saly', name: 'Base Saly', countryId: 'sn', siteId: 'saly' },
  { id: 'b-nkc', name: 'Base Nouakchott', countryId: 'mr', siteId: 'nkc' },
  { id: 'b-ndb', name: 'Base Nouadhibou', countryId: 'mr', siteId: 'ndb' },
  { id: 'b-rak', name: 'Base Marrakech', countryId: 'ma', siteId: 'rak' },
  { id: 'b-aga', name: 'Base Agadir', countryId: 'ma', siteId: 'aga' },
  { id: 'b-dkh', name: 'Base Dakhla', countryId: 'ma', siteId: 'dkh' },
  { id: 'b-gva', name: 'Base Genève', countryId: 'ch', siteId: 'gva' },
  { id: 'b-dxb', name: 'Base Dubaï Marina', countryId: 'ae', siteId: 'dxb' },
  { id: 'b-auh', name: 'Base Abu Dhabi', countryId: 'ae', siteId: 'auh' },
  { id: 'b-rkt', name: 'Base Ras Al Khaimah', countryId: 'ae', siteId: 'rkt' },
];

export type Vehicle = { id: string; label: string; categoryId: VehicleCategoryId; baseId: string; armorLevel?: string };
/** Flotte démo — véhicules génériques (aucune marque ni photo). */
export const FLEET: Vehicle[] = [
  { id: 'v-s1', label: 'Berline L-01', categoryId: 'sedan', baseId: 'b-gva' },
  { id: 'v-s2', label: 'Berline L-02', categoryId: 'sedan', baseId: 'b-gva' },
  { id: 'v-s3', label: 'Berline L-03', categoryId: 'sedan', baseId: 'b-dxb' },
  { id: 'v-s4', label: 'Berline L-04', categoryId: 'sedan', baseId: 'b-rak' },
  { id: 'v-a1', label: 'SUV blindé B-01', categoryId: 'armored', baseId: 'b-dkr', armorLevel: 'VR7 (démo)' },
  { id: 'v-a2', label: 'SUV blindé B-02', categoryId: 'armored', baseId: 'b-nkc', armorLevel: 'VR7 (démo)' },
  { id: 'v-a3', label: 'SUV blindé B-03', categoryId: 'armored', baseId: 'b-dxb', armorLevel: 'VR6 (démo)' },
  { id: 'v-v1', label: 'Van VIP V-01', categoryId: 'van', baseId: 'b-saly' },
  { id: 'v-v2', label: 'Van VIP V-02', categoryId: 'van', baseId: 'b-aga' },
  { id: 'v-v3', label: 'Van VIP V-03', categoryId: 'van', baseId: 'b-dxb' },
  { id: 'v-d1', label: '4x4 désert D-01', categoryId: 'desert', baseId: 'b-ndb' },
  { id: 'v-d2', label: '4x4 désert D-02', categoryId: 'desert', baseId: 'b-ndb' },
  { id: 'v-d3', label: '4x4 désert D-03', categoryId: 'desert', baseId: 'b-dkh' },
  { id: 'v-d4', label: '4x4 désert D-04', categoryId: 'desert', baseId: 'b-rkt' },
  { id: 'v-y1', label: 'Yacht Y-24', categoryId: 'yacht', baseId: 'b-dxb' },
  { id: 'v-y2', label: 'Yacht Y-18', categoryId: 'yacht', baseId: 'b-saly' },
];

/* ---------------- Finance ---------------- */
export type FinanceRepo = { id: string; name: string; standard: string; countryId?: CountryId };
export const FINANCE_REPOS: FinanceRepo[] = [
  { id: 'syscohada-sn', name: 'Référentiel Sénégal', standard: 'SYSCOHADA révisé', countryId: 'sn' },
  { id: 'pcm-mr', name: 'Référentiel Mauritanie', standard: 'Plan comptable mauritanien', countryId: 'mr' },
  { id: 'cgnc-ma', name: 'Référentiel Maroc', standard: 'CGNC', countryId: 'ma' },
  { id: 'co-ch', name: 'Référentiel Suisse', standard: 'CO / Swiss GAAP RPC', countryId: 'ch' },
  { id: 'ifrs-ae', name: 'Référentiel Émirats', standard: 'IFRS local', countryId: 'ae' },
  { id: 'ifrs-group', name: 'Référentiel Groupe', standard: 'IFRS — consolidation EUR' },
];

/* ---------------- Dossier Kane One ---------------- */
export type DossierModule = { id: string; title: string; count: number; owner: string };
export const DOSSIER_MODULES: DossierModule[] = [
  { id: 'm01', title: 'Gouvernance & actionnariat', count: 18, owner: 'admin' },
  { id: 'm02', title: 'Structuration juridique des SPV', count: 16, owner: 'admin' },
  { id: 'm03', title: 'Conformité KYC / LBA', count: 15, owner: 'admin' },
  { id: 'm04', title: 'Fiscalité internationale', count: 17, owner: 'cfo' },
  { id: 'm05', title: 'Finance & consolidation', count: 14, owner: 'cfo' },
  { id: 'm06', title: 'Immobilier & foncier', count: 16, owner: 'ops' },
  { id: 'm07', title: 'Mobilité & flotte', count: 15, owner: 'mobility' },
  { id: 'm08', title: 'Opérations & maintenance', count: 15, owner: 'ops' },
  { id: 'm09', title: 'Ressources humaines', count: 16, owner: 'admin' },
  { id: 'm10', title: 'Assurances & risques', count: 14, owner: 'cfo' },
  { id: 'm11', title: 'Systèmes d’information & cybersécurité', count: 16, owner: 'admin' },
  { id: 'm12', title: 'ESG & impact', count: 15, owner: 'admin' },
];

const REQ_TEMPLATES = [
  'Document de référence approuvé',
  'Responsable désigné et suppléant',
  'Procédure écrite à jour',
  'Registre tenu et archivé',
  'Contrôle annuel planifié',
  'Indicateur de suivi défini',
  'Preuve de conformité archivée',
  'Revue par le comité',
  'Plan de remédiation suivi',
  'Délégations de pouvoir formalisées',
  'Matrice des risques mise à jour',
  'Reporting trimestriel produit',
  'Contrats clés inventoriés',
  'Accès et habilitations revus',
  'Budget alloué et suivi',
  'Fournisseurs critiques évalués',
  'Plan de continuité testé',
  'Formation des équipes réalisée',
];

export type Requirement = { id: string; moduleId: string; title: string };
export const REQUIREMENTS: Requirement[] = DOSSIER_MODULES.flatMap((m, mi) =>
  Array.from({ length: m.count }, (_, k) => ({
    id: `${m.id}-${String(k + 1).padStart(2, '0')}`,
    moduleId: m.id,
    title: REQ_TEMPLATES[(k + mi) % REQ_TEMPLATES.length],
  })),
);

/* ---------------- GMAO ---------------- */
export type Equipment = { id: string; name: string; siteId: string; category: string; criticality: 'basse' | 'moyenne' | 'haute' };
export const EQUIPMENT: Equipment[] = [
  { id: 'eq-saly-light', name: 'Éclairage parties communes', siteId: 'saly', category: 'Électricité', criticality: 'basse' },
  { id: 'eq-saly-hvac', name: 'Climatisation centrale', siteId: 'saly', category: 'CVC', criticality: 'haute' },
  { id: 'eq-saly-pool', name: 'Pompe piscine', siteId: 'saly', category: 'Hydraulique', criticality: 'moyenne' },
  { id: 'eq-nkc-frz1', name: 'Congélateur négatif CF-01', siteId: 'nkc', category: 'Froid', criticality: 'haute' },
  { id: 'eq-nkc-frz2', name: 'Chambre froide positive CP-02', siteId: 'nkc', category: 'Froid', criticality: 'haute' },
  { id: 'eq-nkc-gen', name: 'Groupe électrogène 250 kVA', siteId: 'nkc', category: 'Énergie', criticality: 'haute' },
  { id: 'eq-ndb-lift', name: 'Pont élévateur atelier', siteId: 'ndb', category: 'Atelier', criticality: 'moyenne' },
  { id: 'eq-rak-boiler', name: 'Chaudière eau chaude', siteId: 'rak', category: 'CVC', criticality: 'moyenne' },
  { id: 'eq-dkr-elev', name: 'Ascenseur A', siteId: 'dakar', category: 'Levage', criticality: 'haute' },
  { id: 'eq-gva-srv', name: 'Salle serveurs', siteId: 'gva', category: 'IT', criticality: 'haute' },
  { id: 'eq-dxb-dock', name: 'Ponton & bornes quai', siteId: 'dxb', category: 'Marine', criticality: 'moyenne' },
  { id: 'eq-tgz-site', name: 'Base vie chantier', siteId: 'tgz', category: 'Chantier', criticality: 'basse' },
];

export const PREVENTIVE: { id: string; equipmentId: string; task: string; everyDays: number; offsetDays: number }[] = [
  { id: 'pm-1', equipmentId: 'eq-saly-hvac', task: 'Nettoyage filtres & contrôle gaz', everyDays: 90, offsetDays: 6 },
  { id: 'pm-2', equipmentId: 'eq-nkc-frz1', task: 'Dégivrage & contrôle compresseur', everyDays: 30, offsetDays: 2 },
  { id: 'pm-3', equipmentId: 'eq-nkc-gen', task: 'Essai en charge & vidange', everyDays: 60, offsetDays: 12 },
  { id: 'pm-4', equipmentId: 'eq-dkr-elev', task: 'Visite réglementaire ascenseur', everyDays: 180, offsetDays: 25 },
  { id: 'pm-5', equipmentId: 'eq-gva-srv', task: 'Test onduleur & sauvegardes', everyDays: 30, offsetDays: -1 },
  { id: 'pm-6', equipmentId: 'eq-saly-pool', task: 'Contrôle pompe & traitement eau', everyDays: 14, offsetDays: 4 },
];

export const PEOPLE: { id: string; name: string; role: 'ops' | 'mobility' | 'cfo' | 'admin'; siteId?: string }[] = [
  { id: 'p-ops1', name: 'Technicien Saly (démo)', role: 'ops', siteId: 'saly' },
  { id: 'p-ops2', name: 'Frigoriste Nouakchott (démo)', role: 'ops', siteId: 'nkc' },
  { id: 'p-ops3', name: 'Responsable maintenance groupe (démo)', role: 'ops' },
  { id: 'p-ops4', name: 'Conducteur de travaux Taghazout (démo)', role: 'ops', siteId: 'tgz' },
  { id: 'p-mob1', name: 'Dispatcher mobilité (démo)', role: 'mobility' },
  { id: 'p-cfo1', name: 'Directeur financier (démo)', role: 'cfo' },
];

export const countryOf = (id: CountryId) => COUNTRIES.find((c) => c.id === id)!;
export const siteOf = (id: string) => SITES.find((s) => s.id === id);
export const baseOf = (id: string) => BASES.find((b) => b.id === id);
export const vehicleOf = (id: string) => FLEET.find((v) => v.id === id);
export const categoryOf = (id: VehicleCategoryId) => VEHICLE_CATEGORIES.find((c) => c.id === id)!;
export const spvOf = (id: string) => SPVS.find((s) => s.id === id);
export const equipmentOf = (id?: string) => EQUIPMENT.find((e) => e.id === id);
export const personOf = (id?: string) => PEOPLE.find((p) => p.id === id);

export const GROUP = {
  ebitdaK: SITES.reduce((a, s) => a + s.ebitdaK, 0), // 2 580 k€
  headcount: SITES.reduce((a, s) => a + s.headcount, 0), // 318
  activeSites: SITES.filter((s) => s.status === 'actif').length, // 9
  sites: SITES.length, // 15
};
