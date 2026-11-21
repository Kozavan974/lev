import { remplir } from './format'

const MS_PAR_MINUTE = 60_000

export interface ModelesReste {
  une: string
  plusieurs: string
  moins: string
}

export interface ResteCompte {
  /** `25`, `03`, `120` ou `<1`. */
  icone: string
  reste: string
}

export interface ModeleInfobulle {
  travail: string
  pause: string
  grande: string
  reunion: string
  veille: string
  prochaine: string
  repos: string
}

export type SequenceInfobulle =
  | null
  | { phase: 'reprise' }
  | { phase: 'travail'; reste: string; rang: number; total: number }
  | { phase: 'pause'; grande: boolean; reste: string }

/** Minutes entières au-dessus, `<1` sous une minute. Nul si l'échéance est passée. */
export function decrireReste(
  finMs: number,
  maintenantMs: number,
  modeles: ModelesReste
): ResteCompte | null {
  const resteMs = finMs - maintenantMs
  if (resteMs <= 0) {
    return null
  }
  if (resteMs < MS_PAR_MINUTE) {
    return { icone: '<1', reste: modeles.moins }
  }
  const minutes = Math.ceil(resteMs / MS_PAR_MINUTE)
  return {
    icone: minutes < 100 ? String(minutes).padStart(2, '0') : String(minutes),
    reste: minutes === 1 ? modeles.une : remplir(modeles.plusieurs, { minutes: String(minutes) })
  }
}

/**
 * La réunion passe devant le décompte de séquence, la veille et la prochaine pause.
 * Hors réunion, le décompte de séquence passe devant la veille.
 * Hors travail, pause courte ou grande pause, l'infobulle habituelle reste.
 */
export function choisirInfobulle(
  sequence: SequenceInfobulle,
  reunion: string | null,
  veille: string | null,
  prochaine: string | null,
  modeles: ModeleInfobulle
): string {
  if (reunion) {
    return remplir(modeles.reunion, { heure: reunion })
  }
  if (sequence?.phase === 'travail') {
    return remplir(modeles.travail, {
      reste: sequence.reste,
      rang: String(sequence.rang),
      total: String(sequence.total)
    })
  }
  if (sequence?.phase === 'pause') {
    return remplir(sequence.grande ? modeles.grande : modeles.pause, { reste: sequence.reste })
  }
  if (veille) {
    return remplir(modeles.veille, { heure: veille })
  }
  if (prochaine) {
    return remplir(modeles.prochaine, { heure: prochaine })
  }
  return modeles.repos
}

export function ligneDecompte(
  sequence:
    { phase: 'travail'; reste: string } | { phase: 'pause'; grande: boolean; reste: string },
  modeles: { travail: string; pause: string; grande: string }
): string {
  if (sequence.phase === 'pause') {
    return remplir(sequence.grande ? modeles.grande : modeles.pause, { reste: sequence.reste })
  }
  return remplir(modeles.travail, { reste: sequence.reste })
}
