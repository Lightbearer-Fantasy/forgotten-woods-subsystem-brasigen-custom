/**
 * Compte les choix de compétence par slug.
 * @param {string[]} choices
 * @returns {Record<string, number>}
 */
export function tallySkills(choices) {
    const tally = {};
    for (const skill of choices) {
        tally[skill] = (tally[skill] ?? 0) + 1;
    }
    return tally;
}

/**
 * Malus sans type de sur-utilisation : -2 par usage au-delà de 2.
 * 3 fois → -2, 4 fois → -4, etc. ; ≤ 2 → 0.
 * @param {string} skill
 * @param {Record<string, number>} tally
 * @returns {number} ≤ 0
 */
export function malusFor(skill, tally) {
    const count = tally[skill] ?? 0;
    const excess = Math.max(0, count - 2);
    // guard explicite : -2 * 0 === -0 en JS, toBe(0) échouerait sur Object.is
    return excess > 0 ? -2 * excess : 0;
}
