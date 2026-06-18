import { MAP_SKILLS } from "./map-skills.js";

export const MODULE_ID = "forgotten-woods-brasigen";
export const SKILL_FLAG = "mapAreaSkill";

/**
 * Dernière compétence de cartographie mémorisée sur l'acteur.
 * @param {object} actor
 * @returns {string|null}
 */
export function readDefault(actor) {
    return actor?.getFlag?.(MODULE_ID, SKILL_FLAG) ?? null;
}

/**
 * Défaut effectif du prompt : flag mémorisé s'il est valide, sinon la première
 * compétence de la liste.
 * @param {object} actor
 * @returns {string}
 */
export function effectiveDefault(actor) {
    const saved = readDefault(actor);
    return MAP_SKILLS.includes(saved) ? saved : MAP_SKILLS[0];
}

/**
 * Mémorise la compétence choisie sur l'acteur (no-op si invalide).
 * @param {object} actor
 * @param {string} skill
 * @returns {Promise|void}
 */
export function writeDefault(actor, skill) {
    if (!actor?.setFlag || !MAP_SKILLS.includes(skill)) return;
    return actor.setFlag(MODULE_ID, SKILL_FLAG, skill);
}
