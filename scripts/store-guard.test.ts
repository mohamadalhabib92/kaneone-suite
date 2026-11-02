/**
 * Le délai « Continuer hors ligne » ne doit jamais écrire l’état initial
 * par-dessus les données déjà présentes dans le stockage.
 */
import { createPersistedStore } from '../src/kit/store';

function fail(message: string): never {
  throw new Error(message);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function memory() {
  const data = new Map<string, string>();
  const gates = new Map<string, Promise<void>>();
  return {
    data,
    hold(key: string) {
      let release: () => void = () => {};
      const pending = new Promise<void>((resolve) => {
        release = resolve;
      });
      gates.set(key, pending);
      return () => {
        gates.delete(key);
        release();
      };
    },
    async getItem(key: string) {
      const gate = gates.get(key);
      if (gate) await gate;
      return data.has(key) ? data.get(key)! : null;
    },
    async setItem(key: string, value: string) {
      data.set(key, value);
    },
    async removeItem(key: string) {
      data.delete(key);
    },
  };
}

async function main() {
  const disk = memory();
  const storageKey = 'guard-test@v1';
  const saved = JSON.stringify({ marker: 'enregistre', n: 7 });
  await disk.setItem(storageKey, saved);
  const release = disk.hold(storageKey);

  const store = createPersistedStore('guard-test', () => ({ marker: 'vide', n: 0 }), 1, disk);
  const pending = store.hydrate();
  store.set({ marker: 'ecrase', n: 1 });
  const wiped = await store.reset();
  if (wiped) fail('reset a effacé le stockage avant le chargement');
  await wait(250);
  if (disk.data.get(storageKey) !== saved) fail('écriture avant hydrate : ' + disk.data.get(storageKey));

  release();
  await pending;
  if (store.get().marker !== 'enregistre' || store.get().n !== 7) fail('hydrate n’a pas restauré les données : ' + JSON.stringify(store.get()));
  await wait(250);
  if (disk.data.get(storageKey) !== saved) fail('hydrate a réécrit le stockage');

  store.set((s) => ({ ...s, n: 8 }));
  await wait(250);
  const after = JSON.parse(disk.data.get(storageKey) || 'null') as { marker: string; n: number };
  if (after.marker !== 'enregistre' || after.n !== 8) fail('écriture après hydrate incorrecte : ' + JSON.stringify(after));

  const corrupt = memory();
  await corrupt.setItem('guard-corrupt@v1', '###');
  const broken = createPersistedStore('guard-corrupt', () => ({ marker: 'vide' }), 1, corrupt);
  await broken.hydrate();
  broken.set({ marker: 'ecrase' });
  if (await broken.reset()) fail('reset autorisé sur un blob illisible');
  await wait(250);
  if (corrupt.data.get('guard-corrupt@v1') !== '###') fail('le blob illisible a été écrasé');

  const freshDisk = memory();
  const fresh = createPersistedStore('guard-fresh', () => ({ marker: 'vide', n: 0 }), 1, freshDisk);
  await fresh.hydrate();
  fresh.set({ marker: 'nouveau', n: 3 });
  await wait(250);
  const created = JSON.parse(freshDisk.data.get('guard-fresh@v1') || 'null') as { marker: string; n: number };
  if (created.marker !== 'nouveau' || created.n !== 3) fail('premier enregistrement absent : ' + JSON.stringify(created));

  console.log('store : aucune écriture avant un chargement réussi');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
