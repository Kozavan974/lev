import { randomUUID } from 'node:crypto'
import { app, ipcMain, nativeTheme, shell, type BrowserWindow } from 'electron'
import textes from '../content/fr.json'
import { choisirInfobulle, decrireReste } from '../partage/compteARebours'
import { formaterInstant } from '../partage/format'
import { versionsTechniquesDepuis } from '../partage/versions'
import {
  CANAL_ECRAN,
  estActionEcran,
  type ActionEcran,
  type EcranApplication,
  type EcranNavigation,
  type EtatEcran,
  type EtatMaj,
  type EtatSequence
} from '../preload/contrat'
import { executerAction, type Annulation } from './actionsReglages'
import { fermerApplication, fenetreApplication, ouvrirApplication } from './applicationFenetre'
import { appliquerSourceTheme } from './theme'
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
import { appliquerResultatMaj, majDisponibleDepuis, verifierMiseAJourDistante } from './misesAJour'
import { ecranApresRelance, suiteApresAccueil } from './demarrage'
import { appliquerDemarrageAutomatique, barreSystemeClaire } from './platform'
import type { Reglages, TypeRappel } from './modeles'
import { notificationEstVisible } from './notificationFenetre'
import { calculerEcheances } from './scheduler/echeances'
import { bientotPourIcone, type EtatMoteur } from './scheduler/moteur'
import { enregistrerReglages, lireReglages } from './store'
import {
  definirEtatIcone,
  definirIconeCompte,
  definirInfobulle,
  definirMenuContextuel,
  type EtatIcone
} from './tray'

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
  ipcMain.handle(CANAL_ECRAN.maj, () => conclureVerificationMaj())
  ipcMain.handle(CANAL_ECRAN.versions, () =>
    versionsTechniquesDepuis({
      version: app.getVersion(),
      electron: process.versions.electron,
      chrome: process.versions.chrome
    })
  )
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

export async function conclureVerificationMaj(): Promise<EtatMaj> {
  const resultat = await verifierMiseAJourDistante(app.getVersion())
  const suivant = appliquerResultatMaj(lireReglages(), resultat, new Date())
  if (suivant) {
    enregistrerReglages(suivant)
    diffuser()
  }
  return resultat
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
  if (action.type === 'revoirAccueil') {
    revoirAccueil()
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
  if (action.type === 'theme') {
    appliquerSourceTheme(resultat.reglages.theme)
  }
  if (action.type === 'option' && action.cle === 'lancerAuDemarrage') {
    appliquerDemarrageAutomatique(resultat.reglages.options.lancerAuDemarrage)
  }
  if (action.type === 'sequences' && action.actif === false) {
    arreterSequences()
    return
  }
  reevaluer()
}

export function mettreEnVeille(duree: '30min' | 'demain'): void {
  agir({ type: 'veille', duree })
}

export function mettreEnReunion(): void {
  agir({ type: 'reunion' })
}

export function reprendreRappels(): void {
  agir({ type: 'reprendre' })
}

export function reprendreReunion(): void {
  agir({ type: 'reprendreReunion' })
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
  if (ecranApresRelance(lireReglages().premierLancementFait) === 'accueil') {
    ecran = 'accueil'
    retourGuide = null
    ouvrirApplication()
    diffuser()
    return
  }
  ouvrirEcran('rappels')
}

function terminerAccueil(suite: 'fermer' | 'rappels'): void {
  const issue = suiteApresAccueil(lireReglages().premierLancementFait, suite)
  if (issue.ecrire) {
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
  }
  ecran = 'rappels'
  retourGuide = null
  if (issue.suite === 'fermer') {
    fermerApplication()
    return
  }
  diffuser()
}

function revoirAccueil(): void {
  ecran = 'accueil'
  retourGuide = null
  ouvrirApplication()
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
  return {
    reglages,
    echeances: calculerEcheances(moteur, reglages, maintenant),
    ...libellesSuspension(reglages, maintenant),
    pauseSpontanee: libellePause(moteur),
    bandeau: bandeauCourant(),
    sequence: etatSequence(moteur, maintenant.getTime()),
    ecran,
    version: app.getVersion(),
    majDisponible: majDisponibleDepuis(reglages, app.getVersion())
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
  const description = decrireReste(serie.finMs, maintenantMs, textes.compte)
  const reste = description?.reste ?? textes.compte.moins
  if (serie.phase === 'pause') {
    return {
      phase: 'pause',
      grande: serie.grandePause,
      heure: formaterInstant(new Date(serie.finMs)),
      reste
    }
  }
  return {
    phase: 'travail',
    rang: serie.rang,
    total: serie.grandePauseApres,
    heure: formaterInstant(new Date(serie.finMs)),
    reste,
    icone: description?.icone ?? '<1'
  }
}

function libellesSuspension(
  reglages: Reglages,
  maintenant: Date
): { veilleLibelle: string | null; reunionLibelle: string | null } {
  const heure = libelleJusqua(reglages.veilleJusqua, maintenant)
  if (heure && reglages.veilleMotif === 'reunion') {
    return { veilleLibelle: null, reunionLibelle: heure }
  }
  return { veilleLibelle: heure, reunionLibelle: null }
}

function libelleJusqua(iso: string | undefined, maintenant: Date): string | null {
  if (!iso) {
    return null
  }
  const fin = new Date(iso).getTime()
  if (!Number.isFinite(fin) || fin <= maintenant.getTime()) {
    return null
  }
  return formaterInstant(new Date(iso))
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
  definirInfobulle(
    choisirInfobulle(
      etat.sequence,
      etat.reunionLibelle,
      etat.veilleLibelle,
      etat.echeances[0]?.heure ?? null,
      {
        travail: textes.tray.sequenceTravail,
        pause: textes.tray.sequencePause,
        grande: textes.tray.sequenceGrande,
        reunion: textes.tray.reunionInfobulle,
        veille: textes.tray.veille,
        prochaine: textes.tray.prochaine,
        repos: textes.tray.infobulle
      }
    )
  )
  const suspendu = etat.veilleLibelle !== null || etat.reunionLibelle !== null
  if (etat.sequence?.phase === 'travail' && !suspendu) {
    definirIconeCompte(etat.sequence.icone, themeBarre())
  } else {
    definirEtatIcone(iconeCourante(etat))
  }
  definirMenuContextuel({
    enVeille: etat.veilleLibelle !== null,
    enReunion: etat.reunionLibelle !== null,
    reunionHeure: etat.reunionLibelle,
    sequencesActives: etat.reglages.sequences.actif,
    sequenceEnCours: etat.sequence !== null
  })
  envoyer(fenetreMenu(), etat)
  envoyer(fenetreApplication(), etat)
}

function iconeCourante(etat: EtatEcran): EtatIcone {
  if (etat.veilleLibelle || etat.reunionLibelle) {
    return 'veille'
  }
  if (notificationEstVisible() || bientotPourIcone(lireEtatMoteur(), etat.reglages, new Date())) {
    return 'bientot'
  }
  return 'calme'
}

function themeBarre(): 'clair' | 'sombre' {
  const claire = barreSystemeClaire()
  if (claire !== null) {
    return claire ? 'clair' : 'sombre'
  }
  return nativeTheme.shouldUseDarkColors ? 'sombre' : 'clair'
}

function envoyer(cible: BrowserWindow | null, etat: EtatEcran): void {
  if (!cible || cible.isDestroyed()) {
    return
  }
  cible.webContents.send(CANAL_ECRAN.etat, etat)
}
