// Valeurs de CONST.GRID_TYPES (stables de Foundry v12 à v14) :
// GRIDLESS:0, SQUARE:1, HEXODDR:2, HEXEVENR:3, HEXODDQ:4, HEXEVENQ:5
// Hexagonal = lignes (HEXODDR/HEXEVENR) ou colonnes (HEXODDQ/HEXEVENQ).
const HEX_GRID_TYPES = new Set([2, 3, 4, 5]);

/**
 * @param {object} scene  Document de scène (ou objet { grid: { type } }).
 * @returns {boolean} vrai si la scène utilise une grille hexagonale.
 */
export function isHexScene(scene) {
    return HEX_GRID_TYPES.has(scene?.grid?.type);
}

/**
 * @param {object} token  Token placeable ou TokenDocument.
 * @returns {boolean} vrai si le token porte un acteur de type "party".
 */
export function isPartyToken(token) {
    return token?.actor?.type === "party";
}

/**
 * Détermine le Token Party à ancrer au HUD à partir de l'état du canvas.
 *
 * Deux chemins, car un joueur non-propriétaire ne PEUT PAS sélectionner
 * (contrôler) le Token Party — `controlToken` ne se déclenche alors jamais :
 *  - MJ / propriétaire : le Token Party doit être le seul token contrôlé
 *    (une multi-sélection n'ouvre jamais le HUD, comme le Token HUD natif).
 *  - Joueur : on détecte le clic direct par le survol (hook `hoverToken`),
 *    à condition que ce Token Party ne soit pas déjà contrôlé (sinon ce
 *    serait une multi-sélection MJ, qu'on continue d'ignorer).
 *
 * @param {object} [state]
 * @param {Array}  [state.controlled]  Tokens actuellement contrôlés.
 * @param {object|null} [state.hovered]  Token actuellement survolé, le cas échéant.
 * @returns {object|null} le Token Party actif, ou null.
 */
export function activePartyToken({ controlled = [], hovered = null } = {}) {
    if (controlled.length === 1 && isPartyToken(controlled[0])) return controlled[0];
    if (hovered && isPartyToken(hovered) && !controlled.includes(hovered)) return hovered;
    return null;
}
