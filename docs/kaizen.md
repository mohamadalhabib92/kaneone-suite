# Kaizen

## 2026-11-23

Branche `release/next`. Aucune fusion dans `main`. Nom de l’app inchangé. Clés de stockage inchangées (`kaneone-suite@v1`, `kaneone-suite:vibrations@v1`). Aucune fonction retirée.

### 1. Arbre de détention (look-through)

**Avant.** La détention n’existait que comme un pourcentage sur la fiche SPV ou la liasse. Pas de vue d’ensemble du groupe, du type Addepar / Carta.

**Après.** Écran `Détention` : groupe, puis pays (regroupement, sans participation), puis société, puis actif. La transparence est le produit de la chaîne (`chainLookThrough`). Dans le jeu actuel chaque actif est porté à 100 % par sa société, donc la transparence de l’actif égale la détention de la société. Le bandeau dit « Exemple ». Entrées : Pilotage et Plus. Réservé au même droit `internal` que les autres écrans de groupe.

**Fichiers.** `src/lib/ownership.ts`, `src/app/ownership.tsx`, `src/app/(tabs)/plus.tsx`, `src/app/(tabs)/pilotage.tsx`, `scripts/e2e-scenarios.ts`.

**Tests.** `npm run e2e` : 15 sociétés, 15 actifs, Saint-Louis 80 %, Atar 60 %, Dakhla 51 %, actif de Saint-Louis à 80 % en transparence, 80 × 50 = 40, cinq participations partielles, pays sans détention directe.

### 2. Libellés d’exemple à la place des restes « démo » et `YOUR_*`

**Avant.** Badge « Démo » sur chaque écran, bandeau « Démo / Échantillon », jetons `YOUR_SUPPORT_EMAIL` et `YOUR_BUDGET_ALERT_PCT` affichés tels quels, décisions admin montrées par leur code `YOUR_*`, valeurs non configurées recopiées (`YOUR_SUPABASE_URL`).

**Après.** Le chrome dit « Exemple ». Les jetons `YOUR_*` ne sont plus rendus : une valeur non configurée s’affiche « non renseigné », le seuil d’alerte est une phrase, les décisions admin montrent la note. Les scénarios, le rôle et le mode restent. Les enregistrements déjà sur l’appareil ne sont pas réécrits ; seuls les textes du code (jeu initial et libellés) changent.

**Fichiers.** `src/kit/ui.tsx`, `src/kit/config.ts`, `src/components/common.tsx`, `src/app/settings.tsx`, `src/app/welcome.tsx`, `src/app/immo.tsx`, `src/app/project/[id].tsx`, `src/app/asset/[id].tsx`, `src/app/site/[id].tsx`, `src/app/scenarios.tsx`, `src/app/gmao.tsx`, `src/app/(tabs)/pilotage.tsx`, `src/app/(tabs)/finance.tsx`, `src/app/(tabs)/portail.tsx`, `src/app/(tabs)/actifs.tsx`, `src/app/(tabs)/mobilite.tsx`, `src/app/(tabs)/dossier.tsx`, `src/app/close.tsx`, `src/state.ts`, `src/data/demo.ts`, `src/lib/scenarios.ts`.

**Tests.** `npm run e2e` parcourt `src/app` et `src/components` et échoue si un fichier contient `YOUR_`.

### 3. En-tête qui ne comprime plus le titre

**Avant.** Titre, badge et rôle partageaient une seule ligne. « Pilotage groupe » se coupait à côté des pastilles.

**Après.** La ligne d’en-tête passe à la ligne : le titre garde au moins 160 pt, les pastilles descendent au lieu de l’écraser.

**Fichiers.** `src/kit/ui.tsx` (`Header`).

**Tests.** `npx tsc --noEmit`. Pas de test visuel automatique ; le composant est celui de tous les écrans.
