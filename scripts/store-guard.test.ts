/**
 * Le délai « Continuer hors ligne » ne doit jamais écrire l’état initial
 * par-dessus les données déjà présentes dans le stockage.
 * Schéma ancien, champs futurs, échec d’écriture et effacement gardé.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createPersistedStore } from '../src/kit/store';
import { rehearseCutover, rollbackIsolated } from '../src/kit/cutover-gate';
import { eraseNotice, quarantineNotice, unsavedNotice } from '../src/kit/preservation-copy';

function fail(message: string): never {
  throw new Error(message);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function until(cond: () => boolean, label: string) {
  const start = Date.now();
  while (!cond()) {
    if (Date.now() - start > 2000) fail(label);
    await wait(20);
  }
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
  const quarantinedRaw = await broken.readQuarantine();
  if (quarantinedRaw !== '###') fail('export explicite indisponible');
  if (quarantineNotice(true).text.includes(quarantinedRaw) || quarantineNotice(true).title.includes(quarantinedRaw)) {
    fail('la copie est recopiée dans le bandeau');
  }
  broken.set({ marker: 'ecrase' });
  if (await broken.reset()) fail('reset autorisé sur un blob illisible');
  await wait(250);
  if (corrupt.data.get('guard-corrupt@v1') !== '###') fail('reset a écrasé l’original');
  if (corrupt.data.get(backups[0]) !== '###') fail('la copie a changé');
  if (await broken.startFresh()) fail('effacement sans demande');
  if (await broken.commitDestructive()) fail('commit sans demande');
  if (!broken.armDestructive('replace-unreadable')) fail('demande d’effacement refusée');
  broken.disarmDestructive();
  if (await broken.commitDestructive()) fail('annulation a effacé l’original illisible');
  if (corrupt.data.get('guard-corrupt@v1') !== '###') fail('annulation a modifié l’original');
  if (!broken.armDestructive('replace-unreadable')) fail('seconde demande refusée');
  if (broken.armDestructive('reset')) fail('reset autorisé sur un document illisible');
  if (broken.destructiveArmed() !== 'replace-unreadable') fail('une demande refusée a annulé l’effacement déjà demandé');
  if (!(await broken.commitDestructive())) fail('effacement intentionnel refusé');
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
  if (stuck.armDestructive('replace-unreadable')) fail('effacement proposé sans copie');
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

  const full = memory();
  const fullKey = 'guard-full@v1';
  const fullSaved = JSON.stringify({ marker: 'enregistre', n: 1 });
  await full.setItem(fullKey, fullSaved);
  let blockWrites = true;
  const fullWrite = full.setItem.bind(full);
  full.setItem = async (key, value) => {
    if (blockWrites && key === fullKey) throw new Error('ENOSPC');
    await fullWrite(key, value);
  };
  const cramped = createPersistedStore('guard-full', () => ({ marker: 'vide', n: 0 }), 1, full);
  await cramped.hydrate();
  cramped.set({ marker: 'enregistre', n: 4 });
  await until(() => cramped.unsaved(), 'disque plein non signalé');
  if (full.data.get(fullKey) !== fullSaved) fail('disque plein a quand même écrit');
  if (cramped.get().n !== 4) fail('la saisie a disparu de l’écran');
  if (!cramped.retrySave()) fail('réessai refusé');
  await until(() => !cramped.writing(), 'réessai sans fin');
  if (!cramped.unsaved()) fail('échec présenté comme enregistré');
  if (full.data.get(fullKey) !== fullSaved) fail('second échec a écrit');
  blockWrites = false;
  if (!cramped.retrySave()) fail('réessai après libération refusé');
  await until(() => !cramped.unsaved() && !cramped.writing(), 'réessai non confirmé par relecture');
  const freed = JSON.parse(full.data.get(fullKey) || 'null') as { marker: string; n: number };
  if (freed.marker !== 'enregistre' || freed.n !== 4) fail('valeur absente après réessai : ' + full.data.get(fullKey));

  const liar = memory();
  const liarKey = 'guard-liar@v1';
  const liarSaved = JSON.stringify({ marker: 'enregistre', n: 1 });
  await liar.setItem(liarKey, liarSaved);
  let lie = true;
  const liarWrite = liar.setItem.bind(liar);
  liar.setItem = async (key, value) => {
    if (lie && key === liarKey) {
      await liarWrite(key, 'pas-le-payload');
      return;
    }
    await liarWrite(key, value);
  };
  const lied = createPersistedStore('guard-liar', () => ({ marker: 'vide', n: 0 }), 1, liar);
  await lied.hydrate();
  lied.set({ marker: 'enregistre', n: 9 });
  await until(() => lied.unsaved(), 'relecture divergente tenue pour enregistrée');
  if (lied.get().n !== 9) fail('la mémoire a été remplacée par le disque menteur');
  lie = false;
  if (!lied.retrySave()) fail('réessai après divergence refusé');
  await until(() => !lied.unsaved() && !lied.writing(), 'divergence non réparée');
  const liedRaw = JSON.parse(liar.data.get(liarKey) || 'null') as { n: number };
  if (liedRaw.n !== 9) fail('le disque n’a pas été réaligné');

  const race = memory();
  const raceKey = 'guard-race@v1';
  await race.setItem(raceKey, JSON.stringify({ n: 0 }));
  const releases: Array<() => void> = [];
  const raceWrite = race.setItem.bind(race);
  race.setItem = (key, value) => {
    if (key !== raceKey) return raceWrite(key, value);
    return new Promise((resolve, reject) => {
      releases.push(() => {
        raceWrite(key, value).then(resolve, reject);
      });
    });
  };
  const raced = createPersistedStore('guard-race', () => ({ n: 0 }), 1, race);
  await raced.hydrate();
  raced.set({ n: 1 });
  await until(() => releases.length === 1, 'première écriture non partie');
  raced.set({ n: 2 });
  await wait(250);
  if (releases.length !== 1) fail('deuxième écriture partie avant la première : ' + releases.length);
  releases[0]();
  await until(() => releases.length === 2, 'deuxième écriture non enchaînée');
  releases[1]();
  await until(() => !raced.writing() && !raced.unsaved(), 'course non terminée');
  const raceRaw = JSON.parse(race.data.get(raceKey) || 'null') as { n: number };
  if (raceRaw.n !== 2) fail('la course a conservé ' + raceRaw.n);

  const historic = {
    role: 'ops',
    mode: 'demo',
    wos: [{ id: 'wo-1', ref: 'OT-0001', legacyNote: 'garde' }],
    missions: [{ id: 'm-1', notes: 'note historique' }],
    projects: [{ id: 'pr-stl', name: 'Lodge' }],
    entries: [{ id: 'e-historique', period: '2026-10', debit: 0, credit: 10 }],
    docs: [{ id: 'doc-1', title: 'Bail' }],
    messages: [{ id: 'msg-ancien', text: 'bonjour' }],
    closes: { '2026-10': { period: '2026-10', step: 2 } },
    imports: [{ id: 'imp-1' }],
    attachments: [{ id: 'att-1', name: 'bail.pdf' }],
    calendar: [{ id: 'cal-1', date: '2026-10-01' }],
    futureField: { schema: 99, keep: true },
  };
  const oldDisk = memory();
  const oldKey = 'guard-old@v1';
  const oldRaw = JSON.stringify(historic);
  await oldDisk.setItem(oldKey, oldRaw);
  const old = createPersistedStore('guard-old', () => ({ marker: 'vide', density: 'comfortable' }), 1, oldDisk);
  await old.hydrate();
  if (oldDisk.data.get(oldKey) !== oldRaw) fail('hydrate a réécrit un ancien schéma');
  const loaded = old.get() as typeof historic & { density?: string; marker?: string };
  if (loaded.wos[0].id !== 'wo-1' || loaded.wos[0].legacyNote !== 'garde') fail('ordre de travail historique perdu');
  if (loaded.entries[0].id !== 'e-historique' || loaded.entries[0].credit !== 10) fail('écriture historique perdue');
  if (loaded.missions[0].notes !== 'note historique') fail('note historique perdue');
  if (loaded.projects[0].id !== 'pr-stl' || loaded.docs[0].id !== 'doc-1') fail('projet ou document perdu');
  if (loaded.messages[0].id !== 'msg-ancien' || loaded.closes['2026-10'].period !== '2026-10') fail('message ou clôture perdu');
  if (loaded.imports[0].id !== 'imp-1' || loaded.attachments[0].id !== 'att-1' || loaded.calendar[0].id !== 'cal-1') fail('clé inconnue perdue au chargement');
  if (loaded.futureField.schema !== 99 || loaded.futureField.keep !== true) fail('champ futur perdu au chargement');
  if (loaded.density !== 'comfortable' || loaded.marker !== 'vide') fail('défaut d’une clé absente non appliqué');
  old.set((current) => ({ ...current, role: 'cfo' }));
  await until(() => !old.writing() && !old.unsaved(), 'ancien schéma non réécrit');
  const round = JSON.parse(oldDisk.data.get(oldKey) || 'null') as typeof historic & { role: string; density: string; marker: string };
  if (round.role !== 'cfo') fail('rôle non écrit');
  if (round.wos[0].id !== 'wo-1' || round.wos[0].legacyNote !== 'garde') fail('écriture a perdu l’ordre de travail');
  if (round.entries[0].id !== 'e-historique' || round.entries[0].credit !== 10) fail('écriture a perdu l’écriture comptable');
  if (round.futureField.keep !== true || round.imports[0].id !== 'imp-1') fail('écriture a perdu un champ futur');
  if (round.attachments[0].id !== 'att-1' || round.calendar[0].id !== 'cal-1' || round.docs[0].id !== 'doc-1') fail('écriture a perdu une pièce ou un document');
  if (round.density !== 'comfortable') fail('défaut perdu à l’écriture');

  const io = memory();
  io.getItem = async () => {
    throw new Error('io');
  };
  const unread = createPersistedStore('guard-io', () => ({ marker: 'vide' }), 1, io);
  let threw = false;
  try {
    await unread.hydrate();
  } catch {
    threw = true;
  }
  if (!threw) fail('échec de lecture non signalé');
  unread.set({ marker: 'ecrase' });
  await wait(250);
  if (io.data.size !== 0) fail('échec de lecture suivi d’une écriture');

  const wipe = memory();
  const wipeKey = 'guard-wipe@v1';
  const wipeSaved = JSON.stringify({ marker: 'enregistre', n: 3, entries: [{ id: 'e-historique' }] });
  await wipe.setItem(wipeKey, wipeSaved);
  const wipedStore = createPersistedStore('guard-wipe', () => ({ marker: 'vide', n: 0 }), 1, wipe);
  await wipedStore.hydrate();
  if (await wipedStore.reset()) fail('effacement sans demande');
  if (!wipedStore.armDestructive('reset')) fail('demande d’effacement des données refusée');
  wipedStore.disarmDestructive();
  if (await wipedStore.commitDestructive()) fail('annulation a effacé les données');
  if (wipe.data.get(wipeKey) !== wipeSaved) fail('annulation a changé le disque');
  if (!wipedStore.armDestructive('reset')) fail('seconde demande d’effacement refusée');
  if (!(await wipedStore.commitDestructive())) fail('effacement intentionnel des données refusé');
  if (wipe.data.has(wipeKey)) fail('la clé vivante est encore présente');
  if (wipedStore.get().marker !== 'vide') fail('mémoire non revenue à l’état initial');

  const gateDisk = memory();
  const live = 'kaneone-suite@v1';
  const liveRaw = JSON.stringify({
    wos: [{ id: 'wo-1' }],
    entries: [{ id: 'e-historique', credit: 10 }],
    futureField: { keep: true },
  });
  await gateDisk.setItem(live, liveRaw);
  const report = await rehearseCutover(gateDisk, live, liveRaw, 'essai-1');
  if (!report.ok || !report.liveUntouched) fail('porte de bascule : ' + report.reason + ' untouched=' + report.liveUntouched);
  if (gateDisk.data.get(live) !== liveRaw) fail('la répétition a écrit la clé vivante');
  if (report.counts?.wos !== 1 || report.counts?.entries !== 1 || report.counts?.__keys !== 3) fail('comptes ' + JSON.stringify(report.counts));
  if (!report.snapshotKey || !report.isolatedKey) fail('clés de répétition absentes');
  if (gateDisk.data.get(report.snapshotKey) !== liveRaw) fail('instantané incomplet');
  await gateDisk.setItem(report.isolatedKey, `${liveRaw}x`);
  const rolled = await rollbackIsolated(gateDisk, live, report.snapshotKey, report.isolatedKey);
  if (!rolled.rolledBack || !rolled.restored || !rolled.liveUntouched) fail('retour arrière ' + JSON.stringify(rolled));
  if (gateDisk.data.get(live) !== liveRaw) fail('le retour arrière a touché la clé vivante');
  if (gateDisk.data.get(report.isolatedKey) !== liveRaw) fail('copie isolée non restaurée');

  const secret = '###SECRET-BLOB###';
  const shown = [quarantineNotice(true), quarantineNotice(false), unsavedNotice(false), unsavedNotice(true), eraseNotice()]
    .map((item) => item.title + item.text)
    .join('\n');
  if (shown.includes(secret) || shown.includes('.corrupt-')) fail('le texte affiché contient le document ou la clé');
  const root = join(import.meta.dirname, '..');
  const ui = ['src/components/storage-notices.tsx', 'src/components/local-erase.tsx', 'src/app/settings.tsx', 'src/kit/preservation-copy.ts']
    .map((file) => readFileSync(join(root, file), 'utf8'))
    .join('\n');
  if (/tapez|phrase secrète|confirm\?\./i.test(ui)) fail('confirmation cachée ou phrase à saisir');
  if (ui.includes('.corrupt-')) fail('nom de clé de quarantaine présent dans l’interface');
  const quarantined = await broken.readQuarantine();
  if (quarantined !== null) fail('la copie reste lisible après effacement de l’original');

  console.log('store : aucune écriture avant un chargement réussi ; échec visible ; schéma ancien et champs futurs conservés');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
