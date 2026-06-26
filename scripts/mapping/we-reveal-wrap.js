// scripts/mapping/we-reveal-wrap.js
// Enveloppe World Explorer : on patche _getSpacesInRange, la méthode par laquelle WE
// calcule les DEUX halos de révélation (autour des tokens ET autour des Hex explorés),
// toujours avec originOffset = Hex émetteur. On y ajoute le delta des chips de cet Hex.
// Couvre uniquement le mode "spaces" (le mode "grid units" dessine des cercles sans
// passer par cette méthode — non géré, cf. spec).

import { chipsAt } from "./hex-chips-store.js";
import { effectiveRange } from "./reveal-modifiers.js";

/** Patch unique de WorldExplorerLayer.prototype._getSpacesInRange. No-op si WE absent. */
export function installWorldExplorerRevealWrap() {
    const layerClass = CONFIG?.Canvas?.layers?.worldExplorer?.layerClass;
    if (!layerClass || layerClass.prototype._fwChipsRevealPatched) return;
    const orig = layerClass.prototype._getSpacesInRange;
    if (typeof orig !== "function") return;
    layerClass.prototype._getSpacesInRange = function (originOffset, steps) {
        const chips = chipsAt(this.scene, originOffset);
        return orig.call(this, originOffset, effectiveRange(steps, chips));
    };
    layerClass.prototype._fwChipsRevealPatched = true;
}
