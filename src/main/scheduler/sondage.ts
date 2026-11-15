import { INTERVALLE_EVALUATION_MS } from './constantes'

/**
 * L'appel natif part à l'échéance, puis au plus une fois par réévaluation
 * habituelle tant que le rappel est retenu.
 */
export function sondageEchu(
  demande: boolean,
  dernierSondageMs: number | null,
  maintenantMs: number
): boolean {
  if (!demande) {
    return false
  }
  if (dernierSondageMs === null) {
    return true
  }
  return maintenantMs - dernierSondageMs >= INTERVALLE_EVALUATION_MS
}
