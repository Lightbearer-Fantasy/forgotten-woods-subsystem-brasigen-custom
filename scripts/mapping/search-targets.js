import { offsetToKey } from "../utils/hex.js";

/**
 * Set des clés "i,j" des hex valides pour Fouiller (centre + 6 voisins).
 * @param {{i: number, j: number}[]} offsets
 * @returns {Set<string>}
 */
export function validSearchKeys(offsets) {
    return new Set(offsets.map(offsetToKey));
}

/**
 * Vrai si l'offset cliqué fait partie des hex valides.
 * @param {Set<string>} validKeys
 * @param {{i: number, j: number}} offset
 * @returns {boolean}
 */
export function isValidSearchHex(validKeys, offset) {
    return validKeys.has(offsetToKey(offset));
}

/**
 * Deltas { "i,j": delta } pour un seul hex. Map vide si delta === 0
 * (échec simple → aucune écriture). Conserve les deltas négatifs (crit échec).
 * @param {string} offsetKey
 * @param {number} delta
 * @returns {Map<string, number>}
 */
export function searchPointsDeltas(offsetKey, delta) {
    const deltas = new Map();
    if (delta === 0) return deltas;
    deltas.set(offsetKey, delta);
    return deltas;
}
