#!/usr/bin/env node
// Compile les sources JSON des compendiums du module en bases LevelDB.
import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { rmSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function buildPacks() {
    const src = path.join(ROOT, "packs/_source/effects");
    const dest = path.join(ROOT, "packs/effects");
    if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
    await compilePack(src, dest);
    console.log("📚 Compendium 'effects' compilé →", dest);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    buildPacks().catch((e) => { console.error(e); process.exit(1); });
}
