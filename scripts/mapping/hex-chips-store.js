// scripts/mapping/hex-chips-store.js
// Stockage des chips par Hex sur un flag de scène. Modèle de mapping-dc-store.js :
// builders PURS (testables) + wrappers IO (MJ). Clés "i,j" (sans point).

import { applyChipToList, removeChipFromList, getChip } from "../data/hex-chips.js";

export const MODULE_ID = "forgotten-woods-brasigen";
export const CHIPS_FLAG = "hexChips";

/** @param {object} scene @returns {Record<string,string[]>} copie { "i,j": ids[] } */
export function readChips(scene) {
    const data = scene?.getFlag?.(MODULE_ID, CHIPS_FLAG) ?? {};
    return (typeof foundry !== "undefined" && foundry.utils?.deepClone) ? foundry.utils.deepClone(data) : JSON.parse(JSON.stringify(data));
}

/** @param {object} scene @param {{i,j}} offset @returns {string[]} */
export function chipsAt(scene, offset) {
    return readChips(scene)[`${offset.i},${offset.j}`] ?? [];
}

/** Écrit une liste (ou supprime la clé si vide). Mutateur du payload `updates`. */
function writeList(updates, key, list) {
    const flagBase = `flags.${MODULE_ID}.${CHIPS_FLAG}`;
    if (list.length === 0) updates[`${flagBase}.-=${key}`] = null;
    else updates[`${flagBase}.${key}`] = list;
}

/**
 * Construit le payload scene.update appliquant un chip à des clés.
 * Gère l'exclusivité terrain (via applyChipToList) et la contrainte `unique`
 * (retrait du chip des AUTRES Hex de la scène).
 * @param {object} scene @param {string[]} keys @param {string} chipId
 * @returns {Record<string, any>}
 */
export function buildApplyChip(scene, keys, chipId) {
    const chip = getChip(chipId);
    if (!chip) return {};
    const current = readChips(scene);
    const updates = {};
    const target = new Set(keys);

    if (chip.unique) {
        for (const [key, list] of Object.entries(current)) {
            if (!target.has(key) && list.includes(chipId)) {
                writeList(updates, key, removeChipFromList(list, chipId));
            }
        }
    }
    for (const key of keys) {
        writeList(updates, key, applyChipToList(current[key] ?? [], chipId));
    }
    return updates;
}

/** Applica un chip à une sélection et persiste (MJ). */
export function applyChip(scene, keys, chipId) {
    if (!game.user.isGM || !scene || !keys?.length) return;
    const updates = buildApplyChip(scene, keys, chipId);
    if (Object.keys(updates).length === 0) return;
    return scene.update(updates);
}

/**
 * Construit le payload retirant un chip d'un Hex. {} si absent.
 * @param {object} scene @param {{i,j}} offset @param {string} chipId
 * @returns {Record<string, any>}
 */
export function buildRemoveChip(scene, offset, chipId) {
    const key = `${offset.i},${offset.j}`;
    const list = readChips(scene)[key] ?? [];
    if (!list.includes(chipId)) return {};
    const updates = {};
    writeList(updates, key, removeChipFromList(list, chipId));
    return updates;
}

/** Retire un chip d'un Hex et persiste (MJ). */
export function removeChip(scene, offset, chipId) {
    if (!game.user.isGM || !scene) return;
    const updates = buildRemoveChip(scene, offset, chipId);
    if (Object.keys(updates).length === 0) return;
    return scene.update(updates);
}

/** Construit le payload effaçant tous les chips. {} si aucun. */
export function buildClearAllChips(scene) {
    if (Object.keys(readChips(scene)).length === 0) return {};
    return { [`flags.${MODULE_ID}.-=${CHIPS_FLAG}`]: null };
}

/** Efface tous les chips de la scène et persiste (MJ). */
export function clearAllChips(scene) {
    if (!game.user.isGM || !scene) return;
    const updates = buildClearAllChips(scene);
    if (Object.keys(updates).length === 0) return;
    return scene.update(updates);
}
