// scripts/canvas/chip-overlay.js
// Overlay canvas MJ-only des chips posés : une rangée de pastilles par Hex chipé,
// chacune avec un ✕ de retrait. Rendu PROVISOIRE (disque coloré + abréviation) en
// attendant les images de chips. Jamais rendu côté joueur.

import { readChips } from "../mapping/hex-chips-store.js";
import { getChip } from "../data/hex-chips.js";

const RADIUS = 14;     // rayon d'une pastille
const GAP = 6;         // espace entre pastilles
const Y_OFFSET = 26;   // décalage vertical sous le centre de l'Hex

let overlay = null;

/** Détruit l'overlay courant s'il existe. */
export function clearChipOverlay() {
    if (overlay) {
        overlay.destroy({ children: true });
        overlay = null;
    }
}

/**
 * (Re)dessine les boules de chips pour la scène. MJ uniquement.
 * @param {object} scene
 * @param {(offset:{i:number,j:number}, chipId:string)=>void} onRemove
 */
export function renderChipOverlay(scene, onRemove) {
    clearChipOverlay();
    if (!game.user.isGM || !scene || scene.id !== canvas?.scene?.id) return;
    const data = readChips(scene);
    const container = new PIXI.Container();

    for (const [key, ids] of Object.entries(data)) {
        if (!ids?.length) continue;
        const [i, j] = key.split(",").map(Number);
        const center = canvas.grid.getCenterPoint({ i, j });
        const totalW = ids.length * (RADIUS * 2) + (ids.length - 1) * GAP;
        let x = center.x - totalW / 2 + RADIUS;
        for (const id of ids) {
            const chip = getChip(id);
            if (!chip) continue;
            container.addChild(buildBubble(chip, x, center.y + Y_OFFSET, () => onRemove({ i, j }, id)));
            x += RADIUS * 2 + GAP;
        }
    }
    canvas.interface.addChild(container);
    overlay = container;
}

/** Une pastille interactive : disque coloré + abréviation + ✕ cliquable. */
function buildBubble(chip, x, y, onClickRemove) {
    const group = new PIXI.Container();
    group.position.set(x, y);

    const disc = new PIXI.Graphics();
    disc.beginFill(Color.from(chip.color), 0.95);
    disc.lineStyle(2, 0x000000, 0.8);
    disc.drawCircle(0, 0, RADIUS);
    disc.endFill();
    group.addChild(disc);

    const label = new PIXI.Text(chip.abbr, {
        fontFamily: "Signika, sans-serif", fontSize: 13, fontWeight: "bold",
        fill: 0xffffff, stroke: 0x000000, strokeThickness: 3
    });
    label.anchor.set(0.5);
    group.addChild(label);

    // ✕ de retrait, coin haut-droit, zone cliquable élargie.
    const remove = new PIXI.Text("✕", {
        fontFamily: "Signika, sans-serif", fontSize: 14, fontWeight: "bold",
        fill: 0xff5555, stroke: 0x000000, strokeThickness: 3
    });
    remove.anchor.set(0.5);
    remove.position.set(RADIUS - 1, -RADIUS + 1);
    remove.eventMode = "static";
    remove.cursor = "pointer";
    remove.hitArea = new PIXI.Rectangle(-9, -9, 18, 18);
    remove.on("pointertap", (event) => {
        event.stopPropagation();
        onClickRemove();
    });
    group.addChild(remove);

    return group;
}
