import { isHexScene, activePartyToken, tokenAtPoint, canvasClickOpensHud } from "../utils/scene.js";
import { GROUP_ACTIVITIES, INDIVIDUAL_ACTIVITIES } from "../data/activities.js";
import { slowestLandSpeed, groupActivityCount, characterCount } from "./party-counts.js";
import { roundCountModifier, roundCountColor, roundSymbols, partyFatigued, isCookRound } from "../data/round-effects.js";
import { activityDisabled } from "../data/activity-gating.js";
import { campAt } from "../mapping/camp-store.js";
import { counterValue } from "../mapping/gpc-bridge.js";
import { coordsToOffset } from "../utils/hex.js";
import { MapAreaFlow } from "../mapping/map-area-flow.js";
import { enrichActivityHtml } from "./activity-enrich.js";
import { SkillCheckFlow } from "../mapping/skill-check-flow.js";
import { RecallKnowledgeFlow } from "../mapping/recall-knowledge-flow.js";
import { TreatWoundsFlow } from "../mapping/treat-wounds-flow.js";
import { MakeCampFlow } from "../mapping/make-camp-flow.js";
import { RestFlow } from "../mapping/rest-flow.js";
import { ActivityPopup } from "./activity-popup.js";
import { requestApplyScout, requestSetPartyEffect, requestClearPartyEffect } from "../mapping/gm-actions.js";
import { CookFlow } from "../mapping/cook-flow.js";
import { CraftFlow } from "../mapping/craft-flow.js";
import { SearchFlow } from "../mapping/search-flow.js";
import { PARTY_EFFECTS } from "../data/party-effects.js";

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
            // Une sélection large (drag) ne doit jamais OUVRIR le HUD, mais doit
            // le FERMER s'il est ouvert — parité avec le MJ (dont le controlToken
            // déclenche la fermeture) ; côté joueur, controlToken ne se déclenche
            // pas, donc on planifie nous-mêmes l'évaluation (qui fermera sur _dragged).
            if (wasDrag) {
                this._hovered = null;
                this._scheduleEvaluate();
                return;
            }
            // Gate sur l'outil actif, comme le Token HUD natif : un clic émis
            // alors qu'un outil Hex Controls (selectHex/editPoints…) est actif ne
            // doit jamais ouvrir le Party HUD. Sinon, en mode Sélection de hex,
            // cliquer le hex du Token Party l'ouvrait (≠ Token Actor, qui reste muet).
            if (!canvasClickOpensHud(game?.activeTool, SearchFlow.selecting)) return;
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
            "roll-d20": onRollD20,
            "open-description": onOpenDescription,
            "remove-party-effect": onRemovePartyEffect
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

    async _prepareContext() {
        const actor = this.token?.actor ?? null;
        const base = groupActivityCount(slowestLandSpeed(actor));
        const members = (actor?.members ?? []).filter((m) => m?.type === "character");
        const fatigued = partyFatigued(members);
        const cook = isCookRound(actor?.getFlag?.("forgotten-woods-brasigen", "cookRound"), game.combat?.round ?? null);
        const modifier = roundCountModifier({ fatigued, cook });
        const groupCount = base + modifier;
        const groupColor = roundCountColor(modifier);
        const groupSymbols = roundSymbols({ fatigued, cook });
        const scene = canvas?.scene ?? null;
        const offset = this.token ? coordsToOffset(this.token.center) : null;
        const campPresent = scene && offset ? campAt(scene, offset) : false;
        const character = game.user.character ?? null;
        const ctx = {
            isGM: game.user.isGM,
            hasCharacter: !!character,
            craftingTrained: (character?.skills?.crafting?.rank ?? 0) >= 1,
            medicineTrained: (character?.skills?.medicine?.rank ?? 0) >= 1,
            campPresent,
            ingredientCount: counterValue("ingredients"),
            characterCount: characterCount(actor)
        };
        const withDisabled = (list) => list.map((a) => ({ ...a, disabled: activityDisabled(a, ctx) }));
        const baseIndividual = characterCount(actor);
        // Chips d'effets de groupe : VISIBLES DU MJ UNIQUEMENT (états transitoires
        // pour la mécanique v0.7, pas destinés aux Joueurs).
        const activeEffectKeys = game.user.isGM
            ? (actor?.getFlag?.("forgotten-woods-brasigen", "partyEffects") ?? [])
            : [];
        const partyEffects = activeEffectKeys
            .filter((k) => PARTY_EFFECTS[k])
            .map((k) => ({ key: k, label: game.i18n.localize(PARTY_EFFECTS[k].label), img: PARTY_EFFECTS[k].img }));
        return {
            groupTitle: game.i18n.localize("FORGOTTEN_WOODS.panel.group"),
            individualTitle: game.i18n.localize("FORGOTTEN_WOODS.panel.individual"),
            groupCount,
            groupColor,
            groupSymbols,
            individualCount: baseIndividual + (campPresent ? 2 : 0),
            groupActivities: withDisabled(GROUP_ACTIVITIES),
            individualActivities: withDisabled(INDIVIDUAL_ACTIVITIES),
            campPresent,
            campImg: GROUP_ACTIVITIES.find((a) => a.id === "make-camp")?.img ?? null,
            campLabel: game.i18n.localize("FORGOTTEN_WOODS.panel.campPresent"),
            partyEffects,
            removeEffectTitle: game.i18n.localize("FORGOTTEN_WOODS.panel.removeEffect")
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
        // Espace réel à gauche du token (jusqu'au bord gauche de l'écran), borne de
        // largeur DYNAMIQUE du panneau Groupe : son bord droit est à
        // `center.x - halfWidth - gap`, donc l'espace dispo = cette même valeur.
        // On retranche une marge pour ne pas coller le bord de l'écran. C'est cette
        // mesure géométrique (et non une `max-width` fixe) qui fait wrapper la ligne
        // camp quand le token est près du bord gauche (cas joueur) au lieu de déborder.
        const gap = 10; // doit suivre --fw-gap
        const margin = 8;
        const leftSpace = Math.max(0, center.x - halfWidth - gap - margin);
        this.element.style.setProperty("--fw-left-space", `${leftSpace}px`);
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

    /**
     * Re-render le HUD s'il est ouvert, sans changer le token ancré. Appelé quand
     * une donnée affichée change hors interaction souris : compteurs de ressources
     * (GPC) ou état des camps de la scène, pour mettre à jour grisages, ligne camp
     * et compteur d'activités individuelles sans réouverture manuelle.
     */
    refreshIfOpen() {
        if (this.rendered && this.token) this.render();
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

/**
 * Acteur qui lance réellement un jet d'activité : le personnage assigné du
 * JOUEUR qui clique, et non l'acteur du Token Party (qui ne possède pas les
 * compétences des PJ → jet impossible / mauvaise compétence). Repli sur un
 * token contrôlé puis le Token Party (cas du MJ sans personnage assigné).
 */
function rollingActor(hud) {
    return game.user.character ?? canvas?.tokens?.controlled?.[0]?.actor ?? hud.token?.actor ?? null;
}

async function onSendToChat(event, target) {
    const row = target.closest("[data-activity-id]");
    const activity = this.findActivity(row?.dataset.activityId);
    if (!activity) return;
    return ChatMessage.create({
        content: await enrichActivityHtml(activity),
        // Flavor = titre de la carte (l'en-tête de fenêtre n'existe pas en chat).
        flavor: activity.label,
        // Alias seul, SANS acteur : un @Check cliqué dans la carte se résout
        // alors sur le personnage du joueur qui clique (pas sur le Token Party).
        speaker: { alias: this.token?.name ?? game.i18n.localize("FORGOTTEN_WOODS.panel.group") }
    });
}

function onOpenDescription(event, target) {
    const row = target.closest("[data-activity-id]");
    const activity = this.findActivity(row?.dataset.activityId);
    if (!activity) return;
    ActivityPopup.open(activity);
}

/** ✕ sur une chip d'effet de groupe : retire le marqueur (relais MJ). */
function onRemovePartyEffect(event, target) {
    const key = target.closest("[data-effect-key]")?.dataset.effectKey;
    if (!key) return;
    return requestClearPartyEffect(this.token?.actor?.id, key);
}

async function onRollD20(event, target) {
    const row = target.closest("[data-activity-id]");
    const activity = this.findActivity(row?.dataset.activityId);
    if (!activity) return;
    const actor = rollingActor(this);

    // Cartographier la zone : flux complet (verrou + round MJ + PC).
    if (activity.id === "map-area") {
        return MapAreaFlow.start(this.token, this.token?.actor);
    }
    // Monter le camp : vérif PC + confirmation + pose côté MJ.
    if (activity.id === "make-camp") {
        return MakeCampFlow.start(this.token);
    }
    // Se reposer : confirmation + soins/retrait Fatigued côté MJ.
    if (activity.id === "rest") {
        return RestFlow.start(this.token);
    }
    // Enquêter : deux Recall Knowledge (API pf2e-hud), sur le perso du joueur.
    if (activity.id === "investigate") {
        return RecallKnowledgeFlow.start(actor);
    }
    // Soigner les blessures : action Treat Wounds (API pf2e-hud), sur le perso du joueur.
    if (activity.id === "treat-wounds") {
        return TreatWoundsFlow.start(actor);
    }
    // Réparer : action Repair du système PF2E.
    if (activity.id === "repair") {
        return game.pf2e.actions.repair({ event, actors: [actor] });
    }
    // Fabriquer : flux dédié (zone de drop + pré-check matériaux + craft PF2E + consommation).
    if (activity.id === "craft") {
        return CraftFlow.start(this.token, actor, event);
    }
    // Cuisiner : flux dédié (choix compétence filtré + consommation + effet).
    if (activity.id === "cook") {
        return CookFlow.start(this.token, actor);
    }
    // Fouiller : sélection 1-hex joueur + jet vs DC + PC sur le hex.
    // On passe le HUD pour qu'il se ferme pendant la sélection (libère l'espace).
    if (activity.id === "search") {
        return SearchFlow.start(this.token, actor, this);
    }
    // Activité « à check » : jet de compétence (vs Hex DC si zone, sinon simple),
    // sans application de PC. Le jet est porté par le personnage du joueur qui
    // clique, pas par l'acteur du Token Party.
    if (activity.check?.skills || activity.check?.allSkills) {
        return SkillCheckFlow.start(this.token, actor, activity);
    }
    // Partir en reconnaissance : applique l'effet PF2E Scout à tous les PJ du Party
    // (côté MJ via relais). Pas de jet.
    if (activity.id === "scout") {
        return requestApplyScout(this.token?.actor?.id);
    }
    // S'empresser : pose le marqueur « hustle » (flag) sur l'acteur Party.
    if (activity.id === "hustle") {
        return requestSetPartyEffect(this.token?.actor?.id, "hustle");
    }
    // Activité sans jet : placeholder 1d20.
    const roll = await new Roll("1d20").evaluate();
    return roll.toMessage({
        flavor: activity.label,
        speaker: ChatMessage.getSpeaker({ token: this.token?.document })
    });
}
