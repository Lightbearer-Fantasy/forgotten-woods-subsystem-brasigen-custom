// Pop-up lecture seule affichant le nom et la description d'un pin révélé.
// Pas de JournalEntry : pur affichage du label + flag description.
// Fenêtre légère (ApplicationV2), même thème/gabarit que les pop-ups d'activités
// du Party HUD — barre de titre + texte, sans gros bouton « Fermer ».
// Dédoublonnage : une seule pop-up ouverte à la fois par pin (clé = id de la Note).

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

class PinPopup extends HandlebarsApplicationMixin(ApplicationV2) {
    /** @type {Map<string, PinPopup>} id de Note -> instance ouverte. */
    static open = new Map();

    #title = "";
    #content = "";
    #key = "";

    constructor({ title, content, key } = {}, options = {}) {
        super(options);
        this.#title = title;
        this.#content = content;
        this.#key = key;
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

    _onClose(options) {
        super._onClose(options);
        if (PinPopup.open.get(this.#key) === this) PinPopup.open.delete(this.#key);
    }

    async close(options = {}) {
        // animate:false — même choix que le Party HUD, évite la latence de fermeture.
        return super.close({ ...options, animate: false });
    }
}

/**
 * Ouvre la pop-up d'un repère, ou ramène l'existante au premier plan (une seule par pin).
 * Description vide → message « aucune description ».
 * `anchor` (coords écran du clic, ex. event.clientX/Y) → la fenêtre s'affiche à côté du pin
 * plutôt qu'au centre de l'écran. `key` (id de la Note) sert au dédoublonnage.
 */
export function openPinPopup({ name, description, anchor, key = "" } = {}) {
    const existing = PinPopup.open.get(key);
    if (existing) {
        existing.bringToFront();
        return existing;
    }

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

    const popup = new PinPopup({ title: esc(title), content, key }, {
        id: key ? `fw-pin-popup-${key}` : undefined,
        position
    });
    if (key) PinPopup.open.set(key, popup);
    popup.render({ force: true });
    return popup;
}
