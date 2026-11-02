import { isConfigured, type ConfigEntry } from '@/kit/config';

/**
 * Variables publiques lues par l’app. Défauts YOUR_* uniquement.
 * OPENAI_API_KEY n’est pas lue ici : serveur seulement, Phase 2.
 * Aucun de ces champs n’est appelé au démarrage.
 */
export const ENV = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'YOUR_SUPABASE_URL',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'YOUR_SUPABASE_ANON_KEY',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'YOUR_API_BASE_URL',
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? 'YOUR_SENTRY_DSN',
};

/** Flags Phase 2. Codés à false : le chemin critique ne peut pas les allumer. */
export const FLAGS = {
  FEATURE_AI: false,
  FEATURE_BANK_SYNC: false,
  FEATURE_ESIGN: false,
  FEATURE_PUSH: false,
} as const;

export const CONFIG: ConfigEntry[] = [
  { name: 'EXPO_PUBLIC_SUPABASE_URL', value: ENV.supabaseUrl, note: 'Auth + base (RLS) — Phase 2, aucun appel au démarrage' },
  { name: 'EXPO_PUBLIC_SUPABASE_ANON_KEY', value: ENV.supabaseAnonKey, secret: true, note: 'Clé publique « anon » — protégée par les politiques RLS' },
  { name: 'EXPO_PUBLIC_API_BASE_URL', value: ENV.apiBaseUrl, phase: 'Phase 2', note: 'API serveur optionnelle. Non appelée dans cette version.' },
  { name: 'EXPO_PUBLIC_SENTRY_DSN', value: ENV.sentryDsn, secret: true, note: 'Journal de crash. Désactivé tant que la valeur est un placeholder.' },
];

/** Décisions de Mohamed. Placeholders uniquement — à valider, jamais une valeur inventée. */
export const DECISIONS: { name: string; note: string }[] = [
  { name: 'YOUR_REPORTING_CURRENCY', note: 'EUR selon la v1, CHF possible — à valider' },
  { name: 'YOUR_CONSOLIDATION_GAAP', note: 'IFRS selon la v1, Swiss GAAP RPC possible — à valider' },
  { name: 'YOUR_LEGAL_STRUCTURE', note: 'Organigramme réel — à valider' },
  { name: 'YOUR_DATA_REGION', note: 'Hébergement en Suisse ou dans l’UE — à valider' },
  { name: 'YOUR_FX_RATE_SOURCE', note: 'Source des taux datés — à valider' },
  { name: 'YOUR_BUDGET_ALERT_PCT', note: 'Seuil d’alerte budget Immo — à valider' },
  { name: 'YOUR_ESIGN_PROVIDER', note: 'Signature qualifiée, Phase 2 — à valider' },
  { name: 'YOUR_ARMORED_PERMITS', note: 'Autorisations véhicules blindés par pays — à valider, sans conseil juridique' },
  { name: 'YOUR_REVIEW_ACCOUNT', note: 'Compte démo pour App Review — à valider' },
  { name: 'YOUR_SUPPORT_EMAIL', note: 'Contact support — à renseigner' },
  { name: 'YOUR_PORT', note: 'Port du processus serveur, hors application' },
  { name: 'OPENAI_API_KEY', note: 'Serveur uniquement, Phase 2. Non lue et non embarquée par l’application.' },
];

export const dbReady = () => isConfigured(ENV.supabaseUrl) && isConfigured(ENV.supabaseAnonKey);

/** Les chiffres restent « Démo » tant que le mode réel n’est pas branché sur une base configurée. */
export function figuresAreDemo(mode: 'demo' | 'real'): boolean {
  return mode !== 'real' || !dbReady();
}
