import { readCamps } from "../mapping/camp-store.js";

/** Icône identique à celle de l'activité « Monter le camp » (data/activities.js). */
const CAMP_ICON = "icons/environment/settlement/hut.webp";

/** @type {PIXI.Container|null} */
let overlay = null;

/** Parse une clé de hex "i,j" en offset. */
function parseKey(key) {
    const [i, j] = String(key).split(",").map(Number);
    return { i, j };
}

/** Détruit l'overlay des camps s'il existe. */
function clearCampOverlay() {
    if (overlay) {
        overlay.destroy({ children: true });
        overlay = null;
    }
}

/**
 * (Re)dessine une icône de camp au centre de chaque Hex portant un camp de la
 * scène active. Visible par tout le monde (lit le flag de scène). IO — validé en jeu.
 * @returns {Promise<void>}
 */
export async function renderCampOverlay() {
    clearCampOverlay();
    const scene = canvas?.scene;
    const grid = canvas?.grid;
    if (!scene || !grid || !canvas?.interface) return;

    const keys = Object.keys(readCamps(scene));
    if (!keys.length) return;

    const loader = foundry.canvas?.loadTexture ?? globalThis.loadTexture;
    const texture = await loader(CAMP_ICON);
    // La scène a pu changer pendant le chargement async : on repart propre.
    clearCampOverlay();
    if (canvas?.scene?.id !== scene.id) return;

    const container = new PIXI.Container();
    const target = grid.size * 0.6;
    for (const key of keys) {
        const { x, y } = grid.getCenterPoint(parseKey(key));
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.position.set(x, y);
        sprite.width = target;
        sprite.height = target;
        container.addChild(sprite);
    }
    canvas.interface.addChild(container);
    overlay = container;
}
