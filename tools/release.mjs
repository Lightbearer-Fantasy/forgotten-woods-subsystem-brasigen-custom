#!/usr/bin/env node
// =============================================================================
// release.mjs — pipeline de release unique et reproductible.
//
//   node tools/release.mjs            -> construit + VÉRIFIE module.zip (vrai ZIP)
//   node tools/release.mjs --publish  -> + crée/maj la release GitHub v<version>
//                                        (supprime puis ré-uploade module.zip
//                                         et module.json sur le tag)
//
// Garde-fou anti-régression : on REFUSE de publier un fichier qui n'est pas un
// vrai ZIP PKZIP. La panne "FILE_ENDED" dans Foundry venait d'un tar.gz renommé
// .zip ; ici tout passe par `archiver` (vrai ZIP) + une validation binaire.
//
// Token GitHub : variable d'env GITHUB_TOKEN / GH_TOKEN, sinon le credential
// déjà mémorisé par git pour github.com (jamais affiché).
// =============================================================================

import { createWriteStream, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { buildPacks } from './build-packs.mjs';

const require = createRequire(import.meta.url);
const { ZipArchive } = require('archiver');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ZIP_PATH = path.join(ROOT, 'module.zip');
const PUBLISH = process.argv.includes('--publish');

// Tout ce qui peut être distribué dans le module (on n'inclut que ce qui existe).
const SHIP = [
  'module.json',
  'scripts',
  'templates',
  'styles',
  'lang',
  'images',
  'assets',
  'packs',
  'README.md',
  'LICENSE',
];

function fail(msg) {
  console.error(`\n❌ ${msg}`);
  process.exit(1);
}

// --- 1. Construire le ZIP --------------------------------------------------
async function buildZip() {
  const present = SHIP.filter((p) => existsSync(path.join(ROOT, p)));
  await new Promise((resolve, reject) => {
    const out = createWriteStream(ZIP_PATH);
    const archive = new ZipArchive({ zlib: { level: 9 } });
    out.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(out);
    for (const p of present) {
      const abs = path.join(ROOT, p);
      if (p.includes('.')) archive.file(abs, { name: p });
      else archive.directory(abs, p);
    }
    archive.finalize();
  });
  console.log('📦 Empaqueté :', present.join(', '));
}

// --- 2. Valider que c'est un VRAI ZIP -------------------------------------
async function validateZip() {
  const buf = await readFile(ZIP_PATH);
  const headOk = buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04; // "PK\x03\x04"
  // End Of Central Directory : "PK\x05\x06" (présent en fin de tout zip valide).
  const eocdOk = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06])) !== -1;
  if (buf[0] === 0x1f && buf[1] === 0x8b) fail('module.zip est un GZIP (tar.gz), PAS un ZIP. Abandon.');
  if (!headOk) fail('En-tête ZIP invalide (attendu "PK\\x03\\x04"). Abandon.');
  if (!eocdOk) fail('Signature de fin de ZIP introuvable (archive tronquée). Abandon.');
  console.log(`✅ ZIP valide : ${buf.length} octets (en-tête PK + EOCD OK)`);
}

// --- 3. Publier sur GitHub -------------------------------------------------
function getToken() {
  const env = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (env) return env.trim();
  try {
    const out = execFileSync('git', ['credential', 'fill'], {
      input: 'protocol=https\nhost=github.com\n\n',
      encoding: 'utf8',
    });
    const m = out.match(/^password=(.+)$/m);
    if (m) return m[1].trim();
  } catch { /* ignore */ }
  fail('Aucun token GitHub (ni GITHUB_TOKEN/GH_TOKEN, ni credential git github.com).');
}

async function gh(token, url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(opts.headers || {}),
    },
  });
  return res;
}

async function publish(manifest) {
  const token = getToken();
  const m = manifest.url.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/);
  if (!m) fail(`Impossible de déduire owner/repo depuis url="${manifest.url}".`);
  const repo = `${m[1]}/${m[2]}`;
  const tag = `v${manifest.version}`;
  const api = 'https://api.github.com';

  // Trouver (ou créer) la release du tag.
  let res = await gh(token, `${api}/repos/${repo}/releases/tags/${tag}`);
  let rel;
  if (res.status === 404) {
    res = await gh(token, `${api}/repos/${repo}/releases`, {
      method: 'POST',
      body: JSON.stringify({ tag_name: tag, name: tag, draft: false, prerelease: false }),
    });
    if (!res.ok) fail(`Création release ${tag} échouée : HTTP ${res.status} ${await res.text()}`);
    rel = await res.json();
    console.log(`🆕 Release ${tag} créée (id ${rel.id}).`);
  } else if (res.ok) {
    rel = await res.json();
    console.log(`🔎 Release ${tag} trouvée (id ${rel.id}).`);
  } else {
    fail(`Lecture release ${tag} échouée : HTTP ${res.status} ${await res.text()}`);
  }

  // Uploader chaque asset, en supprimant d'abord un éventuel homonyme.
  const assets = [
    { name: 'module.zip', file: ZIP_PATH, type: 'application/zip' },
    { name: 'module.json', file: path.join(ROOT, 'module.json'), type: 'application/json' },
  ];
  for (const a of assets) {
    const old = (rel.assets || []).find((x) => x.name === a.name);
    if (old) {
      const d = await gh(token, `${api}/repos/${repo}/releases/assets/${old.id}`, { method: 'DELETE' });
      console.log(`🗑️  ${a.name} précédent supprimé (HTTP ${d.status}).`);
    }
    const data = readFileSync(a.file);
    const up = await gh(
      token,
      `https://uploads.github.com/repos/${repo}/releases/${rel.id}/assets?name=${encodeURIComponent(a.name)}`,
      { method: 'POST', headers: { 'Content-Type': a.type }, body: data },
    );
    if (!up.ok) fail(`Upload ${a.name} échoué : HTTP ${up.status} ${await up.text()}`);
    const info = await up.json();
    console.log(`⬆️  ${a.name} uploadé (${info.size} o, ${info.content_type}).`);
  }
  console.log(`\n🎉 Release ${tag} à jour : https://github.com/${repo}/releases/tag/${tag}`);
}

// --- 0. Garde-fou : synchroniser le champ `download` sur la version ---------
// Le bug v0.5.3 venait d'un champ `download` figé sur une ancienne version :
// Foundry lisait version=0.5.3 mais téléchargeait le ZIP v0.5.2. On force ici
// download = .../releases/download/v<version>/module.zip AVANT de zipper, pour
// que le module.json local ET celui embarqué dans le ZIP soient cohérents.
function syncDownloadField() {
  const file = path.join(ROOT, 'module.json');
  const raw = readFileSync(file, 'utf8');
  const m = JSON.parse(raw);
  const repoMatch = m.url.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/);
  if (!repoMatch) fail(`Impossible de déduire owner/repo depuis url="${m.url}".`);
  const repo = `${repoMatch[1]}/${repoMatch[2]}`;
  const expected = `https://github.com/${repo}/releases/download/v${m.version}/module.zip`;
  if (m.download !== expected) {
    console.log(`🔧 download corrigé :\n   avant : ${m.download}\n   après : ${expected}`);
    m.download = expected;
    writeFileSync(file, JSON.stringify(m, null, 4) + '\n');
  } else {
    console.log(`✅ download déjà cohérent (v${m.version}).`);
  }
  return m;
}

// --- main ------------------------------------------------------------------
const manifest = syncDownloadField();
await buildPacks();
await buildZip();
await validateZip();
if (PUBLISH) await publish(manifest);
else console.log('\nℹ️  Build seul. Pour publier : node tools/release.mjs --publish');
