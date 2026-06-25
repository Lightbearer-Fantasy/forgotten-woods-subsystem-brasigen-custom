// scripts/notes/note-config.js
// Injecte une section « Forgotten Woods » dans la fenêtre de config d'une Note
// native (hook renderNoteConfig). Les champs portent des name="flags.<module>.*"
// → le submit natif de la fiche les persiste sans handler custom.

import { isHexScene } from "../utils/scene.js";
import { defaultFwPin } from "./pin-reveal.js";

const MODULE_ID = "forgotten-woods-brasigen";
const t = (k) => game.i18n.localize(`FORGOTTEN_WOODS.notes.${k}`);

/** Lit un flag, avec valeur de repli si absent (undefined). */
function flagOr(note, key, fallback) {
    const v = note.getFlag(MODULE_ID, key);
    return v === undefined ? fallback : v;
}

/** Hook renderNoteConfig : ajoute la section custom une seule fois. */
export function onRenderNoteConfig(app, html) {
    const root = html instanceof HTMLElement ? html : html?.[0];
    if (!root || root.querySelector(".fw-note-section")) return;

    const note = app.document;
    const fwPin = flagOr(note, "fwPin", defaultFwPin(isHexScene(note.parent)));
    const secret = flagOr(note, "secret", false);
    const description = flagOr(note, "description", "");
    const esc = (s) => foundry.utils.escapeHTML?.(String(s)) ?? String(s);

    const section = document.createElement("fieldset");
    section.className = "fw-note-section";
    section.innerHTML = `
        <legend>${t("legend")}</legend>
        <div class="form-group">
            <label>${t("fwPin")}</label>
            <input type="checkbox" name="flags.${MODULE_ID}.fwPin" ${fwPin ? "checked" : ""}>
        </div>
        <div class="form-group">
            <label>${t("secret")}</label>
            <input type="checkbox" name="flags.${MODULE_ID}.secret" ${secret ? "checked" : ""}>
        </div>
        <div class="form-group stacked">
            <label>${t("description")}</label>
            <textarea name="flags.${MODULE_ID}.description" rows="4">${esc(description)}</textarea>
        </div>
    `;

    const footer = root.querySelector("footer") ?? root.querySelector("button[type=submit]")?.parentElement;
    if (footer) footer.before(section); else root.append(section);
    app.setPosition?.({ height: "auto" });
}
