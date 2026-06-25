// Pop-up lecture seule affichant le nom et la description d'un pin révélé.
// Pas de JournalEntry : pur affichage du label + flag description.
// Fenêtre légère (ApplicationV2), même thème/gabarit que les pop-ups d'activités
// du Party HUD — barre de titre + texte, sans gros bouton « Fermer ».

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

class PinPopup extends HandlebarsApplicationMixin(ApplicationV2) {
    #title = "";
    #content = "";

    constructor({ title, content } = {}, options = {}) {
        super(options);
        this.#title = title;
        this.#content = content;
    }

    static DEFAULT_OPTIONS = {
        classes: ["forgotten-woods", "fw-activity-popup"],
        window: { positioned: true, resizable: true, minimizable: true, frame: true },
        position: { width: 320 }
    };

    static PARTS = {
        main: { template: "modules/forgotten-woods-brasigen/templates/activity-popup.hbs" }
    };

    get title() {
        return this.#title;
    }

    async _prepareContext() {
        return { content: this.#content };
    }

    async close(options = {}) {
        // animate:false — même choix que le Party HUD, évite la latence de fermeture.
        return super.close({ ...options, animate: false });
    }
}

/**
 * Ouvre la pop-up d'un repère. Description vide → message « aucune description ».
 * `anchor` (coords écran du clic, ex. event.clientX/Y) → la fenêtre s'affiche à côté du pin
 * plutôt qu'au centre de l'écran.
 */
export function openPinPopup({ name, description, anchor } = {}) {
    const esc = (s) => foundry.utils.escapeHTML?.(String(s ?? "")) ?? String(s ?? "");
    const title = (name ?? "").trim() || game.i18n.localize("FORGOTTEN_WOODS.notes.untitled");
    const body = (description ?? "").trim();
    const content = body
        ? `<p style="white-space:pre-wrap">${esc(body)}</p>`
        : `<p><em>${game.i18n.localize("FORGOTTEN_WOODS.notes.noDescription")}</em></p>`;

    const position = { width: 320 };
    if (Number.isFinite(anchor?.x) && Number.isFinite(anchor?.y)) {
        position.left = Math.round(anchor.x + 16);
        position.top = Math.round(anchor.y - 8);
    }

    return new PinPopup({ title: esc(title), content }, { position }).render({ force: true });
}
