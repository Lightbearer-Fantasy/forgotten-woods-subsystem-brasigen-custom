// Pop-up lecture seule affichant le nom et la description d'un pin révélé.
// Pas de JournalEntry : pur affichage du label + flag description.

/** Ouvre la pop-up d'un repère. Description vide → message « aucune description ». */
export function openPinPopup({ name, description } = {}) {
    const esc = (s) => foundry.utils.escapeHTML?.(String(s ?? "")) ?? String(s ?? "");
    const title = (name ?? "").trim() || game.i18n.localize("FORGOTTEN_WOODS.notes.untitled");
    const body = (description ?? "").trim();
    const inner = body
        ? `<p style="white-space:pre-wrap">${esc(body)}</p>`
        : `<p><em>${game.i18n.localize("FORGOTTEN_WOODS.notes.noDescription")}</em></p>`;

    return foundry.applications.api.DialogV2.prompt({
        window: { title: esc(title) },
        content: `<div class="fw-pin-popup">${inner}</div>`,
        ok: { label: game.i18n.localize("FORGOTTEN_WOODS.notes.close") },
        rejectClose: false
    });
}
