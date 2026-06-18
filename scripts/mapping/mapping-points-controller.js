import { isHexScene, isPartyToken } from "../utils/scene.js";
import { coordsToOffset, offsetToKey, spacesInRange } from "../utils/hex.js";
import { readPoints, applyDeltas, clearAllPoints } from "./mapping-points-store.js";

const CONTROL = "forgottenWoods";
const TOOL_SELECT = "selectHex";
const TOOL_SHOW = "showPoints";
const TOOL_EDIT = "editPoints";
const TOOL_PARTY = "aroundParty";
const TOOL_RESET = "resetPoints";

/**
 * Contrôleur de l'onglet « Hex Controls » (MJ, scène hexagonale).
 * 4 entrées : sélection de hex (radio, défaut), affichage des PC (toggle),
 * incrément/décrément des PC (radio), incrément par proximité (bouton).
 * Consomme un HexSelection autonome pour la sélection + la surbrillance.
 */
export class MappingPointsController {
    /** @type {import("../canvas/hex-selection.js").HexSelection} */
    #selection;
    /** Outil radio actif du groupe : TOOL_SELECT | TOOL_EDIT | null. */
    #activeTool = null;
    /** État du toggle d'affichage des nombres (ON par défaut). */
    #showing = true;
    /** @type {PIXI.Container|null} */
    #overlay = null;
    /** @type {((event: any) => void)|null} */
    #pointerHandler = null;
    /** @type {((event: Event) => void)|null} */
    #contextHandler = null;

    /** @param {import("../canvas/hex-selection.js").HexSelection} selection */
    constructor(selection) {
        this.#selection = selection;
    }

    get scene() {
        return canvas?.scene ?? null;
    }

    /** Enregistre le groupe d'outils. À appeler depuis getSceneControlButtons. */
    getControls(controls) {
        if (!game.user.isGM || !isHexScene(canvas?.scene)) return;
        const t = (key) => game.i18n.localize(`FORGOTTEN_WOODS.mapping.${key}`);
        controls[CONTROL] = {
            name: CONTROL,
            title: t("control"),
            icon: "fa-solid fa-map-location-dot",
            onChange: () => {},
            tools: {
                [TOOL_SELECT]: {
                    name: TOOL_SELECT,
                    order: 1,
                    title: t("tools.selectHex"),
                    icon: "fa-solid fa-location-crosshairs"
                },
                [TOOL_SHOW]: {
                    name: TOOL_SHOW,
                    order: 2,
                    title: t("tools.showPoints"),
                    icon: "fa-solid fa-list-ol",
                    toggle: true,
                    active: this.#showing,
                    onChange: (event, active) => this.#onToggleShow(active)
                },
                [TOOL_EDIT]: {
                    name: TOOL_EDIT,
                    order: 3,
                    title: t("tools.editPoints"),
                    icon: "fa-solid fa-hexagon-plus"
                },
                [TOOL_PARTY]: {
                    name: TOOL_PARTY,
                    order: 4,
                    title: t("tools.aroundParty"),
                    icon: "fa-solid fa-people-group",
                    button: true,
                    onChange: () => this.incrementAroundParty()
                },
                [TOOL_RESET]: {
                    name: TOOL_RESET,
                    order: 5,
                    title: t("tools.resetPoints"),
                    icon: "fa-solid fa-trash",
                    button: true,
                    onChange: () => this.resetAllPoints()
                }
            },
            activeTool: TOOL_SELECT
        };
    }

    /** Réagit au changement d'outil. À appeler depuis activateSceneControls. */
    onActivateControls(controls) {
        const isOurs = controls?.control?.name === CONTROL;
        const tool = controls?.tool?.name;
        const previous = this.#activeTool;
        this.#activeTool = isOurs ? tool : null;
        if (isOurs && (tool === TOOL_SELECT || tool === TOOL_EDIT)) {
            // Passer en édition manuelle vide la multi-sélection (édition mono-hex).
            if (tool === TOOL_EDIT && previous !== TOOL_EDIT) this.#selection.clear();
            this.#enable();
        } else {
            this.#disable();
        }
    }

    /** Rafraîchit l'overlay si affiché (sur updateScene). */
    onUpdateScene(scene) {
        if (this.#showing && this.#activeTool && scene?.id === this.scene?.id) {
            this.#renderOverlay();
        }
    }

    #enable() {
        this.#attachListeners();
        this.#selection.showHighlight();
        if (this.#showing) this.#renderOverlay();
        else this.#clearOverlay();
    }

    #disable() {
        this.#detachListeners();
        this.#selection.hideHighlight();
        this.#selection.clear();
        this.#clearOverlay();
    }

    destroy() {
        this.#disable();
        this.#selection.destroy();
    }

    // --- Toggle d'affichage des nombres ---

    #onToggleShow(active) {
        this.#showing = typeof active === "boolean" ? active : !this.#showing;
        if (this.#showing && this.#activeTool) this.#renderOverlay();
        else this.#clearOverlay();
    }

    // --- Écouteurs pointeur ---

    #attachListeners() {
        if (this.#pointerHandler) return;
        this.#pointerHandler = (event) => this.#onPointerDown(event);
        canvas.stage.on("pointerdown", this.#pointerHandler);
        // Désactive le menu contextuel pour permettre le clic droit = -1.
        this.#contextHandler = (event) => {
            if (this.#activeTool) event.preventDefault();
        };
        (canvas.app.canvas ?? canvas.app.view).addEventListener("contextmenu", this.#contextHandler);
    }

    #detachListeners() {
        if (this.#pointerHandler) {
            canvas.stage?.off("pointerdown", this.#pointerHandler);
            this.#pointerHandler = null;
        }
        if (this.#contextHandler) {
            (canvas.app?.canvas ?? canvas.app?.view)?.removeEventListener("contextmenu", this.#contextHandler);
            this.#contextHandler = null;
        }
    }

    #onPointerDown(event) {
        if (!game.user.isGM) return;
        if (this.#activeTool !== TOOL_SELECT && this.#activeTool !== TOOL_EDIT) return;
        const button = event.data?.button ?? event.button;
        if (button !== 0 && button !== 2) return; // gauche / droit seulement

        const coords = event.data?.getLocalPosition?.(canvas.app.stage)
            ?? event.getLocalPosition?.(canvas.app.stage);
        if (!coords) return;
        const offset = coordsToOffset(coords);
        if (!this.#inBounds(offset)) return; // ignore les hex hors scène (padding)

        if (this.#activeTool === TOOL_SELECT) {
            if (button === 0) this.#selection.toggle(offset); // multi-sélection
            return;
        }

        // TOOL_EDIT : 1er clic sur un hex non sélectionné = sélection seule.
        if (!this.#selection.has(offset)) {
            this.#selection.select(offset);
            return;
        }
        const delta = button === 0 ? 1 : -1;
        applyDeltas(this.scene, new Map([[offsetToKey(offset), delta]]));
        // Le re-render de l'overlay arrive via onUpdateScene après persistance.
    }

    /** Vrai si le centre du hex est dans la zone de scène (hors padding). */
    #inBounds(offset) {
        const rect = canvas.dimensions?.sceneRect;
        if (!rect) return true;
        const { x, y } = canvas.grid.getCenterPoint(offset);
        return x >= rect.x && x <= rect.x + rect.width
            && y >= rect.y && y <= rect.y + rect.height;
    }

    // --- Incrément autour du Token Party ---

    incrementAroundParty() {
        if (!game.user.isGM || !isHexScene(this.scene)) return;
        const token = this.#resolvePartyToken();
        if (!token) {
            ui.notifications.warn(game.i18n.localize("FORGOTTEN_WOODS.mapping.noParty"));
            return;
        }
        const origin = coordsToOffset(token.center);
        const deltas = new Map();
        for (const offset of spacesInRange(origin, 1)) {
            deltas.set(offsetToKey(offset), 1);
        }
        applyDeltas(this.scene, deltas);
    }

    // --- Remise à zéro de tous les PC de la scène ---

    async resetAllPoints() {
        if (!game.user.isGM || !isHexScene(this.scene)) return;
        const t = (key) => game.i18n.localize(`FORGOTTEN_WOODS.mapping.${key}`);
        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: { title: t("reset.title") },
            content: `<p>${t("reset.confirm")}</p>`,
            modal: true
        });
        if (!confirmed) return;
        clearAllPoints(this.scene);
    }

    #resolvePartyToken() {
        const controlled = canvas.tokens?.controlled?.find((t) => isPartyToken(t));
        if (controlled) return controlled;
        const partyTokens = canvas.tokens?.placeables?.filter((t) => isPartyToken(t)) ?? [];
        return partyTokens.length === 1 ? partyTokens[0] : null;
    }

    // --- Overlay des nombres ---

    #renderOverlay() {
        this.#clearOverlay();
        if (!this.scene) return;
        const container = new PIXI.Container();
        const points = readPoints(this.scene);
        for (const [key, count] of Object.entries(points)) {
            if (!count) continue;
            const [i, j] = key.split(",").map(Number);
            const { x, y } = canvas.grid.getCenterPoint({ i, j });
            const text = new PIXI.Text(String(count), {
                fontFamily: "Signika, sans-serif",
                fontSize: 28,
                fill: 0xffffff,
                stroke: 0x000000,
                strokeThickness: 4,
                align: "center"
            });
            text.anchor.set(0.5);
            text.position.set(x, y);
            container.addChild(text);
        }
        canvas.interface.addChild(container);
        this.#overlay = container;
    }

    #clearOverlay() {
        if (this.#overlay) {
            this.#overlay.destroy({ children: true });
            this.#overlay = null;
        }
    }
}
