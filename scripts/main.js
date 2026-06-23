import { PartyActivitiesHUD } from "./hud/party-activities-hud.js";
import { MappingPointsController } from "./mapping/mapping-points-controller.js";
import { HexSelection } from "./canvas/hex-selection.js";
import { registerSocket } from "./mapping/map-lock.js";
import { registerResourceClocks } from "./mapping/gpc-bridge.js";
import { registerGmActions } from "./mapping/gm-actions.js";
import { renderCampOverlay } from "./canvas/camp-overlay.js";
import { registerCraftTempHooks } from "./mapping/craft-temp-card.js";

const MODULE_ID = "forgotten-woods-brasigen";

let hud = null;
let mapping = null;
let hexSelection = null;

Hooks.once("init", () => {
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
