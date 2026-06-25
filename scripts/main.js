import { PartyActivitiesHUD } from "./hud/party-activities-hud.js";
import { MappingPointsController } from "./mapping/mapping-points-controller.js";
import { HexSelection } from "./canvas/hex-selection.js";
import { registerSocket } from "./mapping/map-lock.js";
import { registerResourceClocks } from "./mapping/gpc-bridge.js";
import { registerGmActions } from "./mapping/gm-actions.js";
import { renderCampOverlay } from "./canvas/camp-overlay.js";
import { registerCraftTempHooks } from "./mapping/craft-temp-card.js";
import { onCombatRoundAdvance, onCombatEnd } from "./mapping/round-flow.js";
import { markHexplorationTracker } from "./hud/hexploration-label.js";
import { onRenderNoteConfig } from "./notes/note-config.js";
import { FWNote } from "./notes/fw-note.js";
import { refreshPinReveals } from "./notes/reveal-watcher.js";

const MODULE_ID = "forgotten-woods-brasigen";

let hud = null;
let mapping = null;
let hexSelection = null;

Hooks.once("init", () => {
    CONFIG.Note.objectClass = FWNote;
    registerResourceClocks();
    hud = new PartyActivitiesHUD();
    hexSelection = new HexSelection();
    mapping = new MappingPointsController(hexSelection);
    game.modules.get(MODULE_ID).api = { hud, mapping, hexSelection };
});

Hooks.once("setup", async () => {
    await loadTemplates({
        fwActivityRow: `modules/${MODULE_ID}/templates/partials/activity-row.hbs`
    });
});

Hooks.on("controlToken", (token, controlled) => hud?.onControlToken(token, controlled));
Hooks.on("updateToken", (doc, changes) => hud?.onUpdateToken(doc, changes));
Hooks.on("deleteToken", (doc) => hud?.onDeleteToken(doc));
Hooks.on("canvasPan", () => hud?.onCanvasPan());
Hooks.on("canvasReady", () => {
    hud?.activateCanvasListeners();
    hud?.close();
});

Hooks.once("ready", () => { registerSocket(); registerGmActions(); registerCraftTempHooks(); });

// --- Système de Points de Cartographie (MJ) ---
Hooks.on("getSceneControlButtons", (controls) => mapping?.getControls(controls));
Hooks.on("activateSceneControls", (controls) => mapping?.onActivateControls(controls));
Hooks.on("updateScene", (scene) => mapping?.onUpdateScene(scene));
Hooks.on("canvasReady", () => mapping?.destroy());

// --- Marqueurs de camp sur la scène (visibles par tous) ---
Hooks.on("canvasReady", () => renderCampOverlay());
Hooks.on("updateScene", (scene) => {
    if (scene?.id === canvas?.scene?.id) renderCampOverlay();
});

Hooks.on("updateCombat", (combat, change) => {
    onCombatRoundAdvance(combat, change);
    if (change && "round" in change) hud?.refreshIfOpen();
});
// Fin d'un Hex Encounter : purge des chips/états altérant les AG du Party.
Hooks.on("deleteCombat", (combat) => { onCombatEnd(combat); hud?.refreshIfOpen(); });
// Conditions des membres (Fatigued) : un item condition créé/supprimé sur un Personnage du Party.
const memberOfHudParty = (item) => (hud?.token?.actor?.members ?? []).some((m) => m?.id === item?.parent?.id);
Hooks.on("createItem", (item) => { if (item?.type === "condition" && memberOfHudParty(item)) hud?.refreshIfOpen(); });
Hooks.on("deleteItem", (item) => { if (item?.type === "condition" && memberOfHudParty(item)) hud?.refreshIfOpen(); });

// --- Rafraîchissement du Party HUD sur changement de données affichées ---
// Compteurs de ressources (GPC) : dégrise Cuisiner dès que les ingrédients suffisent.
Hooks.on("updateSetting", (setting) => {
    if (setting?.key === "global-progress-clocks.activeClocks") hud?.refreshIfOpen();
});
// Camps de la scène : met à jour grisages, ligne camp et compteur d'activités.
Hooks.on("updateScene", (scene, changes) => {
    if (scene?.id !== canvas?.scene?.id) return;
    if (changes?.flags && (MODULE_ID in changes.flags)) hud?.refreshIfOpen();
});
// Marqueurs d'effets de groupe (flag sur l'acteur Party) : met à jour les chips.
Hooks.on("updateActor", (actor, changes) => {
    if (hud?.token?.actor?.id !== actor?.id) return;
    if (changes?.flags && (MODULE_ID in changes.flags)) hud?.refreshIfOpen();
});

Hooks.on("renderCombatTracker", (app, html) => markHexplorationTracker(app, html));

// --- Repères Forgotten Woods (Map Notes enrichies) ---
Hooks.on("renderNoteConfig", (app, html) => onRenderNoteConfig(app, html));
// PC modifiés sur la scène active → recalcule les latches de révélation (MJ).
Hooks.on("updateScene", (scene, changes) => {
    if (scene?.id !== canvas?.scene?.id) return;
    if (changes?.flags && (MODULE_ID in changes.flags)) refreshPinReveals(scene);
});
// Pin créé/édité : les PC peuvent déjà dépasser le seuil.
Hooks.on("createNote", (note) => { if (note?.parent?.id === canvas?.scene?.id) refreshPinReveals(note.parent); });
Hooks.on("updateNote", (note) => { if (note?.parent?.id === canvas?.scene?.id) refreshPinReveals(note.parent); });
// Révélation DYNAMIQUE (tous les clients) : quand un flag FW change (notamment le latch
// `revealed`), forcer le placeable à recalculer sa visibilité. Sans ça, le pin ne se met à
// jour qu'au déplacement de la Note ou en passant sur le calque Notes.
Hooks.on("updateNote", (note, changes) => {
    if (changes?.flags && (MODULE_ID in changes.flags)) note.object?._refreshVisibility?.();
});
