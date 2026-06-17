import { offsetToKey } from "../utils/hex.js";

export const MODULE_ID = "forgotten-woods-brasigen";
export const FLAG = "mappingPoints";

/**
 * Lit la carte des Points de Cartographie de la scène.
 * @param {object} scene
 * @returns {Record<string, number>} { "i,j": count }
 */
export function readPoints(scene) {
    return scene.getFlag(MODULE_ID, FLAG) ?? {};
}

/**
 * Points de Cartographie sur un hex (0 si absent).
 * @param {object} scene
 * @param {{i: number, j: number}} offset
 * @returns {number}
 */
export function pointsAt(scene, offset) {
    return readPoints(scene)[offsetToKey(offset)] ?? 0;
}

/**
 * Somme bornée à 0.
 * @param {number} current
 * @param {number} delta
 * @returns {number}
 */
export function clampedAdd(current, delta) {
    return Math.max(0, (current ?? 0) + delta);
}

/**
 * Construit le payload scene.update appliquant des deltas par hex.
 * Une clé retombant à 0 est supprimée (flags propres).
 * @param {object} scene
 * @param {Map<string, number>} deltas  clé "i,j" -> delta
 * @returns {Record<string, any>}
 */
export function buildUpdate(scene, deltas) {
    const current = readPoints(scene);
    const flagBase = `flags.${MODULE_ID}.${FLAG}`;
    const updates = {};
    for (const [key, delta] of deltas) {
        const next = clampedAdd(current[key], delta);
        if (next === 0) {
            updates[`${flagBase}.-=${key}`] = null;
        } else {
            updates[`${flagBase}.${key}`] = next;
        }
    }
    return updates;
}

/**
 * Applique des deltas et persiste (MJ uniquement). Ne fait rien si vide.
 * @param {object} scene
 * @param {Map<string, number>} deltas
 * @returns {Promise|void}
 */
export function applyDeltas(scene, deltas) {
    if (!game.user.isGM || !scene || deltas.size === 0) return;
    const updates = buildUpdate(scene, deltas);
    if (Object.keys(updates).length === 0) return;
    return scene.update(updates);
}
