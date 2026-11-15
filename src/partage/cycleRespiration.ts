export const ECHELLE_PETITE = 0.55
export const ECHELLE_PLEINE = 1

export type PhaseRespiration = 'inspiration' | 'pleine' | 'expiration' | 'vide'

export interface RythmeRespiration {
  inspiration: number
  pleine: number
  expiration: number
  vide: number
  minutes: 1 | 3 | 5
}

export interface SeanceRespiration {
  debutSeanceMs: number
  phase: PhaseRespiration
  debutPhaseMs: number
  dureePhaseMs: number
  terminee: boolean
}

const ORDRE: readonly PhaseRespiration[] = ['inspiration', 'pleine', 'expiration', 'vide']

function premierePhase(rythme: RythmeRespiration): PhaseRespiration {
  return ORDRE.find((phase) => rythme[phase] > 0) ?? 'inspiration'
}

function phaseApres(rythme: RythmeRespiration, phase: PhaseRespiration): PhaseRespiration {
  const index = ORDRE.indexOf(phase)
  for (let decalage = 1; decalage <= ORDRE.length; decalage += 1) {
    const suivante = ORDRE[(index + decalage) % ORDRE.length]
    if (suivante && rythme[suivante] > 0) {
      return suivante
    }
  }
  return premierePhase(rythme)
}

export function echelleDepart(phase: PhaseRespiration): number {
  if (phase === 'pleine' || phase === 'expiration') {
    return ECHELLE_PLEINE
  }
  return ECHELLE_PETITE
}

export function echelleArrivee(phase: PhaseRespiration): number {
  if (phase === 'inspiration' || phase === 'pleine') {
    return ECHELLE_PLEINE
  }
  return ECHELLE_PETITE
}

export function ouvrirSeance(rythme: RythmeRespiration, maintenantMs: number): SeanceRespiration {
  const phase = premierePhase(rythme)
  return {
    debutSeanceMs: maintenantMs,
    phase,
    debutPhaseMs: maintenantMs,
    dureePhaseMs: rythme[phase] * 1000,
    terminee: false
  }
}

/**
 * Passe au temps suivant avec le rythme courant.
 * Le temps déjà engagé garde la durée qu'il avait à son départ.
 * La séance s'arrête quand le cycle qui atteint la durée est fini.
 */
export function avancerPhase(
  seance: SeanceRespiration,
  rythme: RythmeRespiration
): SeanceRespiration {
  if (seance.terminee) {
    return seance
  }
  const debut = seance.debutPhaseMs + seance.dureePhaseMs
  const suivante = phaseApres(rythme, seance.phase)
  const finSeanceMs = seance.debutSeanceMs + rythme.minutes * 60_000
  if (suivante === 'inspiration' && debut >= finSeanceMs) {
    return { ...seance, debutPhaseMs: debut, terminee: true }
  }
  return {
    debutSeanceMs: seance.debutSeanceMs,
    phase: suivante,
    debutPhaseMs: debut,
    dureePhaseMs: rythme[suivante] * 1000,
    terminee: false
  }
}
