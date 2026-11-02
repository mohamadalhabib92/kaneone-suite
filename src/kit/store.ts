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

  const emit = () => listeners.forEach((l) => l());
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
      emit();
      persist();
    },
    use: () => useSyncExternalStore(subscribe, () => state, () => state),
    useSelect: <S,>(sel: (s: T) => S) => useSyncExternalStore(subscribe, () => sel(state), () => sel(state)),
    hydrate: async () => {
      const raw = await storage.getItem(storageKey);
      if (raw) {
        try {
          state = { ...initial(), ...(JSON.parse(raw) as T) };
        } catch {
          /* blob illisible : on ne l’écrase pas et on n’autorise pas les écritures */
          return;
        }
      }
      hydrated = true;
      emit();
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

export function uid(prefix = ''): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
