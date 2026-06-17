import { isHexScene, isPartyToken } from "../utils/scene.js";
import { coordsToOffset, offsetToKey, spacesInRange } from "../utils/hex.js";
import { readPoints, applyDeltas } from "./mapping-points-store.js";

const CONTROL = "forgottenWoods";
const TOOL_POINTS = "points";
const TOOL_PARTY = "aroundParty";

/**
 * Contrôleur du système de Points de Cartographie (MJ).
 * Outils de contrôle de scène + overlay des compteurs (visible seulement
 * quand l'outil "points" est actif) + incrément ciblé / par rayon.
 */
export class MappingPointsController {
    /** @type {boolean} */
    #active = false;
    /** @type {PIXI.Container|null} */
    #overlay = null;
    /** @type {((event: any) => void)|null} */
    #pointerHandler = null;
    /** @type {((event: Event) => void)|null} */
    #contextHandler = null;

    get scene() {
        return canvas?.scene ?? null;
    }

    /** Enregistre le groupe d'outils MJ. À appeler depuis getSceneControlButtons. */
    getControls(controls) {
        if (!game.user.isGM || !isHexScene(canvas?.scene)) return;
        controls[CONTROL] = {
            name: CONTROL,
            title: game.i18n.localize("FORGOTTEN_WOODS.mapping.control"),
            icon: "fa-solid fa-map-location-dot",
            onChange: () => {},
            tools: {
                [TOOL_POINTS]: {
                    name: TOOL_POINTS,
                    title: game.i18n.localize("FORGOTTEN_WOODS.mapping.tools.points"),
                    icon: "fa-solid fa-hexagon-plus"
                },
                [TOOL_PARTY]: {
                    name: TOOL_PARTY,
                    title: game.i18n.localize("FORGOTTEN_WOODS.mapping.tools.aroundParty"),
                    icon: "fa-solid fa-people-group",
                    button: true,
                    onChange: () => this.incrementAroundParty()
                }
            },
            activeTool: TOOL_POINTS
        };
    }

    /** Réagit au changement d'outil. À appeler depuis activateSceneControls. */
    onActivateControls(controls) {
        const active =
            controls?.control?.name === CONTROL && controls?.tool?.name === TOOL_POINTS;
        if (active) this.#enable();
        else this.#disable();
    }

    /** Rafraîchit l'overlay si l'outil est actif (sur updateScene). */
    onUpdateScene(scene) {
        if (this.#active && scene?.id === this.scene?.id) this.#renderOverlay();
    }

    #enable() {
        if (!this.#active) {
            this.#active = true;
            this.#attachListeners();
        }
        this.#renderOverlay();
    }

    #disable() {
        this.#active = false;
        this.#detachListeners();
        this.#clearOverlay();
    }

    destroy() {
        this.#disable();
    }

    // --- Écouteurs pointeur ---

    #attachListeners() {
        this.#pointerHandler = (event) => this.#onPointerDown(event);
        canvas.stage.on("pointerdown", this.#pointerHandler);
        // Empêche le menu contextuel pour permettre le décrément au clic droit.
        this.#contextHandler = (event) => {
            if (this.#active) event.preventDefault();
        };
        canvas.app.view.addEventListener("contextmenu", this.#contextHandler);
    }

    #detachListeners() {
        if (this.#pointerHandler) {
            canvas.stage?.off("pointerdown", this.#pointerHandler);
            this.#pointerHandler = null;
        }
        if (this.#contextHandler) {
            canvas.app?.view?.removeEventListener("contextmenu", this.#contextHandler);
            this.#contextHandler = null;
        }
    }

    #onPointerDown(event) {
        if (!this.#active || !game.user.isGM) return;
        const target = event.srcElement ?? event.target;
        if (!(target && target.id === "board")) return;
        const button = event.data?.button ?? event.button;
        if (button !== 0 && button !== 2) return; // gauche = +1, droit = -1

        const coords = event.data.getLocalPosition(canvas.app.stage);
        const offset = coordsToOffset(coords);
        const delta = button === 0 ? 1 : -1;
        applyDeltas(this.scene, new Map([[offsetToKey(offset), delta]]));
        // Le re-render arrive via onUpdateScene après persistance.
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

    #resolvePartyToken() {
        const controlled = canvas.tokens?.controlled?.find((t) => isPartyToken(t));
        if (controlled) return controlled;
        const partyTokens = canvas.tokens?.placeables?.filter((t) => isPartyToken(t)) ?? [];
        return partyTokens.length === 1 ? partyTokens[0] : null;
    }

    // --- Overlay des compteurs ---

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
