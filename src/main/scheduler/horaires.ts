import type { Jours, Reglages } from '../modeles'

/** Vrai quand l'instant tombe dans la plage, y compris lorsqu'elle passe minuit. */
export function estDansHoraires(instant: Date, horaires: Reglages['horaires']): boolean {
  const minutes = instant.getHours() * 60 + instant.getMinutes()
  const debut = lireMinutes(horaires.debut)
  const fin = lireMinutes(horaires.fin)
  if (debut === null || fin === null) {
    return false
  }
  if (fin > debut) {
    return jourTravaille(instant.getDay(), horaires.jours) && minutes >= debut && minutes < fin
  }
  if (minutes >= debut) {
    return jourTravaille(instant.getDay(), horaires.jours)
  }
  if (minutes < fin) {
    const hier = (instant.getDay() + 6) % 7
    return jourTravaille(hier, horaires.jours)
  }
  return false
}

function jourTravaille(jour: number, jours: Jours): boolean {
  if (jours === 'jour') {
    return true
  }
  if (jour === 0) {
    return false
  }
  if (jours === 'samedi') {
    return jour <= 6
  }
  return jour <= 5
}

function lireMinutes(heure: string): number | null {
  const parties = heure.split(':')
  if (parties.length !== 2) {
    return null
  }
  const heures = Number(parties[0])
  const minutes = Number(parties[1])
  if (!Number.isInteger(heures) || !Number.isInteger(minutes)) {
    return null
  }
  if (heures < 0 || heures > 23 || minutes < 0 || minutes > 59) {
    return null
  }
  return heures * 60 + minutes
}
