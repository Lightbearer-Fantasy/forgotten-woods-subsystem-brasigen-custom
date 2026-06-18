import { malusFor } from "./skill-malus.js";
import { aspectBonus } from "../data/aspects.js";

/**
 * Liste des modificateurs sans type d'un jet : bonus d'Aspect + malus de
 * sur-utilisation. Les entrées nulles sont omises. Cumulables (sans type).
 * @param {string} skill
 * @param {string|null} aspect
 * @param {Record<string, number>} tally
 * @returns {{source: "aspect"|"overuse", modifier: number}[]}
 */
export function composeModifiers(skill, aspect, tally) {
    const modifiers = [];
    const bonus = aspectBonus(aspect, skill);
    if (bonus !== 0) modifiers.push({ source: "aspect", modifier: bonus });
    const malus = malusFor(skill, tally);
    if (malus !== 0) modifiers.push({ source: "overuse", modifier: malus });
    return modifiers;
}
