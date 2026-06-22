// scripts/mapping/cook-logic.js
/**
 * Compétences proposées pour Cuisiner : Crafting toujours, Cooking Lore seulement
 * si l'acteur la possède sur sa fiche.
 * @param {object} actor
 * @returns {string[]} slugs de compétence
 */
export function cookSkillChoices(actor) {
    const slugs = ["crafting"];
    if (actor?.skills?.["cooking-lore"]) slugs.push("cooking-lore");
    return slugs;
}

/**
 * Variation du compteur d'ingrédients frais selon l'outcome (≤ 0).
 * @param {string} outcome  clé de degré ("success"…)
 * @param {number} partySize  nombre de PJ du Party
 * @returns {number}
 */
export function cookIngredientCost(outcome, partySize) {
    switch (outcome) {
        case "criticalSuccess": return partySize <= 1 ? 0 : -(partySize - 1);
        case "success": return -partySize;
        case "criticalFailure": return -1;
        default: return 0;
    }
}
