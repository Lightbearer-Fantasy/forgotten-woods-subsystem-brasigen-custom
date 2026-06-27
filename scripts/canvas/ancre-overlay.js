// scripts/canvas/ancre-overlay.js
// Lueur bleue ondulante « boussole » sur le Hex du Token Party, pilotée par sa
// proximité à une Chip Ancre. Visible par TOUS (pas de garde MJ). Lente quand le Party
// est SUR une Ancre (boussole calme), rapide quand il est ADJACENT (boussole agitée).

import { readChips } from "../mapping/hex-chips-store.js";
import { ancreProximity } from "../mapping/ancre-proximity.js";
import { offsetToKey } from "../utils/hex.js";
import { tokenRevealCenter } from "../utils/scene.js";

const RADIUS_FACTOR = 0.55;                    // rayon de la lueur ∝ taille de l'Hex
const PERIOD = { on: 3000, adjacent: 700 };    // ms par cycle (lent / rapide)

let overlay = null;
let tickerFn = null;

/** Détruit la lueur courante et retire son animation. */
export function clearAncreOverlay() {
    if (tickerFn) { canvas.app.ticker.remove(tickerFn); tickerFn = null; }
    if (overlay) { overlay.destroy({ children: true }); overlay = null; }
}

/** Clés "i,j" des Hex portant une Ancre. */
function ancreKeys(scene) {
    const out = new Set();
    for (const [key, ids] of Object.entries(readChips(scene))) {
        if (ids?.includes("ancre")) out.add(key);
    }
    return out;
}

/** Voisins (clés "i,j") d'une clé, via la grille. */
function neighborKeys(key) {
    const [i, j] = key.split(",").map(Number);
    return canvas.grid.getAdjacentOffsets({ i, j }).map(offsetToKey);
}

/**
 * (Re)dessine la lueur pour le Token Party. Détruit l'overlay si aucune Ancre à portée.
 * @param {object} tokenDoc  document du Token Party
 * @param {object} [changes]  payload updateToken (position neuve pendant l'animation)
 */
export function renderAncreOverlay(tokenDoc, changes = {}) {
    clearAncreOverlay();
    const scene = canvas?.scene;
    if (!scene || !tokenDoc) return;

    const center = tokenRevealCenter(tokenDoc, changes, canvas.grid.size);
    const offset = canvas.grid.getOffset(center);
    const state = ancreProximity(offsetToKey(offset), ancreKeys(scene), neighborKeys);
    if (state === "none") return;

    const hexCenter = canvas.grid.getCenterPoint(offset);
    const radius = canvas.grid.size * RADIUS_FACTOR;
    const glow = new PIXI.Graphics();
    glow.beginFill(0x3aa0ff, 1);
    glow.drawCircle(0, 0, radius);
    glow.endFill();
    glow.position.set(hexCenter.x, hexCenter.y);
    canvas.interface.addChild(glow);
    overlay = glow;

    const period = PERIOD[state];
    tickerFn = () => {
        const phase = (Date.now() % period) / period;          // 0..1
        const wave = (Math.sin(phase * Math.PI * 2) + 1) / 2;  // 0..1
        glow.alpha = 0.15 + wave * 0.35;
        const s = 0.8 + wave * 0.4;
        glow.scale.set(s, s);
    };
    canvas.app.ticker.add(tickerFn);
}
