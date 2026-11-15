import { randomUUID } from 'node:crypto'
import { app, ipcMain, shell, type BrowserWindow } from 'electron'
import textes from '../content/fr.json'
import { formaterInstant, remplir } from '../partage/format'
import {
  CANAL_ECRAN,
  estActionEcran,
  type ActionEcran,
  type EcranApplication,
  type EcranNavigation,
  type EtatEcran,
  type EtatSequence
} from '../preload/contrat'
import { executerAction, type Annulation } from './actionsReglages'
import { fermerApplication, fenetreApplication, ouvrirApplication } from './applicationFenetre'
import {
  arreterSequences,
  demanderPauseMaintenant,
  definirApresEvaluation,
  demarrerSequences,
  lireEtatMoteur,
  reevaluer
} from './boucle'
import { fermerMenu, fenetreMenu, recevoirHauteurMenu } from './menuFenetre'
import { lienAutorise } from './liens'
import type { TypeRappel } from './modeles'
import { notificationEstVisible } from './notificationFenetre'
import { calculerEcheances } from './scheduler/echeances'
import { bientotPourIcone, type EtatMoteur } from './scheduler/moteur'
import { enregistrerReglages, lireReglages } from './store'
import { definirEtatIcone, definirInfobulle, definirMenuContextuel, type EtatIcone } from './tray'

let annulation: Annulation | null = null
let branche = false
let ecran: EcranApplication = 'rappels'
let retourGuide: EcranApplication | null = null

export function brancherEcrans(): void {
  if (branche) {
    return
  }
  branche = true
  definirApresEvaluation(diffuser)
  ipcMain.handle(CANAL_ECRAN.lire, () => etatCourant())
  ipcMain.handle(CANAL_ECRAN.lien, async (_evenement, valeur: unknown) => {
    if (typeof valeur !== 'string' || !lienAutorise(valeur)) {
      return false
    }
    try {
      await shell.openExternal(valeur)
      return true
    } catch {
      return false
    }
  })
  ipcMain.on(CANAL_ECRAN.action, (_evenement, valeur: unknown) => {
    if (estActionEcran(valeur)) {
      agir(valeur)
    }
  })
  ipcMain.on(CANAL_ECRAN.fermerMenu, () => {
    fermerMenu()
  })
  ipcMain.on(CANAL_ECRAN.hauteurMenu, (evenement, valeur: unknown) => {
    if (typeof valeur === 'number') {
      recevoirHauteurMenu(evenement.sender.id, valeur)
    }
  })
}

function agir(action: ActionEcran): void {
  if (action.type === 'quitter') {
    app.quit()
    return
  }
  if (action.type === 'ouvrirRappels') {
    ouvrirEcran('rappels')
    return
  }
  if (action.type === 'ouvrirEcran') {
    ouvrirEcran(action.ecran)
    return
  }
  if (action.type === 'terminerAccueil') {
    terminerAccueil(action.suite)
    return
  }
  if (action.type === 'fermerGuide') {
    fermerGuide()
    return
  }
  if (action.type === 'pause') {
    fermerMenu()
    demanderPauseMaintenant()
    return
  }
  if (action.type === 'demarrerSequence') {
    fermerMenu()
    demarrerSequences()
    return
  }
  if (action.type === 'arreterSequences') {
    arreterSequences()
    return
  }
  const resultat = executerAction(lireReglages(), annulation, action, {
    maintenant: new Date(),
    nouvelId: randomUUID(),
    identifiantsBase: identifiantsBase()
  })
  if (!resultat) {
    return
  }
  annulation = resultat.annulation
  enregistrerReglages(resultat.reglages)
  if (action.type === 'sequences' && action.actif === false) {
    arreterSequences()
    return
  }
  reevaluer()
}

export function mettreEnVeilleUneHeure(): void {
  agir({ type: 'veille', duree: '1h' })
}

export function reprendreRappels(): void {
  agir({ type: 'reprendre' })
}

export function ouvrirEcran(cible: EcranNavigation): void {
  fermerMenu()
  if (cible === 'poste' && ecran !== 'poste') {
    retourGuide = fenetreApplication() ? ecran : null
  }
  if (cible !== 'poste') {
    retourGuide = null
  }
  ecran = cible
  ouvrirApplication()
  diffuser()
}

export function ouvrirSiPremierLancement(): void {
  if (lireReglages().premierLancementFait) {
    return
  }
  ecran = 'accueil'
  retourGuide = null
  ouvrirApplication()
  diffuser()
}

export function ouvrirDepuisRelance(): void {
  if (!lireReglages().premierLancementFait) {
    ecran = 'accueil'
    retourGuide = null
    ouvrirApplication()
    diffuser()
    return
  }
  ouvrirEcran('rappels')
}

function terminerAccueil(suite: 'fermer' | 'rappels'): void {
  const resultat = executerAction(
    lireReglages(),
    annulation,
    { type: 'premierLancement' },
    contexteAction()
  )
  if (!resultat) {
    return
  }
  annulation = resultat.annulation
  enregistrerReglages(resultat.reglages)
  ecran = 'rappels'
  retourGuide = null
  if (suite === 'fermer') {
    fermerApplication()
    return
  }
  diffuser()
}

function fermerGuide(): void {
  if (retourGuide && fenetreApplication()) {
    ecran = retourGuide
    retourGuide = null
    diffuser()
    return
  }
  retourGuide = null
  ecran = 'rappels'
  fermerApplication()
}

function contexteAction(): {
  maintenant: Date
  nouvelId: string
  identifiantsBase: Record<TypeRappel, string>
} {
  return {
    maintenant: new Date(),
    nouvelId: randomUUID(),
    identifiantsBase: identifiantsBase()
  }
}

function identifiantsBase(): Record<TypeRappel, string> {
  return {
    yeux: randomUUID(),
    bouger: randomUUID(),
    posture: randomUUID(),
    libre: randomUUID()
  }
}

function etatCourant(): EtatEcran {
  const reglages = lireReglages()
  const maintenant = new Date()
  const moteur = lireEtatMoteur()
  const finVeille = reglages.veilleJusqua ? new Date(reglages.veilleJusqua).getTime() : Number.NaN
  const veilleActive = Number.isFinite(finVeille) && finVeille > maintenant.getTime()
  return {
    reglages,
    echeances: calculerEcheances(moteur, reglages, maintenant),
    veilleLibelle:
      veilleActive && reglages.veilleJusqua
        ? formaterInstant(new Date(reglages.veilleJusqua))
        : null,
    pauseSpontanee: libellePause(moteur),
    bandeau: bandeauCourant(),
    sequence: etatSequence(moteur, maintenant.getTime()),
    ecran,
    version: app.getVersion()
  }
}

function etatSequence(moteur: EtatMoteur, maintenantMs: number): EtatSequence {
  const serie = moteur.serie
  if (!serie) {
    return null
  }
  if (
    moteur.notification?.genre === 'finPause' ||
    (serie.phase === 'pause' && maintenantMs >= serie.finMs)
  ) {
    return { phase: 'reprise' }
  }
  if (serie.phase === 'pause') {
    return {
      phase: 'pause',
      grande: serie.grandePause,
      heure: formaterInstant(new Date(serie.finMs))
    }
  }
  return {
    phase: 'travail',
    rang: serie.rang,
    total: serie.grandePauseApres,
    heure: formaterInstant(new Date(serie.finMs))
  }
}

function libellePause(moteur: EtatMoteur): { heure: string } | null {
  if (!moteur.lignePause) {
    return null
  }
  return { heure: formaterInstant(new Date(moteur.lignePause.leveeMs)) }
}

function bandeauCourant(): EtatEcran['bandeau'] {
  if (!annulation) {
    return null
  }
  if (annulation.genre === 'retrait') {
    return { genre: 'retrait', nom: annulation.rappel.nom }
  }
  return { genre: 'restauration' }
}

function diffuser(): void {
  const etat = etatCourant()
  definirInfobulle(texteInfobulle(etat))
  definirEtatIcone(iconeCourante(etat))
  definirMenuContextuel({
    enVeille: etat.veilleLibelle !== null,
    sequencesActives: etat.reglages.sequences.actif,
    sequenceEnCours: etat.sequence !== null
  })
  envoyer(fenetreMenu(), etat)
  envoyer(fenetreApplication(), etat)
}

function iconeCourante(etat: EtatEcran): EtatIcone {
  if (etat.veilleLibelle) {
    return 'veille'
  }
  if (notificationEstVisible() || bientotPourIcone(lireEtatMoteur(), etat.reglages, new Date())) {
    return 'bientot'
  }
  return 'calme'
}

function texteInfobulle(etat: EtatEcran): string {
  if (etat.veilleLibelle) {
    return remplir(textes.tray.veille, { heure: etat.veilleLibelle })
  }
  const prochaine = etat.echeances[0]
  if (prochaine) {
    return remplir(textes.tray.prochaine, { heure: prochaine.heure })
  }
  return textes.tray.infobulle
}

function envoyer(cible: BrowserWindow | null, etat: EtatEcran): void {
  if (!cible || cible.isDestroyed()) {
    return
  }
  cible.webContents.send(CANAL_ECRAN.etat, etat)
}
