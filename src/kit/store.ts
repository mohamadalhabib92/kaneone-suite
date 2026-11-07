import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

/**
 * Petit store persistant (AsyncStorage sur mobile, localStorage sur web).
 * Aucune dépendance réseau : tout le chemin "core" fonctionne hors ligne.
 *
 * Une écriture n’est tenue pour faite qu’après relecture identique.
 * L’échec (disque plein, quota, stockage indisponible) reste visible :
 * l’écran n’est pas présenté comme enregistré. Ceci ne garantit pas
 * l’absence de perte : il n’y a pas de sauvegarde ni de restauration
 * de l’appareil.
 */
export type DestructiveAction = 'reset' | 'replace-unreadable';
export type SchemaHold = 'unreadable' | 'future';

export type PersistedStore<T> = {
  get: () => T;
  set: (updater: T | ((prev: T) => T)) => void;
  use: () => T;
  useSelect: <S>(sel: (s: T) => S) => S;
  hydrate: () => Promise<void>;
  /** Efface le stockage seulement après une demande explicite, une fois le chargement réussi. */
  reset: () => Promise<boolean>;
  /** Vrai si une modification faite avant le chargement a été écartée au profit des données déjà enregistrées. */
  offlineEditAbandoned: () => boolean;
  useOfflineEditAbandoned: () => boolean;
  /** Copie de secours d’un blob illisible, ou null si la copie a échoué. Undefined : pas d’incident. */
  corruptBackupKey: () => string | null | undefined;
  useCorruptBackupKey: () => string | null | undefined;
  /** Écrit l’état initial sur la clé d’origine, seulement après demande explicite et copie conforme. */
  startFresh: () => Promise<boolean>;
  /** Dernière écriture non relue à l’identique. */
  unsaved: () => boolean;
  useUnsaved: () => boolean;
  /** Un envoi vers le stockage est en attente ou en cours. */
  writing: () => boolean;
  useWriting: () => boolean;
  /** Relance l’écriture de l’état mémoire. Faux si rien n’est en échec. */
  retrySave: () => boolean;
  armDestructive: (action: DestructiveAction) => boolean;
  disarmDestructive: () => void;
  destructiveArmed: () => DestructiveAction | null;
  useDestructiveArmed: () => DestructiveAction | null;
  commitDestructive: () => Promise<boolean>;
  /** Lit la copie de quarantaine seulement si elle est encore identique à l’original. Ne l’affiche pas. */
  readQuarantine: () => Promise<string | null>;
  /** Document laissé tel quel : illisible, ou version de schéma non prise en charge. */
  schemaHold: () => SchemaHold | undefined;
  useSchemaHold: () => SchemaHold | undefined;
  key: string;
};

type Kv = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

/**
 * Document de cette version : conserve chaque clé déjà présente.
 * N’ajoute un défaut que pour une clé absente. Ne régénère pas les identifiants stockés.
 * Un `schemaVersion` supérieur à la version prise en charge n’entre pas ici :
 * il reste en quarantaine, octet pour octet.
 */
export function mergeStored<T extends object>(stored: Record<string, unknown>, fallback: T): T {
  const merged: Record<string, unknown> = {};
  for (const key of Object.keys(stored)) merged[key] = stored[key];
  const base = fallback as unknown as Record<string, unknown>;
  for (const key of Object.keys(base)) {
    if (!Object.prototype.hasOwnProperty.call(stored, key)) merged[key] = base[key];
  }
  return merged as T;
}

/** Vrai seulement si le document annonce une version de schéma plus récente que celle lue par ce store. */
export function isFutureSchema(parsed: Record<string, unknown>, supported: number): boolean {
  const marker = parsed.schemaVersion;
  return typeof marker === 'number' && Number.isFinite(marker) && marker > supported;
}

export function createPersistedStore<T extends object>(key: string, initial: () => T, version = 1, storage: Kv = AsyncStorage): PersistedStore<T> {
  let state: T = initial();
  const listeners = new Set<() => void>();
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  const storageKey = `${key}@v${version}`;
  /**
   * Faux tant que getItem n’a pas réussi. « Continuer hors ligne » peut afficher
   * l’état initial : toute écriture avant ce drapeau écraserait les données déjà
   * enregistrées avec cet état vide.
   */
  let hydrated = false;
  let offlineEdit = false;
  let abandoned = false;
  /** undefined : rien à signaler. null : copie impossible. string : clé de la copie. */
  let corruptBackup: string | null | undefined;
  let hold: SchemaHold | undefined;
  let generation = 0;
  let failed = false;
  let busy = false;
  let chain: Promise<void> = Promise.resolve();
  let armed: DestructiveAction | null = null;

  const emit = () => listeners.forEach((l) => l());
  const snapshotAbandoned = () => abandoned;
  const snapshotCorrupt = () => corruptBackup;
  const snapshotUnsaved = () => failed;
  const snapshotWriting = () => busy || saveTimer != null;
  const snapshotArmed = () => armed;
  const snapshotHold = () => hold;

  const allowed = (action: DestructiveAction) => {
    if (action === 'reset') return hold === 'future' || (hydrated && corruptBackup === undefined);
    return hold === 'unreadable' && typeof corruptBackup === 'string' && corruptBackup.length > 0;
  };

  const runWrite = (gen: number, payload: string) => {
    chain = chain.then(async () => {
      if (gen !== generation || !hydrated) return;
      busy = true;
      emit();
      try {
        await storage.setItem(storageKey, payload);
        if (gen !== generation || !hydrated) return;
        const back = await storage.getItem(storageKey);
        if (gen !== generation || !hydrated) return;
        if (back !== payload) throw new Error('readback');
        failed = false;
      } catch {
        if (gen !== generation || !hydrated) return;
        failed = true;
      } finally {
        if (gen === generation) busy = false;
        emit();
      }
    });
  };

  const persist = () => {
    if (!hydrated) return;
    if (saveTimer) clearTimeout(saveTimer);
    const gen = ++generation;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      if (!hydrated || gen !== generation) {
        emit();
        return;
      }
      runWrite(gen, JSON.stringify(state));
      emit();
    }, 150);
    emit();
  };

  const settle = async () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    generation += 1;
    await chain;
    busy = false;
  };

  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  };

  const store: PersistedStore<T> = {
    key: storageKey,
    get: () => state,
    set: (updater) => {
      state = typeof updater === 'function' ? (updater as (p: T) => T)(state) : updater;
      if (!hydrated) offlineEdit = true;
      emit();
      persist();
    },
    use: () => useSyncExternalStore(subscribe, () => state, () => state),
    useSelect: <S,>(sel: (s: T) => S) => useSyncExternalStore(subscribe, () => sel(state), () => sel(state)),
    hydrate: async () => {
      const raw = await storage.getItem(storageKey);
      if (raw) {
        const parsed = parseObject(raw);
        if (!parsed) {
          corruptBackup = await copyCorrupt(storage, storageKey, raw);
          hold = 'unreadable';
          emit();
          return;
        }
        if (isFutureSchema(parsed, version)) {
          corruptBackup = await copyCorrupt(storage, storageKey, raw);
          hold = 'future';
          emit();
          return;
        }
        if (offlineEdit) abandoned = true;
        state = mergeStored(parsed, initial());
        offlineEdit = false;
        hydrated = true;
        emit();
        return;
      }
      hydrated = true;
      const keepSession = offlineEdit;
      offlineEdit = false;
      emit();
      if (keepSession) persist();
    },
    offlineEditAbandoned: snapshotAbandoned,
    useOfflineEditAbandoned: () => useSyncExternalStore(subscribe, snapshotAbandoned, snapshotAbandoned),
    corruptBackupKey: snapshotCorrupt,
    useCorruptBackupKey: () => useSyncExternalStore(subscribe, snapshotCorrupt, snapshotCorrupt),
    unsaved: snapshotUnsaved,
    useUnsaved: () => useSyncExternalStore(subscribe, snapshotUnsaved, snapshotUnsaved),
    writing: snapshotWriting,
    useWriting: () => useSyncExternalStore(subscribe, snapshotWriting, snapshotWriting),
    retrySave: () => {
      if (!hydrated || !failed || busy || saveTimer) return false;
      persist();
      return true;
    },
    armDestructive: (action) => {
      if (!allowed(action)) return false;
      if (armed === action) return true;
      armed = action;
      emit();
      return true;
    },
    disarmDestructive: () => {
      if (!armed) return;
      armed = null;
      emit();
    },
    destructiveArmed: snapshotArmed,
    useDestructiveArmed: () => useSyncExternalStore(subscribe, snapshotArmed, snapshotArmed),
    schemaHold: snapshotHold,
    useSchemaHold: () => useSyncExternalStore(subscribe, snapshotHold, snapshotHold),
    commitDestructive: async () => {
      if (armed === 'reset') return store.reset();
      if (armed === 'replace-unreadable') return store.startFresh();
      return false;
    },
    readQuarantine: async () => {
      if (!corruptBackup) return null;
      const backup = await storage.getItem(corruptBackup);
      const original = await storage.getItem(storageKey);
      if (backup == null || original == null || backup !== original) return null;
      return backup;
    },
    startFresh: async () => {
      if (armed !== 'replace-unreadable' || !corruptBackup) return false;
      armed = null;
      const backupKey = corruptBackup;
      const backup = await storage.getItem(backupKey);
      const original = await storage.getItem(storageKey);
      if (backup == null || original == null || backup !== original) {
        emit();
        return false;
      }
      await settle();
      const fresh = initial();
      const payload = JSON.stringify(fresh);
      try {
        await storage.setItem(storageKey, payload);
        if ((await storage.getItem(storageKey)) !== payload) {
          await storage.setItem(storageKey, original).catch(() => {});
          emit();
          return false;
        }
      } catch {
        emit();
        return false;
      }
      state = fresh;
      hydrated = true;
      if (offlineEdit) abandoned = true;
      offlineEdit = false;
      corruptBackup = undefined;
      hold = undefined;
      failed = false;
      emit();
      return true;
    },
    reset: async () => {
      if (armed !== 'reset') return false;
      if (hold === 'future') {
        armed = null;
        await settle();
        const backupKey = typeof corruptBackup === 'string' ? corruptBackup : null;
        try {
          await storage.removeItem(storageKey);
          if ((await storage.getItem(storageKey)) != null) {
            emit();
            return false;
          }
          if (backupKey) await storage.removeItem(backupKey);
        } catch {
          emit();
          return false;
        }
        state = initial();
        hydrated = true;
        hold = undefined;
        corruptBackup = undefined;
        failed = false;
        offlineEdit = false;
        emit();
        return true;
      }
      if (!hydrated || corruptBackup !== undefined) return false;
      armed = null;
      await settle();
      try {
        await storage.removeItem(storageKey);
      } catch {
        emit();
        return false;
      }
      state = initial();
      failed = false;
      emit();
      return true;
    },
  };
  return store;
}

/** Résout une promesse ou échoue après `ms` (évite les "Loading" infinis). */
export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

function parseObject(raw: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Copie le blob tel quel. N’écrit jamais sur la clé d’origine. */
async function copyCorrupt(storage: Kv, storageKey: string, raw: string): Promise<string | null> {
  const day = new Date().toISOString().slice(0, 10);
  let backupKey = `${storageKey}.corrupt-${day}`;
  try {
    const existing = await storage.getItem(backupKey);
    if (existing != null && existing !== raw) {
      backupKey = `${storageKey}.corrupt-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    }
    if (existing !== raw) {
      await storage.setItem(backupKey, raw);
      if ((await storage.getItem(backupKey)) !== raw) return null;
    }
    return backupKey;
  } catch {
    return null;
  }
}

export function uid(prefix = ''): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
