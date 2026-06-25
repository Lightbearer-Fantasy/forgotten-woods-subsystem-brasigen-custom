// scripts/notes/note-create-dialog.js
// Sur une scène Hex, la création d'un repère passe par UN SEUL dialogue qui crée la Note
// directement, avec tout le nécessaire : Nom + Icône + Étiquette + bloc Forgotten Woods
// (Pin / Secret / Description). Évite les deux clics droits d'édition après création.
//
// Pourquoi remplacer le flux natif : depuis Foundry V13, cliquer avec l'outil « note » ouvre un
// mini-dialogue (Nom), puis `_createPreview(..., {renderSheet:true})` ouvre EN PLUS la NoteConfig
// complète — soit deux fenêtres. On court-circuite ce flux sur les scènes Hex via un patch de
// `NotesLayer#_onClickLeft`.

import { isHexScene } from "../utils/scene.js";
import { defaultFwPin } from "./pin-reveal.js";

const MODULE_ID = "forgotten-woods-brasigen";
const t = (k) => game.i18n.localize(`FORGOTTEN_WOODS.notes.${k}`);
const DEFAULT_ICON = "icons/svg/book.svg";

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

const esc = (s) => foundry.utils.escapeHTML?.(String(s ?? "")) ?? String(s ?? "");

/** Construit des <option> ; `choices` = { value: label }. */
function options(choices, selected, blankLabel) {
    const out = blankLabel !== undefined ? [`<option value="">${esc(blankLabel)}</option>`] : [];
    for (const [value, label] of Object.entries(choices ?? {})) {
        const sel = String(value) === String(selected) ? " selected" : "";
        out.push(`<option value="${esc(value)}"${sel}>${esc(label)}</option>`);
    }
    return out.join("");
}

/** Icônes de note préconfigurées (CONFIG) sous forme { src: label }. */
function noteIconChoices() {
    const icons = CONFIG.JournalEntry?.noteIcons ?? {};
    return Object.entries(icons)
        .sort(([a], [b]) => a.localeCompare(b, game.i18n.lang))
        .reduce((obj, [label, src]) => { obj[src] = label; return obj; }, {});
}

/** Points d'ancrage du texte localisés sous forme { value: label }. */
function textAnchorChoices() {
    return Object.entries(CONST.TEXT_ANCHOR_POINTS).reduce((obj, [key, value]) => {
        obj[value] = game.i18n.localize(`JOURNAL.Anchor${key.titleCase()}`);
        return obj;
    }, {});
}

function fontChoices() {
    return foundry.applications?.settings?.menus?.FontConfig?.getAvailableFontChoices?.() ?? {};
}

/** Dialogue unique : Nom + Icône + Étiquette + champs Forgotten Woods → crée la Note directement. */
async function openFwNoteCreateDialog(noteData) {
    if (dialogOpen) return;
    dialogOpen = true;
    try {
        const { DialogV2 } = foundry.applications.api;
        const fwPin = defaultFwPin(true); // scène Hex
        const anchorDefault = CONST.TEXT_ANCHOR_POINTS.BOTTOM;

        const content = `
            <div class="form-group">
                <label>${t("name")}</label>
                <div class="form-fields"><input type="text" name="name" autofocus placeholder="${esc(t("untitled"))}"></div>
            </div>

            <fieldset>
                <legend>${game.i18n.localize("NOTE.SECTIONS.ICON")}</legend>
                <div class="form-group">
                    <label>${game.i18n.localize("NOTE.FIELDS.texture.src.label")}</label>
                    <div class="form-fields">
                        <select name="icon">${options(noteIconChoices(), DEFAULT_ICON, game.i18n.localize("NOTE.Custom"))}</select>
                    </div>
                </div>
                <div class="form-group" data-fw-icon-custom hidden>
                    <label>${game.i18n.localize("NOTE.CustomIcon")}</label>
                    <div class="form-fields"><input type="text" name="iconCustom" placeholder="path/to/icon.svg"></div>
                </div>
                <div class="form-group">
                    <label>${game.i18n.localize("NOTE.FIELDS.iconSize.label")}</label>
                    <div class="form-fields"><input type="number" name="iconSize" value="40" min="32" step="1"></div>
                </div>
                <div class="form-group">
                    <label>${game.i18n.localize("NOTE.FIELDS.texture.tint.label")}</label>
                    <div class="form-fields"><color-picker name="tint" value="#ffffff"></color-picker></div>
                </div>
            </fieldset>

            <fieldset>
                <legend>${game.i18n.localize("NOTE.SECTIONS.LABEL")}</legend>
                <div class="form-group">
                    <label>${game.i18n.localize("NOTE.FIELDS.fontFamily.label")}</label>
                    <div class="form-fields">
                        <select name="fontFamily">${options(fontChoices(), "", game.i18n.localize("COMMON.Default"))}</select>
                    </div>
                </div>
                <div class="form-group">
                    <label>${game.i18n.localize("NOTE.FIELDS.fontSize.label")}</label>
                    <div class="form-fields"><input type="number" name="fontSize" value="32" min="8" max="128" step="1"></div>
                </div>
                <div class="form-group">
                    <label>${game.i18n.localize("NOTE.FIELDS.textColor.label")}</label>
                    <div class="form-fields"><color-picker name="textColor" value="#ffffff"></color-picker></div>
                </div>
                <div class="form-group">
                    <label>${game.i18n.localize("NOTE.FIELDS.textAnchor.label")}</label>
                    <div class="form-fields">
                        <select name="textAnchor">${options(textAnchorChoices(), anchorDefault)}</select>
                    </div>
                </div>
            </fieldset>

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
            position: { width: 460 },
            content,
            rejectClose: false,
            // Affiche le champ « icône personnalisée » seulement quand l'option Personnalisé est choisie.
            render: (event, dialog) => {
                const root = dialog.element;
                const sel = root.querySelector('select[name="icon"]');
                const custom = root.querySelector("[data-fw-icon-custom]");
                const toggle = () => { custom.hidden = sel.value !== ""; };
                sel.addEventListener("change", toggle);
                toggle();
            },
            ok: {
                label: t("create"),
                icon: "fa-solid fa-location-dot",
                callback: (event, button) => new foundry.applications.ux.FormDataExtended(button.form).object
            }
        });
        if (!result) return;

        await canvas.scene.createEmbeddedDocuments("Note", [buildNoteData(noteData, result)]);
    } finally {
        dialogOpen = false;
    }
}

/** Traduit les champs du formulaire en données de Note. */
function buildNoteData(noteData, result) {
    const text = String(result.name ?? "").trim() || t("untitled");
    const src = (result.icon || result.iconCustom || "").trim() || DEFAULT_ICON;
    const iconSize = Math.max(32, Math.round(Number(result.iconSize) || 40));
    const fontSize = Math.min(128, Math.max(8, Math.round(Number(result.fontSize) || 32)));
    const ta = Number(result.textAnchor);
    const textAnchor = Number.isFinite(ta) ? ta : CONST.TEXT_ANCHOR_POINTS.BOTTOM;

    const data = {
        ...noteData,
        text,
        entryId: null,
        texture: { src, tint: result.tint || "#ffffff" },
        iconSize,
        fontSize,
        textColor: result.textColor || "#ffffff",
        textAnchor,
        flags: {
            [MODULE_ID]: {
                fwPin: !!result.fwPin,
                secret: !!result.secret,
                description: String(result.description ?? "")
            }
        }
    };
    // fontFamily vide → on laisse la police par défaut (on n'écrit pas le champ).
    if (result.fontFamily) data.fontFamily = result.fontFamily;
    return data;
}
