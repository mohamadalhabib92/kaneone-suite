import { mix } from './contrast';

/**
 * Verre — tokens partagés (clair et sombre).
 * Le fond de page reste opaque (contraste AA). Les surfaces posent un voile
 * translucide, un reflet en arête haute et une ombre. « Réduire la transparence »
 * remplace le voile par la surface pleine.
 */

/** Échelle d’espacement, en points. */
export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export type TypeRole = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'caption' | 'label' | 'mono';

/** Tailles de référence. Dynamic Type les multiplie (plafond TYPE_MAX). */
export const typeScale: Record<TypeRole, { fs: number; fw: '400' | '500' | '600' | '700' | '800'; lh: number }> = {
  display: { fs: 32, fw: '800', lh: 38 },
  h1: { fs: 24, fw: '800', lh: 30 },
  h2: { fs: 19, fw: '700', lh: 25 },
  h3: { fs: 16, fw: '700', lh: 22 },
  body: { fs: 15, fw: '400', lh: 21 },
  small: { fs: 13, fw: '400', lh: 18 },
  caption: { fs: 12, fw: '600', lh: 16 },
  label: { fs: 12, fw: '700', lh: 16 },
  mono: { fs: 13, fw: '500', lh: 18 },
};

/** Cible tactile minimale (44 pt). */
export const HIT = 44;

/** Dynamic Type : le système peut agrandir jusqu’ici. Au-delà, la mise en page du kit s’ouvre déjà dès ×1,3. */
export const TYPE_MAX = 2;

/**
 * Part de la surface dans le voile. Assez haute pour que le texte atténué
 * reste AA même si un aplat clair défile derrière.
 */
export const GLASS_ON_PAGE = 0.92;

/** Couleur pleine équivalente au voile (fond `page` derrière `surface`). */
export function glassComposite(surface: string, page: string, alpha = GLASS_ON_PAGE): string {
  return mix(surface, page, alpha);
}

export function hexAlpha(hex: string, a: number): string {
  const n = Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex.slice(0, 7)}${n}`;
}

export type GlassPaint = {
  backgroundColor: string;
  borderColor: string;
  borderTopColor: string;
};

/** Voile + contour + arête de reflet. Opaque si `solid` (Réduire la transparence). */
export function glassPaint(
  t: { dark: boolean; surface: string; bg: string; border: string },
  solid: boolean,
): GlassPaint {
  if (solid) {
    return { backgroundColor: t.surface, borderColor: t.border, borderTopColor: t.border };
  }
  return {
    backgroundColor: hexAlpha(t.surface, GLASS_ON_PAGE),
    borderColor: t.dark ? '#FFFFFF1F' : '#0A102014',
    borderTopColor: t.dark ? '#FFFFFF66' : '#FFFFFF',
  };
}

/** Arête claire en haut, ombre en bas : le bouton a une épaisseur. */
export function reliefEdge(dark: boolean, pressed: boolean): { top: string; bottom: string; side: string } {
  if (pressed) {
    return {
      top: dark ? '#FFFFFF29' : '#FFFFFF99',
      bottom: '#00000066',
      side: dark ? '#FFFFFF10' : '#0A102018',
    };
  }
  return {
    top: dark ? '#FFFFFF73' : '#FFFFFF',
    bottom: dark ? '#00000073' : '#00000040',
    side: dark ? '#FFFFFF1A' : '#0A102012',
  };
}
