import { PartyActivitiesHUD } from "./hud/party-activities-hud.js";

const MODULE_ID = "forgotten-woods-brasigen";

let hud = null;

Hooks.once("init", () => {
    hud = new PartyActivitiesHUD();
    game.modules.get(MODULE_ID).api = { hud };
});

Hooks.once("setup", async () => {
    await foundry.applications.handlebars.loadTemplates({
        fwActivityRow: `modules/${MODULE_ID}/templates/partials/activity-row.hbs`
    });
});

Hooks.on("controlToken", (token, controlled) => hud?.onControlToken(token, controlled));
Hooks.on("updateToken", (doc, changes) => hud?.onUpdateToken(doc, changes));
Hooks.on("deleteToken", (doc) => hud?.onDeleteToken(doc));
Hooks.on("canvasPan", () => hud?.onCanvasPan());
Hooks.on("canvasReady", () => hud?.close());
