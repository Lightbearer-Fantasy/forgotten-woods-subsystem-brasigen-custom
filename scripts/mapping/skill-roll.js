import { degreeKeyFromNumber } from "./skill-outcome.js";

/**
 * Résout la statistique PF2E d'un slug. En PF2E 8.x la Perception n'est pas
 * dans `actor.skills` mais exposée séparément en `actor.perception`.
 * @param {object} actor
 * @param {string} skill  slug PF2E
 * @returns {object|undefined} la statistique (avec `.roll`) ou undefined
 */
export function resolveSkillStatistic(actor, skill) {
    return skill === "perception" ? actor?.perception : actor?.skills?.[skill];
}

/**
 * Convertit nos modificateurs en instances PF2E sans type, libellées.
 * @param {{source: string, modifier: number}[]} modifiers
 * @returns {object[]}
 */
export function buildPf2eModifiers(modifiers) {
    return modifiers.map(({ source, modifier }) => new game.pf2e.Modifier({
        label: game.i18n.localize(`FORGOTTEN_WOODS.mapArea.modifiers.${source}`),
        modifier,
        type: "untyped"
    }));
}

/**
 * Lance le jet de compétence d'un acteur, avec les modificateurs sans type,
 * et renvoie la clé de degré de réussite.
 * Si dc == null, le jet est lancé sans cible (placeholder / jets hors Hex DC).
 * IO — à valider en jeu (API PF2E).
 * @param {object} actor
 * @param {string} skill  slug PF2E
 * @param {number|null} dc
 * @param {{source: string, modifier: number}[]} modifiers
 * @returns {Promise<string>} clé d'outcome ("success"…) ou ""
 */
export async function rollMapSkill(actor, skill, dc, modifiers) {
    const statistic = resolveSkillStatistic(actor, skill);
    if (!statistic) return "";
    const rollOptions = {
        modifiers: buildPf2eModifiers(modifiers),
        rollMode: "publicroll"
    };
    // dc == null → jet standard sans cible (placeholder / jets hors Hex DC).
    if (dc != null) rollOptions.dc = { value: dc, visible: false };
    const roll = await statistic.roll(rollOptions);
    const n = roll?.degreeOfSuccess ?? roll?.options?.degreeOfSuccess;
    return typeof n === "number" ? degreeKeyFromNumber(n) : "";
}
