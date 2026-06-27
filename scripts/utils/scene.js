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
 * Centre pixel à révéler autour d'un token qui vient de bouger.
 *
 * On lit le PAYLOAD de changement (`changes.x/y`, valeur neuve) en priorité : au
 * moment du hook `updateToken`, le document ET le placeable sont encore à l'ANCIENNE
 * position (l'animation de déplacement n'est pas appliquée), donc s'y fier persiste
 * l'anneau autour de la case quittée, jamais de la case atteinte. Même approche que
 * World Explorer (`updateForToken`, index.js). Demi-grid : centre d'une case, valable
 * quelle que soit la taille du token.
 *
 * @param {{x:number,y:number}} doc       TokenDocument (position courante, possiblement périmée).
 * @param {{x?:number,y?:number}|null} changes  Payload du hook `updateToken`.
 * @param {number} gridSize               `canvas.grid.size`, en pixels.
 * @returns {{x:number,y:number}}
 */
export function tokenRevealCenter(doc, changes, gridSize) {
    const x = (changes?.x ?? doc.x) + gridSize / 2;
    const y = (changes?.y ?? doc.y) + gridSize / 2;
    return { x, y };
}

/**
 * Vrai si un diff de scène (hook `updateScene`) modifie le `gridData` de World Explorer
 * (révélations persistées). Sert à redéclencher NOTRE refresh du masque APRÈS l'écriture
 * des données : le refresh throttlé de WE peut sauter l'appel final → masque figé (trous).
 * @param {object|null} changes  2e argument du hook `updateScene`.
 * @returns {boolean}
 */
export function weGridDataChanged(changes) {
    const we = changes?.flags?.["world-explorer"];
    return !!we && "gridData" in we;
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
 * Enfin, l'outil « select » existe AUSSI sur le calque Notes (Sélection de notes) :
 * le HUD ne doit pas s'y ouvrir. On exige donc que le contrôle actif soit le calque
 * des jetons (`"tokens"`), sinon (Notes, Murs, Éclairage…) on bloque.
 *
 * @param {string|null|undefined} activeTool  cf. `game.activeTool`
 * @param {boolean} [searchSelecting=false]  vrai si une sélection de Hex Fouiller est en cours
 * @param {string|null|undefined} [activeControl="tokens"]  cf. `ui.controls?.control?.name`
 * @returns {boolean}
 */
export function canvasClickOpensHud(activeTool, searchSelecting = false, activeControl = "tokens") {
    return activeControl === "tokens" && activeTool === "select" && !searchSelecting;
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
