/**
 * Sélection d'un ou plusieurs hex sur le canvas, autonome (aucune dépendance aux
 * Points de Cartographie ni aux DC). Gère l'état "hex sélectionnés", leur
 * surbrillance, et notifie les abonnés à chaque changement. Réutilisable.
 */
const HIGHLIGHT_LAYER = "forgotten-woods-hex-selection";
const HIGHLIGHT_COLOR = 0xff8c1a;

const keyOf = (offset) => `${offset.i},${offset.j}`;

export class HexSelection {
    /** @type {Map<string, {i: number, j: number}>} */
    #selected = new Map();
    /** @type {boolean} */
    #visible = false;
    /** @type {((offsets: {i: number, j: number}[]) => void)[]} */
    #listeners = [];

    /** @returns {{i: number, j: number}|null} Premier offset sélectionné, ou null. */
    get() {
        const first = this.#selected.values().next();
        return first.done ? null : first.value;
    }

    /** @returns {{i: number, j: number}[]} Copie de la collection sélectionnée. */
    getAll() {
        return [...this.#selected.values()];
    }

    /** @param {{i: number, j: number}} offset @returns {boolean} */
    has(offset) {
        return this.#selected.has(keyOf(offset));
    }

    /** Sélection mono : vide la collection puis ajoute un seul hex. */
    select(offset) {
        this.#selected = new Map([[keyOf(offset), { i: offset.i, j: offset.j }]]);
        this.#render();
        this.#notify();
    }

    /** Ajoute un hex à la collection (idempotent). */
    add(offset) {
        this.#selected.set(keyOf(offset), { i: offset.i, j: offset.j });
        this.#render();
        this.#notify();
    }

    /** Retire un hex de la collection. */
    remove(offset) {
        this.#selected.delete(keyOf(offset));
        this.#render();
        this.#notify();
    }

    /** Bascule l'appartenance d'un hex (multi-sélection). */
    toggle(offset) {
        if (this.#selected.has(keyOf(offset))) this.remove(offset);
        else this.add(offset);
    }

    /** Remplace toute la collection par les offsets fournis. */
    set(offsets) {
        this.#selected = new Map(offsets.map((o) => [keyOf(o), { i: o.i, j: o.j }]));
        this.#render();
        this.#notify();
    }

    clear() {
        this.#selected = new Map();
        this.#render();
        this.#notify();
    }

    /** @param {(offsets: {i: number, j: number}[]) => void} cb */
    onChange(cb) {
        this.#listeners.push(cb);
    }

    showHighlight() {
        this.#visible = true;
        this.#render();
    }

    hideHighlight() {
        this.#visible = false;
        this.#render();
    }

    destroy() {
        this.#visible = false;
        this.#selected = new Map();
        this.#listeners = [];
        const grid = globalThis.canvas?.interface?.grid;
        if (grid) grid.clearHighlightLayer(HIGHLIGHT_LAYER);
    }

    #notify() {
        const all = this.getAll();
        for (const cb of this.#listeners) cb(all);
    }

    #render() {
        const grid = globalThis.canvas?.interface?.grid;
        if (!grid) return; // hors canvas (tests) : no-op.
        if (!grid.highlightLayers?.[HIGHLIGHT_LAYER]) {
            grid.addHighlightLayer(HIGHLIGHT_LAYER);
        }
        grid.clearHighlightLayer(HIGHLIGHT_LAYER);
        if (!this.#visible) return;
        for (const offset of this.#selected.values()) {
            const { x, y } = globalThis.canvas.grid.getTopLeftPoint(offset);
            grid.highlightPosition(HIGHLIGHT_LAYER, {
                x,
                y,
                color: HIGHLIGHT_COLOR,
                alpha: 0.35,
                border: HIGHLIGHT_COLOR
            });
        }
    }
}
