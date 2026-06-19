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
 * Lance le jet de compétence d'un acteur contre le DC (caché), avec les
 * modificateurs sans type, et renvoie la clé de degré de réussite.
 * IO — à valider en jeu (API PF2E).
 * @param {object} actor
 * @param {string} skill  slug PF2E
 * @param {number} dc
 * @param {{source: string, modifier: number}[]} modifiers
 * @returns {Promise<string>} clé d'outcome ("success"…) ou ""
 */
export async function rollMapSkill(actor, skill, dc, modifiers) {
    const statistic = actor?.skills?.[skill];
    if (!statistic) return "";
    const roll = await statistic.roll({
        dc: { value: dc, visible: false },
        modifiers: buildPf2eModifiers(modifiers),
        rollMode: "publicroll"
    });
    // Degré de réussite : PF2E expose un index 0..3. Selon la version, il se
    // trouve sur roll.degreeOfSuccess (nombre) ou roll.options.degreeOfSuccess.
    const n = roll?.degreeOfSuccess ?? roll?.options?.degreeOfSuccess;
    const key = typeof n === "number" ? degreeKeyFromNumber(n) : "";
    // DIAGNOSTIC bug 2 (décrémentation) — à retirer après identification.
    console.debug("FW|rollMapSkill", {
        skill, dc,
        rollType: roll?.constructor?.name,
        degreeOfSuccess: roll?.degreeOfSuccess,
        optionsDegree: roll?.options?.degreeOfSuccess,
        n, key
    });
    return key;
}
