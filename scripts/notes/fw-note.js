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

    /**
     * @override Permission « view » (gate du double clic clickLeft2). Le natif renvoie faux
     * pour une note sans JournalEntry → le double-clic MJ ne se déclencherait jamais. On
     * l'autorise pour un pin géré afin que `_onClickLeft2` (pop-up MJ) parte.
     */
    _canView(user, event) {
        if (pinFlags(this.document).fwPin) return true;
        return super._canView(user, event);
    }

    /**
     * @override Simple clic gauche sur un pin géré.
     *  - Joueur : ouvre la pop-up description, à côté du pin.
     *  - MJ : comportement natif (sélection/contrôle) pour pouvoir déplacer/supprimer le pin
     *    en mode Select Notes. La pop-up MJ s'ouvre au DOUBLE clic (`_onClickLeft2`).
     * `clickLeft` se déclenche au pointer-down : côté joueur on STOPPE la propagation (comme
     * le natif), sinon l'événement remonte au calque qui arme son rectangle de sélection.
     */
    _onClickLeft(event) {
        if (!pinFlags(this.document).fwPin) return super._onClickLeft(event);
        if (game.user?.isGM) return super._onClickLeft(event);
        this.#openPopup(event);
        event?.stopPropagation?.();
    }

    /**
     * @override Double clic gauche sur un pin géré.
     *  - MJ : ouvre la pop-up description (le simple clic sert à sélectionner).
     *  - Joueur : pop-up déjà ouverte au simple clic (dédupliquée) → rien à faire.
     */
    _onClickLeft2(event) {
        if (!pinFlags(this.document).fwPin) return super._onClickLeft2(event);
        if (game.user?.isGM) this.#openPopup(event);
        event?.stopPropagation?.();
    }

    /** Ouvre la pop-up description du pin, positionnée à côté du clic. */
    #openPopup(event) {
        openPinPopup({
            name: this.document.text,
            description: this.document.getFlag(MODULE_ID, "description"),
            anchor: { x: event?.clientX, y: event?.clientY },
            key: this.document.id
        });
    }
}
