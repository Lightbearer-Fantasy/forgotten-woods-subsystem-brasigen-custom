// scripts/mapping/reveal-modifiers.js
// Modificateurs de distance de révélation portés par les chips d'Hex (PUR).
// Seul endroit qui connaît les deltas de révélation. Étendre = une entrée.

const REVEAL_DELTAS = { plaines: 1, marais: -1 };

/**
 * Somme des deltas de révélation des chips fournis (0 pour les chips sans effet).
 * @param {string[]} chipIds
 * @returns {number}
 */
export function revealDelta(chipIds) {
    if (!Array.isArray(chipIds)) return 0;
    return chipIds.reduce((sum, id) => sum + (REVEAL_DELTAS[id] ?? 0), 0);
}

/**
 * Distance de révélation effective émanant d'un Hex : base + delta des chips,
 * bornée à 0 (jamais moins que l'Hex lui-même).
 * @param {number} baseSteps  distance configurée dans World Explorer (en spaces)
 * @param {string[]} chipIds
 * @returns {number}
 */
export function effectiveRange(baseSteps, chipIds) {
    return Math.max(0, (baseSteps ?? 0) + revealDelta(chipIds));
}
