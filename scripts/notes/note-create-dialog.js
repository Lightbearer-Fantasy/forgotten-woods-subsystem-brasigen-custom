// scripts/notes/note-create-dialog.js
// Sur une scène Hex, la création d'un repère passe par UN SEUL dialogue (Nom + bloc Forgotten
// Woods : Pin / Secret / Description), qui crée la Note directement.
//
// Pourquoi remplacer le flux natif : depuis Foundry V13, cliquer avec l'outil « note » ouvre un
// mini-dialogue (Nom), puis `_createPreview(..., {renderSheet:true})` ouvre EN PLUS la NoteConfig
// complète (« Créer un repère ») qui, seule, crée réellement la Note — soit deux fenêtres. On
// court-circuite ce flux sur les scènes Hex via un patch de `NotesLayer#_onClickLeft`.

import { isHexScene } from "../utils/scene.js";
import { defaultFwPin } from "./pin-reveal.js";

const MODULE_ID = "forgotten-woods-brasigen";
const t = (k) => game.i18n.localize(`FORGOTTEN_WOODS.notes.${k}`);

let dialogOpen = false; // anti-spam : un seul dialogue de création à la fois

/** Patch unique de NotesLayer#_onClickLeft : dialogue Forgotten Woods sur scène Hex (sinon natif). */
export function installNoteCreateOverride() {
    const NotesLayer = foundry.canvas?.layers?.NotesLayer;
    if (!NotesLayer || NotesLayer.prototype._fwCreatePatched) return;
    const orig = NotesLayer.prototype._onClickLeft;
    NotesLayer.prototype._onClickLeft = async function (event) {
        if (game.activeTool === "journal" && isHexScene(canvas?.scene)) {
            const origin = event.getLocalPosition(canvas.stage);
            const noteData = canvas.grid.getCenterPoint(origin);
            return openFwNoteCreateDialog(noteData);
        }
        return orig.call(this, event);
    };
    NotesLayer.prototype._fwCreatePatched = true;
}

/** Dialogue unique : saisit Nom + champs Forgotten Woods et crée la Note directement. */
async function openFwNoteCreateDialog(noteData) {
    if (dialogOpen) return;
    dialogOpen = true;
    try {
        const { DialogV2 } = foundry.applications.api;
        const fwPin = defaultFwPin(true); // scène Hex
        const content = `
            <div class="form-group">
                <label>${t("name")}</label>
                <div class="form-fields"><input type="text" name="name" autofocus placeholder="${t("untitled")}"></div>
            </div>
            <fieldset class="fw-note-section">
                <legend>${t("legend")}</legend>
                <div class="form-group">
                    <label>${t("fwPin")}</label>
                    <input type="checkbox" name="fwPin" ${fwPin ? "checked" : ""}>
                </div>
                <div class="form-group">
                    <label>${t("secret")}</label>
                    <input type="checkbox" name="secret">
                </div>
                <div class="form-group stacked">
                    <label>${t("description")}</label>
                    <textarea name="description" rows="4"></textarea>
                </div>
            </fieldset>`;

        const result = await DialogV2.prompt({
            window: { title: t("createTitle") },
            position: { width: 400 },
            content,
            rejectClose: false,
            ok: {
                label: t("create"),
                icon: "fa-solid fa-location-dot",
                callback: (event, button) => new foundry.applications.ux.FormDataExtended(button.form).object
            }
        });
        if (!result) return;

        const text = String(result.name ?? "").trim() || t("untitled");
        await canvas.scene.createEmbeddedDocuments("Note", [{
            ...noteData,
            text,
            entryId: null,
            flags: {
                [MODULE_ID]: {
                    fwPin: !!result.fwPin,
                    secret: !!result.secret,
                    description: String(result.description ?? "")
                }
            }
        }]);
    } finally {
        dialogOpen = false;
    }
}
