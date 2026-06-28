// scripts/mapping/we-reveal-wrap.js
// Enveloppe World Explorer : on patche _getSpacesInRange, la méthode par laquelle WE
// calcule ses halos de révélation. On n'agit que sur le halo VIVANT d'un token (Party
// sur l'Hex émetteur) : (1) on module la distance par les chips (Plaines/Marais) ;
// (2) on retire les Hex occultés par une Montagne (sauf si le Party est sur une Montagne).
// On NE touche PAS l'extension des Hex explorés persistés (gridReveal). Mode "spaces".

import { chipsAt, readChips } from "./hex-chips-store.js";
import { effectiveRange } from "./reveal-modifiers.js";
import { occludeBehindMountains } from "./mountain-occlusion.js";
import { offsetToKey, gridCorridor } from "../utils/hex.js";
import { isPartyToken } from "../utils/scene.js";

/** Vrai si un token visible (ami/joueur) occupe l'Hex `originOffset`. */
function tokenOnHex(layer, originOffset) {
    for (const token of layer._getViewableTokens()) {
        const o = canvas.grid.getOffset(token.center);
        if (o.i === originOffset.i && o.j === originOffset.j) return true;
    }
    return false;
}

/** Retire les Hex occultés par une Montagne. `spaces` = itérable d'offsets {i,j}. */
function occludeSpaces(scene, originOffset, spaces) {
    const chipMap = readChips(scene);
    const originCenter = canvas.grid.getCenterPoint(originOffset);
    const candidates = [];
    for (const off of spaces) {
        const key = offsetToKey(off);
        candidates.push({
            off, key,
            center: canvas.grid.getCenterPoint(off),
            mountain: chipMap[key]?.includes("montagne") ?? false
        });
    }
    return occludeBehindMountains(originCenter, candidates, gridCorridor()).map((c) => c.off);
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
        const spaces = orig.call(this, originOffset, effectiveRange(steps, chips));
        if (chips.includes("montagne")) return spaces; // sur Montagne : voit par-dessus
        return occludeSpaces(this.scene, originOffset, spaces);
    };
    layerClass.prototype._fwChipsRevealPatched = true;
}

/** Restreint la révélation vivante de WE aux seuls Token(s) Party. No-op si WE absent. */
export function installPartyOnlyReveal() {
    const layerClass = CONFIG?.Canvas?.layers?.worldExplorer?.layerClass;
    if (!layerClass || layerClass.prototype._fwPartyOnlyReveal) return;
    const orig = layerClass.prototype._getViewableTokens;
    if (typeof orig !== "function") return;
    layerClass.prototype._getViewableTokens = function () {
        return orig.call(this).filter((token) => isPartyToken(token));
    };
    layerClass.prototype._fwPartyOnlyReveal = true;
}
