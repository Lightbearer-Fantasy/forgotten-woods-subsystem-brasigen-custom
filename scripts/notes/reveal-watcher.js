// scripts/notes/reveal-watcher.js
// MJ : sur changement de PC d'une scène Hex active, latch `revealed=true` sur
// les pins ayant franchi leur seuil. Décision déléguée à la logique pure
// (pinsToReveal) ; ici on lit les PC, calcule l'offset Hex et persiste.

import { coordsToOffset, offsetToKey } from "../utils/hex.js";
import { readPoints } from "../mapping/mapping-points-store.js";
import { pinsToReveal } from "./pin-reveal.js";
import { isActiveGM } from "../mapping/gm-actions.js";

const MODULE_ID = "forgotten-woods-brasigen";

/** Construit l'état d'un pin pour la décision pure (PC du Hex sous la Note). */
function pinState(note, points) {
    const key = offsetToKey(coordsToOffset({ x: note.x, y: note.y }));
    return {
        id: note.id,
        fwPin: !!note.getFlag(MODULE_ID, "fwPin"),
        secret: !!note.getFlag(MODULE_ID, "secret"),
        revealed: !!note.getFlag(MODULE_ID, "revealed"),
        points: points[key] ?? 0
    };
}

/** Latch `revealed=true` sur les pins de la scène ayant franchi leur seuil. MJ. */
export async function refreshPinReveals(scene) {
    if (!isActiveGM() || !scene) return;
    const points = readPoints(scene);
    const ids = pinsToReveal(scene.notes.map((n) => pinState(n, points)));
    if (ids.length === 0) return;
    await scene.updateEmbeddedDocuments(
        "Note",
        ids.map((id) => ({ _id: id, [`flags.${MODULE_ID}.revealed`]: true }))
    );
}
