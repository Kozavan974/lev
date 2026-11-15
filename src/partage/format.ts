import type { Repetition } from './modeles'

/** « 08:05 » devient « 8h05 ». */
export function formaterHeure(heure: string): string {
  const [heures, minutes] = heure.split(':')
  return `${Number(heures)}h${minutes ?? '00'}`
}

export function formaterInstant(instant: Date): string {
  const minutes = String(instant.getMinutes()).padStart(2, '0')
  return `${instant.getHours()}h${minutes}`
}

/** Date locale « AAAA-MM-JJ », celle qu'enregistre un rappel à heure fixe. */
export function jourLocal(instant: Date): string {
  const mois = String(instant.getMonth() + 1).padStart(2, '0')
  const jour = String(instant.getDate()).padStart(2, '0')
  return `${instant.getFullYear()}-${mois}-${jour}`
}

/** « une » et « jour » tombent tous les jours. « semaine » du lundi au vendredi. */
export function jourDeRepetition(repetition: Repetition, instant: Date): boolean {
  if (repetition !== 'semaine') {
    return true
  }
  const jour = instant.getDay()
  return jour >= 1 && jour <= 5
}

export function remplir(modele: string, valeurs: Record<string, string>): string {
  return modele.replace(/\{([a-zA-Z]+)\}/g, (tout, cle: string) => {
    const valeur = valeurs[cle]
    return valeur === undefined ? tout : valeur
  })
}
