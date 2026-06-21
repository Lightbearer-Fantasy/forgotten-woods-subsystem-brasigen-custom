import { PartyActivitiesHUD } from "./hud/party-activities-hud.js";
import { MappingPointsController } from "./mapping/mapping-points-controller.js";
import { HexSelection } from "./canvas/hex-selection.js";
import { registerSocket } from "./mapping/map-lock.js";
import { registerResourceClocks } from "./mapping/gpc-bridge.js";

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

Hooks.once("ready", () => registerSocket());

// --- Système de Points de Cartographie (MJ) ---
Hooks.on("getSceneControlButtons", (controls) => mapping?.getControls(controls));
Hooks.on("activateSceneControls", (controls) => mapping?.onActivateControls(controls));
Hooks.on("updateScene", (scene) => mapping?.onUpdateScene(scene));
Hooks.on("canvasReady", () => mapping?.destroy());
