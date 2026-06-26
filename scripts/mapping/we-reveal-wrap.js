// scripts/mapping/we-reveal-wrap.js
// Enveloppe World Explorer : on patche _getSpacesInRange, la méthode par laquelle WE
// calcule ses halos de révélation. On n'applique le delta des chips qu'au halo VIVANT
// d'un token (Party) — quand un token visible est sur l'Hex émetteur. On NE l'applique
// PAS à l'extension des Hex explorés persistés (gridReveal) : sinon les Hex persistés
// refusionnent en un halo de rayon ≥1 sur les Plaines, et le MJ ne peut plus les cacher
// un par un (cf. bug « Hide Hex »). Mode "spaces" uniquement (cf. spec).

import { chipsAt } from "./hex-chips-store.js";
import { effectiveRange } from "./reveal-modifiers.js";

/** Vrai si un token visible (ami/joueur) occupe l'Hex `originOffset`. */
function tokenOnHex(layer, originOffset) {
    for (const token of layer._getViewableTokens()) {
        const o = canvas.grid.getOffset(token.center);
        if (o.i === originOffset.i && o.j === originOffset.j) return true;
    }
    return false;
}

/** Patch unique de WorldExplorerLayer.prototype._getSpacesInRange. No-op si WE absent. */
export function installWorldExplorerRevealWrap() {
    const layerClass = CONFIG?.Canvas?.layers?.worldExplorer?.layerClass;
    if (!layerClass || layerClass.prototype._fwChipsRevealPatched) return;
    const orig = layerClass.prototype._getSpacesInRange;
    if (typeof orig !== "function") return;
    layerClass.prototype._getSpacesInRange = function (originOffset, steps) {
        if (!tokenOnHex(this, originOffset)) return orig.call(this, originOffset, steps);
        const chips = chipsAt(this.scene, originOffset);
        return orig.call(this, originOffset, effectiveRange(steps, chips));
    };
    layerClass.prototype._fwChipsRevealPatched = true;
}
