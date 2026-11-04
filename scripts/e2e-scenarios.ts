import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { kitPairs } from '../src/kit/a11yPairs';
import { contrast, ensureContrast, mix } from '../src/kit/contrast';
import { createVibrationPref } from '../src/kit/vibrations';
import { reportCrash, recentCrashes } from '../src/kit/crash';
import { FLAGS } from '../src/config';
import { BASES, COUNTRIES, DOSSIER_MODULES, FINANCE_REPOS, GROUP, REQUIREMENTS, SITES, VEHICLE_CATEGORIES } from '../src/data/demo';
import { SCENARIOS, scenarioProgress } from '../src/lib/scenarios';
import { store } from '../src/state';
import { kane, kaneDay, kanePrint } from '../src/theme';

function fail(message: string): never {
  throw new Error(message);
}

const root = join(import.meta.dirname, '..');

if (store.key !== 'kaneone-suite@v1') fail(`clé de stockage modifiée : ${store.key}`);
if (GROUP.ebitdaK !== 2580 || GROUP.headcount !== 318 || GROUP.activeSites !== 9 || GROUP.sites !== 15) {
  fail(`chiffres démo inattendus ${GROUP.ebitdaK} ${GROUP.headcount} ${GROUP.activeSites}/${GROUP.sites}`);
}
if (COUNTRIES.length !== 5 || SITES.length !== 15 || BASES.length !== 11) fail('référentiel pays/sites/bases');
if (VEHICLE_CATEGORIES.length !== 5 || FINANCE_REPOS.length !== 6) fail('référentiels mobilité ou finance');
if (DOSSIER_MODULES.length !== 12 || REQUIREMENTS.length !== 187) fail(`dossier ${DOSSIER_MODULES.length}/${REQUIREMENTS.length}`);
if (FLAGS.FEATURE_AI || FLAGS.FEATURE_BANK_SYNC || FLAGS.FEATURE_ESIGN || FLAGS.FEATURE_PUSH) fail('flag Phase 2 allumé');

const pairs: [string, string, string][] = [
  ['texte / fond', kane.text, kane.bg],
  ['texte atténué / fond', kane.textMuted, kane.bg],
  ['texte atténué / surface', kane.textMuted, kane.surface],
  ['texte atténué / surface 2', kane.textMuted, kane.surface2],
  ['rouge texte / surface', kane.dangerText, kane.surface],
  ['rouge texte / surface 2', kane.dangerText, kane.surface2],
  ['texte sur danger', kane.onDanger, kane.danger],
  ['texte sur succès', kane.onSuccess, kane.success],
  ['texte sur alerte', kane.onWarning, kane.warning],
  ['texte sur primaire', kane.primaryText, kane.primary],
  ['or / fond', kane.accent, kane.bg],
  ['impression texte / fond', kanePrint.text, kanePrint.bg],
  ['impression atténué / surface', kanePrint.textMuted, kanePrint.surface],
  ['impression texte sur danger', kanePrint.onDanger, kanePrint.danger],
  ['impression texte sur succès', kanePrint.onSuccess, kanePrint.success],
  ['impression texte sur alerte', kanePrint.onWarning, kanePrint.warning],
  ['impression rouge texte / surface', kanePrint.dangerText, kanePrint.surface],
  ['impression or / fond', kanePrint.accent, kanePrint.bg],
];
for (const [label, fg, bg] of pairs) {
  const ratio = contrast(fg, bg);
  if (ratio < 4.5) fail(`${label} : contraste ${ratio.toFixed(2)} < 4.5`);
}

// Accessibilité : tous les couples dessinés par le kit, sombre (kane), jour (kaneDay) et impression.
const a11yFailures: string[] = [];
for (const [name, p] of [['sombre', kane], ['jour', kaneDay], ['impression', kanePrint]] as const) {
  const chip = (c: string) => ensureContrast(ensureContrast(c, mix(c, p.surface, 0.16), p.text), mix(c, p.bg, 0.16), p.text);
  const kit = kitPairs(p, name, {
    buttons: [
      ['principal', p.primaryText, p.primary],
      ['danger', p.onDanger, p.danger],
      ['succès', p.onSuccess, p.success],
    ],
    ghostInk: p.primary,
    chipInk: chip,
    badgeInk: (c) => ensureContrast(c, mix(c, p.surface, 0.15), p.text),
    badgeColors: [
      ['succès', p.success],
      ['alerte', p.warning],
      ['info', p.info],
      ['rouge', p.dangerText],
      ['or', p.accent],
      ['primaire', p.primary],
    ],
    toast: { bg: p.toastBg, fg: p.toastFg },
    fieldError: p.dangerText,
    emptyInk: p.primary, // inkOf(t) du kit
  });
  for (const [label, fg, bg, min] of kit) {
    const r = contrast(fg, bg);
    if (r < min) a11yFailures.push(`${label} : ${r.toFixed(2)} < ${min}`);
  }
}
if (a11yFailures.length) fail('Contraste insuffisant :\n' + a11yFailures.join('\n'));

// Réglage « Vibrations » : activé par défaut, clé dédiée, aucune donnée touchée.
const VIBRATIONS_KEY = 'kaneone-suite:vibrations@v1';
if (!readFileSync(join(root, 'src/kit/haptics.ts'), 'utf8').includes(`'${VIBRATIONS_KEY}'`)) fail('clé vibrations modifiée');
void (async () => {
  const mem = new Map<string, string>([['kaneone-suite@v1', '{}']]);
  const pref = createVibrationPref(
    { getItem: async (k: string) => mem.get(k) ?? null, setItem: async (k: string, v: string) => void mem.set(k, v) },
    VIBRATIONS_KEY,
  );
  await pref.hydrate();
  if (!pref.get()) fail('vibrations désactivées par défaut');
  pref.set(false);
  await new Promise((r) => setTimeout(r, 0));
  if (mem.get(VIBRATIONS_KEY) !== 'off' || mem.get('kaneone-suite@v1') !== '{}' || mem.size !== 2) fail('vibrations : stockage inattendu');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

let fetchCalled = false;
globalThis.fetch = () => {
  fetchCalled = true;
  return Promise.reject(new Error('fetch'));
};
reportCrash(new Error('incident de test'));
if (fetchCalled) fail('Sentry a été contacté sans DSN configuré');
if (!recentCrashes().some((n) => n.message === 'incident de test')) fail('journal local muet');
reportCrash(new Error('sk-abcdefghijklmnopqrstuvwxyz'));
if (recentCrashes()[0]?.message.includes('sk-')) fail('le journal local a conservé un secret');

for (const sc of SCENARIOS) {
  store.set((s) => ({ ...s, role: sc.role }));
  for (const step of sc.steps) {
    if (!step.done(store.get())) step.run();
  }
  const progress = scenarioProgress(sc, store.get());
  if (!progress.passed) fail(`${sc.id} ${progress.done}/${progress.total}`);
}

const app = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8')) as {
  expo: { ios?: { bundleIdentifier?: string; appleTeamId?: string; baseUrl?: string }; android?: { package?: string }; experiments?: { baseUrl?: string } };
};
if (app.expo.ios?.bundleIdentifier !== 'ch.mohamadba.kaneonesuite') fail('bundle id');
if (app.expo.android?.package !== 'ch.mohamadba.kaneonesuite') fail('package android');
if (app.expo.ios?.appleTeamId !== 'Y9XF9RY2BU') fail('équipe Apple');
if (app.expo.ios?.baseUrl) fail('baseUrl iOS interdit');
if (app.expo.experiments?.baseUrl !== '/kaneone-suite') fail('baseUrl web');

function loadAppConfig(easBuild: string | undefined) {
  const env = { ...process.env };
  if (easBuild === undefined) delete env.EAS_BUILD;
  else env.EAS_BUILD = easBuild;
  const script = `const cfg = require(${JSON.stringify(join(root, 'app.config.js'))}); const resolved = typeof cfg === 'function' ? cfg({}) : cfg; process.stdout.write(JSON.stringify(resolved));`;
  const result = spawnSync(process.execPath, ['-e', script], { env, cwd: root, encoding: 'utf8' });
  if (result.status !== 0) fail(result.stderr || 'app.config.js impossible à charger');
  return JSON.parse(result.stdout) as typeof app;
}

const easConfig = loadAppConfig('1');
if (easConfig.expo.experiments && Object.prototype.hasOwnProperty.call(easConfig.expo.experiments, 'baseUrl')) {
  fail('experiments.baseUrl encore présent avec EAS_BUILD=1');
}
if (easConfig.expo.ios?.baseUrl) fail('baseUrl iOS sous EAS');
if (easConfig.expo.ios?.bundleIdentifier !== 'ch.mohamadba.kaneonesuite') fail('bundle id sous EAS');
if (easConfig.expo.android?.package !== 'ch.mohamadba.kaneonesuite') fail('package android sous EAS');
const webConfig = loadAppConfig(undefined);
if (webConfig.expo.experiments?.baseUrl !== '/kaneone-suite') fail('baseUrl web retiré hors EAS');
if (webConfig.expo.ios?.baseUrl) fail('baseUrl iOS hors EAS');

const banned = [/sk-[A-Za-z0-9]{8,}/, /BEGIN (?:RSA |OPENSSH |EC )?PRIVATE/, /EXPO_PUBLIC_OPENAI/, /EXPO_PUBLIC_EXAMPLE/, /ASC_API/];
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    if (name === 'node_modules' || name === 'dist' || name === '.expo') return [];
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
for (const file of walk(join(root, 'src'))) {
  const text = readFileSync(file, 'utf8');
  for (const re of banned) if (re.test(text)) fail(`${file} contient ${re}`);
  if (file.endsWith('crash.ts')) continue;
  if (/\bfetch\s*\(/.test(text)) fail(`${file} appelle fetch`);
}
const envExample = readFileSync(join(root, '.env.example'), 'utf8');
for (const re of banned) if (re.test(envExample)) fail(`.env.example ${re}`);
if (!envExample.includes('YOUR_SENTRY_DSN') || !envExample.includes('EXPO_NO_CAPABILITY_SYNC=1')) fail('env example incomplet');

console.log(`Passe 1 : ${SCENARIOS.length}/${SCENARIOS.length} scénarios, contraste AA, stockage ${store.key}`);
console.log('Accessibilité : contraste AA du kit (sombre, jour, impression), vibrations activées par défaut');
