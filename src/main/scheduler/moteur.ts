import type { Rappel, Reglages, TypeRappel } from '../modeles'
import {
  AFFICHAGE_NOTIFICATION_AUTRE_MS,
  AFFICHAGE_NOTIFICATION_YEUX_MS,
  BIENTOT_AVANT_MS,
  BIENTOT_FREQUENCE_MIN_MINUTES,
  FENETRE_PRIORITE_MS,
  MESSAGE_REPONSE_MS,
  PAUSE_BOUGER_MS,
  REPORT_CINQ_MIN_MS,
  SEUIL_DEVERROUILLAGE_MS
} from './constantes'
import { estDansHoraires } from './horaires'

/** Contenu affiché, conservé tel quel par « Dans 5 min ». */
export interface ChargeNotification {
  assis: boolean
  ideeIndex: number | null
}

export interface NotificationEnCours {
  rappelId: string
  depuisMs: number
  delaiMs: number
  charge: ChargeNotification
}

export interface ReportEnAttente {
  rappelId: string
  jusquaMs: number
  charge: ChargeNotification
}

export interface EtatMoteur {
  compteursMs: Readonly<Record<string, number>>
  dernierInstantMs: number | null
  etaitDansHoraires: boolean | null
  veilleActive: boolean
  verrouilleDepuisMs: number | null
  notification: NotificationEnCours | null
  bloqueJusquaMs: number | null
  pauseJusquaMs: number | null
  report: ReportEnAttente | null
}

/** L'inactivité est injectée pour le lot 3. Le lot 1 ne s'en sert pas. */
export interface EntreeMoteur {
  maintenant: Date
  inactiviteSec: number
  sessionOuverte: boolean
  reveil: boolean
}

export interface AffichageDemande {
  rappelId: string
  delaiMs: number
  charge: ChargeNotification
}

export interface DecisionMoteur {
  etat: EtatMoteur
  afficher: AffichageDemande | null
  bientot: boolean
}

export type ReponseRappel = 'jeLeFais' | 'dans5min' | 'plusTard' | 'aucune'

export interface ResultatReponse {
  etat: EtatMoteur
  message: 'jeLeFais' | 'dans5min' | 'plusTard' | null
}

const ORDRE_TYPE: Record<TypeRappel, number> = {
  posture: 0,
  bouger: 1,
  libre: 2,
  yeux: 3
}

interface Candidat {
  rappel: Rappel
  dejaDu: boolean
  snooze: boolean
  charge: ChargeNotification
}

export function creerEtat(): EtatMoteur {
  return {
    compteursMs: {},
    dernierInstantMs: null,
    etaitDansHoraires: null,
    veilleActive: false,
    verrouilleDepuisMs: null,
    notification: null,
    bloqueJusquaMs: null,
    pauseJusquaMs: null,
    report: null
  }
}

export function noterCharge(etat: EtatMoteur, charge: ChargeNotification): EtatMoteur {
  if (!etat.notification) {
    return etat
  }
  return { ...etat, notification: { ...etat.notification, charge } }
}

export function evaluer(
  etat: EtatMoteur,
  reglages: Reglages,
  entree: EntreeMoteur
): DecisionMoteur {
  const maintenantMs = entree.maintenant.getTime()
  let courant = cloner(etat)
  const dansHoraires = estDansHoraires(entree.maintenant, reglages.horaires)
  const enVeille = estVeilleActive(reglages, maintenantMs)

  const vientDeDeverrouiller = entree.sessionOuverte && courant.verrouilleDepuisMs !== null
  let reset = entree.reveil
  if (vientDeDeverrouiller && courant.verrouilleDepuisMs !== null) {
    if (maintenantMs - courant.verrouilleDepuisMs >= SEUIL_DEVERROUILLAGE_MS) {
      reset = true
    }
    courant = { ...courant, verrouilleDepuisMs: null }
  } else if (!entree.sessionOuverte && courant.verrouilleDepuisMs === null) {
    courant = { ...courant, verrouilleDepuisMs: maintenantMs }
  }

  if (courant.etaitDansHoraires === false && dansHoraires) {
    reset = true
  }
  if (courant.veilleActive && !enVeille) {
    reset = true
  }
  if (reset) {
    courant = { ...courant, compteursMs: {} }
  }

  const peutCrediter =
    !reset &&
    !vientDeDeverrouiller &&
    courant.dernierInstantMs !== null &&
    entree.sessionOuverte &&
    dansHoraires &&
    !enVeille

  if (peutCrediter && courant.dernierInstantMs !== null) {
    courant = crediter(courant, reglages, courant.dernierInstantMs, maintenantMs)
  } else if (courant.pauseJusquaMs !== null && maintenantMs >= courant.pauseJusquaMs) {
    courant = { ...courant, pauseJusquaMs: null }
  }

  if (courant.bloqueJusquaMs !== null && maintenantMs >= courant.bloqueJusquaMs) {
    courant = { ...courant, bloqueJusquaMs: null }
  }

  courant = {
    ...courant,
    dernierInstantMs: maintenantMs,
    etaitDansHoraires: dansHoraires,
    veilleActive: enVeille
  }

  const choix = choisir(courant, reglages, maintenantMs)
  return {
    etat: choix.etat,
    afficher: choix.afficher,
    bientot: calculerBientot(choix.etat, reglages)
  }
}

export function repondre(
  etat: EtatMoteur,
  reglages: Reglages,
  reponse: ReponseRappel,
  maintenant: Date,
  charge?: ChargeNotification
): ResultatReponse {
  const notification = etat.notification
  if (!notification) {
    return { etat, message: null }
  }
  const maintenantMs = maintenant.getTime()
  const rappel = reglages.rappels.find((candidat) => candidat.id === notification.rappelId)
  const chargeEffective = charge ?? notification.charge
  const compteurs: Record<string, number> = { ...etat.compteursMs }
  let report = etat.report
  let pause = etat.pauseJusquaMs
  let bloque: number | null = null
  let message: ResultatReponse['message'] = null

  if (reponse === 'jeLeFais') {
    compteurs[notification.rappelId] = 0
    if (rappel?.type === 'bouger') {
      pause = maintenantMs + PAUSE_BOUGER_MS
    }
    bloque = maintenantMs + MESSAGE_REPONSE_MS
    message = 'jeLeFais'
    if (report?.rappelId === notification.rappelId) {
      report = null
    }
  } else if (reponse === 'dans5min') {
    report = {
      rappelId: notification.rappelId,
      jusquaMs: maintenantMs + REPORT_CINQ_MIN_MS,
      charge: chargeEffective
    }
    bloque = maintenantMs + MESSAGE_REPONSE_MS
    message = 'dans5min'
  } else if (reponse === 'plusTard') {
    compteurs[notification.rappelId] = 0
    bloque = maintenantMs + MESSAGE_REPONSE_MS
    message = 'plusTard'
    if (report?.rappelId === notification.rappelId) {
      report = null
    }
  } else {
    compteurs[notification.rappelId] = 0
    if (report?.rappelId === notification.rappelId) {
      report = null
    }
  }

  return {
    etat: {
      ...etat,
      compteursMs: compteurs,
      report,
      pauseJusquaMs: pause,
      bloqueJusquaMs: bloque,
      notification: null
    },
    message
  }
}

function choisir(
  etat: EtatMoteur,
  reglages: Reglages,
  maintenantMs: number
): { etat: EtatMoteur; afficher: AffichageDemande | null } {
  if (etat.notification) {
    return { etat: ecarterDejaDus(etat, reglages), afficher: null }
  }
  if (etat.bloqueJusquaMs !== null && maintenantMs < etat.bloqueJusquaMs) {
    return { etat, afficher: null }
  }

  const candidats = listerCandidats(etat, reglages, maintenantMs)
  const dus = candidats.filter((candidat) => candidat.dejaDu)
  const meilleurDu = plusPrioritaire(dus)
  if (!meilleurDu) {
    return { etat, afficher: null }
  }

  const futurs = candidats.filter((candidat) => !candidat.dejaDu)
  const meilleurFutur = plusPrioritaire(futurs)
  if (meilleurFutur && compareRappel(meilleurFutur.rappel, meilleurDu.rappel) < 0) {
    return { etat, afficher: null }
  }

  const compteurs: Record<string, number> = { ...etat.compteursMs }
  for (const candidat of dus) {
    if (candidat.rappel.id === meilleurDu.rappel.id || candidat.snooze) {
      continue
    }
    compteurs[candidat.rappel.id] = 0
  }

  let report = etat.report
  if (meilleurDu.snooze || report?.rappelId === meilleurDu.rappel.id) {
    report = null
  }

  const delaiMs =
    meilleurDu.rappel.type === 'yeux'
      ? AFFICHAGE_NOTIFICATION_YEUX_MS
      : AFFICHAGE_NOTIFICATION_AUTRE_MS
  const notification: NotificationEnCours = {
    rappelId: meilleurDu.rappel.id,
    depuisMs: maintenantMs,
    delaiMs,
    charge: meilleurDu.charge
  }

  return {
    etat: { ...etat, compteursMs: compteurs, report, notification },
    afficher: { rappelId: notification.rappelId, delaiMs, charge: notification.charge }
  }
}

function listerCandidats(etat: EtatMoteur, reglages: Reglages, maintenantMs: number): Candidat[] {
  const candidats: Candidat[] = []
  for (const rappel of rappelsSuivis(reglages)) {
    const periode = periodeMs(rappel)
    if (periode === null) {
      continue
    }
    if (etat.report?.rappelId === rappel.id) {
      if (maintenantMs >= etat.report.jusquaMs) {
        candidats.push({
          rappel,
          dejaDu: true,
          snooze: true,
          charge: etat.report.charge
        })
      }
      continue
    }
    const restant = periode - (etat.compteursMs[rappel.id] ?? 0)
    if (restant <= 0) {
      candidats.push({
        rappel,
        dejaDu: true,
        snooze: false,
        charge: chargeInitiale(rappel, reglages)
      })
    } else if (restant <= FENETRE_PRIORITE_MS) {
      candidats.push({
        rappel,
        dejaDu: false,
        snooze: false,
        charge: chargeInitiale(rappel, reglages)
      })
    }
  }
  return candidats
}

function ecarterDejaDus(etat: EtatMoteur, reglages: Reglages): EtatMoteur {
  const compteurs: Record<string, number> = { ...etat.compteursMs }
  let change = false
  for (const rappel of rappelsSuivis(reglages)) {
    if (rappel.id === etat.notification?.rappelId || rappel.id === etat.report?.rappelId) {
      continue
    }
    const periode = periodeMs(rappel)
    if (periode === null || (compteurs[rappel.id] ?? 0) < periode) {
      continue
    }
    compteurs[rappel.id] = 0
    change = true
  }
  return change ? { ...etat, compteursMs: compteurs } : etat
}

function crediter(
  etat: EtatMoteur,
  reglages: Reglages,
  debutMs: number,
  finMs: number
): EtatMoteur {
  let depuis = debutMs
  let pause = etat.pauseJusquaMs
  if (pause !== null) {
    if (pause > finMs) {
      return etat
    }
    if (pause > depuis) {
      depuis = pause
    }
    pause = null
  }
  const delta = finMs - depuis
  const compteurs: Record<string, number> = { ...etat.compteursMs }
  if (delta > 0) {
    for (const rappel of rappelsSuivis(reglages)) {
      if (etat.notification?.rappelId === rappel.id) {
        continue
      }
      if (etat.report?.rappelId === rappel.id) {
        continue
      }
      compteurs[rappel.id] = (compteurs[rappel.id] ?? 0) + delta
    }
  }
  return { ...etat, compteursMs: compteurs, pauseJusquaMs: pause }
}

function calculerBientot(etat: EtatMoteur, reglages: Reglages): boolean {
  if (etat.notification) {
    return true
  }
  for (const rappel of rappelsSuivis(reglages)) {
    const frequence = rappel.frequenceMin
    const periode = periodeMs(rappel)
    if (frequence === undefined || periode === null || frequence < BIENTOT_FREQUENCE_MIN_MINUTES) {
      continue
    }
    if (etat.report?.rappelId === rappel.id) {
      continue
    }
    const restant = periode - (etat.compteursMs[rappel.id] ?? 0)
    if (restant > 0 && restant <= BIENTOT_AVANT_MS) {
      return true
    }
  }
  return false
}

function rappelsSuivis(reglages: Reglages): Rappel[] {
  return reglages.rappels.filter((rappel) => periodeMs(rappel) !== null)
}

function periodeMs(rappel: Rappel): number | null {
  if (!rappel.actif || rappel.mode !== 'recurrent' || rappel.frequenceMin === undefined) {
    return null
  }
  return rappel.frequenceMin * 60 * 1000
}

function chargeInitiale(rappel: Rappel, reglages: Reglages): ChargeNotification {
  if (rappel.type !== 'bouger') {
    return { assis: false, ideeIndex: null }
  }
  return { assis: reglages.options.mouvementsAssis, ideeIndex: null }
}

function plusPrioritaire(candidats: readonly Candidat[]): Candidat | null {
  let meilleur: Candidat | null = null
  for (const candidat of candidats) {
    if (!meilleur || compareRappel(candidat.rappel, meilleur.rappel) < 0) {
      meilleur = candidat
    }
  }
  return meilleur
}

/** Négatif si `a` passe avant `b`. Moins fréquent d'abord, puis posture, bouger, libre, yeux. */
function compareRappel(a: Rappel, b: Rappel): number {
  const frequenceA = -(a.frequenceMin ?? 0)
  const frequenceB = -(b.frequenceMin ?? 0)
  if (frequenceA !== frequenceB) {
    return frequenceA - frequenceB
  }
  return ORDRE_TYPE[a.type] - ORDRE_TYPE[b.type]
}

function estVeilleActive(reglages: Reglages, maintenantMs: number): boolean {
  if (!reglages.veilleJusqua) {
    return false
  }
  const fin = new Date(reglages.veilleJusqua).getTime()
  return Number.isFinite(fin) && fin > maintenantMs
}

function cloner(etat: EtatMoteur): EtatMoteur {
  return {
    ...etat,
    compteursMs: { ...etat.compteursMs },
    notification: etat.notification
      ? { ...etat.notification, charge: { ...etat.notification.charge } }
      : null,
    report: etat.report ? { ...etat.report, charge: { ...etat.report.charge } } : null
  }
}
