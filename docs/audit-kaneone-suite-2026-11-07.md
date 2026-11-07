# Audit KaneOne Suite — 7 novembre 2026

Copie de travail à reprendre telle quelle : `/opt/cursor/artifacts/audit-kaneone-suite-2026-11-07.md`.

Audit lu sur `main` à l’empreinte `c485c863be2801b3deb2c15a697938144310af16` (fusion de la PR 1, « Passe 1 — fondations KaneOne, sans écraser le stockage local »). Les numéros de ligne cités comme « source » sont ceux de cette empreinte. La PR ouverte n° 2 (`ux/passe-plaisir-2026-11-04`, finition, mode sombre, accessibilité) n’est ni fusionnée, ni modifiée, ni dupliquée. Cette passe livre un seul correctif : la fondation de préservation décrite en fin de document.

## Diagnostic (5 lignes)

KaneOne Suite est le cockpit local d’un family office multi-holding : pilotage, actifs, mobilité premium, GMAO, projets immobiliers, finance multi-référentiels et portail famille, avec des données d’échantillon étiquetées. Cinq personas sont écrits dans le code : administrateur, directeur financier, opérations, mobilité, portail famille et partenaires. Tout tient dans la clé `kaneone-suite@v1`, sans serveur. La passe 1 empêche déjà d’écraser cette clé tant que le chargement n’a pas réussi, et met de côté un document illisible. Le trou qui reste est qu’une écriture refusée peut quand même avoir l’air faite, et que l’effacement sur mobile part au premier contact.

## Domaine et personas (preuves, pas une devinette sur le nom)

Le nom « KaneOne Suite » est celui du dépôt, de `app.json` (`expo.name`, `slug`) et de l’écran d’accueil. Le domaine vient des textes et des données, pas du seul nom de marque.

- Accueil, `src/app/welcome.tsx` ligne 24 à l’empreinte auditée : « OS family-office & multi-holding — pilotage, actifs, mobilité, finance, dossier. »
- Fiche App Store brouillon, `store/ios-metadata.md` lignes 8 et 14 : sous-titre « Pilotage multi-holding », catégories Business et Finance. Rien n’a été soumis.
- Référentiel, `src/data/demo.ts` : 5 pays (Sénégal XOF, Mauritanie MRU, Maroc MAD, Suisse CHF, Émirats AED), 15 sites, 15 SPV, 6 référentiels (SYSCOHADA révisé, plan comptable mauritanien, CGNC, CO / Swiss GAAP RPC, IFRS local, IFRS consolidation EUR) lignes 154-161. Totaux de démonstration `GROUP` lignes 254-259 : EBITDA 2 580 k€, 318 personnes, 9 sites actifs sur 15.
- Personas, `src/state.ts` lignes 7-13 : Administrateur ; Directeur financier (CFO) ; Opérations ; Kane Prestige Mobility ; Portail famille / partenaires. Les droits sont un tableau dans l’application (lignes 16-24), pas un compte.

Pédagogie : sans objet. Les six scénarios (`src/lib/scenarios.ts`) sont des parcours de démonstration produit (Saly, Nouakchott, SUV blindé, Taghazout, itinéraire multi-pays, clôture). Il n’y a ni apprenant, ni parcours scolaire, ni évaluation.

## Concurrents nommés, pages consultées le 7 novembre 2026

Aucun de ces produits ne couvre à lui seul le périmètre lu dans le code (family office + GMAO + mobilité + immobilier + clôture multi-référentiels + portail). Ce sont des voisins vérifiés, par tranche.

| Produit | Tranche comparable | Source lue |
|---|---|---|
| Addepar | Family office, détention look-through, portail, droits par rôle | https://addepar.com/family-offices |
| Masttro | Plateforme family office, entités, actifs, infrastructure présentée comme suisse | https://masttro.com/family-office-software |
| Lucanet | Consolidation, multi-normes, devises, éliminations intragroupe | https://www.lucanet.com/en/solutions/financial-consolidation/ |
| IBM Maximo | GMAO : ordres de travail, préventif, statuts | https://www.ibm.com/products/maximo/asset-management et https://www.ibm.com/docs/en/maximo-manage/cd?topic=module-work-order-tracking |
| Odoo | Localisations fiscales dont SYSCOHADA, Sénégal, Maroc, Suisse, Émirats | https://www.odoo.com/documentation/19.0/applications/finance/fiscal_localizations.html et notes 16.1 SYSCOHADA https://www.odoo.com/odoo-16-1-release-notes |

Écart utile : Addepar et Masttro partent du patrimoine et des dépositaires ; Lucanet part de la liasse ; Maximo part de l’actif technique ; Odoo part de la comptabilité société. KaneOne, dans cette version, montre ces tranches côte à côte sur un seul document local de démonstration, sans agrégation bancaire et sans isolation réelle des rôles.

## Tableau

Priorité P0 = perte ou mensonge sur les données déjà là. P1 = risque sérieux avant tout usage réel. P2 = qualité avant une diffusion privée. P3 = plus tard. Effort 1 = correctif local déjà borné. 5 = autre produit (serveur, store, réécriture).

| Élément | Problème | Solution concrète | Impact | Effort | Priorité |
|---|---|---|---|---|---|
| Écriture disque (`src/kit/store.ts` 52-61) | `setItem` en échec est ignoré. L’écran montre déjà la nouvelle valeur. | File d’attente, relecture identique, bandeau « Non enregistré », bouton Réessayer. Ne déclarer l’écriture faite qu’après relecture. | Une saisie d’OT, d’écriture ou de mission survit à l’écran et peut être renvoyée. | 2 | P0 |
| Course d’écritures (même fonction) | Deux `setItem` peuvent se terminer dans le désordre : l’ancienne valeur reste sur le disque. | Une seule écriture à la fois ; une écriture dépassée ne valide pas l’enregistrement. | La dernière saisie est celle qui reste si le stockage répond. | 2 | P0 |
| Effacement (`src/app/settings.tsx` 17-18) | Sur mobile le dialogue vaut toujours oui. Sur le web, `confirm?.(...) ?? true` efface aussi si `confirm` manque. | Deux boutons séparés : Annuler, puis Effacer définitivement. Aucune phrase à taper. | L’annulation laisse la clé intacte. L’effacement est un acte à part. | 2 | P0 |
| Quarantaine (`src/components/storage-notices.tsx` 28-31) | Le bandeau publie le nom de la clé de copie. « J’ai compris » enchaîne vers l’effacement. | Texte neutre, sans contenu ni nom de clé. Export seulement sur action. Annuler distinct de Confirmer l’effacement. | Le document illisible n’est pas étalé. La copie ne part pas toute seule. | 2 | P0 |
| Schéma ancien et champs futurs (`src/kit/store.ts` 91) | La fusion garde déjà les clés présentes, mais rien ne le verrouille. Une édition suivante pourrait les perdre. | `mergeStored` : toute clé déjà présente reste, y compris inconnue. Test de bout en bout après édition. | OT, écritures, notes, documents, imports, pièces, calendrier et ids historiques restent. | 2 | P0 |
| Badge hors ligne (`src/app/_layout.tsx` 42) | Le texte dit « rien n’est perdu ». | Le laisser à la PR 2, qui possède ce fichier. Le bandeau d’échec dit le contraire quand l’écriture rate. | Le slogan reste trop large tant que la PR 2 n’est pas reprise. | 1 | P1 |
| Rôles (`src/state.ts` 16-24, accueil 42-44) | Changer de puce ouvre tout le même document. Pas de déconnexion : il n’y a pas de session. | Hors de cette passe. Plus tard : droits côté base, quand une base existera. Ici, ne pas ajouter de faux verrou. | Un rôle « portail » n’isole rien sur l’appareil. | 5 | P1 |
| CI (`.github/workflows/pages.yml` 27-29) | Le workflow typecheck et publie la PWA. Il ne lançait pas les tests. | Ajouter `npm run e2e` avant le typecheck. La publication GitHub Pages existante ne part que si les tests passent, et seulement après fusion sur `main`. Cette passe ne pousse pas `main`. | La fondation casse la publication si elle régresse. | 1 | P1 |
| Bascule de schéma future | Aucune porte : un futur changement de forme pourrait réécrire la clé vivante. | Module `src/kit/cutover-gate.ts`, non branché au démarrage : instantané, copie isolée, empreinte, comptes, retour arrière sur la seule clé isolée. | La clé `kaneone-suite@v1` n’est pas migrée. | 2 | P1 |
| iPad / grands écrans (`app.json` 17, `src/kit/ui.tsx` 111) | `supportsTablet` est vrai. Le contenu est plafonné à 820 px, centré. Pas de disposition tablette dédiée. | Garder la colonne. Une passe ultérieure élargit les tableaux Finance et GMAO, sans réécrire l’app. | L’iPad affiche une colonne lisible, avec de grandes marges. | 3 | P2 |
| RTL et langues (`app.json` 26 et 78) | Langue source français (`fr`). Aucun `I18nManager`, aucune direction droite-à-gauche. Les pays du jeu incluent des contextes arabes (MR, AE, MA). | Ne pas traduire dans cette passe. Passe dédiée si Mohamed veut l’arabe, avec les chiffres et les tableaux. | L’interface actuelle est française, de gauche à droite. | 4 | P2 |
| Accessibilité | La passe 1 mesure un contraste ≥ 4,5:1 sur les paires du thème. La PR 2, ouverte, ajoute lecteurs d’écran, grand texte, vibrations. | Ne pas refaire cette PR. | Le socle AA des couleurs est là. Le clavier complet et les listes alternatives restent ouverts (checklist de la PR 1). | 3 | P2 |
| Performance / batterie | Débounce 150 ms déjà là. Pas de GPS. NetInfo écoute le réseau (`src/kit/net.tsx`). La relecture ajoute une lecture à chaque écriture réussie. | Accepté : une lecture de plus, pas de tâche de fond. | Coût faible face au mensonge d’une écriture ratée. | 1 | P3 |
| Sécurité applicative | Pas de secret dans `EXPO_PUBLIC_*` (test e2e). Flags IA, banque, signature et push forcés à false (`src/config.ts` 16-21). Sentry muet si le DSN est un placeholder. | Conserver. Le journal local ne doit pas recevoir de secret (déjà testé dans e2e). | Le binaire de démo n’appelle pas ces services. | 2 | P1 |
| nLPD / RGPD | Politique `public/privacy/index.html` ligne 21 : nLPD et RGPD, données sur l’appareil. Responsable nommé dans cette page. Les rôles ne sont pas une base légale de traitement réel. | Avant tout compte en ligne : mettre à jour la politique, choisir `YOUR_DATA_REGION`, et séparer les accès. | Aujourd’hui l’éditeur ne reçoit pas les saisies. GitHub Pages peut journaliser l’accès au site. | 4 | P1 |
| Linguistique | Français cohérent sur les écrans lus. Quelques libellés techniques (IFRS, SPV, SLA, CSV). | Garder le français. Glossaire seulement si l’arabe ou l’anglais d’interface est décidé. | Lisible pour les personas décrits, en français. | 2 | P3 |
| IA et coûts | `FEATURE_AI` est false. `OPENAI_API_KEY` n’est pas lue par l’app (README et `src/config.ts` 43). Aucun appel, donc aucun coût. | Ne pas allumer l’IA. Un plafond de dépense n’a de sens qu’avec un serveur. | Zéro appel, zéro dépense IA dans cette version. | 1 | P2 |
| Stores | Brouillon App Store seulement. Risque 2.1 / 4.2 et 3.2 noté dans `store/ios-metadata.md` 69-73 : démo et app d’un groupe. | Ne pas construire avec EAS, ne pas soumettre. | Pas de fiche publique à partir de cette passe. | 1 | P0 (interdiction) |
| Croissance et monétisation | Prix « Gratuit » dans le brouillon. Pas de paiement dans l’app. | Rester gratuit tant que les chiffres sont des échantillons. Pas d’achat intégré sur des données fictives. | Pas de revenu, pas de tromperie commerciale. | 2 | P2 |
| KPI | Les KPI écran (EBITDA, sites, effectif) sont des constantes de démo, badge Démo. | Les garder étiquetés. Un KPI réel attend une source que Mohamed validera (`YOUR_FX_RATE_SOURCE`, `YOUR_REPORTING_CURRENCY`). | Personne ne peut prendre 2 580 k€ pour un solde. | 2 | P1 |
| Synergies | OT, missions, projets, écritures, documents et portail sont le même document. Pratique pour la démo. | Interdire le profilage croisé : ne pas relier un membre du portail à des OT ou à des écritures nominatives. Les jeux actuels utilisent des libellés « #démo ». | Pas de fiche personne cachée. Le partage est le document entier, ce qui est le sujet des rôles. | 3 | P1 |

## Données critiques — ce que le schéma contient vraiment

Clé inchangée : `kaneone-suite@v1` (`src/state.ts`, `createPersistedStore(..., 1)`).

| Besoin cité | Où c’est dans ce dépôt | Traitement |
|---|---|---|
| Tâches | `wos` : ordres de travail, id, ref, historique | Conservés tels quels |
| Notes | `missions[].notes`, historiques `Ev` | Conservées |
| Documents | `docs` | Conservés |
| Calendrier | pas d’objet calendrier ; dates dans `missions[].legs[].date`, jalons, `dueAt` | Clés présentes conservées ; une clé inconnue `calendar` aussi |
| Écritures et finance | `entries` (id, débit, crédit, compte, SPV, période), `closes` | Id et montants conservés |
| Messages portail | `messages` | Conservés |
| Imports, pièces jointes | absents du type `State` | S’ils apparaissent comme clés (`imports`, `attachments`), ils restent |
| Ids historiques | `wo-1`, `m-1`, `pr-stl`, et tout id déjà écrit | Non régénérés quand la clé est présente |

`seedEntries` (`src/state.ts` 144-164) fabrique des ids avec `uid()` pour un **nouvel** état mémoire, quand aucune donnée n’est encore sur le disque. Un document déjà enregistré qui contient `entries` ne passe pas par cette régénération. Limite : un document partiel qui **omet** la clé `entries` recevrait, à la prochaine édition, la graine du moment. Les sauvegardes produites par cette app écrivent l’objet entier ; le test verrouille le document complet.

Il n’y a pas de déconnexion. Changer de rôle écrit `role` et laisse le reste. L’effacement est l’unique vidage, et il est maintenant en deux temps.

## Ce que cette passe change

Un seul fil : dire la vérité sur l’enregistrement, et séparer l’annulation de l’effacement, sans réécrire l’app.

- Échec d’écriture (exception ou relecture différente) : bandeau visible, réessai, la valeur à l’écran reste. Aucun toast de succès.
- Les écritures s’enchaînent. Une écriture plus ancienne ne confirme pas la plus récente.
- Quarantaine : texte neutre, contenu non affiché, export seulement si l’on appuie sur « Exporter la copie ».
- Effacement des données de l’appareil, et remplacement d’un original illisible : Annuler d’un côté, confirmation de l’autre. `reset` et `startFresh` ne font rien sans cette demande.
- `mergeStored` garde les clés déjà là et ne complète que les clés absentes.
- `rehearseCutover` / `rollbackIsolated` : exercice sur des clés `.snapshot-` et `.isolated-`. Aucun appel au démarrage. La clé vivante n’est pas écrite par cet exercice.
- Le workflow Pages lance `npm run e2e` avant publication. Cette passe ne déclenche pas ce workflow.

Ce qui n’est pas fait, volontairement : pas de sauvegarde ni de restauration utilisateur, pas de promesse de zéro perte, pas de backend, pas de réécriture Swift ou web, pas de nouveau module, pas de flag qui allume une fonction absente, pas de build EAS, pas de soumission, pas de migration de la clé vivante, pas de message envoyé à un tiers.

## Top 5 de la semaine

1. **Fondation de préservation** — faite dans la PR de cette passe. Critère : les tests cités plus bas restent verts.
2. **Phrase du badge hors ligne** — remplacer « rien n’est perdu » dans `src/app/_layout.tsx` une fois la PR 2 intégrée, pour ne pas la contredire. Le bandeau d’échec couvre déjà le cas « écriture ratée ».
3. **Ne pas publier** — ni App Store, ni Play, ni EAS, tant que les rôles sont une puce et les montants des échantillons.
4. **Graine d’écritures** — ids stables pour un premier lancement vide, sans réécrire un document qui a déjà ses ids.
5. **Contrat de rôles sur papier** — décrire, sans coder de serveur, quelles lignes du document chaque persona peut lire. Le portail ne doit pas devenir un profil croisé des opérations et de la famille.

## Cibles mesurables

| Cible | Seuil | Mesure du 7 novembre 2026 |
|---|---|---|
| Écriture avant chargement réussi | 0 | `npm run test:store` vert (cas déjà là depuis la PR 1, rejoué) |
| Échec `setItem` ou relecture différente | bandeau non enregistré, réessai, pas de faux succès | même commande, cas disque plein et disque menteur |
| Annuler après armement | 0 octet supprimé | même commande |
| Document ancien + champ futur après édition | ids `wo-1`, `e-historique`, `doc-1`, `imp-1`, `att-1`, `cal-1`, `futureField.keep` présents | même commande |
| Exercice de bascule | clé vivante byte-identique ; comptes `wos=1`, `entries=1`, `__keys=3` ; retour arrière sur l’isolé seulement | même commande |
| Scénarios de démo | 6/6 | `npm run e2e` → `Passe 1 : 6/6 scénarios, contraste AA, stockage kaneone-suite@v1` |
| Typecheck | 0 erreur | `npx tsc --noEmit` code de sortie 0 |
| Phrase secrète ou nom de clé dans l’UI | 0 | le test lit les textes et les fichiers d’écran |
| Appels réseau métier au démarrage | 0 | e2e : `fetch` interdit dans `src/`, Sentry non contacté |
| Tests déjà rouges sur `main` | aucun trouvé | `test:store` et `e2e` verts avant et après le correctif |
| Perte nulle garantie | non revendiquée | le bandeau dit l’échec ; il n’y a pas de copie de restauration |

Limites de la mesure : pas d’appareil iOS, pas de disque réellement plein (l’échec est simulé par une exception), pas d’ESLint dans le dépôt, pas de soumission store. Parcours web joué dans Chrome headless : entrée Administrateur, Réglages, premier bouton d’effacement, puis Annuler. La clé `kaneone-suite@v1` reste identique (16 819 octets). « Effacer définitivement » n’apparaît qu’après ce premier bouton et disparaît sur Annuler.

## Cinq prompts détaillés (prochaines passes, pas celle-ci)

### Prompt A — Badge honnête, après la PR 2

Sur `kaneone-suite`, après fusion de la PR 2, une seule ligne : le badge hors ligne de `src/app/_layout.tsx`. Remplacer la promesse « rien n’est perdu » par une phrase qui dit que les données restent sur l’appareil lorsque l’écriture a été relue. Ne pas refaire le thème, les vibrations, ni l’apparence. Ne pas toucher à `kaneone-suite@v1`. Test : le texte source ne contient plus « rien n’est perdu ». `npm run e2e` reste 6/6. Pas de build EAS, pas de fusion vers `main` sans revue.

### Prompt B — Ids de graine stables, documents déjà là intacts

`seedEntries` dans `src/state.ts` appelle `uid()` à chaque création d’état initial. Pour un stockage vide, figer des ids déterministes de démonstration. Si `kaneone-suite@v1` contient déjà `entries`, ne pas régénérer, ne pas réécrire au simple chargement. Test : un JSON historique avec `e-historique` est identique sur le disque après `hydrate`, et le reste après une édition d’un autre champ. Pas de migration, pas de seconde clé de sauvegarde utilisateur.

### Prompt C — Tableaux larges iPad, sans nouvelle fonction

Sur les écrans Finance et GMAO, au-dessus de 900 px de large, laisser le tableau utiliser la largeur au lieu de rester dans 820 px, tout en gardant la colonne téléphone. Vérifier le contraste déjà testé et un libellé d’accessibilité par ligne. Pas de nouveau module, pas de backend. Capture iPad et iPhone, ou mesure de layout si le simulateur manque. `npm run e2e` 6/6.

### Prompt D — Contrat de lecture par persona, sans serveur

Écrire un tableau, dans un document du dépôt, qui dit pour chaque rôle (admin, cfo, ops, mobility, portail) quelles clés de `State` il est censé voir le jour où une base existera. Ne pas coder Supabase, ne pas allumer `mode: real`, ne pas filtrer les données de façon à faire croire que c’est sûr. Le portail ne reçoit pas de lien vers l’identité d’un technicien ou d’un membre de la famille au-delà des libellés déjà fictifs. Mohamed valide `YOUR_DATA_REGION` avant toute suite.

### Prompt E — Exercice de bascule, toujours hors de la clé vivante

Quand un nouveau champ sera vraiment décidé, appeler `rehearseCutover` sur une copie du JSON, comparer empreinte et comptes (`wos`, `missions`, `projects`, `entries`, `docs`, `messages`, `closes`, et `__keys`), et `rollbackIsolated` si ça diverge. Refuser la passe si la clé `kaneone-suite@v1` est écrite par l’exercice. Ajouter un test avec un champ futur et un id ancien. Ne pas brancher cet appel dans `hydrate`. Pas de restauration proposée dans Réglages.

## Axes (détail)

### 1. Vision

Tenir sur un seul écran le pilotage d’un groupe qui a des sites, des SPV, une flotte, des chantiers et une clôture. La version actuelle le montre avec un échantillon. Elle ne remplace pas Addepar, Lucanet ou Maximo. La décision utile pour Mohamed : usage interne de démonstration, pas une fiche publique.

### 2. Fonctionnalités

Présentes et locales : rôles-démo, pilotage, actifs, mobilité (conflits de véhicule), GMAO (SLA, préventif), Immo, finance et clôture en 6 étapes, dossier 12 modules / 187 exigences, portail, 6 scénarios, réglages. Absentes, et annoncées comme telles : sync, IA, banque, signature, push, PDF mobile (`expo-print` reporté). Cette passe n’en ajoute aucune.

### 3. UX iPhone, iPad, web

`supportsTablet: true`, orientation libre, PWA `lang: fr`, colonne max 820. Le web sert sous `/kaneone-suite` ; un build EAS retire `baseUrl` (`app.config.js`, déjà testé). Points d’entrée clairs par rôle. L’effacement était le geste le plus dangereux de l’écran Réglages : un contact suffisait sur mobile.

### 4. RTL et accessibilité

Français, gauche à droite. Contraste des jetons mesuré dans e2e. Cibles 44 pt déjà posées sur les boutons du kit. La PR 2 couvre le lecteur d’écran et le grand texte : elle reste ouverte, non reprise ici. L’arabe n’est pas dans l’interface malgré les pays du jeu.

### 5. Architecture et hors-ligne

Expo Router, un store AsyncStorage / localStorage, zéro fetch métier. Le mode hors ligne est le mode normal. « Continuer hors ligne » (délai 4 s) n’écrit pas par-dessus une clé déjà remplie : c’est le contrat de la PR 1, toujours testé. Cette passe y ajoute la vérité sur l’échec d’écriture.

### 6. CI et tests

`npm run test:store` et `npm run e2e` existent depuis la PR 1. Le workflow Pages ne les lançait pas. Il les lance maintenant, puis typecheck, puis le build web déjà présent. Aucun test rouge préexistant n’a été trouvé sur cette empreinte.

### 7. Performance et batterie

Pas de géolocalisation, pas de minuteur permanent. Le débounce reste 150 ms. La file et la relecture coûtent une lecture par sauvegarde. C’est le prix pour ne pas afficher un succès faux.

### 8. Sécurité

Surface actuelle : le document sur l’appareil, le site statique, les placeholders `YOUR_*`. Pas de clé bancaire, pas d’IBAN. Le risque réel avant une base est le rôle qui ne protège rien, et une copie de quarantaine exportée vers une cible choisie par la personne (feuille de partage ou téléchargement). L’export n’est pas chiffré. Il ne s’affiche pas dans l’écran.

### 9. nLPD, RGPD, rôles

La politique dit que les saisies restent sur l’appareil. C’est exact tant qu’aucun serveur n’est branché. Les cinq personas sont des libellés. Le jour d’un compte, il faudra une base légale, une région, et des droits qui ne vivent pas dans le téléphone. Cette passe ne crée pas de traitement nouveau.

### 10. Linguistique et pédagogie

Français de travail, termes métier assumés (liasse, SPV, OT, SLA). Pédagogie : sans objet, voir plus haut.

### 11. IA, garde-fous, coûts

Aucun modèle n’est appelé. Aucun plafond n’est nécessaire tant que le flag reste false. Le garder false est le garde-fou.

### 12. Stores, croissance, monétisation, KPI, synergies

Store : brouillon seulement, distribution publique déconseillée par la propre fiche du dépôt. Croissance : un groupe, pas une place de marché. Monétisation : gratuit, et les chiffres sont faux au sens où ils sont des échantillons — les faire payer serait induire. KPI : ceux de `GROUP` et de la liasse (`src/lib/finance.ts`) portent le badge Démo. Synergie : un document unique aide la démo et empêche toute cloison. Ne pas construire, par-dessus, de profil qui croiserait famille, salariés et écritures. Les libellés actuels sont du type « Membre famille #1 (démo) ».

## Fondation livrée — fichiers

- `src/kit/store.ts` — file, relecture, armement, fusion des clés
- `src/kit/cutover-gate.ts` — portes, non branchées au lancement
- `src/kit/preservation-copy.ts` — textes sans document brut
- `src/components/storage-notices.tsx` — quarantaine et échec d’écriture
- `src/components/local-erase.tsx` — Annuler / Effacer définitivement
- `src/app/settings.tsx` — branche le composant d’effacement (seul fichier en commun avec la PR 2 ; les sections Apparence et Vibrations de cette PR ne sont pas reprises)
- `scripts/store-guard.test.ts` — cas ajoutés
- `.github/workflows/pages.yml` — `npm run e2e` avant le reste
- `README.md` — limites dites sans promesse de zéro perte

## Chevauchements

| PR | État | Rapport avec cette passe |
|---|---|---|
| n° 1 `cursor/passe-1-fondations-dc82` | fusionnée, `c485c863` | Vérifiée. Chargement, copie d’un blob illisible, contraste, portail. Non refaite. |
| n° 2 `ux/passe-plaisir-2026-11-04` | ouverte | Non modifiée. Fichiers laissés : thème, haptique, `state.ts` (`appearance`), `_layout.tsx`, `ui.tsx`, e2e accessibilité. `settings.tsx` est touché ici seulement pour retirer l’effacement en un geste. |
