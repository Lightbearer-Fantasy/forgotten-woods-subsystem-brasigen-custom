// scripts/notes/fw-note.js
// Sous-classe du placeable Note :
//  - visibilité joueur gouvernée par le latch `revealed` (pin géré) ;
//  - simple clic gauche sur un pin géré → pop-up description (pas de feuille de journal),
//    affichée à côté du pin ;
//  - jamais de déplacement d'un pin géré par un joueur.
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
     * @override Permission « control » (gate du simple clic gauche clickLeft).
     * Le natif exige le calque Notes actif + droit de modification → faux pour un joueur,
     * et faux pour tous hors du calque Notes (Token Controls). On l'autorise pour un pin
     * géré afin que le clic ouvre la pop-up. Le clic NE contrôle/sélectionne PAS le pin :
     * `_onClickLeft` n'appelle pas le super.
     */
    _canControl(user, event) {
        if (pinFlags(this.document).fwPin) return true;
        return super._canControl(user, event);
    }

    /**
     * @override Déplacement : un joueur ne déplace jamais un pin géré ; le MJ ne le déplace
     * que sur le calque Notes (jamais depuis les Token Controls), comme le comportement natif.
     */
    _canDrag(user, event) {
        if (!pinFlags(this.document).fwPin) return super._canDrag(user, event);
        if (!game.user?.isGM || !this.layer?.active) return false;
        return super._canDrag(user, event);
    }

    /** @override Simple clic gauche sur un pin géré → pop-up description, à côté du pin. */
    _onClickLeft(event) {
        if (!pinFlags(this.document).fwPin) return super._onClickLeft(event);
        openPinPopup({
            name: this.document.text,
            description: this.document.getFlag(MODULE_ID, "description"),
            anchor: { x: event?.clientX, y: event?.clientY }
        });
    }
}
