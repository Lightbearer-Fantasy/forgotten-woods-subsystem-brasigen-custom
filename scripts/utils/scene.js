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
