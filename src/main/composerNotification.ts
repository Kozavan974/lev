import textes from '../content/fr.json'
import { formaterInstant, remplir } from '../partage/format'
import type { VueNotification } from '../preload/contrat'
import { frequenceSuperieure, type Frequence, type Rappel, type Reglages } from './modeles'
import type { DetailSequence, NotificationEnCours } from './scheduler/moteur'
import { texteIdee } from './selectionIdees'

export function composerVue(
  reglages: Reglages,
  notification: NotificationEnCours,
  cycle: number
): VueNotification | null {
  const vue = composerContenu(reglages, notification, cycle)
  if (!vue) {
    return null
  }
  return { ...vue, son: reglages.options.son }
}

function composerContenu(
  reglages: Reglages,
  notification: NotificationEnCours,
  cycle: number
): VueNotification | null {
  if (notification.genre === 'debutSequence') {
    return vueDebut(notification, reglages, cycle)
  }
  if (notification.genre === 'finSequence') {
    return notification.sequence ? vueFinSequence(notification, notification.sequence, cycle) : null
  }
  if (notification.genre === 'finPause') {
    return vueFinPause(notification, cycle)
  }
  const rappel = reglages.rappels.find((candidat) => candidat.id === notification.rappelId)
  if (!rappel) {
    return null
  }
  if (notification.genre === 'rythme') {
    return vueRythme(notification, rappel, cycle)
  }
  const assis = notification.charge.assis
  if (rappel.type === 'yeux') {
    return vue(
      notification,
      cycle,
      'yeux',
      textes.notification.yeux.titre,
      textes.notification.yeux.phrase,
      null,
      false
    )
  }
  if (rappel.type === 'bouger') {
    const textesVariante = assis ? textes.notification.bougerAssis : textes.notification.bouger
    return vue(
      notification,
      cycle,
      'bouger',
      textesVariante.titre,
      textesVariante.phrase,
      texteIdee(assis, notification.charge.ideeIndex),
      assis
    )
  }
  if (rappel.type === 'posture') {
    return vue(
      notification,
      cycle,
      'posture',
      textes.notification.posture.titre,
      textes.notification.posture.phrase,
      null,
      false,
      { lienPoste: true }
    )
  }
  return vue(
    notification,
    cycle,
    'libre',
    rappel.nom,
    textes.notification.libre.phrase,
    null,
    false
  )
}

function vueDebut(
  notification: NotificationEnCours,
  reglages: Reglages,
  cycle: number
): VueNotification {
  const textesDebut = textes.notification.debutSequence
  return vue(
    notification,
    cycle,
    'debutSequence',
    textesDebut.titre,
    [
      textesDebut.ligne1,
      textesDebut.ligne2,
      remplir(textesDebut.suite, { minutes: String(reglages.sequences.travailMin) })
    ].join('\n'),
    null,
    false,
    { boutons: 'aucun' }
  )
}

function vueFinSequence(
  notification: NotificationEnCours,
  detail: DetailSequence,
  cycle: number
): VueNotification {
  const textesSequence = textes.notification.finSequence
  const duree = texteDuree(detail.pauseMin)
  const heure = formaterInstant(new Date(detail.repriseMs))
  const modele = detail.grandePause ? textesSequence.grandePause : textesSequence.phrase
  return vue(
    notification,
    cycle,
    'finSequence',
    titreSequence(detail.rang),
    remplir(modele, { duree, heure }),
    null,
    false,
    {
      surtitre: textesSequence.surtitre,
      parcours: { faits: detail.rang, total: detail.total },
      legende: legendeParcours(detail.rang, detail.total, detail.grandePause),
      lienArret: true
    }
  )
}

function vueFinPause(notification: NotificationEnCours, cycle: number): VueNotification {
  return vue(notification, cycle, 'finPause', textes.notification.finPause.titre, '', null, false, {
    boutons: 'reprise',
    resteAffichee: true
  })
}

function titreSequence(rang: number): string {
  const cle = String(rang)
  if (estClef(cle, textes.notification.finSequence.rangs)) {
    return textes.notification.finSequence.rangs[cle]
  }
  return remplir(textes.notification.finSequence.rangSuite, { rang: cle })
}

function legendeParcours(rang: number, total: number, grande: boolean): string | null {
  if (grande) {
    return null
  }
  const reste = total - rang
  if (reste <= 1) {
    return reste === 1 ? textes.notification.finSequence.parcoursUn : null
  }
  return remplir(textes.notification.finSequence.parcours, { reste: motReste(reste) })
}

function motReste(reste: number): string {
  const cle = String(reste)
  if (estClef(cle, textes.notification.finSequence.reste)) {
    return textes.notification.finSequence.reste[cle]
  }
  return cle
}

function texteDuree(minutes: number): string {
  if (minutes === 1) {
    return textes.notification.finSequence.uneMinute
  }
  return remplir(textes.notification.finSequence.minutes, { duree: String(minutes) })
}

function estClef<T extends object>(cle: string, objet: T): cle is keyof T & string {
  return Object.prototype.hasOwnProperty.call(objet, cle)
}

function vueRythme(
  notification: NotificationEnCours,
  rappel: Rappel,
  cycle: number
): VueNotification | null {
  const frequence = rappel.frequenceMin
  const suivante = frequence === undefined ? null : frequenceSuperieure(frequence)
  if (frequence === undefined || suivante === null) {
    return null
  }
  const textesRythme = textes.notification.rythme
  const proposee = lireTable(textesRythme.proposee, suivante)
  const actuelle = lireTable(textesRythme.actuelle, frequence)
  const courte = lireTable(textesRythme.courte, suivante)
  if (!proposee || !actuelle || !courte) {
    return null
  }
  return vue(
    notification,
    cycle,
    rappel.type,
    textesRythme.titre,
    remplir(textesRythme.phrase, { nom: rappel.nom, proposee, actuelle }),
    null,
    false,
    {
      boutons: 'rythme',
      boutonOui: remplir(textesRythme.oui, { courte }),
      boutonGarder: textesRythme.garder
    }
  )
}

function lireTable<T extends object>(table: T, frequence: Frequence): string | null {
  const cle = String(frequence)
  if (!Object.prototype.hasOwnProperty.call(table, cle)) {
    return null
  }
  const valeur: unknown = table[cle as keyof T]
  return typeof valeur === 'string' ? valeur : null
}

interface ComplementVue {
  surtitre?: string | null
  parcours?: VueNotification['parcours']
  legende?: string | null
  boutons?: VueNotification['boutons']
  boutonOui?: string | null
  boutonGarder?: string | null
  lienArret?: boolean
  lienPoste?: boolean
  resteAffichee?: boolean
}

function vue(
  notification: NotificationEnCours,
  cycle: number,
  type: VueNotification['type'],
  titre: string,
  phrase: string,
  idee: string | null,
  assis: boolean,
  complement: ComplementVue = {}
): VueNotification {
  return {
    cycle,
    rappelId: notification.rappelId,
    type,
    titre,
    phrase,
    delaiDisparitionMs: notification.delaiMs,
    idee,
    assis,
    surtitre: complement.surtitre ?? null,
    parcours: complement.parcours ?? null,
    legende: complement.legende ?? null,
    boutons: complement.boutons ?? 'trois',
    boutonOui: complement.boutonOui ?? null,
    boutonGarder: complement.boutonGarder ?? null,
    son: false,
    lienArret: complement.lienArret ?? false,
    lienPoste: complement.lienPoste ?? false,
    resteAffichee: complement.resteAffichee ?? false
  }
}
