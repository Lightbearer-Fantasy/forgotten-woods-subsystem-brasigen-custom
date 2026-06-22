#!/usr/bin/env node
// Compile les sources JSON des compendiums du module en bases LevelDB.
import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { ClassicLevel } from "classic-level";
import { rmSync, existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Garde-fou : foundryvtt-cli IGNORE silencieusement toute source SANS champ
 * `_key` (cf. lib/package.mjs `if (!doc._key) continue;`). Une source mal formée
 * produit donc un pack VIDE sans erreur — le bug v0.6.2a/b (effets introuvables).
 * On valide les sources avant, et on vérifie le compte après.
 */
function sourceFiles(dir) {
    return readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => path.join(dir, f));
}

async function countEntries(packDir) {
    const db = new ClassicLevel(packDir, { keyEncoding: "utf8", valueEncoding: "json" });
    await db.open();
    let n = 0;
    for await (const _ of db.iterator()) n++; // eslint-disable-line no-unused-vars
    await db.close();
    return n;
}

export async function buildPacks() {
    const src = path.join(ROOT, "packs/_source/effects");
    const dest = path.join(ROOT, "packs/effects");

    const files = sourceFiles(src);
    if (files.length === 0) throw new Error(`Aucune source JSON dans ${src}.`);
    for (const file of files) {
        const doc = JSON.parse(readFileSync(file, "utf8"));
        if (!doc._key) {
            throw new Error(`Source ${path.basename(file)} sans champ "_key" : foundryvtt-cli l'ignorerait silencieusement. Ajoutez "_key": "!items!<_id>".`);
        }
    }

    if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
    await compilePack(src, dest);

    const packed = await countEntries(dest);
    if (packed !== files.length) {
        throw new Error(`Pack 'effects' incohérent : ${files.length} source(s) mais ${packed} document(s) compilé(s).`);
    }
    console.log(`📚 Compendium 'effects' compilé (${packed} effets) →`, dest);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    buildPacks().catch((e) => { console.error(e); process.exit(1); });
}
