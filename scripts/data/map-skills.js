/**
 * Compétences proposées pour « Cartographier la zone », dans l'ordre d'affichage.
 * Slugs de compétence PF2E.
 * @type {string[]}
 */
export const MAP_SKILLS = ["crafting", "society", "nature", "survival"];

/**
 * Compétences proposées à un acteur pour Cartographier : MAP_SKILLS, plus
 * Scouting Lore seulement si l'acteur la possède sur sa fiche.
 * @param {object} actor
 * @returns {string[]} slugs
 */
export function mapSkillChoices(actor) {
    const slugs = [...MAP_SKILLS];
    if (actor?.skills?.["scouting-lore"]) slugs.push("scouting-lore");
    return slugs;
}

/**
 * Clé i18n du libellé d'une compétence.
 * @param {string} slug
 * @returns {string}
 */
export function skillLabelKey(slug) {
    return `FORGOTTEN_WOODS.skills.${slug}`;
}
