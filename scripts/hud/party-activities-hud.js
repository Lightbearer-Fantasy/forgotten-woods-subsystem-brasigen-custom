import { isHexScene, isPartyToken } from "../utils/scene.js";
import { GROUP_ACTIVITIES, INDIVIDUAL_ACTIVITIES } from "../data/activities.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class PartyActivitiesHUD extends HandlebarsApplicationMixin(ApplicationV2) {
    /** @type {Token|null} Token party actuellement ancré. */
    token = null;

    static DEFAULT_OPTIONS = {
        id: "forgotten-woods-party-hud",
        classes: ["forgotten-woods", "fw-party-hud"],
        window: { frame: false, positioned: false }
    };

    static PARTS = {
        main: {
            template: "modules/forgotten-woods-brasigen/templates/party-activities-hud.hbs"
        }
    };

    findActivity(id) {
        return [...GROUP_ACTIVITIES, ...INDIVIDUAL_ACTIVITIES].find(a => a.id === id) ?? null;
    }

    async _prepareContext() {
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
