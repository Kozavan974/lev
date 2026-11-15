export const FREQUENCES = [10, 20, 30, 45, 60, 120, 240] as const

export type Frequence = (typeof FREQUENCES)[number]

/** Palier suivant de la liste unique, ou null si la fréquence est déjà la plus espacée. */
export function frequenceSuperieure(frequence: Frequence): Frequence | null {
  const index = FREQUENCES.indexOf(frequence)
  return FREQUENCES[index + 1] ?? null
}
export type Repetition = 'jour' | 'semaine' | 'une'
export type Jours = 'semaine' | 'samedi' | 'jour'
export type TypeRappel = 'yeux' | 'bouger' | 'posture' | 'libre'
export type OrigineRappel = 'base' | 'perso'
export type ModeRappel = 'recurrent' | 'heure'
export type RythmeSequence = '25-5' | '50-10' | 'heure' | 'autre'
export type Theme = 'auto' | 'clair' | 'sombre'
export type DureeRespiration = 1 | 3 | 5

export interface Rappel {
  id: string
  nom: string
  type: TypeRappel
  origine: OrigineRappel
  mode: ModeRappel
  frequenceMin?: Frequence
  heure?: string
  repetition?: Repetition
  dernierDeclenchement?: string
  actif: boolean
  reportsDeSuite: number
  neRienProposerAvant?: string
}

export interface Reglages {
  version: 1
  premierLancementFait: boolean
  rappels: Rappel[]
  horaires: { debut: string; fin: string; jours: Jours }
  sequences: {
    actif: boolean
    rythme: RythmeSequence
    travailMin: number
    pauseMin: number
    grandePauseMin: number
    grandePauseApres: number
  }
  options: {
    attendreAccalmie: boolean
    pausesSpontanees: boolean
    nePasDeranger: boolean
    proposerEspacer: boolean
    mouvementsAssis: boolean
    son: boolean
    lancerAuDemarrage: boolean
  }
  theme: Theme
  respiration: {
    inspiration: number
    pleine: number
    expiration: number
    vide: number
    minutes: DureeRespiration
  }
  guidePoste: boolean[]
  veilleJusqua?: string
}
