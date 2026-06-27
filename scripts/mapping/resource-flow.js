import { requestResource } from "./gm-actions.js";

/**
 * Après un jet de Chasser/Récupérer, propose au MJ d'ajouter les ressources.
 * IO — validé en jeu.
 */
export class ResourceFlow {
    /**
     * @param {{resource:string, label:string}} activity
     * @param {string} skillLabel  libellé FR de la compétence utilisée
     * @param {string} outcome     clé d'outcome ("success"…)
     */
    static report(activity, skillLabel, outcome, bonus = 0) {
        if (!activity?.resource || !outcome) return;
        requestResource({
            resourceKey: activity.resource,
            activityLabel: activity.label,
            skillLabel,
            outcome,
            bonus
        });
    }
}
