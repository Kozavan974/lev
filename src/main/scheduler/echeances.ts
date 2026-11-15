import { formaterInstant, jourDeRepetition, jourLocal } from '../../partage/format'
import type { Rappel, Reglages } from '../modeles'
import { HEURE_FIXE_RETARD_MAX_MS } from './constantes'
import { estDansHoraires, prochaineOuverture, projeterEcheance } from './horaires'
import type { EtatMoteur } from './moteur'

export interface EcheanceAffichee {
  nom: string
  heure: string
}

interface Echeance {
  nom: string
  instant: Date
}

/** Les deux prochaines pauses, dans l'ordre, pour le menu et l'infobulle. */
export function calculerEcheances(
  etat: EtatMoteur,
  reglages: Reglages,
  maintenant: Date
): EcheanceAffichee[] {
  const trouvees: Echeance[] = []
  for (const rappel of reglages.rappels) {
    const instant = instantRappel(rappel, etat, reglages, maintenant)
    if (instant) {
      trouvees.push({ nom: rappel.nom, instant })
    }
  }
  trouvees.sort(
    (a, b) => a.instant.getTime() - b.instant.getTime() || a.nom.localeCompare(b.nom, 'fr')
  )
  return trouvees.slice(0, 2).map((echeance) => ({
    nom: echeance.nom,
    heure: formaterInstant(echeance.instant)
  }))
}

function instantRappel(
  rappel: Rappel,
  etat: EtatMoteur,
  reglages: Reglages,
  maintenant: Date
): Date | null {
  if (!rappel.actif) {
    return null
  }
  if (rappel.mode === 'heure') {
    return instantHeureFixe(rappel, maintenant, finVeilleMs(reglages, maintenant))
  }
  return instantRecurrent(rappel, etat, reglages, maintenant)
}

function instantRecurrent(
  rappel: Rappel,
  etat: EtatMoteur,
  reglages: Reglages,
  maintenant: Date
): Date | null {
  if (rappel.frequenceMin === undefined) {
    return null
  }
  const periode = rappel.frequenceMin * 60 * 1000
  let depart = new Date(maintenant)
  let restant = Math.max(0, periode - (etat.compteursMs[rappel.id] ?? 0))
  const veille = finVeilleMs(reglages, maintenant)
  if (veille !== null && veille > depart.getTime()) {
    depart = new Date(veille)
    restant = periode
  } else if (etat.pauseJusquaMs !== null && etat.pauseJusquaMs > depart.getTime()) {
    depart = new Date(etat.pauseJusquaMs)
  }
  if (!estDansHoraires(depart, reglages.horaires)) {
    depart = prochaineOuverture(depart, reglages.horaires)
    restant = periode
  }
  return projeterEcheance(depart, restant, periode, reglages.horaires)
}

function instantHeureFixe(rappel: Rappel, maintenant: Date, veilleFin: number | null): Date | null {
  if (!rappel.heure || !rappel.repetition) {
    return null
  }
  const [heures, minutes] = rappel.heure.split(':').map(Number)
  for (let delta = 0; delta <= 8; delta += 1) {
    const prevu = new Date(
      maintenant.getFullYear(),
      maintenant.getMonth(),
      maintenant.getDate() + delta,
      heures,
      minutes,
      0,
      0
    )
    if (!jourDeRepetition(rappel.repetition, prevu)) {
      continue
    }
    if (rappel.dernierDeclenchement === jourLocal(prevu)) {
      continue
    }
    const finFenetre = prevu.getTime() + HEURE_FIXE_RETARD_MAX_MS
    if (maintenant.getTime() >= finFenetre) {
      continue
    }
    if (veilleFin !== null && prevu.getTime() < veilleFin && veilleFin >= finFenetre) {
      continue
    }
    return prevu
  }
  return null
}

function finVeilleMs(reglages: Reglages, maintenant: Date): number | null {
  if (!reglages.veilleJusqua) {
    return null
  }
  const fin = new Date(reglages.veilleJusqua).getTime()
  if (!Number.isFinite(fin) || fin <= maintenant.getTime()) {
    return null
  }
  return fin
}
