import type { Reglages } from '../modeles'

/** Rappels affichés avant la première astuce. */
export const SILENCE_ASTUCES = 2

/** Un rappel sur quatre porte une astuce, une fois le silence passé. */
export const INTERVALLE_ASTUCES = 4

export interface SuiviAstuces {
  afficherAstuces: boolean
  astucesVues: readonly string[]
  notificationsAffichees: number
}

export interface DecisionAstuce {
  suivi: SuiviAstuces
  identifiant: string | null
}

export function suiviDe(reglages: Reglages): SuiviAstuces {
  return {
    afficherAstuces: reglages.options.afficherAstuces,
    astucesVues: reglages.astucesVues,
    notificationsAffichees: reglages.notificationsAffichees
  }
}

export function avecSuivi(reglages: Reglages, suivi: SuiviAstuces): Reglages {
  return {
    ...reglages,
    astucesVues: [...suivi.astucesVues],
    notificationsAffichees: suivi.notificationsAffichees,
    options: { ...reglages.options, afficherAstuces: suivi.afficherAstuces }
  }
}

/**
 * Compte un rappel affiché et choisit l'astuce à glisser en pied de carte.
 * Les deux premiers n'en ont pas. Ensuite, le 6e, le 10e, puis de quatre en quatre,
 * tant qu'il reste une astuce non vue. La case décochée laisse le compteur avancer.
 */
export function noterNotificationRappel(
  suivi: SuiviAstuces,
  identifiants: readonly string[]
): DecisionAstuce {
  const notificationsAffichees = suivi.notificationsAffichees + 1
  const base: SuiviAstuces = {
    afficherAstuces: suivi.afficherAstuces,
    astucesVues: suivi.astucesVues,
    notificationsAffichees
  }
  if (!suivi.afficherAstuces || notificationsAffichees <= SILENCE_ASTUCES) {
    return { suivi: base, identifiant: null }
  }
  const rang = notificationsAffichees - SILENCE_ASTUCES
  if (rang % INTERVALLE_ASTUCES !== 0) {
    return { suivi: base, identifiant: null }
  }
  const identifiant = identifiants.find((id) => !suivi.astucesVues.includes(id)) ?? null
  if (identifiant === null) {
    return { suivi: base, identifiant: null }
  }
  return {
    suivi: { ...base, astucesVues: [...suivi.astucesVues, identifiant] },
    identifiant
  }
}

export function integrerAstuce(
  reglages: Reglages,
  identifiants: readonly string[]
): { reglages: Reglages; identifiant: string | null } {
  const decision = noterNotificationRappel(suiviDe(reglages), identifiants)
  return { reglages: avecSuivi(reglages, decision.suivi), identifiant: decision.identifiant }
}
