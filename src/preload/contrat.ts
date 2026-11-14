export const CANAL_NOTIFICATION = {
  prete: 'notification:prete',
  afficher: 'notification:afficher',
  message: 'notification:message',
  repondre: 'notification:repondre',
  expirer: 'notification:expirer',
  hauteur: 'notification:hauteur',
  autreIdee: 'notification:autre-idee',
  variante: 'notification:variante',
  masquee: 'notification:masquee'
} as const

export type ReponseBouton = 'jeLeFais' | 'dans5min' | 'plusTard'

export type TypeVueNotification = 'yeux' | 'bouger' | 'posture' | 'libre'

export interface VueNotification {
  cycle: number
  rappelId: string
  type: TypeVueNotification
  titre: string
  phrase: string
  delaiDisparitionMs: number
  idee: string | null
  assis: boolean
}

export interface VueMessage {
  texte: string
  dureeMs: number
}

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
}

const TYPES_VUE = ['yeux', 'bouger', 'posture', 'libre'] as const

export function estReponseBouton(valeur: unknown): valeur is ReponseBouton {
  return valeur === 'jeLeFais' || valeur === 'dans5min' || valeur === 'plusTard'
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
    typeof valeur.assis === 'boolean'
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

function estObjet(valeur: unknown): valeur is Record<string, unknown> {
  return typeof valeur === 'object' && valeur !== null
}
