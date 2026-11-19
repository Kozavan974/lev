/** Vrai pendant l'appel : la fin est encore à 0 et le début a été inscrit. */
export function microOccupe(debut: bigint, fin: bigint): boolean {
  return fin === 0n && debut > 0n
}

/** Plein écran, présentation ou microphone. */
export function sessionOccupee(pleinEcran: boolean, micro: boolean): boolean {
  return pleinEcran || micro
}

/** La case décochée ne retient rien. Cochée, l'occupation suffit. */
export function retenirSiOccupe(option: boolean, occupe: boolean): boolean {
  return option && occupe
}
