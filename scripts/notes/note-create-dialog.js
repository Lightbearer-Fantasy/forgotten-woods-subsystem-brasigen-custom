// scripts/notes/note-create-dialog.js
// Le mini-dialogue natif « Créer une note » (NoteDocument.createDialog → DialogV2) n'expose
// que Nom / Dossier / Journal. On y injecte le bloc Forgotten Woods (Pin / Secret / Description)
// pour que le MJ règle tout à la création, et on dédoublonne le dialogue (anti-spam : un seul
// dialogue de création ouvert à la fois).
//
// Persistance : le callback natif ne recopie pas nos champs dans le document → on garde les
// valeurs saisies (`pending`) et on les applique dans le hook `preCreateNote` via updateSource
// (écriture atomique, pas de second update).

import { isHexScene } from "../utils/scene.js";
import { defaultFwPin } from "./pin-reveal.js";

const MODULE_ID = "forgotten-woods-brasigen";
const t = (k) => game.i18n.localize(`FORGOTTEN_WOODS.notes.${k}`);

let pending = null; // { fwPin, secret, description } saisis dans le dialogue en cours
let openDialog = null; // dialogue « Créer une note » actuellement ouvert (anti-spam)

/**
 * Vrai si l'élément rendu est le dialogue natif de création d'une Note.
 * NB : DialogV2 injecte le contenu via innerHTML DANS son propre <form>. Le <form id="document-create">
 * du gabarit, imbriqué, est supprimé par l'analyseur HTML (formulaires imbriqués interdits) ; seuls
 * ses champs survivent. On détecte donc par la combinaison de champs (nom + case « journal »),
 * pas par le formulaire interne.
 */
function isNoteCreateDialog(element) {
    return !!(element?.querySelector?.('input[name="journal"]')
        && element?.querySelector?.('input[name="name"]'));
}

/** Hook renderDialogV2 : dédoublonne + injecte le bloc Forgotten Woods. */
export function onRenderNoteCreateDialog(dialog, element) {
    const root = element instanceof HTMLElement ? element : element?.[0];
    if (!isNoteCreateDialog(root)) return;

    // Anti-spam : si un dialogue de création est déjà ouvert, ramener celui-là et fermer le nouveau.
    if (openDialog && openDialog.rendered && openDialog !== dialog) {
        openDialog.bringToFront();
        dialog.close();
        return;
    }
    openDialog = dialog;

    // Cible d'injection : le conteneur du contenu (le <form id="document-create"> a été aplati).
    const container = root.querySelector(".dialog-content") ?? root.querySelector("form.dialog-form") ?? root;
    if (!container || container.querySelector(".fw-note-section")) return;

    const fwPin = defaultFwPin(isHexScene(canvas?.scene));
    pending = { fwPin, secret: false, description: "" };

    const section = document.createElement("fieldset");
    section.className = "fw-note-section";
    section.innerHTML = `
        <legend>${t("legend")}</legend>
        <div class="form-group">
            <label>${t("fwPin")}</label>
            <input type="checkbox" name="fw-fwPin" ${fwPin ? "checked" : ""}>
        </div>
        <div class="form-group">
            <label>${t("secret")}</label>
            <input type="checkbox" name="fw-secret">
        </div>
        <div class="form-group stacked">
            <label>${t("description")}</label>
            <textarea name="fw-description" rows="4"></textarea>
        </div>
    `;
    container.append(section);
    dialog.setPosition?.({ height: "auto" });

    // Suivi en direct des valeurs (input couvre frappe clavier + cases).
    const fwPinEl = section.querySelector('[name="fw-fwPin"]');
    const secretEl = section.querySelector('[name="fw-secret"]');
    const descEl = section.querySelector('[name="fw-description"]');
    const sync = () => {
        pending = { fwPin: fwPinEl.checked, secret: secretEl.checked, description: descEl.value };
    };
    for (const el of [fwPinEl, secretEl, descEl]) el.addEventListener("input", sync);
}

/** Hook closeDialogV2 : libère le suivi ; annule les valeurs en attente si dialogue fermé sans créer. */
export function onCloseNoteCreateDialog(dialog) {
    if (dialog !== openDialog) return;
    openDialog = null;
    pending = null;
}

/** Hook preCreateNote : applique les champs Forgotten Woods saisis au dialogue de création. */
export function applyPendingFwCreate(note) {
    if (!pending) return;
    const p = pending;
    pending = null;
    note.updateSource({
        flags: { [MODULE_ID]: { fwPin: p.fwPin, secret: p.secret, description: p.description } }
    });
}
