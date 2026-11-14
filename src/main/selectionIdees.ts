import idees from '../content/idees.fr.json'
import { indiceSuivant } from './idees'

const dernieres = {
  debout: null as number | null,
  assis: null as number | null
}

export function texteIdee(assis: boolean, index: number | null): string | null {
  if (index === null) {
    return null
  }
  const liste = assis ? idees.assis : idees.debout
  return liste[index] ?? null
}

export function choisirIdee(assis: boolean, eviter: number | null): number {
  const liste = assis ? idees.assis : idees.debout
  const precedent = eviter ?? (assis ? dernieres.assis : dernieres.debout)
  const index = indiceSuivant(liste.length, precedent, Math.random)
  if (assis) {
    dernieres.assis = index
  } else {
    dernieres.debout = index
  }
  return index
}

export function retenirIdee(assis: boolean, index: number | null): void {
  if (index === null) {
    return
  }
  if (assis) {
    dernieres.assis = index
  } else {
    dernieres.debout = index
  }
}
