import { isConfigured, type ConfigEntry } from '@/kit/config';

export const ENV = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'YOUR_SUPABASE_URL',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'YOUR_SUPABASE_ANON_KEY',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'YOUR_API_BASE_URL',
};

export const CONFIG: ConfigEntry[] = [
  { name: 'EXPO_PUBLIC_SUPABASE_URL', value: ENV.supabaseUrl, note: 'Auth + base de données (RLS)' },
  { name: 'EXPO_PUBLIC_SUPABASE_ANON_KEY', value: ENV.supabaseAnonKey, secret: true, note: 'Clé publique « anon » — protégée par les politiques RLS' },
  { name: 'EXPO_PUBLIC_API_BASE_URL', value: ENV.apiBaseUrl, note: 'API serveur (exports PDF serveur, IA Phase 2, sync bancaire)' },
  { name: 'OPENAI_API_KEY (serveur)', value: 'YOUR_OPENAI_API_KEY', secret: true, phase: 'Phase 2', note: 'Assistants IA — côté serveur uniquement, jamais dans l’app' },
];

export const dbReady = () => isConfigured(ENV.supabaseUrl) && isConfigured(ENV.supabaseAnonKey);
