import { offsetToKey } from "../utils/hex.js";

export const MODULE_ID = "forgotten-woods-brasigen";
export const FLAG = "camps";

/**
 * Carte des camps de la scène.
 * @param {object} scene
 * @returns {Record<string, true>} { "i,j": true }
 */
export function readCamps(scene) {
    return scene.getFlag(MODULE_ID, FLAG) ?? {};
}

/**
 * Vrai si un camp est présent sur le hex.
 * @param {object} scene
 * @param {{i:number,j:number}} offset
 * @returns {boolean}
 */
export function campAt(scene, offset) {
    return readCamps(scene)[offsetToKey(offset)] === true;
}

/**
 * Payload scene.update posant (on=true) ou retirant (on=false) un camp.
 * @param {object} scene
 * @param {{i:number,j:number}} offset
 * @param {boolean} on
 * @returns {Record<string, any>}
 */
export function buildCampUpdate(scene, offset, on) {
    const key = offsetToKey(offset);
    const base = `flags.${MODULE_ID}.${FLAG}`;
    return on ? { [`${base}.${key}`]: true } : { [`${base}.-=${key}`]: null };
}

/**
 * Payload scene.update effaçant tous les camps. {} si aucun camp.
 * @param {object} scene
 * @returns {Record<string, any>}
 */
export function buildClearAllCamps(scene) {
    if (Object.keys(readCamps(scene)).length === 0) return {};
    return { [`flags.${MODULE_ID}.-=${FLAG}`]: null };
}

/**
 * Pose/retire un camp et persiste (MJ uniquement).
 * @param {object} scene
 * @param {{i:number,j:number}} offset
 * @param {boolean} on
 * @returns {Promise|void}
 */
export function setCamp(scene, offset, on) {
    if (!game.user.isGM || !scene) return;
    return scene.update(buildCampUpdate(scene, offset, on));
}

/**
 * Efface tous les camps de la scène (MJ uniquement). No-op si rien à effacer.
 * @param {object} scene
 * @returns {Promise|void}
 */
export function clearAllCamps(scene) {
    if (!game.user.isGM || !scene) return;
    const updates = buildClearAllCamps(scene);
    if (Object.keys(updates).length === 0) return;
    return scene.update(updates);
}
