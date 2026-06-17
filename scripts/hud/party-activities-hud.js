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

        const imgBySlug = new Map();
        for (const entry of index) {
            const slug = entry.system?.slug ?? entry.name?.slugify?.({ strict: true });
            if (slug && entry.img) imgBySlug.set(slug, entry.img);
        }

        for (const activity of [...GROUP_ACTIVITIES, ...INDIVIDUAL_ACTIVITIES]) {
            if (activity.slug && imgBySlug.has(activity.slug)) {
                activity.img = imgBySlug.get(activity.slug);
            }
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

    onControlToken(token, controlled) {
        if (controlled) {
            if (isPartyToken(token) && isHexScene(canvas?.scene)) {
                this.token = token;
                this.render({ force: true });
            }
            return;
        }
        if (this.token === token) this.close();
    }

    _positionToToken() {
        if (!this.token || !this.element) return;
        if (!canvas?.dimensions) return;
        const doc = this.token.document;
        const gridSize = canvas.dimensions.size;
        const worldX = doc.x + doc.width * gridSize;
        const worldY = doc.y;
        const point = canvas.stage.worldTransform.apply({ x: worldX, y: worldY });
        Object.assign(this.element.style, {
            left: `${point.x + 8}px`,
            top: `${point.y}px`
        });
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
