/** Durée du guide visuel sur le rappel « bouger ». */
export const PAUSE_GUIDEE_MS = 30_000

/** Part de l'anneau déjà parcourue, entre 0 et 1. */
export function progressionAnneau(ecouleMs: number): number {
  if (!Number.isFinite(ecouleMs) || ecouleMs <= 0) {
    return 0
  }
  if (ecouleMs >= PAUSE_GUIDEE_MS) {
    return 1
  }
  return ecouleMs / PAUSE_GUIDEE_MS
}
