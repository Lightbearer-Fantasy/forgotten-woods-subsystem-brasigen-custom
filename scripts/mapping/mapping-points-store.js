import { offsetToKey, spacesInRange } from "../utils/hex.js";

export const MODULE_ID = "forgotten-woods-brasigen";
export const FLAG = "mappingPoints";
// Plafond de Points de Cartographie par hex : rien n'est prévu au-delà de 4.
export const MAX_POINTS = 4;

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
 * Somme bornée à l'intervalle [0, MAX_POINTS].
 * @param {number} current
 * @param {number} delta
 * @returns {number}
 */
export function clampedAdd(current, delta) {
    return Math.min(MAX_POINTS, Math.max(0, (current ?? 0) + delta));
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
 * Deltas { "i,j": delta } pour tous les hex à portée `radius` de `origin`.
 * Renvoie une Map vide si delta <= 0 (rien à écrire).
 * @param {{i: number, j: number}} origin
 * @param {number} radius
 * @param {number} delta
 * @returns {Map<string, number>}
 */
export function buildRangeDeltas(origin, radius, delta) {
    const deltas = new Map();
    if (delta <= 0) return deltas;
    for (const offset of spacesInRange(origin, radius)) {
        deltas.set(offsetToKey(offset), delta);
    }
    return deltas;
}

/**
 * Comme buildRangeDeltas mais conserve les deltas négatifs (décrément).
 * Renvoie une Map vide uniquement si delta === 0. Le clamp [0, MAX_POINTS]
 * reste appliqué à l'écriture par buildUpdate.
 * @param {{i: number, j: number}} origin
 * @param {number} radius
 * @param {number} delta
 * @returns {Map<string, number>}
 */
export function buildSignedRangeDeltas(origin, radius, delta) {
    const deltas = new Map();
    if (delta === 0) return deltas;
    for (const offset of spacesInRange(origin, radius)) {
        deltas.set(offsetToKey(offset), delta);
    }
    return deltas;
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

/**
 * Construit le payload scene.update effaçant tous les Points de Cartographie.
 * Renvoie {} si la scène n'en porte aucun (no-op).
 * @param {object} scene
 * @returns {Record<string, any>}
 */
export function buildClearAll(scene) {
    if (Object.keys(readPoints(scene)).length === 0) return {};
    return { [`flags.${MODULE_ID}.-=${FLAG}`]: null };
}

/**
 * Efface tous les PC de la scène et persiste (MJ uniquement). No-op si rien à effacer.
 * @param {object} scene
 * @returns {Promise|void}
 */
export function clearAllPoints(scene) {
    if (!game.user.isGM || !scene) return;
    const updates = buildClearAll(scene);
    if (Object.keys(updates).length === 0) return;
    return scene.update(updates);
}
