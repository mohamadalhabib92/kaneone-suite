import { isConfigured } from './config';

export type CrashNote = { at: number; message: string };

const notes: CrashNote[] = [];
let lastKey = '';
let lastAt = 0;

/** Messages visibles : pas de jeton, pas de donnée métier. */
export function publicCrashMessage(input: unknown): string {
  const raw = input instanceof Error ? input.message : typeof input === 'string' ? input : 'Erreur inattendue';
  if (/sk-|eyJ|BEGIN |supabase|api[_-]?key|secret|token|dsn/i.test(raw)) return 'Erreur interne (détail masqué).';
  return raw.replace(/\s+/g, ' ').slice(0, 180) || 'Erreur inattendue';
}

export function recentCrashes(): readonly CrashNote[] {
  return notes;
}

/**
 * Journal de crash. Aucun appel réseau si EXPO_PUBLIC_SENTRY_DSN est absent
 * ou vaut un placeholder YOUR_*. N’est jamais appelé au démarrage.
 */
export function reportCrash(error: unknown, componentStack?: string): void {
  try {
    const message = publicCrashMessage(error);
    const now = Date.now();
    if (message === lastKey && now - lastAt < 10_000) return;
    lastKey = message;
    lastAt = now;
    notes.unshift({ at: now, message });
    if (notes.length > 20) notes.pop();
    const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
    if (!isConfigured(dsn)) return;
    void sendToSentry(dsn, error, componentStack);
  } catch {
    /* le journal ne doit jamais faire tomber l’app */
  }
}

function sendToSentry(dsn: string, error: unknown, componentStack?: string): Promise<void> {
  const parsed = parseDsn(dsn);
  if (!parsed) return Promise.resolve();
  const eventId = randomId();
  const message = publicCrashMessage(error);
  const type = error instanceof Error && error.name ? error.name : 'Error';
  const event = {
    event_id: eventId,
    timestamp: new Date().toISOString(),
    platform: 'javascript',
    level: 'error',
    logger: 'kaneone',
    message: { formatted: message },
    exception: { values: [{ type, value: message }] },
    extra: componentStack ? { componentStack: componentStack.slice(0, 2000) } : undefined,
    tags: { app: 'kaneone-suite' },
  };
  const envelope = [
    JSON.stringify({ event_id: eventId, sent_at: event.timestamp, dsn }),
    JSON.stringify({ type: 'event' }),
    JSON.stringify(event),
  ].join('\n');
  const url = `${parsed.origin}/api/${parsed.project}/envelope/?sentry_key=${encodeURIComponent(parsed.key)}&sentry_version=7`;
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-sentry-envelope' },
    body: envelope,
  })
    .then(() => undefined)
    .catch(() => undefined);
}

function parseDsn(dsn: string): { origin: string; key: string; project: string } | null {
  try {
    const url = new URL(dsn);
    const key = decodeURIComponent(url.username);
    const project = url.pathname.replace(/\//g, '');
    if (!key || !project || !/^\d+$/.test(project)) return null;
    return { origin: url.origin, key, project };
  } catch {
    return null;
  }
}

function randomId(): string {
  const bytes = new Uint8Array(16);
  const cryptoObj = globalThis.crypto;
  if (cryptoObj?.getRandomValues) cryptoObj.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
