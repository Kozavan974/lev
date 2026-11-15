/** Réévaluation habituelle du moteur. */
export const INTERVALLE_EVALUATION_MS = 15_000

/** Réévaluation pendant l'attente d'une accalmie. */
export const INTERVALLE_EVALUATION_ACCALMIE_MS = 1_000

/** Secondes sans frappe ni souris avant d'afficher la notification. */
export const ACCALMIE_SECONDES = 4

/** Délai au bout duquel la notification s'affiche même sans accalmie. */
export const ACCALMIE_MAX_MS = 2 * 60 * 1000

/** La pastille « bientôt » précède l'échéance de ce délai. */
export const BIENTOT_AVANT_MS = 2 * 60 * 1000

/** Fenêtre dans laquelle un seul rappel, le plus prioritaire, s'affiche. */
export const FENETRE_PRIORITE_MS = 2 * 60 * 1000

/** En dessous de cette fréquence, en minutes, pas de pastille « bientôt ». */
export const BIENTOT_FREQUENCE_MIN_MINUTES = 30

/** Suspension des rappels après « Je le fais » sur un rappel « bouger ». */
export const PAUSE_BOUGER_MS = 5 * 60 * 1000

/** Inactivité, en secondes, qui compte comme une pause spontanée. */
export const PAUSE_SPONTANEE_SEC = 3 * 60

/** Durée d'affichage de la ligne qui signale une pause spontanée. */
export const LIGNE_PAUSE_SPONTANEE_MS = 30 * 60 * 1000

/** Déverrouillage au-delà duquel les compteurs repartent de zéro. */
export const SEUIL_DEVERROUILLAGE_MS = 3 * 60 * 1000

/** Effacement automatique d'une notification « yeux ». */
export const AFFICHAGE_NOTIFICATION_YEUX_MS = 20_000

/** Effacement de l'annonce de début de séquence. */
export const AFFICHAGE_DEBUT_SEQUENCE_MS = 8_000

/** Effacement automatique des autres notifications. */
export const AFFICHAGE_NOTIFICATION_AUTRE_MS = 60_000

/** Durée du message affiché après une réponse. */
export const MESSAGE_REPONSE_MS = 3_000

/** Report demandé par « Dans 5 min ». */
export const REPORT_CINQ_MIN_MS = 5 * 60 * 1000

/** Retard au-delà duquel un rappel à heure fixe est abandonné pour la journée. */
export const HEURE_FIXE_RETARD_MAX_MS = 10 * 60 * 1000

/** Reports consécutifs avant la question de rythme. */
export const REPORTS_AVANT_QUESTION_RYTHME = 3

/** Jours de silence de la question après « Garder ce rythme ». */
export const SILENCE_QUESTION_RYTHME_JOURS = 7

/** Durée exacte de ce silence, à partir de l'instant injecté. */
export const SILENCE_QUESTION_RYTHME_MS = SILENCE_QUESTION_RYTHME_JOURS * 24 * 60 * 60 * 1000

/** Sans réponse à la fin d'une pause, les séquences s'arrêtent après ce délai. */
export const FIN_PAUSE_SANS_REPONSE_MS = 15 * 60 * 1000

/** Au-delà de cette durée de travail, une invitation à se lever est proposée au milieu. */
export const SEQUENCE_INVITATION_BOUGER_MIN = 30
