/**
 * Choisit un indice différent du précédent.
 * `alea` renvoie un nombre dans l'intervalle [0, 1).
 */
export function indiceSuivant(
  taille: number,
  precedent: number | null,
  alea: () => number
): number {
  if (taille <= 1) {
    return 0
  }
  const tirage = alea()
  const fraction = Number.isFinite(tirage) ? Math.min(Math.max(tirage, 0), 0.999999) : 0
  const precedentValide = precedent !== null && precedent >= 0 && precedent < taille
  if (!precedentValide) {
    return Math.min(taille - 1, Math.floor(fraction * taille))
  }
  const choix = Math.min(taille - 2, Math.floor(fraction * (taille - 1)))
  return choix >= precedent ? choix + 1 : choix
}
