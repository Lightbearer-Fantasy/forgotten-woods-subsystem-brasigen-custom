// scripts/notes/fw-note.js
// Sous-classe du placeable Note :
//  - visibilité joueur gouvernée par le latch `revealed` (pin géré) ;
//  - double-clic sur un pin géré → pop-up description (pas de feuille de journal).
// Installée via CONFIG.Note.objectClass dans main.js (init).

import { pinVisibleToPlayer } from "./pin-reveal.js";
import { openPinPopup } from "./note-popup.js";

const MODULE_ID = "forgotten-woods-brasigen";

function pinFlags(doc) {
    return {
        fwPin: !!doc?.getFlag(MODULE_ID, "fwPin"),
        revealed: !!doc?.getFlag(MODULE_ID, "revealed")
    };
}

export class FWNote extends foundry.canvas.placeables.Note {
    /** @override Le MJ voit tout ; le joueur ne voit un pin géré que s'il est révélé. */
    get visible() {
        if (game.user?.isGM) return super.visible;
        return super.visible && pinVisibleToPlayer(pinFlags(this.document));
    }

    /** @override Double-clic (geste « ouvrir ») : pop-up custom pour un pin géré. */
    _onClickLeft2(event) {
        if (!pinFlags(this.document).fwPin) return super._onClickLeft2(event);
        openPinPopup({
            name: this.document.text,
            description: this.document.getFlag(MODULE_ID, "description")
        });
    }
}
