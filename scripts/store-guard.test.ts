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
  let originalWrites = 0;
  const write = corrupt.setItem.bind(corrupt);
  corrupt.setItem = async (key, value) => {
    if (key === 'guard-corrupt@v1') originalWrites += 1;
    return write(key, value);
  };
  const broken = createPersistedStore('guard-corrupt', () => ({ marker: 'vide' }), 1, corrupt);
  await broken.hydrate();
  if (originalWrites !== 0) fail('l’original a été écrit avant ou pendant la copie');
  const backups = [...corrupt.data.keys()].filter((key) => key.startsWith('guard-corrupt@v1.corrupt-'));
  if (backups.length !== 1) fail('copie de secours manquante : ' + [...corrupt.data.keys()].join(','));
  if (corrupt.data.get(backups[0]) !== '###') fail('la copie n’est pas conforme');
  if (corrupt.data.get('guard-corrupt@v1') !== '###') fail('le blob illisible a été écrasé');
  if (broken.corruptBackupKey() !== backups[0]) fail('clé de copie non signalée');
  broken.set({ marker: 'ecrase' });
  if (await broken.reset()) fail('reset autorisé sur un blob illisible');
  await wait(250);
  if (corrupt.data.get('guard-corrupt@v1') !== '###') fail('reset a écrasé l’original');
  if (corrupt.data.get(backups[0]) !== '###') fail('la copie a changé');
  if (!(await broken.startFresh())) fail('repartir de zéro refusé alors que la copie existe');
  if (corrupt.data.get(backups[0]) !== '###') fail('repartir de zéro a modifié la copie');
  const restarted = JSON.parse(corrupt.data.get('guard-corrupt@v1') || 'null') as { marker: string };
  if (restarted.marker !== 'vide') fail('état initial absent après confirmation : ' + JSON.stringify(restarted));
  if (broken.corruptBackupKey() !== undefined) fail('l’incident illisible est resté affiché');

  const blocked = memory();
  await blocked.setItem('guard-blocked@v1', '###');
  const allow = blocked.setItem.bind(blocked);
  blocked.setItem = async (key, value) => {
    if (key.includes('.corrupt-')) throw new Error('copie impossible');
    return allow(key, value);
  };
  const stuck = createPersistedStore('guard-blocked', () => ({ marker: 'vide' }), 1, blocked);
  await stuck.hydrate();
  if (stuck.corruptBackupKey() !== null) fail('une copie a été annoncée alors qu’elle a échoué');
  if (blocked.data.get('guard-blocked@v1') !== '###') fail('échec de copie : original modifié');
  if (await stuck.startFresh()) fail('repartir de zéro proposé sans copie');
  if (blocked.data.get('guard-blocked@v1') !== '###') fail('startFresh a écrasé l’original sans copie');

  const drop = memory();
  const dropKey = 'guard-drop@v1';
  const dropSaved = JSON.stringify({ marker: 'enregistre', n: 7 });
  await drop.setItem(dropKey, dropSaved);
  const releaseDrop = drop.hold(dropKey);
  const dropped = createPersistedStore('guard-drop', () => ({ marker: 'vide', n: 0 }), 1, drop);
  const dropPending = dropped.hydrate();
  dropped.set({ marker: 'hors-ligne', n: 2 });
  if (dropped.offlineEditAbandoned()) fail('abandon signalé trop tôt');
  releaseDrop();
  await dropPending;
  if (!dropped.offlineEditAbandoned()) fail('modification hors ligne non signalée');
  if (dropped.get().marker !== 'enregistre' || dropped.get().n !== 7) fail('les données enregistrées n’ont pas été restaurées');
  await wait(250);
  if (drop.data.get(dropKey) !== dropSaved) fail('l’abandon a réécrit le stockage');

  const session = memory();
  const releaseSession = session.hold('guard-session@v1');
  const kept = createPersistedStore('guard-session', () => ({ marker: 'vide', n: 0 }), 1, session);
  const sessionPending = kept.hydrate();
  kept.set({ marker: 'session', n: 4 });
  releaseSession();
  await sessionPending;
  if (kept.offlineEditAbandoned()) fail('session sans données préalables abandonnée à tort');
  await wait(250);
  const keptRaw = JSON.parse(session.data.get('guard-session@v1') || 'null') as { marker: string; n: number };
  if (keptRaw.marker !== 'session' || keptRaw.n !== 4) fail('édition hors ligne perdue alors que le stockage était vide');

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
