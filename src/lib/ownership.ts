import { ASSETS, COUNTRIES, SPVS } from '@/data/demo';

/**
 * Arbre de détention construit uniquement sur les entités déjà présentes
 * (groupe → pays → SPV → actif). Un pays regroupe, il ne détient pas.
 * Chaque actif du jeu est porté à 100 % par sa SPV : la transparence
 * est alors égale à la détention de la SPV dans le groupe.
 */
export type OwnKind = 'groupe' | 'pays' | 'spv' | 'actif';

export type OwnNode = {
  id: string;
  name: string;
  kind: OwnKind;
  /** null : regroupement, pas une participation. */
  direct: number | null;
  /** Pourcentage économique depuis le groupe (look-through). */
  lookThrough: number;
  /** Route existante, si le nœud ouvre une fiche. */
  href?: string;
  children: OwnNode[];
};

/** Produit de la chaîne. 80 % d’une SPV qui détient 50 % d’un actif = 40 %. */
export function chainLookThrough(parentPct: number, directPct: number): number {
  return Math.round(parentPct * directPct) / 100;
}

export function ownershipTree(): OwnNode {
  return {
    id: 'groupe',
    name: 'Groupe',
    kind: 'groupe',
    direct: 100,
    lookThrough: 100,
    children: COUNTRIES.map((country) => ({
      id: country.id,
      name: `${country.flag} ${country.name}`,
      kind: 'pays' as const,
      direct: null,
      lookThrough: 100,
      children: SPVS.filter((spv) => spv.countryId === country.id).map((spv) => {
        const look = chainLookThrough(100, spv.ownership);
        return {
          id: spv.id,
          name: spv.name,
          kind: 'spv' as const,
          direct: spv.ownership,
          lookThrough: look,
          href: `/site/${spv.siteId}`,
          children: ASSETS.filter((asset) => asset.spvId === spv.id).map((asset) => ({
            id: asset.id,
            name: asset.name,
            kind: 'actif' as const,
            direct: 100,
            lookThrough: chainLookThrough(look, 100),
            href: `/asset/${asset.id}`,
            children: [],
          })),
        };
      }),
    })),
  };
}

export function flattenOwnership(node: OwnNode): OwnNode[] {
  return [node, ...node.children.flatMap(flattenOwnership)];
}
