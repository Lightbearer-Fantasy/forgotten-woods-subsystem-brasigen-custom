import { isHexScene, isPartyToken } from "../utils/scene.js";
import { GROUP_ACTIVITIES, INDIVIDUAL_ACTIVITIES } from "../data/activities.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class PartyActivitiesHUD extends HandlebarsApplicationMixin(ApplicationV2) {
    /** @type {Token|null} Token party actuellement ancré. */
    token = null;

    static DEFAULT_OPTIONS = {
        id: "forgotten-woods-party-hud",
        classes: ["forgotten-woods", "fw-party-hud"],
        window: { frame: false, positioned: false },
        actions: {
            "send-to-chat": onSendToChat,
            "roll-d20": onRollD20
        }
    };

    static PARTS = {
        main: {
            template: "modules/forgotten-woods-brasigen/templates/party-activities-hud.hbs"
        }
    };

    findActivity(id) {
        return [...GROUP_ACTIVITIES, ...INDIVIDUAL_ACTIVITIES].find(a => a.id === id) ?? null;
    }

    static _imagesResolved = false;

    /** Slug de l'action PF2e dont l'icône est appliquée à toutes les activités (provisoire). */
    static REFERENCE_SLUG = "investigate";

    static async _ensureImages() {
        if (this._imagesResolved) return;
        this._imagesResolved = true;

        const pack = game.packs.get("pf2e.actionspf2e");
        if (!pack) return;

        let index;
        try {
            index = await pack.getIndex({ fields: ["system.slug"] });
        } catch (error) {
            console.warn("forgotten-woods-brasigen | échec du chargement des actions PF2e", error);
            return;
        }

        // Pour le moment : une seule et même icône pour toutes les activités,
        // celle d'une action PF2e de référence (cf. REFERENCE_SLUG).
        const reference = index.find(
            (e) => (e.system?.slug ?? e.name?.slugify?.({ strict: true })) === this.REFERENCE_SLUG
        );
        if (!reference?.img) return;

        for (const activity of [...GROUP_ACTIVITIES, ...INDIVIDUAL_ACTIVITIES]) {
            activity.img = reference.img;
        }
    }

    async _prepareContext() {
        await this.constructor._ensureImages();
        return {
            groupTitle: game.i18n.localize("FORGOTTEN_WOODS.panel.group"),
            individualTitle: game.i18n.localize("FORGOTTEN_WOODS.panel.individual"),
            groupActivities: GROUP_ACTIVITIES,
            individualActivities: INDIVIDUAL_ACTIVITIES
        };
    }

    onControlToken() {
        // Recalcule depuis la source de vérité : le HUD ne reste ouvert que
        // si un Token Party est effectivement contrôlé sur une scène hexagonale.
        // Couvre la désélection et le clic à côté (qui relâchent le contrôle).
        const active = canvas?.tokens?.controlled?.find((t) => isPartyToken(t));
        if (active && isHexScene(canvas?.scene)) {
            if (this.token === active && this.rendered) {
                this._positionToToken();
                return;
            }
            this.token = active;
            this.render({ force: true });
        } else {
            this.close();
        }
    }

    _positionToToken() {
        if (!this.token || !this.element) return;
        if (!canvas?.dimensions) return;
        const doc = this.token.document;
        const gridSize = canvas.dimensions.size;
        const m = canvas.stage.worldTransform;
        // Ancre l'élément au centre-haut du token (coordonnées écran).
        const topLeft = m.apply({ x: doc.x, y: doc.y });
        const topCenter = m.apply({ x: doc.x + (doc.width * gridSize) / 2, y: doc.y });
        const halfWidth = topCenter.x - topLeft.x;
        // Le panneau Groupe se place à gauche, Individuelles à droite (via CSS).
        this.element.style.left = `${topCenter.x}px`;
        this.element.style.top = `${topCenter.y}px`;
        this.element.style.setProperty("--fw-half", `${halfWidth}px`);
    }

    _onRender(context, options) {
        this._positionToToken();
    }

    onUpdateToken(doc, changes) {
        if (this.token?.document !== doc) return;
        if ("x" in changes || "y" in changes) {
            this._positionToToken();
        }
    }

    onDeleteToken(doc) {
        if (this.token?.document === doc) this.close();
    }

    onCanvasPan() {
        this._positionToToken();
    }

    async close(options) {
        this.token = null;
        return super.close(options);
    }
}

// --- Handlers d'action (this === instance de PartyActivitiesHUD) ---

function onSendToChat(event, target) {
    const row = target.closest("[data-activity-id]");
    const activity = this.findActivity(row?.dataset.activityId);
    if (!activity) return;
    return ChatMessage.create({
        content: activity.chatText,
        speaker: ChatMessage.getSpeaker({ token: this.token?.document })
    });
}

async function onRollD20(event, target) {
    const row = target.closest("[data-activity-id]");
    const activity = this.findActivity(row?.dataset.activityId);
    if (!activity) return;
    const roll = await new Roll("1d20").evaluate();
    return roll.toMessage({
        flavor: activity.label,
        speaker: ChatMessage.getSpeaker({ token: this.token?.document })
    });
}
