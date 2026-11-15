import { BrowserWindow, globalShortcut, screen } from 'electron'
import { CANAL_NOTIFICATION, type VueMessage, type VueNotification } from '../preload/contrat'
import { chargerPage, creerFenetre } from './windows'

/** Marge transparente pour que l'ombre de la carte ne soit pas coupée. */
const MARGE_OMBRE_PX = 30

/** Distance entre la carte et le bord de la zone de travail. */
const MARGE_BORD_PX = 24

const LARGEUR_CARTE_PX = 420
const LARGEUR_FENETRE_PX = LARGEUR_CARTE_PX + MARGE_OMBRE_PX * 2

const RACCOURCI = 'CommandOrControl+Alt+L'

let fenetre: BrowserWindow | null = null
let vueCourante: VueNotification | null = null
let messageCourant: VueMessage | null = null
let pagePrete = false
let hauteurCeilee: number | null = null
let raccourciActif = false
let quitter = false
let metricsBranches = false
let surFermetureForcee: (() => void) | null = null

export function definirFermetureForcee(action: () => void): void {
  surFermetureForcee = action
}

export function publierNotification(vue: VueNotification): void {
  vueCourante = vue
  messageCourant = null
  assurerFenetre()
  envoyer(CANAL_NOTIFICATION.afficher, vue)
  revelerSiPret()
}

export function publierMessage(message: VueMessage): void {
  messageCourant = message
  envoyer(CANAL_NOTIFICATION.message, message)
}

export function notificationEstVisible(): boolean {
  return fenetre !== null && !fenetre.isDestroyed() && fenetre.isVisible()
}

export function masquerNotification(): void {
  if (!fenetre || fenetre.isDestroyed()) {
    return
  }
  if (fenetre.isVisible()) {
    fenetre.hide()
  }
  retirerRaccourci()
}

export function autoriserFermetureNotification(): void {
  quitter = true
}

export function detruireNotification(): void {
  autoriserFermetureNotification()
  retirerRaccourci()
  screen.removeListener('display-metrics-changed', replacer)
  metricsBranches = false
  if (fenetre && !fenetre.isDestroyed()) {
    fenetre.destroy()
  }
  fenetre = null
  pagePrete = false
  vueCourante = null
  messageCourant = null
  hauteurCeilee = null
}

export function recevoirPrete(contenuId: number): void {
  if (!fenetre || fenetre.isDestroyed() || fenetre.webContents.id !== contenuId) {
    return
  }
  pagePrete = true
  if (vueCourante) {
    envoyer(CANAL_NOTIFICATION.afficher, vueCourante)
  }
  if (messageCourant) {
    envoyer(CANAL_NOTIFICATION.message, messageCourant)
  }
}

export function recevoirHauteur(hauteurCarte: number): void {
  if (!fenetre || fenetre.isDestroyed()) {
    return
  }
  if (!Number.isFinite(hauteurCarte) || hauteurCarte <= 0) {
    return
  }
  const suivante = Math.ceil(hauteurCarte)
  if (hauteurCeilee !== suivante) {
    hauteurCeilee = suivante
    poser(fenetre, hauteurCarte)
  }
  revelerSiPret()
}

function assurerFenetre(): void {
  if (fenetre && !fenetre.isDestroyed()) {
    return
  }
  quitter = false
  pagePrete = false
  hauteurCeilee = null
  const creee = creerFenetre({
    show: false,
    frame: false,
    transparent: true,
    skipTaskbar: true,
    focusable: true,
    resizable: false,
    movable: false,
    hasShadow: false,
    alwaysOnTop: true,
    backgroundColor: '#00000000',
    width: LARGEUR_FENETRE_PX,
    height: LARGEUR_CARTE_PX
  })
  // La transparence casse si la fenêtre redevient redimensionnable, même un instant.
  creee.setAlwaysOnTop(true, 'pop-up-menu')
  creee.on('close', (evenement) => {
    if (quitter) {
      return
    }
    evenement.preventDefault()
    surFermetureForcee?.()
  })
  fenetre = creee
  if (!metricsBranches) {
    metricsBranches = true
    screen.on('display-metrics-changed', replacer)
  }
  chargerPage(creee, 'notification')
}

function revelerSiPret(): void {
  if (!fenetre || fenetre.isDestroyed() || fenetre.isVisible() || hauteurCeilee === null) {
    return
  }
  fenetre.showInactive()
  enregistrerRaccourci()
}

function replacer(): void {
  if (!fenetre || fenetre.isDestroyed() || !fenetre.isVisible() || hauteurCeilee === null) {
    return
  }
  poser(fenetre, hauteurCeilee)
}

function poser(cible: BrowserWindow, hauteurCarte: number): void {
  const zone = screen.getPrimaryDisplay().workArea
  const hauteur = Math.ceil(hauteurCarte) + MARGE_OMBRE_PX * 2
  const largeur = Math.round(LARGEUR_FENETRE_PX)
  const x = Math.round(zone.x + zone.width - largeur - MARGE_BORD_PX + MARGE_OMBRE_PX)
  const y = Math.round(zone.y + zone.height - hauteur - MARGE_BORD_PX + MARGE_OMBRE_PX)
  cible.setBounds({ x, y, width: largeur, height: hauteur })
}

function envoyer(canal: string, charge: VueNotification | VueMessage): void {
  if (!pagePrete || !fenetre || fenetre.isDestroyed()) {
    return
  }
  fenetre.webContents.send(canal, charge)
}

function enregistrerRaccourci(): void {
  if (raccourciActif) {
    return
  }
  raccourciActif = globalShortcut.register(RACCOURCI, () => {
    if (fenetre && !fenetre.isDestroyed()) {
      fenetre.focus()
    }
  })
}

function retirerRaccourci(): void {
  if (!raccourciActif) {
    return
  }
  globalShortcut.unregister(RACCOURCI)
  raccourciActif = false
}
