import { isHexScene, isPartyToken } from "../utils/scene.js";
import { coordsToOffset, offsetToKey, offsetsInRect } from "../utils/hex.js";
import { readPoints, applyDeltas, clearAllPoints, buildRangeDeltas } from "./mapping-points-store.js";
import { readDC, setDC, clearAllDC, dcAt } from "./mapping-dc-store.js";
import { aspectOf, setAspect } from "./aspect-store.js";
import { aspectOptions, aspectLabelKey } from "../data/aspects.js";

const CONTROL = "forgottenWoods";
const TOOL_SELECT = "selectHex";
const TOOL_SHOW = "showPoints";
const TOOL_EDIT = "editPoints";
const TOOL_PARTY = "aroundParty";
const TOOL_RESET = "resetPoints";
const TOOL_SHOW_DC = "showDC";
const TOOL_SET_DC = "setDC";
const TOOL_RESET_DC = "resetDC";
const TOOL_SET_ASPECT = "setAspect";

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
    /** Suivi du clic droit en mode Sélection (clic court vs pan maintenu). */
    #rightDownPos = null;
    #rightDragged = false;
    /** @type {{el: EventTarget, down: Function, move: Function, up: Function}|null} */
    #rightHandlers = null;
    /** Peinture de sélection au clic gauche maintenu (mode Sélection). */
    #painting = false;
    #paintMoved = false;
    #paintStartOffset = null;
    /** Sens de la peinture, fixé selon l'état du hex de départ : "add" | "remove". */
    #paintMode = "add";
    /** @type {Set<string>|null} */
    #paintStroke = null;
    /** @type {((event: any) => void)|null} */
    #moveHandler = null;
    /** @type {((event: any) => void)|null} */
    #upHandler = null;

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
            icon: "fa-solid fa-compass-drafting",
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
                },
                [TOOL_SET_ASPECT]: {
                    name: TOOL_SET_ASPECT,
                    order: 9,
                    title: t("tools.setAspect"),
                    icon: "fa-solid fa-mountain-sun",
                    button: true,
                    onChange: () => this.promptSetAspect()
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
        // Peinture de sélection : clic gauche maintenu + déplacement.
        this.#moveHandler = (event) => this.#onPointerMove(event);
        this.#upHandler = (event) => this.#onPointerUp(event);
        canvas.stage.on("pointermove", this.#moveHandler);
        canvas.stage.on("pointerup", this.#upHandler);
        canvas.stage.on("pointerupoutside", this.#upHandler);
        // Désactive le menu contextuel pour permettre le clic droit = -1.
        this.#contextHandler = (event) => {
            if (this.#activeTool) event.preventDefault();
        };
        const el = canvas.app.canvas ?? canvas.app.view;
        el.addEventListener("contextmenu", this.#contextHandler);
        // Clic droit court (sans pan) en mode Sélection = tout désélectionner.
        // On distingue clic vs pan par le déplacement (seuil ~10px), comme le
        // Party HUD : un pan (clic droit maintenu + déplacement) ne désélectionne pas.
        const down = (e) => {
            if (e.button === 2) {
                this.#rightDownPos = { x: e.clientX, y: e.clientY };
                this.#rightDragged = false;
            }
        };
        const move = (e) => {
            if (!this.#rightDownPos) return;
            const dx = e.clientX - this.#rightDownPos.x;
            const dy = e.clientY - this.#rightDownPos.y;
            if (dx * dx + dy * dy > 100) this.#rightDragged = true;
        };
        const up = (e) => {
            if (e.button !== 2 || !this.#rightDownPos) return;
            const dragged = this.#rightDragged;
            this.#rightDownPos = null;
            if (!dragged && this.#activeTool === TOOL_SELECT) this.#selection.clear();
        };
        el.addEventListener("pointerdown", down, { capture: true });
        el.addEventListener("pointermove", move, { capture: true });
        el.addEventListener("pointerup", up, { capture: true });
        this.#rightHandlers = { el, down, move, up };
    }

    #detachListeners() {
        if (this.#pointerHandler) {
            canvas.stage?.off("pointerdown", this.#pointerHandler);
            this.#pointerHandler = null;
        }
        if (this.#moveHandler) {
            canvas.stage?.off("pointermove", this.#moveHandler);
            this.#moveHandler = null;
        }
        if (this.#upHandler) {
            canvas.stage?.off("pointerup", this.#upHandler);
            canvas.stage?.off("pointerupoutside", this.#upHandler);
            this.#upHandler = null;
        }
        this.#painting = false;
        this.#paintMoved = false;
        this.#paintStartOffset = null;
        this.#paintStroke = null;
        if (this.#contextHandler) {
            (canvas.app?.canvas ?? canvas.app?.view)?.removeEventListener("contextmenu", this.#contextHandler);
            this.#contextHandler = null;
        }
        if (this.#rightHandlers) {
            const { el, down, move, up } = this.#rightHandlers;
            el.removeEventListener("pointerdown", down, { capture: true });
            el.removeEventListener("pointermove", move, { capture: true });
            el.removeEventListener("pointerup", up, { capture: true });
            this.#rightHandlers = null;
        }
        this.#rightDownPos = null;
        this.#rightDragged = false;
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
            if (button === 0) {
                // Démarre un trait : un simple clic (sans entrer dans d'autres hex)
                // bascule le hex au relâchement ; un glissé peint les hex traversés.
                // Le sens dépend du hex de départ : déjà sélectionné → désélection,
                // sinon → sélection. La décision clic/glissé est prise dans move/up.
                this.#painting = true;
                this.#paintMoved = false;
                this.#paintStartOffset = offset;
                this.#paintMode = this.#selection.has(offset) ? "remove" : "add";
                this.#paintStroke = new Set();
            }
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

    /** Peinture de sélection : ajoute les hex traversés tant que le clic gauche est maintenu. */
    #onPointerMove(event) {
        if (!this.#painting) return;
        const coords = event.data?.getLocalPosition?.(canvas.app.stage)
            ?? event.getLocalPosition?.(canvas.app.stage);
        if (!coords) return;
        const offset = coordsToOffset(coords);
        if (!this.#inBounds(offset)) return;
        const key = offsetToKey(offset);
        const startKey = offsetToKey(this.#paintStartOffset);
        if (!this.#paintMoved) {
            if (key === startKey) return; // encore sur le hex de départ : pas un glissé
            // Entrée dans un nouveau hex → glissé : on peint le hex de départ aussi.
            this.#paintMoved = true;
            this.#paintStroke.add(startKey);
            this.#paintApply(this.#paintStartOffset);
        }
        if (this.#paintStroke.has(key)) return;
        this.#paintStroke.add(key);
        this.#paintApply(offset);
    }

    /** Applique le sens de peinture courant à un hex (ajout ou retrait). */
    #paintApply(offset) {
        if (this.#paintMode === "remove") this.#selection.remove(offset);
        else this.#selection.add(offset);
    }

    /** Fin de trait : un clic simple (sans glissé) bascule le hex de départ. */
    #onPointerUp() {
        if (!this.#painting) return;
        this.#painting = false;
        if (!this.#paintMoved && this.#paintStartOffset) {
            this.#selection.toggle(this.#paintStartOffset);
        }
        this.#paintMoved = false;
        this.#paintStartOffset = null;
        this.#paintStroke = null;
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
        applyDeltas(this.scene, buildRangeDeltas(origin, 1, 1));
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
        let keys;
        if (offsets.length > 0) {
            keys = offsets.map((o) => offsetToKey(o));
        } else if (Object.keys(readDC(this.scene)).length === 0) {
            // Aucune sélection ET aucun DC encore défini : on établit une base de
            // travail en appliquant la valeur à TOUS les hex de la scène
            // (ajustables ensuite hex par hex avec les autres outils).
            keys = this.#allSceneHexKeys();
            if (keys.length === 0) return;
        } else {
            ui.notifications.warn(t("setDCPrompt.noSelection"));
            return;
        }
        // Champ laissé vide : le DC courant (1 hex) ou 0 est montré en placeholder
        // grisé, qui disparaît dès la saisie. Pas besoin d'effacer un 0 pré-rempli.
        const placeholder = offsets.length === 1 ? dcAt(this.scene, offsets[0]) : 0;
        const raw = await foundry.applications.api.DialogV2.prompt({
            window: { title: t("setDCPrompt.title") },
            content: `<p>${t("setDCPrompt.label")}</p>`
                + `<input type="number" name="dc" placeholder="${placeholder}" min="0" step="1" autofocus>`,
            ok: {
                callback: (event, button) => button.form.elements.dc.value
            },
            modal: true
        });
        // Dialogue fermé (null) ou champ vide ("") = aucune modification.
        if (raw == null || String(raw).trim() === "") return;
        const value = Number(raw);
        if (Number.isNaN(value)) return;
        setDC(this.scene, keys, Math.max(0, Math.trunc(value)));
    }

    /** Clés "i,j" de tous les hex de la scène (centre dans la zone de scène). */
    #allSceneHexKeys() {
        const rect = canvas.dimensions?.sceneRect;
        if (!rect) return [];
        return offsetsInRect(rect).map(offsetToKey);
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

    /** Menu de sélection de l'Aspect de la scène (MJ). */
    async promptSetAspect() {
        if (!game.user.isGM || !isHexScene(this.scene)) return;
        const t = (key) => game.i18n.localize(`FORGOTTEN_WOODS.mapping.${key}`);
        const current = aspectOf(this.scene) ?? "";
        const opts = aspectOptions().map(({ value, labelKey }) => {
            const selected = value === current ? " selected" : "";
            return `<option value="${value}"${selected}>${game.i18n.localize(labelKey)}</option>`;
        }).join("");
        const raw = await foundry.applications.api.DialogV2.prompt({
            window: { title: t("setAspectPrompt.title") },
            content: `<p>${t("setAspectPrompt.label")}</p>`
                + `<select name="aspect" autofocus>${opts}</select>`,
            ok: { callback: (event, button) => button.form.elements.aspect.value },
            modal: true
        });
        if (raw == null) return;
        setAspect(this.scene, raw || null);
    }

    #resolvePartyToken() {
        const controlled = canvas.tokens?.controlled?.find((t) => isPartyToken(t));
        if (controlled) return controlled;
        const partyTokens = canvas.tokens?.placeables?.filter((t) => isPartyToken(t)) ?? [];
        return partyTokens.length === 1 ? partyTokens[0] : null;
    }

    // --- Overlay des nombres ---

    #renderOverlay() {
        if (!game.user.isGM) return; // confidentialité : jamais d'overlay côté joueur
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
