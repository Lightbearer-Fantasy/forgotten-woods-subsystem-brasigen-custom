/**
 * Stockage des DC de zone par hex, dans un flag séparé des PC.
 * Valeur absolue (fixée par le MJ), sans plafond ; 0 supprime la clé.
 */
import { pointsAt } from "./mapping-points-store.js";

export const MODULE_ID = "forgotten-woods-brasigen";
export const DC_FLAG = "mappingDC";

/**
 * @param {object} scene
 * @returns {Record<string, number>} { "i,j": dc }
 */
export function readDC(scene) {
    return scene.getFlag(MODULE_ID, DC_FLAG) ?? {};
}

/**
 * @param {object} scene
 * @param {{i: number, j: number}} offset
 * @returns {number} 0 si absent.
 */
export function dcAt(scene, offset) {
    return readDC(scene)[`${offset.i},${offset.j}`] ?? 0;
}

/**
 * DC effectif d'un Hex : DC de base − 2 si le Hex porte 2+ PC (dynamique).
 * dynamic:false rend le DC brut (cas Cuisiner, exclu de la réduction).
 * @param {object} scene
 * @param {{i:number,j:number}} offset
 * @param {{dynamic?:boolean}} [opts]
 * @returns {number}
 */
export function effectiveHexDc(scene, offset, { dynamic = true } = {}) {
    const base = dcAt(scene, offset);
    if (!base) return 0;
    return base - (dynamic && pointsAt(scene, offset) >= 2 ? 2 : 0);
}

/**
 * Construit le payload scene.update fixant une valeur de DC sur des clés.
 * value === 0 supprime la clé (flags propres). Aucun plafond.
 * @param {object} scene
 * @param {string[]} keys  clés "i,j"
 * @param {number} value
 * @returns {Record<string, any>}
 */
export function buildSetDC(scene, keys, value) {
    const flagBase = `flags.${MODULE_ID}.${DC_FLAG}`;
    const updates = {};
    for (const key of keys) {
        if (value === 0) updates[`${flagBase}.-=${key}`] = null;
        else updates[`${flagBase}.${key}`] = value;
    }
    return updates;
}

/**
 * Fixe une valeur de DC sur des clés et persiste (MJ uniquement).
 * @param {object} scene
 * @param {string[]} keys
 * @param {number} value
 * @returns {Promise|void}
 */
export function setDC(scene, keys, value) {
    if (!game.user.isGM || !scene || keys.length === 0) return;
    const updates = buildSetDC(scene, keys, value);
    if (Object.keys(updates).length === 0) return;
    return scene.update(updates);
}

/**
 * Construit le payload effaçant tous les DC. {} si la scène n'en porte aucun.
 * @param {object} scene
 * @returns {Record<string, any>}
 */
export function buildClearAllDC(scene) {
    if (Object.keys(readDC(scene)).length === 0) return {};
    return { [`flags.${MODULE_ID}.-=${DC_FLAG}`]: null };
}

/**
 * Efface tous les DC de la scène et persiste (MJ uniquement). No-op si rien.
 * @param {object} scene
 * @returns {Promise|void}
 */
export function clearAllDC(scene) {
    if (!game.user.isGM || !scene) return;
    const updates = buildClearAllDC(scene);
    if (Object.keys(updates).length === 0) return;
    return scene.update(updates);
}
