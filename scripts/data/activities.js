// Image placeholder garantie présente dans Foundry core (image de token par défaut).
export const PLACEHOLDER_IMG = "icons/svg/mystery-man.svg";

/**
 * Clé de tri alphabétique : minuscule, en ignorant les préfixes
 * « se  » (devant « Se reposer ») et « s' » (devant « S'entraider »).
 * @param {string} label
 * @returns {string}
 */
export function activitySortKey(label) {
    const lower = label.toLowerCase();
    if (lower.startsWith("se ")) return lower.slice(3);
    if (lower.startsWith("s'")) return lower.slice(2);
    return lower;
}

// Activités de Groupe (5) — triées par activitySortKey.
// Ordre : Cartographier la zone, S'empresser, Monter le camp, Se reposer, Voyager.
export const GROUP_ACTIVITIES = [
    {
        id: "map-area",
        label: "Cartographier la zone",
        slug: null,
        img: "icons/tools/navigation/map-chart-tan.webp",
        traits: ["exploration", "concentrate"],
        description:
            "Vous prenez le temps de faire du repérage et de cartographier toutes les Hex adjacentes. Chaque aventurier doit effectuer un @Check[crafting], @Check[society], @Check[nature] ou @Check[survival] (au choix) contre le DC de la zone. Chaque fois qu'un Skill est utilisé plus de 2 fois, le DC pour ce Skill subit une pénalité sans type de -2 cumulable. En fonction de l'Aspect, certains jets peuvent voir leur DC diminué, comme Nature dans l'Aspect Sauvage ou Society dans l'Aspect du Donjon, ou augmenté, comme Nature dans l'Aspect de Cendres. Le nombre de PC sur une Hex détermine la qualité de la carte effectuée. Pour chaque Activité de Groupe que vous dépensez au-delà de 1 pour Cartographier la zone, vous pouvez soit augmenter le rayon de repérage de 1 Hex (une fois) ou gagner automatiquement 1 PC (cumulable). Vous ne pouvez pas découvrir une nouvelle Ancre à distance si vous n'entendez pas le Chant." +
            "<ul>" +
            "<li><strong>1 PC :</strong> Vous ne parvenez pas à réaliser une carte satisfaisante des environs. Si vous avez une carte partielle de la zone, vous parvenez tout de même à révéler la position de ses points de repères si elles se trouvent sur ces Hex.</li>" +
            "<li><strong>2 PC :</strong> Vous repérez approximativement ce qui se trouve sur les Hex alentours. Le DC de toute activité ayant lieu sur ces Hex est réduit de 2, et vous révélez toutes les créatures non cachées et tous les points d'intérêt non secrets sur ces Hex. Vous pouvez Monter le camp sur ces Hex.</li>" +
            "<li><strong>3 PC :</strong> Comme pour 2 PC, mais l'aventurier ayant le plus de Perception lance un jet caché contre le DC de la zone pour vérifier si des créatures cachées ou des points d'intérêt secrets sont révélés sur ces Hex. Si vous avez connaissance de créatures cachées ou de points d'intérêt secrets sur ces Hex, vous les trouvez.</li>" +
            "<li><strong>4+ PC :</strong> Comme pour 3 PC, mais vous trouvez automatiquement toutes les créatures cachées et tous les points d'intérêt secrets sur ces Hex. Vous apprenez également, en étudiant la Boussole ou en écoutant le Chant, si une Ancre se trouve sur l'une de ces Hex.</li>" +
            "</ul>",
        outcomes: {
            criticalSuccess: "Les Hex cartographiés gagnent 2 Points de Cartographie.",
            success: "Les Hex cartographiés gagnent 1 Point de Cartographie.",
            criticalFailure: "Les Hex cartographiés perdent 1 Point de Cartographie."
        }
    },
    {
        id: "hustle",
        label: "S'empresser",
        slug: null,
        img: "systems/pf2e/icons/spells/longstrider.webp",
        traits: ["exploration", "move"],
        description:
            "Vous cessez d'avancer prudemment et accélérez la marche. Vous devez utiliser toutes vos Activités de Groupe pour Vous empresser. Quand vous le faites, chaque Activité de Groupe vous permet de Voyager deux fois. Typiquement, vous parcourez le double de la distance habituelle. À l'issue, vous devenez Fatigued et perdez deux Activités de Groupe jusqu'à ce que vous vous reposiez."
    },
    {
        id: "make-camp",
        label: "Monter le camp",
        slug: null,
        img: "icons/environment/settlement/hut.webp",
        traits: ["exploration"],
        description:
            "Vous ne pouvez faire cela que dans un Hex ayant au moins 2 PC. Tant que vous restez sur ce Hex, votre groupe peut effectuer deux Activités Individuelles supplémentaires."
    },
    {
        id: "rest",
        label: "Se reposer",
        slug: null,
        img: "icons/magic/life/heart-hand-gold-green-light.webp",
        traits: ["exploration"],
        description:
            "Nécessite un camp. Lorsque vous vous Reposez, vous ne pouvez pas vous déplacer de la journée. Récupérez le triple du montant normal de points de vie récupéré lors d'un repos long. Si vous êtes Fatigued, lors des prochaines préparations quotidiennes, vous perdez la condition et vous récupérez deux Activités de Groupe."
    },
    {
        id: "travel",
        label: "Voyager",
        slug: null,
        img: "systems/pf2e/icons/spells/synchronise-steps.webp",
        traits: ["exploration", "move"],
        description:
            "Vous progressez en direction d'un Hex adjacent. Dans la forêt du Bois de l'Oubli, chaque Hex est traversé en une activité de Voyage. Traverser un Hex avec du terrain difficile, comme la montagne ou les marécages, nécessite 2 activités de Voyage, et au contraire sur une route bitumée ou un espace dégagé, vous pouvez traverser 2 Hex en 1 activité de Voyage. En arrivant sur un Hex, vous révélez si le Hex abrite une créature non caché ou un point d'intérêt non secret, et vous identifiez automatiquement les terrains des Hex adjacents. Vous révélez automatiquement une Ancre en arrivant sur sa Hex si avez une Boussole de Courant ou si vous entendez le Chant. De la même manière, la Boussole de Courant indique automatiquement si une Ancre se trouve sur une Hex adjacente."
    }
];

// Activités Individuelles (12) — triées par activitySortKey.
// Ordre : Chasser et cueillir, Cuisiner, Défendre, Échapper aux regards, Enquêter,
//         Fabriquer, Fouiller, Partir en reconnaissance, Récupérer des matériaux,
//         Réparer, S'entraider, Soigner les blessures.
export const INDIVIDUAL_ACTIVITIES = [
    {
        id: "hunt-and-gather",
        label: "Chasser et cueillir",
        slug: null,
        img: "icons/environment/wilderness/tree-spruce.webp",
        traits: ["exploration"],
        description:
            "Vous essayez de trouver des ingrédients frais sur le trajet. Effectuez un @Check[nature] ou @Check[survival] contre le DC de la zone.",
        outcomes: {
            criticalSuccess: "Vous trouvez 3 ingrédients frais.",
            success: "Vous trouvez 2 ingrédients frais."
        },
        check: { skills: ["nature", "survival"], vsHexDC: true },
        resource: "ingredients"
    },
    {
        id: "cook",
        label: "Cuisiner",
        slug: null,
        img: "icons/tools/cooking/bowl-steaming-brown.webp",
        traits: ["exploration", "manipulate"],
        description:
            "Nécessite un camp. Vous cuisinez des ingrédients frais. Effectuez un @Check[crafting] ou @Check[cooking-lore] contre le DC de la zone (les ingrédients disponibles dépendent de la zone et influent sur la difficulté de la recette). En cas d'échec, vous économisez les ingrédients frais.",
        outcomes: {
            criticalSuccess: "Comme la Réussite, et vous gagnez un bonus sans type de +1 au prochain jet d'attaque, de sauvegarde ou de compétence que vous effectuez le lendemain.",
            success: "Vous gagnez une Activité de Groupe supplémentaire le lendemain."
        },
        check: { skills: ["crafting", "cooking-lore"], vsHexDC: true }
    },
    {
        id: "defend",
        label: "Défendre",
        slug: "defend",
        img: "systems/pf2e/icons/spells/inspire-defense.webp",
        traits: ["exploration"],
        description:
            "Vous commencez toute Rencontre avec le bouclier levé et votre réaction. La nuit au camp, si une embuscade nocturne survient, vous montez la garde, vous empêchant vous et vos compagnons d'être surpris."
    },
    {
        id: "avoid-notice",
        label: "Échapper aux regards",
        slug: "avoid-notice",
        img: "icons/magic/perception/shadow-stealth-eyes-purple.webp",
        traits: ["exploration"],
        description:
            "Vous et les membres de votre groupe qui le souhaitent peuvent effectuer leur jet d'initiative avec leur Stealth."
    },
    {
        id: "investigate",
        label: "Enquêter",
        slug: "investigate",
        img: "systems/pf2e/icons/spells/brain-drain.webp",
        traits: ["exploration", "secret"],
        description:
            "Permet de @Action[recall-knowledge]{Recall Knowledge} deux fois, sur n'importe quel élément d'un Hex révélé. Par exemple les créatures présentes sur un Hex sont-elles hostiles ? Existe-t-il un lieu à proximité de ce Hex ayant davantage d'ingrédients frais que la moyenne ? Certains résultats du RK pourront finir documentés dans la Bibliothèque de la Guilde (comme l'obtention d'informations sur une créature)."
    },
    {
        id: "aid",
        label: "S'entraider",
        slug: null,
        img: "icons/skills/social/diplomacy-handshake.webp",
        traits: ["exploration"],
        description:
            "Choisissez deux alliés qui n'utilisent ou ne bénéficient pas de cette activité. La première fois dans la journée que chacun de ces alliés effectue un jet de compétence, vous pouvez @Action[aid]{Aid} comme si vous aviez préparé la réaction correspondante."
    },
    {
        id: "craft",
        label: "Fabriquer",
        slug: "craft",
        img: "icons/tools/hand/hammer-cobbler-steel.webp",
        traits: ["exploration", "manipulate"],
        description:
            "Nécessite un camp. Vous utilisez des matériaux récupérés au cours de votre exploration pour @Action[craft]{Fabriquer} un objet dont vous avez la recette de votre niveau ou moins."
    },
    {
        id: "search",
        label: "Fouiller",
        slug: "search",
        img: "icons/tools/navigation/compass-brass-blue-red.webp",
        traits: ["exploration", "concentrate"],
        description:
            "Choisissez un Hex adjacent. Vous faites un @Check[perception], @Check[stealth] ou @Check[survival] contre le DC de la zone pour essayer de glaner des informations dans la zone. Le Hex gagne des PC comme pour Cartographier la zone. Si vous avez la Boussole de Courant, vous apprenez si une Ancre se trouve sur le Hex ou à proximité du Hex.",
        outcomes: {
            criticalSuccess: "Le Hex gagne 2 PC.",
            success: "Le Hex gagne 1 PC."
        },
        check: { skills: ["perception", "stealth", "survival"], vsHexDC: true }
    },
    {
        id: "scout",
        label: "Partir en reconnaissance",
        slug: "scout",
        img: "icons/tools/navigation/spyglass-telescope-brass-blue.webp",
        traits: ["exploration", "concentrate"],
        description:
            "Vous patrouillez en tout temps dans les environs pour avoir un coup d'avance. Vous déterminez si des créatures hostiles, cachées ou non, sont présentes sur une Hex adjacente. Vous et vos compagnons gagnez un bonus de circonstance de +1 à tous vos jets d'initiative."
    },
    {
        id: "gather-materials",
        label: "Récupérer des matériaux",
        slug: null,
        img: "icons/environment/settlement/building-rubble.webp",
        traits: ["exploration"],
        description:
            "Vous essayez de mettre la main sur des matériaux de fabrication sur le trajet. Effectuez un jet de compétence contre le DC de la zone, en fonction des matériaux présents dans la zone. Par exemple dans une forêt, ce serait un jet de Nature. Certaines zones permettent d'autres compétences à l'utilisation (Society dans l'Aspect Donjon par exemple, ou Arcane dans une zone avec une magie particulièrement puissante).",
        outcomes: {
            criticalSuccess: "Vous trouvez 3 matériaux de fabrication.",
            success: "Vous trouvez 2 matériaux de fabrication.",
            failure: "Vous revenez bredouille."
        },
        check: { allSkills: true, vsHexDC: true },
        resource: "materials"
    },
    {
        id: "repair",
        label: "Réparer",
        slug: "repair",
        img: "icons/tools/smithing/anvil.webp",
        traits: ["exploration", "manipulate"],
        description:
            "Vous prenez le temps de @Action[repair]{Réparer} un équipement endommagé. Si vous avez un camp, vous pouvez réparer une fois supplémentaire."
    },
    {
        id: "treat-wounds",
        label: "Soigner les blessures",
        slug: "treat-wounds",
        img: "icons/magic/life/cross-embers-glow-yellow-purple.webp",
        traits: ["exploration", "healing", "manipulate"],
        description:
            "Vous pouvez @Action[treat-wounds]{Treat Wounds} chaque aventurier. Comme d'habitude, vous lancez un jet distinct pour chaque aventurier. Si vous avez Ward Medic, vous pouvez choisir de lancer un seul jet et appliquer le résultat à tous les aventuriers. Si vous avez Continuous Recovery, vous pouvez Treat Wounds deux fois chaque aventurier."
    }
];
