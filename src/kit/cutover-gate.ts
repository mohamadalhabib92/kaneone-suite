/**
 * Portes d’une future bascule de schéma. Ce module ne lit ni n’écrit la clé
 * vivante : il répète un instantané, une restauration isolée, une empreinte
 * et des comptes, puis peut revenir en arrière sur la seule clé isolée.
 * Ce n’est pas une sauvegarde de l’appareil, ni une restauration utilisateur.
 */

export type ByteStore = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

/** Collections déjà présentes dans l’état. Une clé absente compte −1, pas 0. */
export const CRITICAL_COLLECTIONS = [
  'wos',
  'missions',
  'projects',
  'entries',
  'docs',
  'messages',
  'closes',
  'accessLog',
  'reqStatus',
  'portalUsers',
  'pmDone',
] as const;

/** Empreinte stable, non cryptographique, du texte exact. */
export function fingerprint(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function collectionCounts(raw: string): Record<string, number> | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const record = parsed as Record<string, unknown>;
    const counts: Record<string, number> = { __keys: Object.keys(record).length };
    for (const key of CRITICAL_COLLECTIONS) {
      if (!Object.prototype.hasOwnProperty.call(record, key)) {
        counts[key] = -1;
        continue;
      }
      const value = record[key];
      if (Array.isArray(value)) counts[key] = value.length;
      else if (value && typeof value === 'object') counts[key] = Object.keys(value as object).length;
      else counts[key] = 1;
    }
    return counts;
  } catch {
    return null;
  }
}

export function sameCounts(a: Record<string, number> | null, b: Record<string, number> | null): boolean {
  if (!a || !b) return false;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) if (a[key] !== b[key]) return false;
  return true;
}

export type GateReport = {
  ok: boolean;
  reason: string;
  rolledBack: boolean;
  liveUntouched: boolean;
  hash?: string;
  counts?: Record<string, number>;
  snapshotKey?: string;
  isolatedKey?: string;
};

/**
 * Copie `raw` vers une clé d’instantané puis vers une clé isolée.
 * N’appelle jamais setItem/removeItem sur `liveKey`.
 */
export async function rehearseCutover(storage: ByteStore, liveKey: string, raw: string, nonce: string): Promise<GateReport> {
  const liveBefore = await storage.getItem(liveKey);
  const snapshotKey = `${liveKey}.snapshot-${nonce}`;
  const isolatedKey = `${liveKey}.isolated-${nonce}`;
  const hash = fingerprint(raw);
  const counts = collectionCounts(raw);
  const finish = async (ok: boolean, reason: string, rolledBack: boolean): Promise<GateReport> => {
    const liveAfter = await storage.getItem(liveKey);
    return {
      ok,
      reason,
      rolledBack,
      liveUntouched: liveAfter === liveBefore,
      hash,
      counts: counts ?? undefined,
      snapshotKey,
      isolatedKey,
    };
  };
  if (!counts) return finish(false, 'document illisible', false);
  if (snapshotKey === liveKey || isolatedKey === liveKey) return finish(false, 'clé de répétition identique à la clé vivante', false);
  try {
    await storage.setItem(snapshotKey, raw);
    if ((await storage.getItem(snapshotKey)) !== raw) return finish(false, 'instantané non relu', false);
    await storage.setItem(isolatedKey, raw);
    const isolated = await storage.getItem(isolatedKey);
    if (isolated !== raw || fingerprint(isolated) !== hash || !sameCounts(collectionCounts(isolated), counts)) {
      const back = await rollbackIsolated(storage, liveKey, snapshotKey, isolatedKey);
      return finish(false, 'restauration isolée divergente', back.rolledBack);
    }
    return finish(true, 'instantané, restauration isolée, empreinte et comptes concordent', false);
  } catch {
    return finish(false, 'écriture de répétition impossible', false);
  }
}

/**
 * Si la clé isolée n’est plus identique à l’instantané, la réécrit depuis
 * l’instantané. La clé vivante n’est pas modifiée.
 */
export async function rollbackIsolated(
  storage: ByteStore,
  liveKey: string,
  snapshotKey: string,
  isolatedKey: string,
): Promise<{ rolledBack: boolean; liveUntouched: boolean; restored: boolean }> {
  const liveBefore = await storage.getItem(liveKey);
  const snapshot = await storage.getItem(snapshotKey);
  const untouched = async (): Promise<boolean> => (await storage.getItem(liveKey)) === liveBefore;
  if (snapshot == null || isolatedKey === liveKey || snapshotKey === liveKey) {
    return { rolledBack: false, liveUntouched: await untouched(), restored: false };
  }
  const isolated = await storage.getItem(isolatedKey);
  const aligned =
    isolated === snapshot &&
    fingerprint(isolated) === fingerprint(snapshot) &&
    sameCounts(collectionCounts(snapshot), isolated == null ? null : collectionCounts(isolated));
  if (aligned) return { rolledBack: false, liveUntouched: await untouched(), restored: true };
  try {
    await storage.setItem(isolatedKey, snapshot);
    const back = await storage.getItem(isolatedKey);
    return { rolledBack: true, liveUntouched: await untouched(), restored: back === snapshot };
  } catch {
    return { rolledBack: false, liveUntouched: await untouched(), restored: false };
  }
}
