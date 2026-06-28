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
        return !blockedByMountains(originCenter, c.center, mountains, corridor);
    });
}

/**
 * Vrai si le segment o→target est occulté par les Montagnes. Une Montagne occulte si la
 * ligne de vue traverse son corps (perp < corridor), OU si elle est prise en tenaille
 * entre deux Montagnes adjacentes qu'elle ne fait que frôler des deux côtés (perp ≈
 * corridor à un t voisin) — la « couture » entre deux Montagnes est un mur. Un simple
 * frôlement d'un seul côté laisse passer (il y a un trou en face).
 */
function blockedByMountains(o, target, mountains, corridor) {
    const dx = target.x - o.x, dy = target.y - o.y;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return false;
    const nlen = Math.hypot(dx, dy);
    const eps = corridor * 0.05;
    const grazes = []; // frôlements { t, side: +1/-1 } à perp ≈ corridor
    for (const m of mountains) {
        const mx = m.center.x - o.x, my = m.center.y - o.y;
        const t = (mx * dx + my * dy) / len2;       // projection paramétrique
        if (t <= 0 || t >= 1) continue;             // pas strictement entre
        const perp = (mx * -dy + my * dx) / nlen;   // distance signée à la ligne
        const ap = Math.abs(perp);
        if (ap < corridor - eps) return true;       // traverse le corps de la Montagne
        if (ap <= corridor + eps) grazes.push({ t, side: Math.sign(perp) || 1 });
    }
    // tenaille = un frôlement de chaque côté, au même endroit (couture entre 2 Montagnes).
    const left = grazes.filter((g) => g.side < 0);
    const right = grazes.filter((g) => g.side > 0);
    return left.some((l) => right.some((r) => Math.abs(l.t - r.t) < 0.34));
}
