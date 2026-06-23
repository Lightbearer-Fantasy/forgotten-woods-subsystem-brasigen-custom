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
 *  - Joueur : on détecte le clic direct par hit-test du token sous le curseur
 *    (cf. `tokenAtPoint`), à condition que ce Token Party ne soit pas déjà
 *    contrôlé (sinon ce serait une multi-sélection MJ, qu'on continue d'ignorer).
 *
 * @param {object} [state]
 * @param {Array}  [state.controlled]  Tokens actuellement contrôlés.
 * @param {object|null} [state.hovered]  Token Party cliqué (hit-test), le cas échéant.
 * @returns {object|null} le Token Party actif, ou null.
 */
export function activePartyToken({ controlled = [], hovered = null } = {}) {
    if (controlled.length === 1 && isPartyToken(controlled[0])) return controlled[0];
    if (hovered && isPartyToken(hovered) && !controlled.includes(hovered)) return hovered;
    return null;
}

/**
 * Vrai si un clic canvas doit pouvoir ouvrir le Party HUD, selon l'outil actif.
 *
 * Reproduit le comportement du Token HUD natif de PF2E HUD, qui ne réagit au
 * survol/clic que lorsque l'outil sélectionné est la sélection de jetons
 * (`game.activeTool === "select"`). Sur un outil Hex Controls (`selectHex`,
 * `editPoints`, …) — ou tout autre contrôle — le HUD ne doit pas s'ouvrir,
 * exactement comme le Token HUD du Token Actor ne s'ouvre pas dans ce mode.
 *
 * Côté JOUEUR, l'outil actif reste `"select"` pendant la sélection de Hex de
 * Fouiller (le joueur n'a pas accès aux outils Hex Controls, réservés au MJ).
 * On bloque donc aussi l'ouverture quand une sélection de Hex est en cours, pour
 * que cliquer le Hex SOUS le Token Party ne rouvre pas le Party HUD.
 *
 * @param {string|null|undefined} activeTool  cf. `game.activeTool`
 * @param {boolean} [searchSelecting=false]  vrai si une sélection de Hex Fouiller est en cours
 * @returns {boolean}
 */
export function canvasClickOpensHud(activeTool, searchSelecting = false) {
    return activeTool === "select" && !searchSelecting;
}

/**
 * Hit-test déterministe : renvoie le token dont les bornes (rectangle en
 * coordonnées de scène) contiennent le point, sinon null.
 *
 * Sert au joueur non-propriétaire : au moment du clic, on détermine le Token
 * Party sous le curseur par calcul géométrique plutôt qu'en se fiant à l'état
 * de survol PIXI (`hoverToken`), que l'overlay HTML du HUD peut figer — le
 * suivi de survol PIXI est interrompu tant que le curseur est au-dessus du HUD,
 * si bien que `hoverToken(token, false)` peut ne pas se déclencher en sortant.
 *
 * Le rectangle est demi-ouvert (coin haut-gauche inclus, bords bas-droite
 * exclus) pour éviter qu'un point sur une frontière n'appartienne à deux tokens.
 *
 * @param {{x:number,y:number}|null} point  Position en coordonnées de scène (cf. `canvas.mousePosition`).
 * @param {Array} [tokens]  Tokens placeables candidats (cf. `canvas.tokens.placeables`).
 * @returns {object|null} le premier token contenant le point, ou null.
 */
export function tokenAtPoint(point, tokens = []) {
    if (!point) return null;
    return tokens.find((t) => {
        const b = t?.bounds;
        return b
            && point.x >= b.x && point.x < b.x + b.width
            && point.y >= b.y && point.y < b.y + b.height;
    }) ?? null;
}
