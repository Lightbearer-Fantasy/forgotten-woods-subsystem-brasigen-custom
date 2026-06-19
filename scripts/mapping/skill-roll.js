import { degreeKeyFromNumber } from "./skill-outcome.js";

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
    const statistic = actor?.skills?.[skill];
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
