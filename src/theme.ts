import type { Palette } from '@/kit/theme';

/**
 * KaneOne — tokens uniques.
 * Sombre : fond #0A1020, sarcelle #3FB6A8, or #D9B26A.
 * `danger` est l’aplat ; `dangerText` est le rouge de texte (AA sur surface).
 * Variante `kanePrint` : impression et PDF.
 */
const shared = { dark: true, radius: 12, fontScale: 1, gap: 14, cardPad: 14 };

export const kane: Palette = {
  bg: '#0A1020',
  surface: '#111A2E',
  surface2: '#18233B',
  border: '#24314D',
  text: '#E7ECF5',
  textMuted: '#8D9AB3',
  primary: '#3FB6A8',
  primaryText: '#04110F',
  accent: '#D9B26A',
  success: '#3FB27F',
  warning: '#E0A43A',
  danger: '#E5484D',
  dangerText: '#FF8A80',
  info: '#5B9BF0',
  onDanger: '#04110F',
  onSuccess: '#04110F',
  onWarning: '#04110F',
  toastBg: '#F4F1EA',
  toastFg: '#0A1020',
  thumb: '#FFFFFF',
  ...shared,
};

/** Variante claire — impression et PDF uniquement. */
export const kanePrint: Palette = {
  bg: '#F4F7FB',
  surface: '#FFFFFF',
  surface2: '#E6EEF6',
  border: '#C5D2E2',
  text: '#0A1020',
  textMuted: '#3C4A60',
  primary: '#0F6E66',
  primaryText: '#FFFFFF',
  accent: '#7A5B1E',
  success: '#0E6B45',
  warning: '#8A5A10',
  danger: '#B4232A',
  dangerText: '#9F1220',
  info: '#1B4F91',
  onDanger: '#FFFFFF',
  onSuccess: '#FFFFFF',
  onWarning: '#FFFFFF',
  toastBg: '#0A1020',
  toastFg: '#F4F7FB',
  thumb: '#FFFFFF',
  dark: false,
  radius: 12,
  fontScale: 1,
  gap: 14,
  cardPad: 14,
};

/**
 * Variante claire pour l’app (mode clair du système ou réglage « Clair »).
 * Mêmes valeurs AA que la variante impression : sarcelle et or de la marque, assombris.
 */
export const kaneDay: Palette = { ...kanePrint };

export type AppearancePref = 'system' | 'dark' | 'light';

/** Palette selon le réglage et l’apparence système. Défaut : suit le système. */
export function paletteFor(appearance: AppearancePref | undefined, scheme: string | null | undefined): Palette {
  const a = appearance ?? 'system';
  if (a === 'dark') return kane;
  if (a === 'light') return kaneDay;
  return scheme === 'light' ? kaneDay : kane;
}

export type Density = 'comfortable' | 'compact';

export function withDensity(base: Palette, density: Density): Palette {
  const compact = density === 'compact';
  return { ...base, gap: compact ? 8 : 14, cardPad: compact ? 10 : 14, radius: compact ? 10 : 12 };
}
