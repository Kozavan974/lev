export const ARGUMENT_DEMARRAGE_AUTO = '--demarrage-auto'

export type ModeOuverture = 'accueil' | 'discret' | 'rappels'

export function estDemarrageAuto(argv: readonly string[]): boolean {
  return argv.includes(ARGUMENT_DEMARRAGE_AUTO)
}

/**
 * Premier lancement : toujours la bienvenue.
 * Démarrage Windows : zone de notification seule.
 * Lancement par la personne : « Mes rappels ».
 */
export function deciderOuverture(entree: {
  premierLancementFait: boolean
  demarrageAuto: boolean
}): ModeOuverture {
  if (!entree.premierLancementFait) {
    return 'accueil'
  }
  if (entree.demarrageAuto) {
    return 'discret'
  }
  return 'rappels'
}

/** Une relance pendant l'accueil laisse la bienvenue au premier plan. */
export function ecranApresRelance(premierLancementFait: boolean): 'accueil' | 'rappels' {
  return premierLancementFait ? 'rappels' : 'accueil'
}
