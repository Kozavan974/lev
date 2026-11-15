import { SEQUENCE_INVITATION_BOUGER_MIN } from './constantes'

/** Série en cours. Perdue à la fermeture de Lèv : elle n'est pas enregistrée. */
export interface SerieEnCours {
  rang: number
  finMs: number
  phase: 'travail' | 'pause'
  grandePause: boolean
  travailMin: number
  pauseMin: number
  grandePauseMin: number
  grandePauseApres: number
  /** L'invitation du milieu a déjà été affichée pour ce temps de travail. */
  bougerMilieuPropose: boolean
  /** Milieu du travail, seulement si celui-ci dépasse 30 minutes. */
  milieuMs: number | null
}

export interface ReglagesSequence {
  actif: boolean
  travailMin: number
  pauseMin: number
  grandePauseMin: number
  grandePauseApres: number
}

export const ID_FIN_SEQUENCE = 'sequence:fin'
export const ID_FIN_PAUSE = 'sequence:reprise'

const MS_PAR_MINUTE = 60 * 1000

export function creerSerie(reglages: ReglagesSequence, maintenantMs: number): SerieEnCours | null {
  if (!reglages.actif) {
    return null
  }
  return travail(1, reglages.travailMin, reglages, maintenantMs)
}

export function ouvrirPause(serie: SerieEnCours, maintenantMs: number): SerieEnCours {
  const grande = estGrande(serie)
  const minutes = grande ? serie.grandePauseMin : serie.pauseMin
  return {
    ...serie,
    phase: 'pause',
    grandePause: grande,
    finMs: maintenantMs + minutes * MS_PAR_MINUTE,
    bougerMilieuPropose: true
  }
}

export function prolongerTravail(
  serie: SerieEnCours,
  maintenantMs: number,
  dureeMs: number
): SerieEnCours {
  return {
    ...serie,
    phase: 'travail',
    finMs: maintenantMs + dureeMs,
    bougerMilieuPropose: true
  }
}

export function prolongerPause(
  serie: SerieEnCours,
  maintenantMs: number,
  dureeMs: number
): SerieEnCours {
  return {
    ...serie,
    phase: 'pause',
    finMs: maintenantMs + dureeMs
  }
}

/** Séquence suivante, sans pause. Après la grande pause, ou après la dernière, le rang repart à 1. */
export function enchainterTravail(serie: SerieEnCours, maintenantMs: number): SerieEnCours {
  const rang = serie.grandePause || estGrande(serie) ? 1 : serie.rang + 1
  return travail(rang, serie.travailMin, serie, maintenantMs)
}

export function bougerDuMilieu(serie: SerieEnCours, maintenantMs: number): boolean {
  return (
    serie.phase === 'travail' &&
    !serie.bougerMilieuPropose &&
    serie.milieuMs !== null &&
    maintenantMs >= serie.milieuMs
  )
}

export function estGrande(serie: SerieEnCours): boolean {
  return serie.rang >= serie.grandePauseApres
}

export function minutesDePause(serie: SerieEnCours): number {
  return estGrande(serie) ? serie.grandePauseMin : serie.pauseMin
}

function travail(
  rang: number,
  travailMin: number,
  durees: Pick<SerieEnCours, 'pauseMin' | 'grandePauseMin' | 'grandePauseApres'>,
  maintenantMs: number
): SerieEnCours {
  return {
    rang,
    finMs: maintenantMs + travailMin * MS_PAR_MINUTE,
    phase: 'travail',
    grandePause: false,
    travailMin,
    pauseMin: durees.pauseMin,
    grandePauseMin: durees.grandePauseMin,
    grandePauseApres: durees.grandePauseApres,
    bougerMilieuPropose: false,
    milieuMs:
      travailMin > SEQUENCE_INVITATION_BOUGER_MIN
        ? maintenantMs + (travailMin * MS_PAR_MINUTE) / 2
        : null
  }
}
