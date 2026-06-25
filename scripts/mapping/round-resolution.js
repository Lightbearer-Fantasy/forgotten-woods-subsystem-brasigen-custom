// scripts/mapping/round-resolution.js
// Décision PURE de résolution des chips au début d'un Round d'Hexploration.
// Hustle et Rest sont mutuellement exclusifs (S'empresser interdit toute autre
// AG) : s'ils coexistent, on bloque la résolution et on prévient le MJ.

const BLOCKED = { blocked: true, applyCook: false, applyFatigued: false, removeFatigued: false };

/**
 * @param {string[]} chips  clés des chips en attente (hustle/rest/cook)
 * @returns {{blocked:boolean, applyCook:boolean, applyFatigued:boolean, removeFatigued:boolean}}
 */
export function resolveRoundChips(chips) {
    const set = new Set(chips ?? []);
    if (set.has("hustle") && set.has("rest")) return { ...BLOCKED };
    return {
        blocked: false,
        applyCook: set.has("cook"),
        applyFatigued: set.has("hustle"),
        removeFatigued: set.has("rest")
    };
}
