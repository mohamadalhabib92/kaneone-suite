import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

/**
 * Petit store persistant (AsyncStorage sur mobile, localStorage sur web).
 * Aucune dépendance réseau : tout le chemin "core" fonctionne hors ligne.
 */
export type PersistedStore<T> = {
  get: () => T;
  set: (updater: T | ((prev: T) => T)) => void;
  use: () => T;
  useSelect: <S>(sel: (s: T) => S) => S;
  hydrate: () => Promise<void>;
  /** Efface le stockage. Renvoie false tant que le chargement n’a pas réussi (rien n’est supprimé). */
  reset: () => Promise<boolean>;
  /** Vrai si une modification faite avant le chargement a été écartée au profit des données déjà enregistrées. */
  offlineEditAbandoned: () => boolean;
  useOfflineEditAbandoned: () => boolean;
  /** Copie de secours d’un blob illisible, ou null si la copie a échoué. Undefined : pas d’incident. */
  corruptBackupKey: () => string | null | undefined;
  useCorruptBackupKey: () => string | null | undefined;
  /** Écrit l’état initial sur la clé d’origine, seulement si la copie de secours est déjà en place. */
  startFresh: () => Promise<boolean>;
  key: string;
};

type Kv = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

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
  /** undefined : rien à signaler. null : illisible et copie impossible. string : clé de la copie. */
  let corruptBackup: string | null | undefined;

  const emit = () => listeners.forEach((l) => l());
  const snapshotAbandoned = () => abandoned;
  const snapshotCorrupt = () => corruptBackup;
  const persist = () => {
    if (!hydrated) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTimer = null;
      if (!hydrated) return;
      storage.setItem(storageKey, JSON.stringify(state)).catch(() => {
        /* stockage indisponible : on garde l'état en mémoire */
      });
    }, 150);
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
          emit();
          return;
        }
        if (offlineEdit) abandoned = true;
        state = { ...initial(), ...(parsed as T) };
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
    startFresh: async () => {
      if (!corruptBackup) return false;
      const backup = await storage.getItem(corruptBackup);
      const original = await storage.getItem(storageKey);
      if (backup == null || original == null || backup !== original) return false;
      const fresh = initial();
      await storage.setItem(storageKey, JSON.stringify(fresh));
      state = fresh;
      hydrated = true;
      if (offlineEdit) abandoned = true;
      offlineEdit = false;
      corruptBackup = undefined;
      emit();
      return true;
    },
    reset: async () => {
      if (!hydrated) return false;
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
      }
      state = initial();
      emit();
      await storage.removeItem(storageKey);
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
