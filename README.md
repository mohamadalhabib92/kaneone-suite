# KaneOne Suite

Suite de pilotage multi-holding (family office) : pilotage groupe, actifs, mobilité premium (Kane Prestige Mobility), GMAO, projets immobiliers (Kane Immo), finance & clôture IFRS, Dossier Kane One et portail famille/partenaires.

Recréée from scratch en **Expo (React Native + expo-router + TypeScript)**, à partir de la spécification (`vibecode-deploy-prompts/06-kaneone-suite.md`), car le code source Vibecode d’origine n’était pas disponible. Elle tourne sur iOS, Android et le web, et s’exporte en **PWA installable**.

> ⚠️ **Démo / Échantillon** : toutes les données (sites, SPV, montants, flotte, écritures) sont fictives et clairement étiquetées dans l’interface. Aucun solde réel, IBAN ou clé n’est embarqué.

## Fonctionnalités (100 % locales, hors ligne)

| Module | Contenu |
|---|---|
| Rôles (démo) | Administrateur, CFO, Opérations, Mobilité, Portail : l’onglet et les actions visibles dépendent du rôle (le rôle remplace l’auth en démo) |
| Pilotage | KPIs groupe (EBITDA 12 mois, sites actifs, effectif, OT), graphique mensuel, filtres par pays, drill-down site → SPV → KPIs, export CSV |
| Actifs | 15 actifs, filtres pays / type / statut, fiche actif (SPV, détention, quote-part, flotte, maintenance) |
| Mobilité | 5 catégories, 11 bases dans 5 pays, flotte, missions multi-étapes / multi-pays, détection de conflits véhicule, statuts, rapport, historique |
| GMAO | Inventaire équipements, OT (créer, assigner, démarrer, escalader, résoudre, clôturer), SLA par priorité, plans préventifs « Générer OT » |
| Kane Immo | Projets : phases, budget/engagé, jalons, risques, SPV et site liés |
| Finance | 6 référentiels (SYSCOHADA, MA, CH, EAU, groupe IFRS…), écritures, liasse de consolidation EUR avec élimination intragroupe, export CSV, impression/PDF (web) |
| Clôture | Clôture mensuelle guidée en 6 étapes (CFO uniquement), export CSV de la liasse, verrouillage, partage automatique dans le portail |
| Dossier Kane One | 12 modules / 187 exigences (ouvert → en cours → validé), export du pack comité |
| Portail | Lecture seule : KPIs, documents partagés, messages |
| Scénarios | 6 scénarios de démonstration exécutables pas à pas (Saly, Nouakchott, blindé, Taghazout, multi-pays, clôture) |
| Paramètres | « Configuration manquante », changement de rôle, bascule démo/réel (désactivée sans base), accès portail, notes sécurité, réinitialisation |

## Lancer en local

```bash
npm install
npx expo start          # i = iOS, a = Android, w = web
npm run typecheck       # tsc --noEmit
```

## Build web / PWA

```bash
npm run build:web       # expo export -p web + manifest, service worker, icônes
npm run serve:web       # http://localhost:8080/kaneone-suite/
```

`dist/` contient `manifest.webmanifest`, `sw.js` (pré-cache hors ligne), icônes 192/512/maskable, `404.html` (routage SPA) et `.nojekyll`.

## GitHub Pages

Le workflow `.github/workflows/pages.yml` construit et publie `dist/` à chaque push sur `main` (activer **Settings → Pages → Source : GitHub Actions**).
`app.json → expo.experiments.baseUrl` vaut `/kaneone-suite` : **le dépôt doit s’appeler `kaneone-suite`**, sinon ajustez cette valeur.

## Configuration (placeholders)

Copiez `.env.example` en `.env`. Sans configuration, l’app reste entièrement utilisable en mode démo local.

| Variable | Usage | Statut |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Auth + base de données | `YOUR_SUPABASE_URL` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Clé publique anon (protégée par RLS) | `YOUR_SUPABASE_ANON_KEY` |
| `EXPO_PUBLIC_API_BASE_URL` | API serveur (PDF serveur, sync) | `YOUR_API_BASE_URL` |
| `OPENAI_API_KEY` | Assistants IA — **serveur uniquement**, Phase 2 | `YOUR_OPENAI_API_KEY` |

Ne mettez **jamais** de secret dans une variable `EXPO_PUBLIC_*` : elles sont embarquées dans l’app.

## Limites connues

- Pas de backend : les données vivent sur l’appareil (AsyncStorage / localStorage), sans synchronisation multi-utilisateur. Le « mode réel » Supabase (auth, RLS, sync) est en Phase 2.
- Les rôles sont un sélecteur de démo, pas une sécurité : en production, l’isolation doit être faite côté base (RLS).
- Taux de change et montants de démonstration ; pas de connexion bancaire.
- PDF : impression navigateur sur le web ; sur mobile, export CSV (expo-print en Phase 2).
- Assistants IA : Phase 2, côté serveur.
