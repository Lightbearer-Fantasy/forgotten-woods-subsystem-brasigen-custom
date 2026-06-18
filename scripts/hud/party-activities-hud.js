import { isHexScene, activePartyToken, tokenAtPoint } from "../utils/scene.js";
import { GROUP_ACTIVITIES, INDIVIDUAL_ACTIVITIES } from "../data/activities.js";
import { slowestLandSpeed, groupActivityCount, groupCountColor, characterCount } from "./party-counts.js";
import { MapAreaFlow } from "../mapping/map-area-flow.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class PartyActivitiesHUD extends HandlebarsApplicationMixin(ApplicationV2) {
    /** @type {Token|null} Token party actuellement ancré. */
    token = null;

    /** Position du pointeur au dernier appui (pour distinguer clic vs drag). */
    _downPos = null;
    /** Vrai si le pointeur a été déplacé depuis l'appui → sélection marquee. */
    _dragged = false;
    /** Garde-fou : n'attache les écouteurs pointeur qu'une fois. */
    _listenersBound = false;
    /**
     * Token Party sous le curseur AU MOMENT du dernier clic (hit-test
     * déterministe via `tokenAtPoint`). Sert au joueur qui ne peut pas
     * contrôler le Token Party : on détecte le clic direct par calcul
     * géométrique, puisque `controlToken` ne se déclenche jamais pour lui.
     * On n'utilise PLUS l'état de survol PIXI (`hoverToken`), que l'overlay
     * HTML du HUD peut figer (→ le HUD ne se fermait pas au clic dans le vide).
     */
    _hovered = null;

    /**
     * Attache le suivi du pointeur sur l'élément canvas (idempotent).
     * Permet de distinguer un clic direct d'une sélection large (marquee) :
     * seul un clic doit ouvrir le HUD, jamais un drag de sélection.
     */
    activateCanvasListeners() {
        const el = canvas?.app?.view ?? canvas?.app?.canvas;
        if (!el || this._listenersBound) return;
        this._listenersBound = true;
        // Capture : on observe l'événement avant tout arrêt de propagation PIXI.
        el.addEventListener("pointerdown", (event) => {
            this._downPos = { x: event.clientX, y: event.clientY };
            this._dragged = false;
        }, { capture: true });
        el.addEventListener("pointermove", (event) => {
            if (!this._downPos) return;
            const dx = event.clientX - this._downPos.x;
            const dy = event.clientY - this._downPos.y;
            if (dx * dx + dy * dy > 100) this._dragged = true; // seuil ~10px
        }, { capture: true });
        // _dragged n'est PAS remis à zéro ici : l'évaluation (microtask) qui suit
        // le drop doit encore voir le drag. Il est remis à zéro au prochain appui.
        el.addEventListener("pointerup", () => {
            const wasDrag = this._dragged;
            this._downPos = null;
            // Un clic propre (sans drag) ré-évalue, même si aucun controlToken
            // n'a été émis : cliquer un Token Party déjà contrôlé (après une
            // sélection large) doit ouvrir le HUD, comme le Token HUD natif.
            if (wasDrag) return;
            // Détermine le Token Party sous le curseur au moment du clic par
            // hit-test (canvas.mousePosition est en coordonnées de scène, comme
            // token.bounds). Cliquer dans le vide → null → fermeture ; un autre
            // token → non-party → fermeture. Déterministe, contrairement à l'état
            // de survol PIXI que l'overlay du HUD peut figer.
            this._hovered = tokenAtPoint(canvas?.mousePosition, canvas?.tokens?.placeables ?? []);
            this._scheduleEvaluate();
        }, { capture: true });
    }

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
        this._scheduleEvaluate();
    }

    /**
     * Planifie une évaluation unique en fin de tick (microtask).
     * Une sélection large émet un controlToken par token, de façon synchrone :
     * on ne juge que l'état FINAL de la sélection (et on évite le render async
     * qui s'afficherait malgré le close() des événements suivants).
     */
    _scheduleEvaluate() {
        if (this._controlPending) return;
        this._controlPending = true;
        Promise.resolve().then(() => {
            this._controlPending = false;
            this._evaluateControl();
        });
    }

    _evaluateControl() {
        // Recalcule depuis la source de vérité (cf. activePartyToken) : le HUD
        // ne reste ouvert que pour un Token Party actif sur une scène hexagonale
        // — contrôlé (MJ/propriétaire) ou survolé au clic (joueur non-propriétaire).
        // Couvre la désélection et le clic à côté (qui relâchent le contrôle).
        // Comme le Token HUD natif : une sélection large (marquee) n'ouvre jamais
        // le HUD, même si elle n'englobe que le Token Party — seul un clic direct.
        if (this._dragged) {
            this.close();
            return;
        }
        const active = activePartyToken({
            controlled: canvas?.tokens?.controlled ?? [],
            hovered: this._hovered
        });
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

    async close(options = {}) {
        this.token = null;
        // Masque l'élément immédiatement pour éviter la latence visuelle de l'animation ApplicationV2.
        if (this.element) this.element.style.display = "none";
        // `animate: false` est CRUCIAL : sans lui, ApplicationV2#close lance une
        // animation de minimisation et `await _awaitTransition(element, 1000)`.
        // Notre élément frameless (déjà en display:none) n'a AUCUNE transition CSS,
        // donc `transitionend` n'est jamais émis → l'attente va jusqu'au timeout de
        // 1000 ms. Or render() et close() partagent le même Semaphore(1) : ce close
        // bloquant retardait d'autant l'ouverture suivante du HUD (latence au clic).
        return super.close({ ...options, animate: false });
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
    // « Cartographier la zone » : flux d'automatisation (le jet 1d20 est émis en fin de flux).
    if (activity.id === "map-area") {
        return MapAreaFlow.start(this.token, this.token?.actor, activity.label);
    }
    const roll = await new Roll("1d20").evaluate();
    return roll.toMessage({
        flavor: activity.label,
        speaker: ChatMessage.getSpeaker({ token: this.token?.document })
    });
}
