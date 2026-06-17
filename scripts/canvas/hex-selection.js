/**
 * Sélection d'un hex sur le canvas, autonome (aucune dépendance aux Points
 * de Cartographie). Gère l'état "hex sélectionné", sa surbrillance, et notifie
 * les abonnés à chaque changement. Réutilisable pour de futures mécaniques.
 */
const HIGHLIGHT_LAYER = "forgotten-woods-hex-selection";
const HIGHLIGHT_COLOR = 0xff8c1a;

export class HexSelection {
    /** @type {{i: number, j: number}|null} */
    #selected = null;
    /** @type {boolean} */
    #visible = false;
    /** @type {((offset: {i: number, j: number}|null) => void)[]} */
    #listeners = [];

    /** @returns {{i: number, j: number}|null} */
    get() {
        return this.#selected;
    }

    /** @param {{i: number, j: number}} offset @returns {boolean} */
    has(offset) {
        return (
            !!this.#selected &&
            this.#selected.i === offset.i &&
            this.#selected.j === offset.j
        );
    }

    /** @param {{i: number, j: number}} offset */
    select(offset) {
        this.#selected = { i: offset.i, j: offset.j };
        this.#render();
        this.#notify();
    }

    clear() {
        this.#selected = null;
        this.#render();
        this.#notify();
    }

    /** @param {(offset: {i: number, j: number}|null) => void} cb */
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
        this.#selected = null;
        this.#listeners = [];
        const grid = globalThis.canvas?.interface?.grid;
        if (grid) grid.clearHighlightLayer(HIGHLIGHT_LAYER);
    }

    #notify() {
        for (const cb of this.#listeners) cb(this.#selected);
    }

    #render() {
        const grid = globalThis.canvas?.interface?.grid;
        if (!grid) return; // hors canvas (tests) : no-op.
        if (!grid.highlightLayers?.[HIGHLIGHT_LAYER]) {
            grid.addHighlightLayer(HIGHLIGHT_LAYER);
        }
        grid.clearHighlightLayer(HIGHLIGHT_LAYER);
        if (!this.#visible || !this.#selected) return;
        const { x, y } = globalThis.canvas.grid.getTopLeftPoint(this.#selected);
        grid.highlightPosition(HIGHLIGHT_LAYER, {
            x,
            y,
            color: HIGHLIGHT_COLOR,
            alpha: 0.35,
            border: HIGHLIGHT_COLOR
        });
    }
}
