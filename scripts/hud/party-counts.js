/**
 * Membres PJ (type "character") d'un acteur Party PF2e.
 * @param {object} partyActor
 * @returns {object[]}
 */
function characters(partyActor) {
    return (partyActor?.members ?? []).filter((m) => m?.type === "character");
}

/**
 * Speed terrestre du PJ le plus lent du Party, en pieds.
 * @param {object} partyActor
 * @returns {number|null} null si aucun PJ n'a de Speed exploitable.
 */
export function slowestLandSpeed(partyActor) {
    const speeds = characters(partyActor)
        .map((m) => m?.system?.attributes?.speed?.value)
        .filter((v) => typeof v === "number" && v > 0);
    return speeds.length ? Math.min(...speeds) : null;
}

/**
 * Nombre d'Activités de Groupe selon la Speed du PJ le plus lent.
 * @param {number|null} speed
 * @returns {3|4|5}
 */
export function groupActivityCount(speed) {
    if (speed == null) return 4;
    if (speed <= 15) return 3;
    if (speed < 30) return 4;
    return 5;
}

/**
 * Classe de couleur du compteur d'AG : 3 rouge, 4 blanc, 5 bleu.
 * @param {number} n
 * @returns {"red"|"white"|"blue"}
 */
export function groupCountColor(n) {
    if (n === 3) return "red";
    if (n === 5) return "blue";
    return "white";
}

/**
 * Nombre de PJ (type "character") dans le Party.
 * @param {object} partyActor
 * @returns {number}
 */
export function characterCount(partyActor) {
    return characters(partyActor).length;
}
