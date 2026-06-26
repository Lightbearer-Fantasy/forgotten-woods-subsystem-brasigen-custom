// scripts/mapping/aspect-scene-config.js
// Injecte un bloc « Forgotten Woods » en tête de l'onglet World Explorer de la
// config de Scène, avec un <select> « Aspect de la Scène ». Le champ porte
// name="flags.<module>.mappingAspect" → le submit natif de SceneConfig le
// persiste (même mécanisme que World Explorer et que note-config.js).
// Valeur vide = Aucun ; aspectOf() la relit comme null.

import { isHexScene } from "../utils/scene.js";
import { aspectOf } from "./aspect-store.js";
import { aspectOptions } from "../data/aspects.js";

const MODULE_ID = "forgotten-woods-brasigen";

/** Hook renderSceneConfig : ajoute le bloc Aspect une seule fois. */
export function onRenderSceneConfig(app, html) {
    if (!game.user.isGM) return;
    const root = html instanceof HTMLElement ? html : html?.[0];
    if (!root) return;
    const scene = app.document;
    if (!isHexScene(scene)) return;
    const tab = root.querySelector('[data-tab="worldExplorer"]');
    if (!tab || tab.querySelector(".fw-aspect-setting")) return;

    const t = (k) => game.i18n.localize(`FORGOTTEN_WOODS.mapping.${k}`);
    const current = aspectOf(scene) ?? "";
    const opts = aspectOptions().map(({ value, labelKey }) => {
        const selected = value === current ? " selected" : "";
        return `<option value="${value}"${selected}>${game.i18n.localize(labelKey)}</option>`;
    }).join("");

    const section = document.createElement("fieldset");
    section.className = "fw-aspect-setting";
    section.innerHTML = `
        <legend>Forgotten Woods</legend>
        <div class="form-group">
            <label>${t("setAspectPrompt.title")}</label>
            <div class="form-fields">
                <select name="flags.${MODULE_ID}.mappingAspect">${opts}</select>
            </div>
            <p class="hint">${t("setAspectPrompt.label")}</p>
        </div>
    `;
    tab.prepend(section);
    app.setPosition?.({ height: "auto" });
}
