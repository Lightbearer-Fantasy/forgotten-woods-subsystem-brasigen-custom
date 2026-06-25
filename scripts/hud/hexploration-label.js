// scripts/hud/hexploration-label.js
// Indique visuellement aux Joueurs qu'un Combat sur Scene hex est un Round
// d'Hexploration (et non un combat tactique).

import { isHexScene } from "../utils/scene.js";

/**
 * Ajoute un label « Hexploration » en tête du tracker si le combat courant est
 * sur une Scene à grille hex.
 * @param {Application} _app
 * @param {HTMLElement|JQuery} html  racine rendue du tracker
 */
export function markHexplorationTracker(_app, html) {
    const combat = game.combats?.active ?? null;
    if (!combat || !isHexScene(combat.scene)) return;
    const root = html instanceof HTMLElement ? html : html?.[0];
    if (!root || root.querySelector(".fw-hexploration-label")) return;
    const banner = document.createElement("div");
    banner.className = "fw-hexploration-label";
    banner.textContent = game.i18n.localize("FORGOTTEN_WOODS.round.hexplorationLabel");
    root.prepend(banner);
}
