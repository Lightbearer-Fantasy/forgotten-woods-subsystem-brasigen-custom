import { isHexScene, isPartyToken } from "../utils/scene.js";
import { coordsToOffset, offsetToKey, spacesInRange } from "../utils/hex.js";
import { readPoints, applyDeltas, clearAllPoints } from "./mapping-points-store.js";
import { readDC, setDC, clearAllDC, dcAt } from "./mapping-dc-store.js";

const CONTROL = "forgottenWoods";
const TOOL_SELECT = "selectHex";
const TOOL_SHOW = "showPoints";
const TOOL_EDIT = "editPoints";
const TOOL_PARTY = "aroundParty";
const TOOL_RESET = "resetPoints";
const TOOL_SHOW_DC = "showDC";
const TOOL_SET_DC = "setDC";
const TOOL_RESET_DC = "resetDC";

/**
 * États actifs des deux toggles d'affichage dérivés du mode courant.
 * Invariant : au plus un toggle actif, et il correspond exactement au mode
 * (exclusivité au niveau des boutons). Pur — testable hors Foundry.
 * @param {"pc"|"dc"|"none"} displayMode
 * @returns {{pc: boolean, dc: boolean}}
 */
export function toggleActiveStates(displayMode) {
    return { pc: displayMode === "pc", dc: displayMode === "dc" };
}

/**
 * Contrôleur de l'onglet « Hex Controls » (MJ, scène hexagonale).
 * 8 entrées : sélection de hex (radio, défaut), affichage des PC (toggle),
 * incrément/décrément des PC (radio), affichage des DC (toggle),
 * définir le DC (bouton), incrément par proximité (bouton),
 * remise à zéro des PC (bouton), remise à zéro des DC (bouton).
 * Consomme un HexSelection autonome pour la sélection + la surbrillance.
 */
export class MappingPointsController {
    /** @type {import("../canvas/hex-selection.js").HexSelection} */
    #selection;
    /** Outil radio actif du groupe : TOOL_SELECT | TOOL_EDIT | null. */
    #activeTool = null;
    /** Mode d'affichage de l'overlay : "pc" | "dc" | "none". PC par défaut. */
    #displayMode = "pc";
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
                    active: this.#displayMode === "pc",
                    onChange: (event, active) => this.#onTogglePC(active)
                },
                [TOOL_EDIT]: {
                    name: TOOL_EDIT,
                    order: 3,
                    title: t("tools.editPoints"),
                    icon: "fa-solid fa-hexagon-plus"
                },
                [TOOL_SHOW_DC]: {
                    name: TOOL_SHOW_DC,
                    order: 4,
                    title: t("tools.showDC"),
                    icon: "fa-solid fa-flag-checkered",
                    toggle: true,
                    active: this.#displayMode === "dc",
                    onChange: (event, active) => this.#onToggleDC(active)
                },
                [TOOL_SET_DC]: {
                    name: TOOL_SET_DC,
                    order: 5,
                    title: t("tools.setDC"),
                    icon: "fa-solid fa-pen-to-square",
                    button: true,
                    onChange: () => this.promptSetDC()
                },
                [TOOL_PARTY]: {
                    name: TOOL_PARTY,
                    order: 6,
                    title: t("tools.aroundParty"),
                    icon: "fa-solid fa-people-group",
                    button: true,
                    onChange: () => this.incrementAroundParty()
                },
                [TOOL_RESET]: {
                    name: TOOL_RESET,
                    order: 7,
                    title: t("tools.resetPoints"),
                    icon: "fa-solid fa-trash",
                    button: true,
                    onChange: () => this.resetAllPoints()
                },
                [TOOL_RESET_DC]: {
                    name: TOOL_RESET_DC,
                    order: 8,
                    title: t("tools.resetDC"),
                    icon: "fa-solid fa-eraser",
                    button: true,
                    onChange: () => this.resetAllDC()
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
        if (this.#displayMode !== "none" && this.#activeTool && scene?.id === this.scene?.id) {
            this.#renderOverlay();
        }
    }

    #enable() {
        this.#attachListeners();
        this.#selection.showHighlight();
        this.#refreshOverlay();
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

    // --- Toggles d'affichage (PC / DC mutuellement exclusifs) ---

    #onTogglePC(active) {
        const on = typeof active === "boolean" ? active : this.#displayMode !== "pc";
        this.#displayMode = on ? "pc" : "none";
        this.#syncToggleStates();
        this.#refreshOverlay();
    }

    #onToggleDC(active) {
        const on = typeof active === "boolean" ? active : this.#displayMode !== "dc";
        this.#displayMode = on ? "dc" : "none";
        this.#syncToggleStates();
        this.#refreshOverlay();
    }

    /**
     * Aligne l'état actif *vivant* des deux toggles sur #displayMode, puis
     * redessine la barre. Indispensable : Foundry ne bascule que le toggle
     * cliqué et `render()` ne ré-exécute pas getControls (pas de `reset`), donc
     * sans cela l'autre toggle resterait allumé sans effet. Le template rend
     * `aria-pressed` depuis `tool.active` (cloné au render), d'où l'écriture
     * directe sur l'objet outil vivant — même pattern que `togglePalette`.
     */
    #syncToggleStates() {
        const tools = ui.controls?.controls?.[CONTROL]?.tools;
        if (tools) {
            const states = toggleActiveStates(this.#displayMode);
            if (tools[TOOL_SHOW]) tools[TOOL_SHOW].active = states.pc;
            if (tools[TOOL_SHOW_DC]) tools[TOOL_SHOW_DC].active = states.dc;
        }
        ui.controls?.render();
    }

    /** (Re)dessine l'overlay selon le mode courant, ou l'efface. */
    #refreshOverlay() {
        if (this.#displayMode !== "none" && this.#activeTool) this.#renderOverlay();
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

    // --- Définition du DC des hex sélectionnés ---

    async promptSetDC() {
        if (!game.user.isGM || !isHexScene(this.scene)) return;
        const t = (key) => game.i18n.localize(`FORGOTTEN_WOODS.mapping.${key}`);
        const offsets = this.#selection.getAll();
        if (offsets.length === 0) {
            ui.notifications.warn(t("setDCPrompt.noSelection"));
            return;
        }
        // Pré-remplissage avec le DC courant si un seul hex est sélectionné.
        const initial = offsets.length === 1 ? dcAt(this.scene, offsets[0]) : 0;
        const value = await foundry.applications.api.DialogV2.prompt({
            window: { title: t("setDCPrompt.title") },
            content: `<p>${t("setDCPrompt.label")}</p>`
                + `<input type="number" name="dc" value="${initial}" min="0" step="1" autofocus>`,
            ok: {
                callback: (event, button) => Number(button.form.elements.dc.value)
            },
            modal: true
        });
        if (value == null || Number.isNaN(value)) return;
        const keys = offsets.map((o) => offsetToKey(o));
        setDC(this.scene, keys, Math.max(0, Math.trunc(value)));
    }

    // --- Remise à zéro de tous les DC de la scène ---

    async resetAllDC() {
        if (!game.user.isGM || !isHexScene(this.scene)) return;
        const t = (key) => game.i18n.localize(`FORGOTTEN_WOODS.mapping.${key}`);
        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: { title: t("resetDC.title") },
            content: `<p>${t("resetDC.confirm")}</p>`,
            modal: true
        });
        if (!confirmed) return;
        clearAllDC(this.scene);
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
        if (!this.scene || this.#displayMode === "none") return;
        const isDC = this.#displayMode === "dc";
        const data = isDC ? readDC(this.scene) : readPoints(this.scene);
        const fill = isDC ? 0x5fd0ff : 0xffffff;
        const container = new PIXI.Container();
        for (const [key, value] of Object.entries(data)) {
            if (!value) continue;
            const [i, j] = key.split(",").map(Number);
            const { x, y } = canvas.grid.getCenterPoint({ i, j });
            const text = new PIXI.Text(isDC ? `DC ${value}` : String(value), {
                fontFamily: "Signika, sans-serif",
                fontSize: 28,
                fill,
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
