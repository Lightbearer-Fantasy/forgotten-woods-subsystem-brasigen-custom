// scripts/mapping/mountain-occlusion.js
// Effets du chip Montagne (PUR).
//  - filterMappableDeltas : la Cartographie ne pose pas de PC sur une Montagne tant que
//    le Party n'est pas lui-même sur une Montagne.
//  - occludeBehindMountains : une Montagne occulte la révélation des Hex au-delà d'elle
//    (ajouté en Task 6).

/**
 * Retire des deltas de Cartographie les Hex Montagne, sauf si l'origine est une Montagne.
 * @param {Map<string,number>} deltas  clé "i,j" -> delta
 * @param {boolean} originIsMountain
 * @param {(key:string)=>boolean} isMountainKey
 * @returns {Map<string,number>}  nouvelle Map
 */
export function filterMappableDeltas(deltas, originIsMountain, isMountainKey) {
    if (originIsMountain) return new Map(deltas);
    const out = new Map();
    for (const [key, delta] of deltas) {
        if (!isMountainKey(key)) out.set(key, delta);
    }
    return out;
}

/**
 * Filtre des Hex candidats à la révélation : retire ceux situés derrière une Montagne
 * (le centre d'un Hex Montagne, strictement plus proche, tombe dans le couloir du
 * segment origine→cible). Les Hex Montagne sont toujours conservés. Géométrie pure.
 * @param {{x:number,y:number}} originCenter
 * @param {{key:string, center:{x:number,y:number}, mountain:boolean}[]} candidates
 * @param {number} corridor  demi-largeur du couloir de blocage
 * @returns {{key:string, center:{x:number,y:number}, mountain:boolean}[]} conservés
 */
export function occludeBehindMountains(originCenter, candidates, corridor) {
    const mountains = candidates.filter((c) => c.mountain);
    return candidates.filter((c) => {
        if (c.mountain) return true;
        return !mountains.some((m) => blocks(originCenter, c.center, m.center, corridor));
    });
}

/** Vrai si le centre `m` bloque le segment o→target (strictement entre, dans le couloir). */
function blocks(o, target, m, corridor) {
    const dx = target.x - o.x, dy = target.y - o.y;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return false;
    const t = ((m.x - o.x) * dx + (m.y - o.y) * dy) / len2; // projection paramétrique
    if (t <= 0 || t >= 1) return false;                     // pas strictement entre
    const px = o.x + t * dx, py = o.y + t * dy;             // pied de perpendiculaire
    return Math.hypot(m.x - px, m.y - py) < corridor;
}
