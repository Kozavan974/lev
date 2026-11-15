import { jourDeRepetition, jourLocal } from '../../partage/format'
import {
  frequenceSuperieure,
  type Frequence,
  type Rappel,
  type Reglages,
  type TypeRappel
} from '../modeles'
import {
  ACCALMIE_MAX_MS,
  ACCALMIE_SECONDES,
  AFFICHAGE_DEBUT_SEQUENCE_MS,
  AFFICHAGE_NOTIFICATION_AUTRE_MS,
  AFFICHAGE_NOTIFICATION_YEUX_MS,
  BIENTOT_AVANT_MS,
  BIENTOT_FREQUENCE_MIN_MINUTES,
  FENETRE_PRIORITE_MS,
  HEURE_FIXE_RETARD_MAX_MS,
  LIGNE_PAUSE_SPONTANEE_MS,
  FIN_PAUSE_SANS_REPONSE_MS,
  MESSAGE_REPONSE_MS,
  PAUSE_BOUGER_MS,
  PAUSE_SPONTANEE_SEC,
  REPORT_CINQ_MIN_MS,
  REPORTS_AVANT_QUESTION_RYTHME,
  SEUIL_DEVERROUILLAGE_MS,
  SILENCE_QUESTION_RYTHME_MS
} from './constantes'
import { estDansHoraires } from './horaires'
import {
  bougerDuMilieu,
  creerSerie,
  enchainterTravail,
  estGrande,
  ID_DEBUT_SEQUENCE,
  ID_FIN_PAUSE,
  ID_FIN_SEQUENCE,
  minutesDePause,
  ouvrirPause,
  prolongerPause,
  prolongerTravail,
  type SerieEnCours
} from './sequences'

/** Contenu affiché, conservé tel quel par « Dans 5 min ». */
export interface ChargeNotification {
  assis: boolean
  ideeIndex: number | null
}

export interface DetailSequence {
  rang: number
  total: number
  grandePause: boolean
  pauseMin: number
  repriseMs: number
}

export interface NotificationEnCours {
  genre: 'rappel' | 'rythme' | 'debutSequence' | 'finSequence' | 'finPause'
  rappelId: string
  depuisMs: number
  delaiMs: number
  charge: ChargeNotification
  /** La fin de pause reste affichée : pas d'effacement au bout d'une minute. */
  resteAffichee: boolean
  sequence: DetailSequence | null
}

export interface ReportEnAttente {
  rappelId: string
  jusquaMs: number
  charge: ChargeNotification
}

/** Heure fixe écartée : elle attend la fermeture, puis 2 minutes. */
export interface HeureFixeDifferee {
  rappelId: string
  /** Null tant que la notification en cours n'est pas fermée. */
  pasAvantMs: number | null
}

/** Inactivité d'au moins 3 minutes, en attente du retour. */
export interface AbsenceSpontanee {
  leveeMs: number
}

/** Ligne du menu après une pause spontanée. */
export interface LignePauseSpontanee {
  leveeMs: number
  jusquaMs: number
}

export type GenreAttente = 'pleinEcran' | 'accalmie'

/** Rappel dû, retenu par le plein écran ou par l'attente d'une accalmie. */
export interface AttenteAffichage {
  depuisMs: number
  genre: GenreAttente
  rappelId: string
}

export type CadenceMoteur = 'normale' | 'accalmie'

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
  heureFixeDifferee: HeureFixeDifferee | null
  absence: AbsenceSpontanee | null
  lignePause: LignePauseSpontanee | null
  attente: AttenteAffichage | null
  /** Série de travail en cours. Absente du fichier de réglages. */
  serie: SerieEnCours | null
}

export interface EntreeMoteur {
  maintenant: Date
  /** Secondes depuis la dernière frappe ou le dernier mouvement de souris. */
  inactiviteSec: number
  sessionOuverte: boolean
  reveil: boolean
  /** Plein écran ou mode présentation, mesuré par la plateforme. */
  pleinEcran?: boolean
}

export interface AffichageDemande {
  rappelId: string
  delaiMs: number
  charge: ChargeNotification
}

/** Écriture à faire dans les réglages : déclenchement, ou abandon du jour. */
export interface EffetHeureFixe {
  rappelId: string
  dernierDeclenchement: string
  desactiver: boolean
}

export interface DecisionMoteur {
  etat: EtatMoteur
  afficher: AffichageDemande | null
  bientot: boolean
  effets: readonly EffetHeureFixe[]
  cadence: CadenceMoteur
  /** Vrai quand un rappel est à échéance et que l'option plein écran est active. */
  sonderPleinEcran: boolean
  /** La fin de pause a atteint 15 minutes sans réponse : fermer la carte. */
  fermerNotification: boolean
}

export type ReponseRappel =
  | 'jeLeFais'
  | 'dans5min'
  | 'plusTard'
  | 'aucune'
  | 'ouiRythme'
  | 'garderRythme'
  | 'cestReparti'
  | 'encore5min'
  | 'arreterSequences'

/** Écriture du compteur de reports, de la fréquence, ou de la date de silence. */
export interface EffetAdaptation {
  rappelId: string
  reportsDeSuite: number
  frequenceMin?: Frequence
  /** null retire la date. Une chaîne la pose. Absent : la date reste. */
  neRienProposerAvant?: string | null
}

export interface ResultatReponse {
  etat: EtatMoteur
  message: 'jeLeFais' | 'dans5min' | 'plusTard' | null
  effet?: EffetAdaptation
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
    report: null,
    heureFixeDifferee: null,
    absence: null,
    lignePause: null,
    attente: null,
    serie: null
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

  const finPauseTenue = courant.notification?.genre === 'finPause'
  if (peutCrediter && !finPauseTenue && courant.dernierInstantMs !== null) {
    courant = crediter(courant, reglages, courant.dernierInstantMs, maintenantMs)
  } else if (
    !finPauseTenue &&
    courant.pauseJusquaMs !== null &&
    maintenantMs >= courant.pauseJusquaMs
  ) {
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
  courant = traiterPauseSpontanee(courant, reglages, entree, maintenantMs)

  if (
    courant.notification?.genre === 'finPause' &&
    maintenantMs - courant.notification.depuisMs >= FIN_PAUSE_SANS_REPONSE_MS
  ) {
    return finir(
      arreterSerie(courant),
      null,
      [],
      'normale',
      false,
      reglages,
      entree.maintenant,
      true
    )
  }

  const sequence = montrerSequence(courant, reglages, entree, enVeille)
  if (sequence) {
    return sequence
  }

  const resolution = resoudreHeureFixe(courant, reglages, entree, enVeille)

  if (resolution.afficher) {
    return conclure(
      ecarterDejaDus(resolution.etat, reglages),
      resolution.etatSansAffichage,
      resolution.afficher,
      resolution.effets,
      resolution.effetsSansAffichage,
      reglages,
      entree
    )
  }

  let suivant = resolution.etat
  if (suivant.notification) {
    suivant = ecarterDejaDus(suivant, reglages)
  }

  if (resolution.bloqueRecurrents || suivant.absence) {
    return conclure(suivant, suivant, null, resolution.effets, resolution.effets, reglages, entree)
  }

  const choix = choisir(suivant, reglages, maintenantMs)
  return conclure(
    choix.etat,
    choix.etatSansAffichage,
    choix.afficher,
    resolution.effets,
    resolution.effets,
    reglages,
    entree
  )
}

/** Affiche tout de suite le rappel « bouger », même décoché ou hors horaires. */
export function poserPauseImmediate(
  etat: EtatMoteur,
  reglages: Reglages,
  maintenant: Date
): { etat: EtatMoteur; afficher: AffichageDemande } | null {
  const maintenantMs = maintenant.getTime()
  if (etat.notification) {
    return null
  }
  if (etat.bloqueJusquaMs !== null && maintenantMs < etat.bloqueJusquaMs) {
    return null
  }
  const bouger = reglages.rappels.find((rappel) => rappel.type === 'bouger')
  if (!bouger) {
    return null
  }
  const charge = chargeInitiale(bouger, reglages)
  const notification = notificationRappel(
    bouger.id,
    maintenantMs,
    AFFICHAGE_NOTIFICATION_AUTRE_MS,
    charge
  )
  const report = etat.report?.rappelId === bouger.id ? null : etat.report
  return {
    etat: { ...etat, notification, report, attente: null, lignePause: null },
    afficher: { rappelId: bouger.id, delaiMs: notification.delaiMs, charge }
  }
}

export function appliquerAdaptation(reglages: Reglages, effet: EffetAdaptation): Reglages {
  return {
    ...reglages,
    rappels: reglages.rappels.map((rappel) => {
      if (rappel.id !== effet.rappelId) {
        return rappel
      }
      const suivant: Rappel = { ...rappel, reportsDeSuite: effet.reportsDeSuite }
      if (effet.frequenceMin !== undefined) {
        suivant.frequenceMin = effet.frequenceMin
      }
      if (effet.neRienProposerAvant === null) {
        delete suivant.neRienProposerAvant
      } else if (effet.neRienProposerAvant !== undefined) {
        suivant.neRienProposerAvant = effet.neRienProposerAvant
      }
      return suivant
    })
  }
}

export function appliquerEffets(reglages: Reglages, effets: readonly EffetHeureFixe[]): Reglages {
  if (effets.length === 0) {
    return reglages
  }
  const parId = new Map(effets.map((effet) => [effet.rappelId, effet]))
  return {
    ...reglages,
    rappels: reglages.rappels.map((rappel) => {
      const effet = parId.get(rappel.id)
      if (!effet) {
        return rappel
      }
      const suivant: Rappel = { ...rappel, dernierDeclenchement: effet.dernierDeclenchement }
      if (effet.desactiver) {
        suivant.actif = false
      }
      return suivant
    })
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
  if (notification.genre === 'debutSequence') {
    return { etat: { ...etat, notification: null }, message: null }
  }
  if (notification.genre === 'finSequence') {
    return repondreFinSequence(etat, reglages, reponse, maintenantMs)
  }
  if (notification.genre === 'finPause') {
    return repondreFinPause(etat, reponse, maintenantMs)
  }
  if (notification.genre === 'rythme') {
    return repondreRythme(etat, reglages, reponse, maintenantMs)
  }
  if (reponse === 'ouiRythme' || reponse === 'garderRythme') {
    return { etat, message: null }
  }
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

  const effet = effetReport(rappel, reglages, reponse)
  return {
    etat: {
      ...etat,
      compteursMs: compteurs,
      report,
      pauseJusquaMs: pause,
      bloqueJusquaMs: bloque,
      notification: null
    },
    message,
    ...(effet ? { effet } : {})
  }
}

function conclure(
  etatAffiche: EtatMoteur,
  etatRetenu: EtatMoteur,
  afficher: AffichageDemande | null,
  effetsAffiche: readonly EffetHeureFixe[],
  effetsRetenu: readonly EffetHeureFixe[],
  reglages: Reglages,
  entree: EntreeMoteur
): DecisionMoteur {
  const maintenantMs = entree.maintenant.getTime()
  if (!afficher) {
    return finir(
      { ...etatRetenu, attente: null },
      null,
      effetsRetenu,
      'normale',
      false,
      reglages,
      entree.maintenant
    )
  }

  if (reglages.options.nePasDeranger && entree.pleinEcran === true) {
    return finir(
      {
        ...etatRetenu,
        attente: poursuivreAttente(etatRetenu, maintenantMs, 'pleinEcran', afficher.rappelId)
      },
      null,
      effetsRetenu,
      'normale',
      true,
      reglages,
      entree.maintenant
    )
  }

  if (reglages.options.attendreAccalmie && entree.inactiviteSec < ACCALMIE_SECONDES) {
    const attente = poursuivreAttente(etatRetenu, maintenantMs, 'accalmie', afficher.rappelId)
    if (maintenantMs - attente.depuisMs < ACCALMIE_MAX_MS) {
      return finir(
        { ...etatRetenu, attente },
        null,
        effetsRetenu,
        'accalmie',
        reglages.options.nePasDeranger,
        reglages,
        entree.maintenant
      )
    }
  }

  const rappel = reglages.rappels.find((candidat) => candidat.id === afficher.rappelId)
  return finir(
    {
      ...etatAffiche,
      attente: null,
      lignePause: rappel?.type === 'bouger' ? null : etatAffiche.lignePause
    },
    afficher,
    effetsAffiche,
    'normale',
    reglages.options.nePasDeranger,
    reglages,
    entree.maintenant
  )
}

function finir(
  etat: EtatMoteur,
  afficher: AffichageDemande | null,
  effets: readonly EffetHeureFixe[],
  cadence: CadenceMoteur,
  sonderPleinEcran: boolean,
  reglages: Reglages,
  maintenant: Date,
  fermerNotification = false
): DecisionMoteur {
  return {
    etat,
    afficher,
    bientot: bientotPourIcone(etat, reglages, maintenant),
    effets,
    cadence,
    sonderPleinEcran,
    fermerNotification
  }
}

/** Pastille « bientôt » : veille exclue, la fenêtre visible se juge ailleurs. */
export function bientotPourIcone(etat: EtatMoteur, reglages: Reglages, maintenant: Date): boolean {
  if (etat.notification || etat.attente) {
    return true
  }
  return (
    calculerBientot(etat, reglages) ||
    heureFixeProche(reglages, maintenant) ||
    bientotSerie(etat, maintenant.getTime())
  )
}

function poursuivreAttente(
  etat: EtatMoteur,
  maintenantMs: number,
  genre: GenreAttente,
  rappelId: string
): AttenteAffichage {
  const precedente = etat.attente
  if (precedente?.genre === genre) {
    return { depuisMs: precedente.depuisMs, genre, rappelId }
  }
  return { depuisMs: maintenantMs, genre, rappelId }
}

function traiterPauseSpontanee(
  etat: EtatMoteur,
  reglages: Reglages,
  entree: EntreeMoteur,
  maintenantMs: number
): EtatMoteur {
  let courant = etat
  if (!reglages.options.pausesSpontanees) {
    if (courant.absence) {
      courant = { ...courant, absence: null }
    }
    return expirerLigne(courant, reglages, maintenantMs)
  }
  if (!entree.sessionOuverte) {
    if (courant.absence) {
      courant = remettreRecurrentsAZero(courant, reglages)
      courant = { ...courant, absence: null }
    }
    return expirerLigne(courant, reglages, maintenantMs)
  }
  if (entree.inactiviteSec >= PAUSE_SPONTANEE_SEC) {
    if (!courant.absence) {
      courant = {
        ...courant,
        absence: { leveeMs: maintenantMs - entree.inactiviteSec * 1000 }
      }
    }
    return expirerLigne(courant, reglages, maintenantMs)
  }
  if (courant.absence) {
    const leveeMs = courant.absence.leveeMs
    courant = remettreRecurrentsAZero(courant, reglages)
    courant = {
      ...courant,
      absence: null,
      lignePause: ligneSiBougerActif(reglages, leveeMs, maintenantMs)
    }
  }
  return expirerLigne(courant, reglages, maintenantMs)
}

/** Les récurrents seulement. L'heure de fin de la série vit sur `serie` et ne bouge pas ici. */
function remettreRecurrentsAZero(etat: EtatMoteur, reglages: Reglages): EtatMoteur {
  const compteurs: Record<string, number> = { ...etat.compteursMs }
  for (const rappel of reglages.rappels) {
    if (rappel.mode === 'recurrent') {
      delete compteurs[rappel.id]
    }
  }
  return { ...etat, compteursMs: compteurs }
}

function ligneSiBougerActif(
  reglages: Reglages,
  leveeMs: number,
  maintenantMs: number
): LignePauseSpontanee | null {
  const bougerActif = reglages.rappels.some((rappel) => rappel.type === 'bouger' && rappel.actif)
  if (!bougerActif) {
    return null
  }
  return { leveeMs, jusquaMs: maintenantMs + LIGNE_PAUSE_SPONTANEE_MS }
}

function expirerLigne(etat: EtatMoteur, reglages: Reglages, maintenantMs: number): EtatMoteur {
  const ligne = etat.lignePause
  if (!ligne) {
    return etat
  }
  const bougerActif = reglages.rappels.some((rappel) => rappel.type === 'bouger' && rappel.actif)
  if (!bougerActif || maintenantMs >= ligne.jusquaMs) {
    return { ...etat, lignePause: null }
  }
  return etat
}

function heureFixeProche(reglages: Reglages, maintenant: Date): boolean {
  const maintenantMs = maintenant.getTime()
  for (const rappel of reglages.rappels) {
    if (!rappel.actif || rappel.mode !== 'heure' || !rappel.heure || !rappel.repetition) {
      continue
    }
    for (const delta of [-1, 0]) {
      const occurrence = lireOccurrence(rappel, maintenant, delta)
      if (!occurrence) {
        continue
      }
      const ecart = occurrence.prevuMs - maintenantMs
      if (ecart > 0 && ecart <= FENETRE_PRIORITE_MS) {
        return true
      }
      if (ecart <= 0 && maintenantMs < occurrence.prevuMs + HEURE_FIXE_RETARD_MAX_MS) {
        return true
      }
    }
  }
  return false
}

function choisir(
  etat: EtatMoteur,
  reglages: Reglages,
  maintenantMs: number
): { etat: EtatMoteur; etatSansAffichage: EtatMoteur; afficher: AffichageDemande | null } {
  if (etat.notification) {
    const suivant = ecarterDejaDus(etat, reglages)
    return { etat: suivant, etatSansAffichage: suivant, afficher: null }
  }
  if (etat.absence || (etat.bloqueJusquaMs !== null && maintenantMs < etat.bloqueJusquaMs)) {
    return { etat, etatSansAffichage: etat, afficher: null }
  }

  const candidats = listerCandidats(etat, reglages, maintenantMs)
  const dus = candidats.filter((candidat) => candidat.dejaDu)
  const meilleurDu = plusPrioritaire(dus)
  if (!meilleurDu) {
    return { etat, etatSansAffichage: etat, afficher: null }
  }

  const futurs = candidats.filter((candidat) => !candidat.dejaDu)
  const meilleurFutur = plusPrioritaire(futurs)
  if (meilleurFutur && compareRappel(meilleurFutur.rappel, meilleurDu.rappel) < 0) {
    return { etat, etatSansAffichage: etat, afficher: null }
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

  const rythme = !meilleurDu.snooze && questionDue(meilleurDu.rappel, reglages, maintenantMs)
  const delaiMs =
    rythme || meilleurDu.rappel.type !== 'yeux'
      ? AFFICHAGE_NOTIFICATION_AUTRE_MS
      : AFFICHAGE_NOTIFICATION_YEUX_MS
  const notification = notificationRappel(
    meilleurDu.rappel.id,
    maintenantMs,
    delaiMs,
    meilleurDu.charge,
    rythme ? 'rythme' : 'rappel'
  )
  let serie = etat.serie
  if (serie && meilleurDu.rappel.type === 'bouger' && bougerDuMilieu(serie, maintenantMs)) {
    serie = { ...serie, bougerMilieuPropose: true }
  }

  return {
    etat: { ...etat, serie, compteursMs: compteurs, report, notification },
    etatSansAffichage: etat,
    afficher: { rappelId: notification.rappelId, delaiMs, charge: notification.charge }
  }
}

function listerCandidats(etat: EtatMoteur, reglages: Reglages, maintenantMs: number): Candidat[] {
  const candidats: Candidat[] = []
  const report = etat.report
  if (report && maintenantMs >= report.jusquaMs) {
    const reporte = reglages.rappels.find((rappel) => rappel.id === report.rappelId)
    if (reporte) {
      candidats.push({
        rappel: reporte,
        dejaDu: true,
        snooze: true,
        charge: report.charge
      })
    }
  }
  for (const rappel of rappelsSuivis(reglages)) {
    if (report?.rappelId === rappel.id) {
      continue
    }
    if (rappel.type === 'bouger' && etat.serie?.phase === 'travail') {
      if (!bougerDuMilieu(etat.serie, maintenantMs)) {
        continue
      }
      candidats.push({
        rappel,
        dejaDu: true,
        snooze: false,
        charge: chargeInitiale(rappel, reglages)
      })
      continue
    }
    const periode = periodeMs(rappel)
    if (periode === null) {
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
  const frequenceA = a.mode === 'heure' ? -1_000_000 : -(a.frequenceMin ?? 0)
  const frequenceB = b.mode === 'heure' ? -1_000_000 : -(b.frequenceMin ?? 0)
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
    report: etat.report ? { ...etat.report, charge: { ...etat.report.charge } } : null,
    heureFixeDifferee: etat.heureFixeDifferee ? { ...etat.heureFixeDifferee } : null,
    absence: etat.absence ? { ...etat.absence } : null,
    lignePause: etat.lignePause ? { ...etat.lignePause } : null,
    attente: etat.attente ? { ...etat.attente } : null,
    serie: etat.serie ? { ...etat.serie } : null,
    notification: etat.notification
      ? {
          ...etat.notification,
          charge: { ...etat.notification.charge },
          sequence: etat.notification.sequence ? { ...etat.notification.sequence } : null
        }
      : null
  }
}

interface OccurrenceHeure {
  rappel: Rappel
  prevuMs: number
  cle: string
}

interface ResolutionHeure {
  etat: EtatMoteur
  etatSansAffichage: EtatMoteur
  effets: EffetHeureFixe[]
  effetsSansAffichage: EffetHeureFixe[]
  afficher: AffichageDemande | null
  bloqueRecurrents: boolean
}

function resoudreHeureFixe(
  etat: EtatMoteur,
  reglages: Reglages,
  entree: EntreeMoteur,
  enVeille: boolean
): ResolutionHeure {
  const maintenantMs = entree.maintenant.getTime()
  const retenu = !entree.sessionOuverte || enVeille
  const dedans: OccurrenceHeure[] = []
  const avant: OccurrenceHeure[] = []
  const effets: EffetHeureFixe[] = []

  for (const rappel of reglages.rappels) {
    if (!rappel.actif || rappel.mode !== 'heure' || !rappel.heure || !rappel.repetition) {
      continue
    }
    for (const delta of [-1, 0]) {
      const occurrence = lireOccurrence(rappel, entree.maintenant, delta)
      if (!occurrence) {
        continue
      }
      const fin = occurrence.prevuMs + HEURE_FIXE_RETARD_MAX_MS
      const accalmieEngagee =
        delta === 0 && etat.attente?.genre === 'accalmie' && etat.attente.rappelId === rappel.id
      if (maintenantMs < occurrence.prevuMs) {
        if (delta === 0) {
          avant.push(occurrence)
        }
      } else if (maintenantMs < fin || accalmieEngagee) {
        dedans.push(occurrence)
      } else if (delta === 0) {
        effets.push(effetDe(rappel, occurrence.cle))
      }
    }
  }

  dedans.sort((a, b) => a.prevuMs - b.prevuMs)
  const principal = dedans[0]
  const proche =
    avant.some((occurrence) => occurrence.prevuMs - maintenantMs <= FENETRE_PRIORITE_MS) ||
    dedans.length > 0

  if (!principal) {
    return resolutionFermee({
      etat: { ...etat, heureFixeDifferee: null },
      effets,
      afficher: null,
      bloqueRecurrents: !retenu && proche
    })
  }

  if (retenu) {
    return resolutionFermee({
      etat,
      effets,
      afficher: null,
      bloqueRecurrents: false
    })
  }

  if (!peutAfficher(etat, maintenantMs)) {
    return resolutionFermee({
      etat: {
        ...etat,
        heureFixeDifferee: { rappelId: principal.rappel.id, pasAvantMs: null }
      },
      effets,
      afficher: null,
      bloqueRecurrents: true
    })
  }

  const differee = etat.heureFixeDifferee
  if (differee?.rappelId === principal.rappel.id && differee.pasAvantMs === null) {
    return resolutionFermee({
      etat: {
        ...etat,
        heureFixeDifferee: {
          rappelId: principal.rappel.id,
          pasAvantMs: maintenantMs + FENETRE_PRIORITE_MS
        }
      },
      effets,
      afficher: null,
      bloqueRecurrents: true
    })
  }
  if (
    differee?.rappelId === principal.rappel.id &&
    differee.pasAvantMs !== null &&
    maintenantMs < differee.pasAvantMs
  ) {
    return resolutionFermee({
      etat,
      effets,
      afficher: null,
      bloqueRecurrents: true
    })
  }

  const charge = chargeInitiale(principal.rappel, reglages)
  const notification = notificationRappel(
    principal.rappel.id,
    maintenantMs,
    AFFICHAGE_NOTIFICATION_AUTRE_MS,
    charge
  )
  const suivant = dedans[1]
  const report = etat.report?.rappelId === principal.rappel.id ? null : etat.report
  return {
    etat: {
      ...etat,
      report,
      notification,
      heureFixeDifferee: suivant ? { rappelId: suivant.rappel.id, pasAvantMs: null } : null
    },
    etatSansAffichage: etat,
    effets: [...effets, effetDe(principal.rappel, principal.cle)],
    effetsSansAffichage: effets,
    afficher: { rappelId: principal.rappel.id, delaiMs: notification.delaiMs, charge },
    bloqueRecurrents: false
  }
}

function resolutionFermee(
  resolution: Omit<ResolutionHeure, 'etatSansAffichage' | 'effetsSansAffichage'>
): ResolutionHeure {
  return {
    ...resolution,
    etatSansAffichage: resolution.etat,
    effetsSansAffichage: resolution.effets
  }
}

function lireOccurrence(
  rappel: Rappel,
  maintenant: Date,
  deltaJours: number
): OccurrenceHeure | null {
  if (!rappel.heure || !rappel.repetition) {
    return null
  }
  const [heures, minutes] = rappel.heure.split(':').map(Number)
  const jour = new Date(
    maintenant.getFullYear(),
    maintenant.getMonth(),
    maintenant.getDate() + deltaJours,
    heures,
    minutes,
    0,
    0
  )
  if (!jourDeRepetition(rappel.repetition, jour)) {
    return null
  }
  const cle = jourLocal(jour)
  if (rappel.dernierDeclenchement === cle) {
    return null
  }
  return { rappel, prevuMs: jour.getTime(), cle }
}

function effetDe(rappel: Rappel, cle: string): EffetHeureFixe {
  return {
    rappelId: rappel.id,
    dernierDeclenchement: cle,
    desactiver: rappel.repetition === 'une'
  }
}

function peutAfficher(etat: EtatMoteur, maintenantMs: number): boolean {
  if (etat.notification) {
    return false
  }
  if (etat.bloqueJusquaMs !== null && maintenantMs < etat.bloqueJusquaMs) {
    return false
  }
  return true
}

const CHARGE_VIDE: ChargeNotification = { assis: false, ideeIndex: null }

export function demarrerSerie(
  etat: EtatMoteur,
  reglages: Reglages,
  maintenant: Date
): EtatMoteur | null {
  if (etat.serie) {
    return null
  }
  const serie = creerSerie(reglages.sequences, maintenant.getTime())
  if (!serie) {
    return null
  }
  return {
    ...etat,
    serie,
    attente: null,
    notification: notificationDebut(maintenant.getTime())
  }
}

export function arreterSerie(etat: EtatMoteur): EtatMoteur {
  const genre = etat.notification?.genre
  const attenteId = etat.attente?.rappelId
  return {
    ...etat,
    serie: null,
    notification:
      genre === 'debutSequence' || genre === 'finSequence' || genre === 'finPause'
        ? null
        : etat.notification,
    attente: attenteId === ID_FIN_SEQUENCE || attenteId === ID_FIN_PAUSE ? null : etat.attente,
    pauseJusquaMs: etat.serie?.phase === 'pause' ? null : etat.pauseJusquaMs
  }
}

function montrerSequence(
  etat: EtatMoteur,
  reglages: Reglages,
  entree: EntreeMoteur,
  enVeille: boolean
): DecisionMoteur | null {
  const maintenantMs = entree.maintenant.getTime()
  const serie = etat.serie
  if (!serie || maintenantMs < serie.finMs) {
    return null
  }
  const genre = etat.notification?.genre
  if (genre === 'finSequence' || genre === 'finPause') {
    return null
  }
  const retenu = !entree.sessionOuverte || enVeille
  if (retenu || etat.absence || !peutAfficher(etat, maintenantMs)) {
    return null
  }

  const notification = notificationDeSequence(serie, maintenantMs)
  const resolution = resoudreHeureFixe({ ...etat, notification }, reglages, entree, enVeille)
  const etatAffiche = ecarterDejaDus(
    {
      ...resolution.etat,
      notification,
      serie: notification.genre === 'finSequence' ? { ...serie, bougerMilieuPropose: true } : serie
    },
    reglages
  )
  return conclure(
    etatAffiche,
    etat,
    { rappelId: notification.rappelId, delaiMs: notification.delaiMs, charge: notification.charge },
    resolution.effets,
    resolution.effetsSansAffichage,
    reglages,
    entree
  )
}

function notificationDebut(depuisMs: number): NotificationEnCours {
  return {
    genre: 'debutSequence',
    rappelId: ID_DEBUT_SEQUENCE,
    depuisMs,
    delaiMs: AFFICHAGE_DEBUT_SEQUENCE_MS,
    charge: CHARGE_VIDE,
    resteAffichee: false,
    sequence: null
  }
}

function notificationRappel(
  rappelId: string,
  depuisMs: number,
  delaiMs: number,
  charge: ChargeNotification,
  genre: 'rappel' | 'rythme' = 'rappel'
): NotificationEnCours {
  return {
    genre,
    rappelId,
    depuisMs,
    delaiMs,
    charge,
    resteAffichee: false,
    sequence: null
  }
}

function questionDue(rappel: Rappel, reglages: Reglages, maintenantMs: number): boolean {
  if (!reglages.options.proposerEspacer || rappel.mode !== 'recurrent') {
    return false
  }
  const frequence = rappel.frequenceMin
  if (frequence === undefined || frequenceSuperieure(frequence) === null) {
    return false
  }
  if (rappel.reportsDeSuite < REPORTS_AVANT_QUESTION_RYTHME) {
    return false
  }
  return !silenceEnCours(rappel, maintenantMs)
}

function silenceEnCours(rappel: Rappel, maintenantMs: number): boolean {
  if (!rappel.neRienProposerAvant) {
    return false
  }
  const fin = new Date(rappel.neRienProposerAvant).getTime()
  return Number.isFinite(fin) && fin > maintenantMs
}

function effetReport(
  rappel: Rappel | undefined,
  reglages: Reglages,
  reponse: ReponseRappel
): EffetAdaptation | undefined {
  if (!rappel || rappel.mode !== 'recurrent') {
    return undefined
  }
  if (reponse === 'jeLeFais') {
    return rappel.reportsDeSuite === 0 ? undefined : { rappelId: rappel.id, reportsDeSuite: 0 }
  }
  if (!reglages.options.proposerEspacer) {
    return undefined
  }
  if (reponse === 'plusTard') {
    return { rappelId: rappel.id, reportsDeSuite: rappel.reportsDeSuite + 1 }
  }
  if (reponse === 'aucune' && rappel.type !== 'yeux') {
    return { rappelId: rappel.id, reportsDeSuite: rappel.reportsDeSuite + 1 }
  }
  return undefined
}

function repondreRythme(
  etat: EtatMoteur,
  reglages: Reglages,
  reponse: ReponseRappel,
  maintenantMs: number
): ResultatReponse {
  const notification = etat.notification
  if (!notification) {
    return { etat, message: null }
  }
  const rappel = reglages.rappels.find((candidat) => candidat.id === notification.rappelId)
  const ferme: EtatMoteur = { ...etat, notification: null }
  if (!rappel || rappel.frequenceMin === undefined) {
    return { etat: ferme, message: null }
  }
  if (reponse === 'ouiRythme') {
    const suivante = frequenceSuperieure(rappel.frequenceMin)
    if (!suivante) {
      return { etat: ferme, message: null }
    }
    return {
      etat: { ...ferme, compteursMs: { ...etat.compteursMs, [rappel.id]: 0 } },
      message: null,
      effet: {
        rappelId: rappel.id,
        reportsDeSuite: 0,
        frequenceMin: suivante,
        neRienProposerAvant: null
      }
    }
  }
  if (reponse === 'garderRythme') {
    return {
      etat: { ...ferme, compteursMs: { ...etat.compteursMs, [rappel.id]: 0 } },
      message: null,
      effet: {
        rappelId: rappel.id,
        reportsDeSuite: rappel.reportsDeSuite,
        neRienProposerAvant: new Date(maintenantMs + SILENCE_QUESTION_RYTHME_MS).toISOString()
      }
    }
  }
  if (reponse === 'aucune') {
    return {
      etat: ferme,
      message: null,
      effet: { rappelId: rappel.id, reportsDeSuite: 0 }
    }
  }
  return { etat, message: null }
}

function notificationDeSequence(serie: SerieEnCours, maintenantMs: number): NotificationEnCours {
  if (serie.phase === 'pause') {
    return {
      genre: 'finPause',
      rappelId: ID_FIN_PAUSE,
      depuisMs: maintenantMs,
      delaiMs: 0,
      charge: CHARGE_VIDE,
      resteAffichee: true,
      sequence: null
    }
  }
  const pauseMin = minutesDePause(serie)
  return {
    genre: 'finSequence',
    rappelId: ID_FIN_SEQUENCE,
    depuisMs: maintenantMs,
    delaiMs: AFFICHAGE_NOTIFICATION_AUTRE_MS,
    charge: CHARGE_VIDE,
    resteAffichee: false,
    sequence: {
      rang: serie.rang,
      total: serie.grandePauseApres,
      grandePause: estGrande(serie),
      pauseMin,
      repriseMs: maintenantMs + pauseMin * 60 * 1000
    }
  }
}

function repondreFinSequence(
  etat: EtatMoteur,
  reglages: Reglages,
  reponse: ReponseRappel,
  maintenantMs: number
): ResultatReponse {
  const serie = etat.serie
  if (!serie) {
    return { etat: { ...etat, notification: null }, message: null }
  }
  if (reponse === 'arreterSequences') {
    return { etat: arreterSerie(etat), message: null }
  }
  if (reponse === 'jeLeFais') {
    const suivante = ouvrirPause(serie, maintenantMs)
    const compteurs: Record<string, number> = { ...etat.compteursMs }
    const bouger = reglages.rappels.find((rappel) => rappel.type === 'bouger')
    if (bouger) {
      compteurs[bouger.id] = 0
    }
    const pause =
      etat.pauseJusquaMs !== null && etat.pauseJusquaMs > suivante.finMs
        ? etat.pauseJusquaMs
        : suivante.finMs
    return {
      etat: {
        ...etat,
        compteursMs: compteurs,
        notification: null,
        bloqueJusquaMs: maintenantMs + MESSAGE_REPONSE_MS,
        pauseJusquaMs: pause,
        serie: suivante
      },
      message: 'jeLeFais'
    }
  }
  if (reponse === 'dans5min') {
    return {
      etat: {
        ...etat,
        notification: null,
        bloqueJusquaMs: maintenantMs + MESSAGE_REPONSE_MS,
        serie: prolongerTravail(serie, maintenantMs, REPORT_CINQ_MIN_MS)
      },
      message: 'dans5min'
    }
  }
  if (reponse === 'plusTard' || reponse === 'aucune') {
    return {
      etat: {
        ...etat,
        notification: null,
        bloqueJusquaMs: reponse === 'plusTard' ? maintenantMs + MESSAGE_REPONSE_MS : null,
        serie: enchainterTravail(serie, maintenantMs)
      },
      message: reponse === 'plusTard' ? 'plusTard' : null
    }
  }
  return { etat, message: null }
}

function repondreFinPause(
  etat: EtatMoteur,
  reponse: ReponseRappel,
  maintenantMs: number
): ResultatReponse {
  const serie = etat.serie
  if (!serie) {
    return { etat: { ...etat, notification: null }, message: null }
  }
  if (reponse === 'arreterSequences') {
    return { etat: arreterSerie(etat), message: null }
  }
  if (reponse === 'encore5min') {
    const fin = maintenantMs + REPORT_CINQ_MIN_MS
    return {
      etat: {
        ...etat,
        notification: null,
        bloqueJusquaMs: maintenantMs + MESSAGE_REPONSE_MS,
        pauseJusquaMs: fin,
        serie: prolongerPause(serie, maintenantMs, REPORT_CINQ_MIN_MS)
      },
      message: 'dans5min'
    }
  }
  if (reponse === 'cestReparti') {
    return {
      etat: {
        ...etat,
        notification: null,
        pauseJusquaMs:
          etat.pauseJusquaMs !== null && etat.pauseJusquaMs > maintenantMs
            ? etat.pauseJusquaMs
            : null,
        serie: enchainterTravail(serie, maintenantMs)
      },
      message: null
    }
  }
  return { etat, message: null }
}

function bientotSerie(etat: EtatMoteur, maintenantMs: number): boolean {
  const serie = etat.serie
  if (!serie || serie.phase !== 'travail') {
    return false
  }
  if (serie.travailMin < BIENTOT_FREQUENCE_MIN_MINUTES) {
    return false
  }
  const restant = serie.finMs - maintenantMs
  return restant > 0 && restant <= BIENTOT_AVANT_MS
}
