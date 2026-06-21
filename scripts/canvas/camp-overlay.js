import { readCamps } from "../mapping/camp-store.js";

/** Symbole de tente du module (trait noir, intérieur blanc, fond transparent). */
const CAMP_ICON = "modules/forgotten-woods-brasigen/assets/camp-tent.png";

/** Teinte rouge appliquée au symbole (intérieur blanc → rouge, trait noir conservé). */
const CAMP_TINT = 0xe02020;
/** Taille du symbole, en fraction de la taille de grille (petit, lisible au-dessus du token). */
const CAMP_SCALE = 0.3;
/** Décalage vertical vers le haut du Hex, en fraction de la taille de grille. */
const CAMP_TOP_OFFSET = 0.47;

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
 * (Re)dessine une icône de camp (tente rouge) en haut de chaque Hex portant un
 * camp de la scène active, assez petite pour rester visible au-dessus du Token
 * Party. Visible par tout le monde (lit le flag de scène). IO — validé en jeu.
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
    const target = grid.size * CAMP_SCALE;
    const topOffset = grid.size * CAMP_TOP_OFFSET;
    for (const key of keys) {
        const { x, y } = grid.getCenterPoint(parseKey(key));
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.position.set(x, y - topOffset);
        sprite.width = target;
        sprite.height = target;
        sprite.tint = CAMP_TINT;
        container.addChild(sprite);
    }
    canvas.interface.addChild(container);
    overlay = container;
}
