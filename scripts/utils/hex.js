/**
 * Clé de stockage d'un offset de grille.
 * @param {{i: number, j: number}} offset
 * @returns {string} "i,j"
 */
export function offsetToKey(offset) {
    return `${offset.i},${offset.j}`;
}

/**
 * Offset de grille (ligne/colonne) pour des coordonnées pixel.
 * @param {{x: number, y: number}} coords
 * @returns {{i: number, j: number}}
 */
export function coordsToOffset(coords) {
    return canvas.grid.getOffset(coords);
}

/**
 * Tous les offsets à au plus `steps` sauts d'adjacence de l'origine, centre inclus.
 * Parcours en anneau via canvas.grid.getAdjacentOffsets (indépendant du type de grille).
 * @param {{i: number, j: number}} originOffset
 * @param {number} steps
 * @returns {{i: number, j: number}[]}
 */
export function spacesInRange(originOffset, steps) {
    const visited = new Map([[offsetToKey(originOffset), originOffset]]);
    if (steps <= 0) return [...visited.values()];

    let frontier = [originOffset];
    for (let s = 0; s < steps; s++) {
        const next = [];
        for (const offset of frontier) {
            for (const adjacent of canvas.grid.getAdjacentOffsets(offset)) {
                const key = offsetToKey(adjacent);
                if (!visited.has(key)) {
                    visited.set(key, adjacent);
                    next.push(adjacent);
                }
            }
        }
        frontier = next;
    }
    return [...visited.values()];
}

/**
 * Tous les offsets de hex dont le centre tombe dans le rectangle fourni
 * (typiquement la zone de scène, hors padding). Parcourt la plage d'offsets
 * couvrant le rectangle puis filtre par position du centre.
 * @param {{x: number, y: number, width: number, height: number}} rect
 * @returns {{i: number, j: number}[]}
 */
export function offsetsInRect(rect) {
    const [i0, j0, i1, j1] = canvas.grid.getOffsetRange(rect);
    const result = [];
    for (let i = i0; i < i1; i++) {
        for (let j = j0; j < j1; j++) {
            const { x, y } = canvas.grid.getCenterPoint({ i, j });
            if (x >= rect.x && x <= rect.x + rect.width
                && y >= rect.y && y <= rect.y + rect.height) {
                result.push({ i, j });
            }
        }
    }
    return result;
}
