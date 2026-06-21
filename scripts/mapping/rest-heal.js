/**
 * PV regagnés par un personnage lors d'un repos avec ses compagnons.
 * Formule maison : max(1, mod Con) × niveau × 3.
 * @param {number} conMod  modificateur de Constitution
 * @param {number} level   niveau du personnage
 * @returns {number}
 */
export function restHealAmount(conMod, level) {
    return Math.max(1, conMod) * level * 3;
}
