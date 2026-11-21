import { ipcMain, powerMonitor } from 'electron'
import textes from '../content/fr.json'
import {
  CANAL_NOTIFICATION,
  estReponseBouton,
  type ReponseBouton,
  type VueNotification
} from '../preload/contrat'
import { composerVue } from './composerNotification'
import type { Reglages } from './modeles'
import {
  detruireNotification,
  definirFermetureForcee,
  publierMessage,
  publierNotification,
  publierRetrait,
  recevoirHauteur,
  recevoirPrete
} from './notificationFenetre'
import { choisirIdee, retenirIdee } from './selectionIdees'
import { sessionRetientNotifications } from './platform'
import {
  INTERVALLE_EVALUATION_ACCALMIE_MS,
  INTERVALLE_EVALUATION_MS,
  MESSAGE_REPONSE_MS
} from './scheduler/constantes'
import { sondageEchu } from './scheduler/sondage'
import {
  appliquerAdaptation,
  appliquerEffets,
  arreterSerie,
  creerEtat,
  demarrerSerie,
  evaluer,
  noterCharge,
  poserPauseImmediate,
  repondre,
  type EtatMoteur,
  type ResultatReponse
} from './scheduler/moteur'
import { enregistrerReglages, lireReglages } from './store'

let etat: EtatMoteur = creerEtat()
let cycle = 0
let verrouille = false
let veilleSysteme = false
let reveilEnAttente = false
let intervalle: ReturnType<typeof setInterval> | null = null
let delaiCourant = 0
let pleinEcranConnu = false
let dernierSondageMs: number | null = null
let demarree = false
let apresEvaluation: (() => void) | null = null

export function definirApresEvaluation(action: () => void): void {
  apresEvaluation = action
}

export function lireEtatMoteur(): EtatMoteur {
  return etat
}

export function reevaluer(): void {
  if (demarree) {
    tick()
  }
}

export function demarrerSequences(): void {
  const reglages = lireReglages()
  const suivant = demarrerSerie(etat, reglages, new Date())
  const notification = suivant?.notification
  if (!suivant || notification?.genre !== 'debutSequence') {
    return
  }
  etat = suivant
  cycle += 1
  const vue = composerVue(reglages, notification, cycle)
  if (vue) {
    publierNotification(vue)
  }
  if (demarree) {
    tick()
    return
  }
  apresEvaluation?.()
}

export function arreterSequences(): void {
  const fermer =
    etat.notification?.genre === 'debutSequence' ||
    etat.notification?.genre === 'finSequence' ||
    etat.notification?.genre === 'finPause'
  etat = arreterSerie(etat)
  if (demarree) {
    tick()
  } else {
    apresEvaluation?.()
  }
  if (fermer && !etat.notification) {
    publierRetrait()
  }
}

export function demanderPauseMaintenant(): void {
  const reglages = lireReglages()
  const resultat = poserPauseImmediate(etat, reglages, new Date())
  if (!resultat) {
    return
  }
  etat = preparerIdee(resultat.etat, reglages)
  if (!etat.notification) {
    return
  }
  cycle += 1
  const vue = composerVue(reglages, etat.notification, cycle)
  if (vue) {
    publierNotification(vue)
  }
  armer('normale')
  apresEvaluation?.()
}

export function demarrerBoucle(): void {
  if (demarree) {
    return
  }
  demarree = true
  definirFermetureForcee(fermerParLeSysteme)
  ipcMain.on(CANAL_NOTIFICATION.prete, (evenement) => {
    recevoirPrete(evenement.sender.id)
  })
  ipcMain.on(CANAL_NOTIFICATION.hauteur, (_evenement, valeur: unknown) => {
    if (typeof valeur === 'number') {
      recevoirHauteur(valeur)
    }
  })
  ipcMain.on(CANAL_NOTIFICATION.repondre, (_evenement, valeur: unknown) => {
    if (estReponseBouton(valeur)) {
      recevoirReponse(valeur)
    }
  })
  ipcMain.on(CANAL_NOTIFICATION.expirer, () => {
    recevoirExpiration()
  })
  ipcMain.on(CANAL_NOTIFICATION.autreIdee, () => {
    changerIdee()
  })
  ipcMain.on(CANAL_NOTIFICATION.variante, (_evenement, valeur: unknown) => {
    if (typeof valeur === 'boolean') {
      changerVariante(valeur)
    }
  })
  ipcMain.on(CANAL_NOTIFICATION.masquee, () => {
    detruireNotification()
    apresEvaluation?.()
  })
  ipcMain.on(CANAL_NOTIFICATION.pauseGuidee, () => {
    recevoirPauseGuidee()
  })

  powerMonitor.on('lock-screen', verrouiller)
  powerMonitor.on('unlock-screen', deverrouiller)
  powerMonitor.on('suspend', suspendre)
  powerMonitor.on('resume', reprendre)

  tick()
}

export function arreterBoucle(): void {
  if (!demarree) {
    return
  }
  demarree = false
  if (intervalle) {
    clearInterval(intervalle)
    intervalle = null
  }
  delaiCourant = 0
  powerMonitor.removeListener('lock-screen', verrouiller)
  powerMonitor.removeListener('unlock-screen', deverrouiller)
  powerMonitor.removeListener('suspend', suspendre)
  powerMonitor.removeListener('resume', reprendre)
  retirerCanaux()
  detruireNotification()
}

function tick(): void {
  const maintenant = new Date()
  const inactiviteSec = powerMonitor.getSystemIdleTime()
  const sessionOuverte = !verrouille && !veilleSysteme
  const reveil = reveilEnAttente
  const base = { maintenant, inactiviteSec, sessionOuverte, reveil }
  const reglages = lireReglages()
  let decision = evaluer(etat, reglages, { ...base, pleinEcran: pleinEcranConnu })
  if (sondageEchu(decision.sonderPleinEcran, dernierSondageMs, maintenant.getTime())) {
    const mesure = sessionRetientNotifications()
    dernierSondageMs = maintenant.getTime()
    if (mesure !== pleinEcranConnu) {
      pleinEcranConnu = mesure
      decision = evaluer(etat, reglages, { ...base, pleinEcran: mesure })
    }
  }
  reveilEnAttente = false
  etat = decision.etat
  if (decision.effets.length > 0) {
    enregistrerReglages(appliquerEffets(lireReglages(), decision.effets))
  }
  armer(decision.cadence)
  apresEvaluation?.()
  if (decision.fermerNotification) {
    publierRetrait()
  }
  if (!decision.afficher || !etat.notification) {
    return
  }
  etat = preparerIdee(etat, reglages)
  if (!etat.notification) {
    return
  }
  cycle += 1
  const vue = composerVue(reglages, etat.notification, cycle)
  if (vue) {
    publierNotification(vue)
  }
}

function recevoirReponse(reponse: ReponseBouton): void {
  if (!etat.notification) {
    return
  }
  const genre = etat.notification.genre
  const resultat = repondre(etat, lireReglages(), reponse, new Date())
  retenirReponse(resultat)
  if (resultat.message) {
    publierMessage({
      texte: textes.notification.messages[resultat.message],
      dureeMs: MESSAGE_REPONSE_MS
    })
  } else if (
    (genre === 'debutSequence' ||
      genre === 'finSequence' ||
      genre === 'finPause' ||
      genre === 'rythme') &&
    !etat.notification
  ) {
    publierRetrait()
  }
  apresEvaluation?.()
}

function recevoirPauseGuidee(): void {
  if (!etat.notification) {
    return
  }
  retenirReponse(repondre(etat, lireReglages(), 'jeLeFais', new Date()))
  publierRetrait()
  apresEvaluation?.()
}

function recevoirExpiration(): void {
  if (!etat.notification) {
    return
  }
  retenirReponse(repondre(etat, lireReglages(), 'aucune', new Date()))
  apresEvaluation?.()
}

function retenirReponse(resultat: ResultatReponse): void {
  etat = resultat.etat
  if (resultat.effet) {
    enregistrerReglages(appliquerAdaptation(lireReglages(), resultat.effet))
  }
}

function changerIdee(): void {
  const notification = etat.notification
  const reglages = lireReglages()
  const rappel = reglages.rappels.find((candidat) => candidat.id === notification?.rappelId)
  if (!notification || rappel?.type !== 'bouger') {
    return
  }
  const ideeIndex = choisirIdee(notification.charge.assis, notification.charge.ideeIndex)
  etat = noterCharge(etat, { ...notification.charge, ideeIndex })
  republier(reglages)
}

function changerVariante(assis: boolean): void {
  const notification = etat.notification
  const reglages = lireReglages()
  const rappel = reglages.rappels.find((candidat) => candidat.id === notification?.rappelId)
  if (!notification || rappel?.type !== 'bouger' || notification.charge.assis === assis) {
    return
  }
  const ideeIndex = choisirIdee(assis, null)
  etat = noterCharge(etat, { assis, ideeIndex })
  republier(reglages)
}

function fermerParLeSysteme(): void {
  if (etat.notification?.genre === 'rythme') {
    recevoirExpiration()
    publierRetrait()
    return
  }
  if (etat.notification) {
    recevoirReponse('plusTard')
    return
  }
  detruireNotification()
}

function preparerIdee(courant: EtatMoteur, reglages: Reglages): EtatMoteur {
  const notification = courant.notification
  if (!notification) {
    return courant
  }
  const rappel = reglages.rappels.find((candidat) => candidat.id === notification.rappelId)
  if (rappel?.type !== 'bouger') {
    return courant
  }
  if (notification.charge.ideeIndex !== null) {
    retenirIdee(notification.charge.assis, notification.charge.ideeIndex)
    return courant
  }
  const ideeIndex = choisirIdee(notification.charge.assis, null)
  return noterCharge(courant, { assis: notification.charge.assis, ideeIndex })
}

function republier(reglages: Reglages): void {
  if (!etat.notification) {
    return
  }
  const vue: VueNotification | null = composerVue(reglages, etat.notification, cycle)
  if (vue) {
    publierNotification(vue)
  }
}

function verrouiller(): void {
  verrouille = true
  tick()
}

function deverrouiller(): void {
  verrouille = false
  tick()
}

function suspendre(): void {
  veilleSysteme = true
}

function reprendre(): void {
  veilleSysteme = false
  reveilEnAttente = true
  tick()
}

function armer(cadence: 'normale' | 'accalmie'): void {
  if (!demarree) {
    return
  }
  const delai =
    cadence === 'accalmie' ? INTERVALLE_EVALUATION_ACCALMIE_MS : INTERVALLE_EVALUATION_MS
  if (intervalle && delaiCourant === delai) {
    return
  }
  delaiCourant = delai
  if (intervalle) {
    clearInterval(intervalle)
  }
  intervalle = setInterval(tick, delai)
}

function retirerCanaux(): void {
  const canaux = [
    CANAL_NOTIFICATION.prete,
    CANAL_NOTIFICATION.hauteur,
    CANAL_NOTIFICATION.repondre,
    CANAL_NOTIFICATION.expirer,
    CANAL_NOTIFICATION.autreIdee,
    CANAL_NOTIFICATION.variante,
    CANAL_NOTIFICATION.masquee,
    CANAL_NOTIFICATION.pauseGuidee
  ]
  for (const canal of canaux) {
    ipcMain.removeAllListeners(canal)
  }
}
