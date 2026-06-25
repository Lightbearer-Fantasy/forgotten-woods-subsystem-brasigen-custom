// scripts/notes/pin-presets.js
// Presets de repère : pré-remplissent les champs VISUELS du dialogue de création
// (icône, taille, teinte, police, taille/couleur de texte, ancrage). N'affectent PAS
// le Nom, la Description, le toggle Secret ni le toggle Pin.
//
// Module PUR (aucune globale Foundry au niveau module) → testable en isolation, comme
// pin-reveal.js. `textAnchor` est la CHAÎNE "BOTTOM" ; le dialogue la résout via
// CONST.TEXT_ANCHOR_POINTS["BOTTOM"]. `fontFamily: ""` = police par défaut (option blanche).

export const PIN_PRESETS = [
    { id: "anchor",   label: "Ancre",           icon: "icons/svg/anchor.svg",   iconSize: 40, tint: "#680808", fontFamily: "", fontSize: 40, textColor: "#680808", textAnchor: "BOTTOM" },
    { id: "creature", label: "Créature",        icon: "icons/svg/pawprint.svg", iconSize: 40, tint: "#be8919", fontFamily: "", fontSize: 40, textColor: "#be8919", textAnchor: "BOTTOM" },
    { id: "poi",      label: "Point d'intérêt", icon: "icons/svg/tower.svg",    iconSize: 40, tint: "#ffffff", fontFamily: "", fontSize: 40, textColor: "#ffffff", textAnchor: "BOTTOM" }
];

/** Retourne le preset d'id donné, ou undefined. */
export function getPreset(id) {
    return PIN_PRESETS.find((p) => p.id === id);
}
