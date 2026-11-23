# Release `release/next`

Cette branche est la ligne de livraison iOS. **Ne pas la fusionner dans `main` sans accord.** `main` publie le site web : le workflow `pages.yml` ne part que sur un push de `main` (export PWA + GitHub Pages). Un merge ici déploierait le web.

Les branches d’origine ne sont pas supprimées.

## Ce que contient cette tête

- `ux/passe-plaisir-2026-11-04` (PR 2) : tête de départ. Apparence système / clair / sombre, accessibilité, vibrations.
- `cursor/fondation-preservation-f216` (PR 3), intégrée : une écriture n’est tenue pour faite qu’après relecture identique ; l’effacement local se confirme en deux temps. Le badge hors ligne garde la phrase de cette PR. Apparence et Vibrations de la PR 2 restent dans Réglages.
- `main` (PR 1 déjà fusionnée) est l’ancêtre : préparation EAS, bundle, fiche App Store. Rien de cela n’est modifié ici.

Aucun historique TestFlight n’est lisible depuis le dépôt (les deux PR ouvertes disent ne pas avoir lancé EAS ; le projet Expo est privé). La tête visuelle préparée est donc la PR 2, avec la préservation par-dessus.

## Vérification avant un binaire

Sur `release/next`, en local :

```bash
npm ci
npm run typecheck
npm run e2e
npx expo export --platform web
```

Le workflow `.github/workflows/ci.yml` lance les trois mêmes contrôles à chaque push et à chaque pull request. Il ne publie rien et ne lance pas EAS.

## Envoyer un build sur TestFlight

À faire par une personne du compte Expo `habib548`, **depuis `release/next`**, pas depuis `main`. Cette note ne lance pas la commande.

1. Être sur `release/next`, avec les contrôles ci-dessus au vert.
2. Build iOS du profil déjà décrit dans `eas.json` (`production`, `autoIncrement`, `EXPO_NO_CAPABILITY_SYNC=1`) :

   ```bash
   npx eas build --platform ios --profile production
   ```

3. Envoi vers App Store Connect / TestFlight, sans soumission App Store :

   ```bash
   npx eas submit --platform ios --profile production --latest
   ```

Le profil `preview` produit une distribution interne (APK Android compris). Ce n’est pas le chemin TestFlight. Le profil `production` est celui du binaire iOS numéroté à distance.

Ne pas changer le bundle `ch.mohamadba.kaneonesuite`, l’équipe `Y9XF9RY2BU`, les entitlements, ni `eas.json`, pour qu’un build reste le même application que les binaires déjà préparés.

Aucune soumission App Store, aucune migration, aucun secret dans cette branche.

## Verre

Les écrans passent par le kit (`Screen`, `Header`, `Card`, `Stat`, `Button`, `Sheet`, `Field`, barre d’onglets). Clair et sombre partagent `src/kit/verre.ts` : voile translucide, arête de reflet, ombre en couches sur les boutons, échelle d’espacement et de typo. « Réduire la transparence » rend les surfaces pleines. « Réduire les animations » coupe ressorts et glissement de feuille. Dynamic Type est laissé au système (plafond ×2, mise en page souple dès ×1,3). Cibles ≥ 44 pt. Contraste AA vérifié sur le voile, y compris devant un aplat blanc.

`userInterfaceStyle` est `automatic` pour que le réglage clair existe aussi sur iOS. Les couleurs de marque et la clé `kaneone-suite@v1` ne changent pas. La clé des vibrations reste `kaneone-suite:vibrations@v1`.

## Questions ouvertes (aucune décision prise ici)

- **Rôles.** Le sélecteur (Administrateur, CFO, Opérations, Mobilité, Portail) remplace la connexion en démo. Il ne décide pas qui, en production, peut voir la finance, clôturer, gérer la GMAO, éditer le dossier, administrer ou ouvrir le portail. La matrice actuelle du code n’a pas été modifiée. L’isolation réelle reste une politique de base (RLS), pas un choix d’interface.
- **Accès portail.** La liste famille / partenaires affichée dans Réglages est une donnée de démonstration. Qui voit quels rapports n’est pas tranché.
- **Apparence par défaut.** Le réglage reste « Système » (comme la PR 2 le proposait, sans le figer). Faut-il forcer le sombre de marque ?
- **Distribution.** TestFlight interne, fiche non répertoriée, ou Apple Business Manager : non choisi. La fiche `store/ios-metadata.md` déconseille une soumission publique en l’état.
- **Décisions `YOUR_*`.** Devise de reporting, GAAP, structure juridique, région d’hébergement, source de taux, seuil d’alerte, signature, autorisations blindés, compte de revue, e-mail de support : toujours des placeholders. Rien n’a été inventé.
