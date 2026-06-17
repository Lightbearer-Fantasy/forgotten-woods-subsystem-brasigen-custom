import { isHexScene, isPartyToken } from "../utils/scene.js";
import { GROUP_ACTIVITIES, INDIVIDUAL_ACTIVITIES } from "../data/activities.js";
import { slowestLandSpeed, groupActivityCount, groupCountColor, characterCount } from "./party-counts.js";

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
        const actor = this.token?.actor ?? null;
        const groupCount = groupActivityCount(slowestLandSpeed(actor));
        return {
            groupTitle: game.i18n.localize("FORGOTTEN_WOODS.panel.group"),
            individualTitle: game.i18n.localize("FORGOTTEN_WOODS.panel.individual"),
            groupCount,
            groupColor: groupCountColor(groupCount),
            individualCount: characterCount(actor),
            groupActivities: GROUP_ACTIVITIES,
            individualActivities: INDIVIDUAL_ACTIVITIES
        };
    }

    onControlToken() {
        // Une sélection large (marquee, Ctrl+A) émet un controlToken par token,
        // de façon synchrone. On diffère l'évaluation à la fin du tick pour ne
        // juger que l'état FINAL de la sélection : sinon, si le Token Party est
        // contrôlé en premier (seul à cet instant), un render({force}) async
        // démarre et s'affiche malgré le close() des événements suivants.
        if (this._controlPending) return;
        this._controlPending = true;
        Promise.resolve().then(() => {
            this._controlPending = false;
            this._evaluateControl();
        });
    }

    _evaluateControl() {
        // Recalcule depuis la source de vérité : le HUD ne reste ouvert que
        // si un Token Party est effectivement contrôlé sur une scène hexagonale.
        // Couvre la désélection et le clic à côté (qui relâchent le contrôle).
        // Comme le Token HUD natif : uniquement sur une sélection d'un seul token
        // (une sélection large incluant le Party Token n'ouvre pas le HUD).
        const controlled = canvas?.tokens?.controlled ?? [];
        const active = controlled.length === 1 && isPartyToken(controlled[0]) ? controlled[0] : null;
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
        // Ancre l'élément au centre exact du token (horizontal + vertical).
        const midX = doc.x + (doc.width * gridSize) / 2;
        const midY = doc.y + (doc.height * gridSize) / 2;
        const centerLeft = m.apply({ x: doc.x, y: midY });
        const center = m.apply({ x: midX, y: midY });
        const halfWidth = center.x - centerLeft.x;
        this.element.style.left = `${center.x}px`;
        this.element.style.top = `${center.y}px`;
        this.element.style.setProperty("--fw-half", `${halfWidth}px`);
    }

    _onRender(context, options) {
        this._positionToToken();
    }

    onUpdateToken(doc, changes) {
        if (this.token?.document !== doc) return;
        // Comme le Token HUD natif : un déplacement du token ferme le HUD.
        if ("x" in changes || "y" in changes) {
            this.close();
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
        // Masque l'élément immédiatement pour éviter la latence visuelle de l'animation ApplicationV2.
        if (this.element) this.element.style.display = "none";
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
