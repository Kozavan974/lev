import { randomUUID } from 'node:crypto'
import { app, ipcMain, type BrowserWindow } from 'electron'
import textes from '../content/fr.json'
import { formaterInstant, remplir } from '../partage/format'
import { CANAL_ECRAN, estActionEcran, type ActionEcran, type EtatEcran } from '../preload/contrat'
import { executerAction, type Annulation } from './actionsReglages'
import { fenetreApplication, ouvrirApplication } from './applicationFenetre'
import {
  demanderPauseMaintenant,
  definirApresEvaluation,
  lireEtatMoteur,
  reevaluer
} from './boucle'
import { fermerMenu, fenetreMenu, recevoirHauteurMenu } from './menuFenetre'
import type { TypeRappel } from './modeles'
import { calculerEcheances } from './scheduler/echeances'
import { enregistrerReglages, lireReglages } from './store'
import { definirInfobulle } from './tray'

let annulation: Annulation | null = null
let branche = false

export function brancherEcrans(): void {
  if (branche) {
    return
  }
  branche = true
  definirApresEvaluation(diffuser)
  ipcMain.handle(CANAL_ECRAN.lire, () => etatCourant())
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
    fermerMenu()
    ouvrirApplication()
    return
  }
  if (action.type === 'pause') {
    fermerMenu()
    demanderPauseMaintenant()
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
  reevaluer()
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
  const finVeille = reglages.veilleJusqua ? new Date(reglages.veilleJusqua).getTime() : Number.NaN
  const veilleActive = Number.isFinite(finVeille) && finVeille > maintenant.getTime()
  return {
    reglages,
    echeances: calculerEcheances(lireEtatMoteur(), reglages, maintenant),
    veilleLibelle:
      veilleActive && reglages.veilleJusqua
        ? formaterInstant(new Date(reglages.veilleJusqua))
        : null,
    bandeau: bandeauCourant()
  }
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
  envoyer(fenetreMenu(), etat)
  envoyer(fenetreApplication(), etat)
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
