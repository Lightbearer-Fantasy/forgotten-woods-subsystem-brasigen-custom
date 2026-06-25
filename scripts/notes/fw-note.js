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
    /**
     * @override Visibilité du placeable.
     * NB : on surcharge `isVisible` (et non `visible`) car `visible` est une propriété
     * de données PIXI assignée par le constructeur DisplayObject (`this.visible = true`) ;
     * un getter seul sur `visible` casse la construction (TypeError « only a getter »).
     * Foundry assigne `this.visible` depuis `isVisible` dans `_refreshVisibility()`.
     *
     * MJ et notes non gérées : comportement natif. Pour un pin géré côté joueur, on renvoie
     * directement le latch de révélation, SANS le `&& super.isVisible` natif : un pin n'a pas
     * de JournalEntry et le natif gate sur la permission d'entrée / l'affichage des notes /
     * la vision des tokens → un pin révélé pourrait ne jamais s'afficher (risque T5).
     */
    get isVisible() {
        const flags = pinFlags(this.document);
        if (!flags.fwPin) return super.isVisible;
        if (game.user?.isGM) return super.isVisible;
        return pinVisibleToPlayer(flags);
    }

    /**
     * @override Permission « view » (gate du double-clic clickLeft2).
     * Le natif renvoie FAUX pour une Note sans JournalEntry (nos pins n'en ont pas) →
     * le double-clic est bloqué pour MJ ET joueur. On l'autorise pour un pin géré.
     */
    _canView(user) {
        if (pinFlags(this.document).fwPin) return true;
        return super._canView(user);
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
