const t = (key) => game.i18n.localize(`FORGOTTEN_WOODS.craft.${key}`);

/** Réplique le sélecteur d'objet PF2E (zone de drop) : renvoie l'objet glissé ou null. */
export class CraftItemPicker {
    /** @returns {Promise<object|null>} un Item PF2E physique, ou null si annulé. */
    static pick() {
        return new Promise((resolve) => {
            let picked = null;
            const dlg = new foundry.applications.api.DialogV2({
                window: { title: t("pickTitle") },
                content: `<div class="fw-craft-drop" style="border:1px dashed #888;padding:1em;text-align:center;">${t("pickDrop")}</div><p class="fw-craft-chosen"></p>`,
                buttons: [
                    { action: "ok", label: t("pickConfirm"), default: true, callback: () => picked },
                    { action: "cancel", label: t("pickCancel"), callback: () => null }
                ],
                submit: (result) => resolve(result ?? null)
            });
            dlg.render(true).then(() => {
                const zone = dlg.element.querySelector(".fw-craft-drop");
                const chosen = dlg.element.querySelector(".fw-craft-chosen");
                zone.addEventListener("dragover", (e) => e.preventDefault());
                zone.addEventListener("drop", async (e) => {
                    e.preventDefault();
                    const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(e);
                    const item = data?.uuid ? await fromUuid(data.uuid) : null;
                    if (!item || !item.isOfType?.("physical")) {
                        ui.notifications.warn(t("notPhysical"));
                        return;
                    }
                    picked = item;
                    chosen.textContent = `${item.name} (niv. ${item.level})`;
                });
            });
        });
    }
}
