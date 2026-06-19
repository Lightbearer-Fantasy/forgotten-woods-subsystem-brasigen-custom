import { enrichActivityHtml } from "./activity-enrich.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ActivityPopup extends HandlebarsApplicationMixin(ApplicationV2) {
    /** @type {Map<string, ActivityPopup>} id d'activité -> instance ouverte. */
    static #open = new Map();

    /** @type {object} */
    activity = null;

    constructor(activity, options = {}) {
        super(options);
        this.activity = activity;
    }

    static DEFAULT_OPTIONS = {
        classes: ["forgotten-woods", "fw-activity-popup"],
        window: { positioned: true, resizable: false, minimizable: true, frame: true },
        position: { width: 320 }
    };

    static PARTS = {
        main: { template: "modules/forgotten-woods-brasigen/templates/activity-popup.hbs" }
    };

    get title() {
        return this.activity?.label ?? "";
    }

    async _prepareContext() {
        return { content: await enrichActivityHtml(this.activity) };
    }

    /** Ouvre le popup d'une activité, ou ramène l'existant au premier plan. */
    static open(activity) {
        const existing = ActivityPopup.#open.get(activity.id);
        if (existing) {
            existing.bringToFront();
            return existing;
        }
        const popup = new ActivityPopup(activity, { id: `fw-activity-popup-${activity.id}` });
        ActivityPopup.#open.set(activity.id, popup);
        popup.render({ force: true });
        return popup;
    }

    _onClose(options) {
        super._onClose(options);
        if (ActivityPopup.#open.get(this.activity?.id) === this) {
            ActivityPopup.#open.delete(this.activity.id);
        }
    }

    async close(options = {}) {
        // animate:false — même choix que le Party HUD, évite la latence de fermeture.
        return super.close({ ...options, animate: false });
    }
}
