import textes from '../content/fr.json'
import type { VueNotification } from '../preload/contrat'
import type { Reglages } from './modeles'
import type { NotificationEnCours } from './scheduler/moteur'
import { texteIdee } from './selectionIdees'

export function composerVue(
  reglages: Reglages,
  notification: NotificationEnCours,
  cycle: number
): VueNotification | null {
  const rappel = reglages.rappels.find((candidat) => candidat.id === notification.rappelId)
  if (!rappel) {
    return null
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
      false
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

function vue(
  notification: NotificationEnCours,
  cycle: number,
  type: VueNotification['type'],
  titre: string,
  phrase: string,
  idee: string | null,
  assis: boolean
): VueNotification {
  return {
    cycle,
    rappelId: notification.rappelId,
    type,
    titre,
    phrase,
    delaiDisparitionMs: notification.delaiMs,
    idee,
    assis
  }
}
