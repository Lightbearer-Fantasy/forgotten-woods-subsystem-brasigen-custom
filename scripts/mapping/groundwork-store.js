// scripts/mapping/groundwork-store.js
// Progression de terrain par Hex (activité « Préparer le terrain »). Builders PURS
// testables + wrappers IO (MJ). Flag scène, clés "i,j". Modèle de mapping-points-store.
import { offsetToKey } from "../utils/hex.js";

export const MODULE_ID = "forgotten-woods-brasigen";
export const GROUNDWORK_FLAG = "groundwork";

/** @param {object} scene @returns {Record<string,number>} { "i,j": n } */
export function readGroundwork(scene) {
    return scene?.getFlag?.(MODULE_ID, GROUNDWORK_FLAG) ?? {};
}

/** @param {object} scene @param {{i,j}} offset @returns {number} */
export function groundworkAt(scene, offset) {
    return readGroundwork(scene)[offsetToKey(offset)] ?? 0;
}

/**
 * Résout l'effet d'un jet sur la Progression d'un Hex (PUR).
 * Le total est planché à 0 ; s'il atteint le coût de Voyage, la charge -1 est prête
 * et la Progression repart à 0 (« le prochain Voyage »).
 * @returns {{count:number, discount:boolean}}
 */
export function resolveGroundwork(current, delta, cost) {
    const raw = Math.max(0, (current ?? 0) + delta);
    if (raw >= cost) return { count: 0, discount: true };
    return { count: raw, discount: false };
}

/** Payload scene.update fixant la Progression d'une clé (suppression si 0). */
export function buildSetGroundwork(key, count) {
    const flagBase = `flags.${MODULE_ID}.${GROUNDWORK_FLAG}`;
    if (count === 0) return { [`${flagBase}.-=${key}`]: null };
    return { [`${flagBase}.${key}`]: count };
}

/** Payload effaçant toute la Progression. {} si rien. */
export function buildClearAllGroundwork(scene) {
    if (Object.keys(readGroundwork(scene)).length === 0) return {};
    return { [`flags.${MODULE_ID}.-=${GROUNDWORK_FLAG}`]: null };
}

/** Efface toute la Progression et persiste (MJ). No-op si rien. */
export function clearAllGroundwork(scene) {
    if (!game.user.isGM || !scene) return;
    const updates = buildClearAllGroundwork(scene);
    if (Object.keys(updates).length === 0) return;
    return scene.update(updates);
}
