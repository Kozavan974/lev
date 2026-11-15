import type {
  Frequence,
  Jours,
  ModeRappel,
  Reglages,
  Repetition,
  RythmeSequence,
  Theme
} from '../partage/modeles'
import { FREQUENCES } from '../partage/modeles'

export const CANAL_NOTIFICATION = {
  prete: 'notification:prete',
  afficher: 'notification:afficher',
  message: 'notification:message',
  repondre: 'notification:repondre',
  expirer: 'notification:expirer',
  hauteur: 'notification:hauteur',
  autreIdee: 'notification:autre-idee',
  variante: 'notification:variante',
  masquee: 'notification:masquee',
  retirer: 'notification:retirer'
} as const

export type ReponseBouton =
  | 'jeLeFais'
  | 'dans5min'
  | 'plusTard'
  | 'ouiRythme'
  | 'garderRythme'
  | 'cestReparti'
  | 'encore5min'
  | 'arreterSequences'

export type TypeVueNotification =
  'yeux' | 'bouger' | 'posture' | 'libre' | 'debutSequence' | 'finSequence' | 'finPause'

export type BoutonsNotification = 'trois' | 'reprise' | 'aucun' | 'rythme'

export interface ParcoursSequence {
  faits: number
  total: number
}

export interface VueNotification {
  cycle: number
  rappelId: string
  type: TypeVueNotification
  titre: string
  phrase: string
  delaiDisparitionMs: number
  idee: string | null
  assis: boolean
  surtitre: string | null
  parcours: ParcoursSequence | null
  legende: string | null
  boutons: BoutonsNotification
  boutonOui: string | null
  boutonGarder: string | null
  /** Vrai quand l'option son est cochée : la carte joue le son à son apparition. */
  son: boolean
  lienArret: boolean
  lienPoste: boolean
  resteAffichee: boolean
}

export interface VueMessage {
  texte: string
  dureeMs: number
}

export const CANAL_ECRAN = {
  lire: 'ecran:lire',
  etat: 'ecran:etat',
  action: 'ecran:action',
  fermerMenu: 'ecran:fermer-menu',
  hauteurMenu: 'ecran:hauteur-menu',
  lien: 'ecran:lien'
} as const

export type ClefOption =
  | 'attendreAccalmie'
  | 'pausesSpontanees'
  | 'nePasDeranger'
  | 'proposerEspacer'
  | 'mouvementsAssis'
  | 'son'
  | 'lancerAuDemarrage'

export type DureeVeille = '30min' | '1h' | 'demain'

export const ECRANS_NAVIGATION = ['rappels', 'apropos', 'poste', 'respiration'] as const
export type EcranNavigation = (typeof ECRANS_NAVIGATION)[number]
export type EcranApplication = EcranNavigation | 'accueil'

export interface EtatEcran {
  reglages: Reglages
  echeances: { nom: string; heure: string }[]
  veilleLibelle: string | null
  pauseSpontanee: { heure: string } | null
  bandeau: { genre: 'retrait'; nom: string } | { genre: 'restauration' } | null
  sequence: EtatSequence
  ecran: EcranApplication
  version: string
}

export type EtatSequence =
  | null
  | { phase: 'travail'; rang: number; total: number; heure: string }
  | { phase: 'pause'; grande: boolean; heure: string }
  | { phase: 'reprise' }

export type ActionEcran =
  | { type: 'activer'; id: string; actif: boolean }
  | { type: 'frequence'; id: string; frequenceMin: Frequence }
  | { type: 'heure'; id: string; heure: string }
  | { type: 'repetition'; id: string; repetition: Repetition }
  | { type: 'retirer'; id: string }
  | { type: 'annuler' }
  | {
      type: 'ajouter'
      nom: string
      mode: ModeRappel
      frequenceMin: Frequence
      heure: string
      repetition: Repetition
    }
  | { type: 'horaires'; debut: string; fin: string; jours: Jours }
  | {
      type: 'sequences'
      actif?: boolean
      rythme?: RythmeSequence
      travailMin?: number
      pauseMin?: number
    }
  | { type: 'option'; cle: ClefOption; valeur: boolean }
  | { type: 'theme'; theme: Theme }
  | { type: 'veille'; duree: DureeVeille }
  | { type: 'reprendre' }
  | { type: 'pause' }
  | { type: 'demarrerSequence' }
  | { type: 'arreterSequences' }
  | { type: 'ouvrirRappels' }
  | { type: 'ouvrirEcran'; ecran: EcranNavigation }
  | { type: 'terminerAccueil'; suite: 'fermer' | 'rappels' }
  | { type: 'fermerGuide' }
  | { type: 'premierLancement' }
  | { type: 'guide'; index: number; coche: boolean }
  | {
      type: 'respiration'
      inspiration?: number
      pleine?: number
      expiration?: number
      vide?: number
      minutes?: 1 | 3 | 5
    }
  | { type: 'quitter' }
  | { type: 'retablir' }

export interface ApiLev {
  prete(): void
  surAffichage(recevoir: (vue: VueNotification) => void): () => void
  surMessage(recevoir: (vue: VueMessage) => void): () => void
  repondre(reponse: ReponseBouton): void
  expirer(): void
  definirHauteur(hauteurPx: number): void
  autreIdee(): void
  definirVariante(assis: boolean): void
  masquageTermine(): void
  surRetrait(recevoir: () => void): () => void
  lireEtat(): Promise<EtatEcran>
  surEtat(recevoir: (etat: EtatEcran) => void): () => void
  agir(action: ActionEcran): void
  ouvrirLien(url: string): Promise<boolean>
  fermerMenu(): void
  definirHauteurMenu(hauteurPx: number): void
}

const TYPES_VUE = [
  'yeux',
  'bouger',
  'posture',
  'libre',
  'debutSequence',
  'finSequence',
  'finPause'
] as const

export function estReponseBouton(valeur: unknown): valeur is ReponseBouton {
  return (
    valeur === 'jeLeFais' ||
    valeur === 'dans5min' ||
    valeur === 'plusTard' ||
    valeur === 'ouiRythme' ||
    valeur === 'garderRythme' ||
    valeur === 'cestReparti' ||
    valeur === 'encore5min' ||
    valeur === 'arreterSequences'
  )
}

export function estVueNotification(valeur: unknown): valeur is VueNotification {
  if (!estObjet(valeur)) {
    return false
  }
  return (
    typeof valeur.cycle === 'number' &&
    typeof valeur.rappelId === 'string' &&
    estTypeVue(valeur.type) &&
    typeof valeur.titre === 'string' &&
    typeof valeur.phrase === 'string' &&
    typeof valeur.delaiDisparitionMs === 'number' &&
    (valeur.idee === null || typeof valeur.idee === 'string') &&
    typeof valeur.assis === 'boolean' &&
    (valeur.surtitre === null || typeof valeur.surtitre === 'string') &&
    estParcours(valeur.parcours) &&
    (valeur.legende === null || typeof valeur.legende === 'string') &&
    boutonsCoherents(valeur) &&
    typeof valeur.son === 'boolean' &&
    typeof valeur.lienArret === 'boolean' &&
    typeof valeur.lienPoste === 'boolean' &&
    typeof valeur.resteAffichee === 'boolean'
  )
}

export function estVueMessage(valeur: unknown): valeur is VueMessage {
  if (!estObjet(valeur)) {
    return false
  }
  return typeof valeur.texte === 'string' && typeof valeur.dureeMs === 'number'
}

function estTypeVue(valeur: unknown): valeur is TypeVueNotification {
  return typeof valeur === 'string' && TYPES_VUE.some((type) => type === valeur)
}

const REPETITIONS = ['jour', 'semaine', 'une'] as const
const JOURS = ['semaine', 'samedi', 'jour'] as const
const RYTHMES = ['25-5', '50-10', 'heure', 'autre'] as const
const THEMES = ['auto', 'clair', 'sombre'] as const
const CLEFS_OPTION = [
  'attendreAccalmie',
  'pausesSpontanees',
  'nePasDeranger',
  'proposerEspacer',
  'mouvementsAssis',
  'son',
  'lancerAuDemarrage'
] as const
const DUREES_VEILLE = ['30min', '1h', 'demain'] as const
const ACTIONS_SANS_CHARGE = [
  'annuler',
  'reprendre',
  'pause',
  'ouvrirRappels',
  'quitter',
  'retablir',
  'demarrerSequence',
  'arreterSequences',
  'premierLancement',
  'fermerGuide'
] as const

export function estActionEcran(valeur: unknown): valeur is ActionEcran {
  if (!estObjet(valeur) || typeof valeur.type !== 'string') {
    return false
  }
  if (ACTIONS_SANS_CHARGE.some((type) => type === valeur.type)) {
    return true
  }
  switch (valeur.type) {
    case 'activer':
      return typeof valeur.id === 'string' && typeof valeur.actif === 'boolean'
    case 'frequence':
      return typeof valeur.id === 'string' && estFrequence(valeur.frequenceMin)
    case 'heure':
      return typeof valeur.id === 'string' && estHeure(valeur.heure)
    case 'repetition':
      return typeof valeur.id === 'string' && estParmi(valeur.repetition, REPETITIONS)
    case 'retirer':
      return typeof valeur.id === 'string'
    case 'ajouter':
      return (
        typeof valeur.nom === 'string' &&
        (valeur.mode === 'recurrent' || valeur.mode === 'heure') &&
        estFrequence(valeur.frequenceMin) &&
        estHeure(valeur.heure) &&
        estParmi(valeur.repetition, REPETITIONS)
      )
    case 'horaires':
      return estHeure(valeur.debut) && estHeure(valeur.fin) && estParmi(valeur.jours, JOURS)
    case 'sequences':
      return (
        (valeur.actif === undefined || typeof valeur.actif === 'boolean') &&
        (valeur.rythme === undefined || estParmi(valeur.rythme, RYTHMES)) &&
        (valeur.travailMin === undefined || typeof valeur.travailMin === 'number') &&
        (valeur.pauseMin === undefined || typeof valeur.pauseMin === 'number')
      )
    case 'option':
      return estParmi(valeur.cle, CLEFS_OPTION) && typeof valeur.valeur === 'boolean'
    case 'theme':
      return estParmi(valeur.theme, THEMES)
    case 'veille':
      return estParmi(valeur.duree, DUREES_VEILLE)
    case 'ouvrirEcran':
      return estParmi(valeur.ecran, ECRANS_NAVIGATION)
    case 'terminerAccueil':
      return valeur.suite === 'fermer' || valeur.suite === 'rappels'
    case 'guide':
      return typeof valeur.index === 'number' && typeof valeur.coche === 'boolean'
    case 'respiration':
      return (
        (valeur.inspiration === undefined || typeof valeur.inspiration === 'number') &&
        (valeur.pleine === undefined || typeof valeur.pleine === 'number') &&
        (valeur.expiration === undefined || typeof valeur.expiration === 'number') &&
        (valeur.vide === undefined || typeof valeur.vide === 'number') &&
        (valeur.minutes === undefined ||
          valeur.minutes === 1 ||
          valeur.minutes === 3 ||
          valeur.minutes === 5)
      )
    default:
      return false
  }
}

export function estEtatEcran(valeur: unknown): valeur is EtatEcran {
  if (!estObjet(valeur) || !estObjet(valeur.reglages) || !Array.isArray(valeur.reglages.rappels)) {
    return false
  }
  if (!estEcheances(valeur.echeances)) {
    return false
  }
  if (valeur.veilleLibelle !== null && typeof valeur.veilleLibelle !== 'string') {
    return false
  }
  if (!estPauseSpontanee(valeur.pauseSpontanee)) {
    return false
  }
  if (!estEcran(valeur.ecran) || typeof valeur.version !== 'string') {
    return false
  }
  return estBandeau(valeur.bandeau) && estSequence(valeur.sequence)
}

function boutonsCoherents(valeur: Record<string, unknown>): boolean {
  if (valeur.boutons === 'rythme') {
    return typeof valeur.boutonOui === 'string' && typeof valeur.boutonGarder === 'string'
  }
  if (valeur.boutons === 'trois' || valeur.boutons === 'reprise' || valeur.boutons === 'aucun') {
    return valeur.boutonOui === null && valeur.boutonGarder === null
  }
  return false
}

function estParcours(valeur: unknown): valeur is { faits: number; total: number } | null {
  if (valeur === null) {
    return true
  }
  return estObjet(valeur) && typeof valeur.faits === 'number' && typeof valeur.total === 'number'
}

function estEcran(valeur: unknown): valeur is EcranApplication {
  return valeur === 'accueil' || estParmi(valeur, ECRANS_NAVIGATION)
}

function estSequence(valeur: unknown): valeur is EtatSequence {
  if (valeur === null) {
    return true
  }
  if (!estObjet(valeur)) {
    return false
  }
  if (valeur.phase === 'reprise') {
    return true
  }
  if (valeur.phase === 'pause') {
    return typeof valeur.grande === 'boolean' && typeof valeur.heure === 'string'
  }
  if (valeur.phase === 'travail') {
    return (
      typeof valeur.rang === 'number' &&
      typeof valeur.total === 'number' &&
      typeof valeur.heure === 'string'
    )
  }
  return false
}

function estPauseSpontanee(valeur: unknown): valeur is { heure: string } | null {
  if (valeur === null) {
    return true
  }
  return estObjet(valeur) && typeof valeur.heure === 'string'
}

function estEcheances(valeur: unknown): valeur is { nom: string; heure: string }[] {
  return (
    Array.isArray(valeur) &&
    valeur.every(
      (element) =>
        estObjet(element) && typeof element.nom === 'string' && typeof element.heure === 'string'
    )
  )
}

function estBandeau(valeur: unknown): valeur is EtatEcran['bandeau'] {
  if (valeur === null) {
    return true
  }
  if (!estObjet(valeur)) {
    return false
  }
  if (valeur.genre === 'restauration') {
    return true
  }
  return valeur.genre === 'retrait' && typeof valeur.nom === 'string'
}

function estFrequence(valeur: unknown): valeur is Frequence {
  return typeof valeur === 'number' && FREQUENCES.some((frequence) => frequence === valeur)
}

function estParmi<T extends string>(valeur: unknown, valeurs: readonly T[]): valeur is T {
  return typeof valeur === 'string' && valeurs.some((candidat) => candidat === valeur)
}

function estHeure(valeur: unknown): boolean {
  return typeof valeur === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(valeur)
}

function estObjet(valeur: unknown): valeur is Record<string, unknown> {
  return typeof valeur === 'object' && valeur !== null
}
