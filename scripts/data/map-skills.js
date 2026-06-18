/**
 * Compétences proposées pour « Cartographier la zone », dans l'ordre d'affichage.
 * Slugs de compétence PF2E.
 * @type {string[]}
 */
export const MAP_SKILLS = ["crafting", "society", "nature", "survival"];

/**
 * Clé i18n du libellé d'une compétence.
 * @param {string} slug
 * @returns {string}
 */
export function skillLabelKey(slug) {
    return `FORGOTTEN_WOODS.skills.${slug}`;
}
