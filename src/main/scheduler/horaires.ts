import type { Jours, Reglages } from '../modeles'

type Horaires = Reglages['horaires']

/** Vrai quand l'instant tombe dans la plage, y compris lorsqu'elle passe minuit. */
export function estDansHoraires(instant: Date, horaires: Horaires): boolean {
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

/** Début des horaires du prochain jour travaillé, strictement après aujourd'hui. */
export function finVeilleDemain(maintenant: Date, horaires: Horaires): Date {
  const debut = lireMinutes(horaires.debut)
  const heures = debut === null ? 8 : Math.floor(debut / 60)
  const minutes = debut === null ? 0 : debut % 60
  for (let delta = 1; delta <= 8; delta += 1) {
    const candidat = new Date(
      maintenant.getFullYear(),
      maintenant.getMonth(),
      maintenant.getDate() + delta,
      heures,
      minutes,
      0,
      0
    )
    if (estDansHoraires(candidat, horaires)) {
      return candidat
    }
  }
  return new Date(
    maintenant.getFullYear(),
    maintenant.getMonth(),
    maintenant.getDate() + 1,
    heures,
    minutes,
    0,
    0
  )
}

/** Prochain instant compté, ou l'instant lui-même s'il l'est déjà. */
export function prochaineOuverture(instant: Date, horaires: Horaires): Date {
  if (estDansHoraires(instant, horaires)) {
    return new Date(instant)
  }
  const debut = lireMinutes(horaires.debut)
  const heures = debut === null ? 0 : Math.floor(debut / 60)
  const minutes = debut === null ? 0 : debut % 60
  for (let delta = 0; delta <= 8; delta += 1) {
    const candidat = new Date(
      instant.getFullYear(),
      instant.getMonth(),
      instant.getDate() + delta,
      heures,
      minutes,
      0,
      0
    )
    if (candidat.getTime() < instant.getTime()) {
      continue
    }
    if (estDansHoraires(candidat, horaires)) {
      return candidat
    }
  }
  return new Date(instant)
}

/**
 * Fin de la plage en cours. À l'ouverture suivante, les compteurs repartent de zéro :
 * un reste qui ne tient pas dans la plage ne se reporte pas.
 */
export function projeterEcheance(
  depart: Date,
  restantMs: number,
  periodeMs: number,
  horaires: Horaires
): Date {
  let instant = new Date(depart)
  let reste = restantMs
  for (let securite = 0; securite < 14; securite += 1) {
    if (!estDansHoraires(instant, horaires)) {
      const ouverture = prochaineOuverture(instant, horaires)
      if (ouverture.getTime() <= instant.getTime()) {
        return instant
      }
      instant = ouverture
      reste = periodeMs
      continue
    }
    const fin = finPlageActive(instant, horaires)
    if (!fin || fin.getTime() <= instant.getTime()) {
      return new Date(instant.getTime() + reste)
    }
    const disponible = fin.getTime() - instant.getTime()
    if (reste <= disponible) {
      return new Date(instant.getTime() + reste)
    }
    const suivante = prochaineOuverture(fin, horaires)
    if (suivante.getTime() <= fin.getTime()) {
      return new Date(instant.getTime() + reste)
    }
    instant = suivante
    reste = periodeMs
  }
  return instant
}

function finPlageActive(instant: Date, horaires: Horaires): Date | null {
  if (!estDansHoraires(instant, horaires)) {
    return null
  }
  const debut = lireMinutes(horaires.debut)
  const fin = lireMinutes(horaires.fin)
  if (debut === null || fin === null) {
    return null
  }
  const minutes = instant.getHours() * 60 + instant.getMinutes()
  if (fin > debut || minutes < fin) {
    return new Date(
      instant.getFullYear(),
      instant.getMonth(),
      instant.getDate(),
      Math.floor(fin / 60),
      fin % 60,
      0,
      0
    )
  }
  return new Date(
    instant.getFullYear(),
    instant.getMonth(),
    instant.getDate() + 1,
    Math.floor(fin / 60),
    fin % 60,
    0,
    0
  )
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
