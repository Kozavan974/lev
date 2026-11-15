import { BrowserWindow, screen, type Rectangle } from 'electron'
import { chargerPage, creerFenetre } from './windows'
import { lireBoundsZone } from './tray'

/** Marge transparente pour que l'ombre de la carte ne soit pas coupée. */
const MARGE_OMBRE_PX = 30

/** Distance entre la carte et le bord de la zone de travail, au repli. */
const MARGE_BORD_PX = 24

const LARGEUR_CARTE_PX = 380
const LARGEUR_FENETRE_PX = LARGEUR_CARTE_PX + MARGE_OMBRE_PX * 2
const DELAI_DESTRUCTION_MS = 60_000
const DELAI_REOUVERTURE_MS = 300

let fenetre: BrowserWindow | null = null
let hauteurCeilee: number | null = null
let visibleVoulu = false
let quitter = false
let destruction: ReturnType<typeof setTimeout> | null = null
let fermeA = 0
let ignoreFlouJusqua = 0
let metricsBranches = false

export function basculerMenu(): void {
  if (visibleVoulu && fenetre && !fenetre.isDestroyed() && fenetre.isVisible()) {
    fermerMenu()
    return
  }
  if (Date.now() - fermeA < DELAI_REOUVERTURE_MS) {
    return
  }
  ouvrirMenu()
}

export function ouvrirMenu(): void {
  annulerDestruction()
  visibleVoulu = true
  assurerFenetre()
  if (hauteurCeilee !== null) {
    montrer()
  }
}

export function fermerMenu(): void {
  if (!visibleVoulu && (!fenetre || fenetre.isDestroyed() || !fenetre.isVisible())) {
    return
  }
  visibleVoulu = false
  fermeA = Date.now()
  if (fenetre && !fenetre.isDestroyed() && fenetre.isVisible()) {
    fenetre.hide()
  }
  programmerDestruction()
}

export function fenetreMenu(): BrowserWindow | null {
  if (!fenetre || fenetre.isDestroyed()) {
    return null
  }
  return fenetre
}

export function recevoirHauteurMenu(contenuId: number, hauteurCarte: number): void {
  if (!fenetre || fenetre.isDestroyed() || fenetre.webContents.id !== contenuId) {
    return
  }
  if (!Number.isFinite(hauteurCarte) || hauteurCarte <= 0) {
    return
  }
  const suivante = Math.ceil(hauteurCarte)
  const changement = hauteurCeilee !== suivante
  hauteurCeilee = suivante
  if (!visibleVoulu) {
    if (changement) {
      poser(fenetre, suivante)
    }
    return
  }
  if (!fenetre.isVisible()) {
    montrer()
    return
  }
  if (changement) {
    poser(fenetre, suivante)
  }
}

export function detruireMenu(): void {
  quitter = true
  annulerDestruction()
  screen.removeListener('display-metrics-changed', replacer)
  metricsBranches = false
  if (fenetre && !fenetre.isDestroyed()) {
    fenetre.destroy()
  }
  fenetre = null
  visibleVoulu = false
  hauteurCeilee = null
}

function assurerFenetre(): void {
  if (fenetre && !fenetre.isDestroyed()) {
    return
  }
  quitter = false
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
    fullscreenable: false,
    alwaysOnTop: true,
    backgroundColor: '#00000000',
    width: LARGEUR_FENETRE_PX,
    height: LARGEUR_CARTE_PX
  })
  creee.setAlwaysOnTop(true, 'pop-up-menu')
  creee.on('blur', () => {
    if (Date.now() < ignoreFlouJusqua) {
      return
    }
    fermerMenu()
  })
  creee.on('close', (evenement) => {
    if (quitter) {
      return
    }
    evenement.preventDefault()
    fermerMenu()
  })
  fenetre = creee
  if (!metricsBranches) {
    metricsBranches = true
    screen.on('display-metrics-changed', replacer)
  }
  chargerPage(creee, 'menu')
}

function montrer(): void {
  if (!fenetre || fenetre.isDestroyed() || !visibleVoulu || hauteurCeilee === null) {
    return
  }
  poser(fenetre, hauteurCeilee)
  ignoreFlouJusqua = Date.now() + DELAI_REOUVERTURE_MS
  if (!fenetre.isVisible()) {
    fenetre.show()
  }
  fenetre.focus()
}

function replacer(): void {
  if (!fenetre || fenetre.isDestroyed() || !fenetre.isVisible() || hauteurCeilee === null) {
    return
  }
  poser(fenetre, hauteurCeilee)
}

function poser(cible: BrowserWindow, hauteurCarte: number): void {
  const largeur = LARGEUR_FENETRE_PX
  const zoneIcone = lireBoundsZone()
  const ancree = zoneIcone ? positionAncree(zoneIcone, largeur, hauteurCarte) : null
  const position = ancree ?? positionRepli(largeur, hauteurCarte)
  cible.setBounds({
    x: Math.round(position.x),
    y: Math.round(position.y),
    width: largeur,
    height: position.hauteur
  })
}

function positionAncree(
  icone: Rectangle,
  largeur: number,
  hauteurCarte: number
): { x: number; y: number; hauteur: number } | null {
  if (!boundsUtiles(icone)) {
    return null
  }
  const zone = screen.getDisplayMatching(icone).workArea
  const hauteur = Math.min(Math.ceil(hauteurCarte) + MARGE_OMBRE_PX * 2, zone.height)
  let x = icone.x + icone.width - (largeur - MARGE_OMBRE_PX)
  const xMin = zone.x - MARGE_OMBRE_PX
  const xMax = zone.x + zone.width - largeur + MARGE_OMBRE_PX
  x = borner(x, xMin, xMax)
  const milieuIcone = icone.y + icone.height / 2
  const milieuZone = zone.y + zone.height / 2
  let y =
    milieuIcone >= milieuZone
      ? icone.y - (hauteur - MARGE_OMBRE_PX)
      : icone.y + icone.height - MARGE_OMBRE_PX
  const yMin = zone.y - MARGE_OMBRE_PX
  const yMax = zone.y + zone.height - hauteur + MARGE_OMBRE_PX
  y = borner(y, yMin, yMax)
  return { x, y, hauteur }
}

function positionRepli(
  largeur: number,
  hauteurCarte: number
): { x: number; y: number; hauteur: number } {
  const zone = screen.getPrimaryDisplay().workArea
  const hauteur = Math.min(Math.ceil(hauteurCarte) + MARGE_OMBRE_PX * 2, zone.height)
  const x = zone.x + zone.width - MARGE_BORD_PX - (largeur - MARGE_OMBRE_PX)
  const y = zone.y + zone.height - MARGE_BORD_PX - (hauteur - MARGE_OMBRE_PX)
  return { x, y, hauteur }
}

function boundsUtiles(rectangle: Rectangle): boolean {
  if (rectangle.width <= 0 || rectangle.height <= 0) {
    return false
  }
  const centreX = rectangle.x + rectangle.width / 2
  const centreY = rectangle.y + rectangle.height / 2
  return screen.getAllDisplays().some((affichage) => {
    const zone = affichage.bounds
    return (
      centreX >= zone.x &&
      centreX < zone.x + zone.width &&
      centreY >= zone.y &&
      centreY < zone.y + zone.height
    )
  })
}

function borner(valeur: number, min: number, max: number): number {
  const plancher = Math.min(min, max)
  const plafond = Math.max(min, max)
  return Math.min(Math.max(valeur, plancher), plafond)
}

function programmerDestruction(): void {
  annulerDestruction()
  destruction = setTimeout(() => {
    destruction = null
    if (!visibleVoulu) {
      detruireMenu()
    }
  }, DELAI_DESTRUCTION_MS)
}

function annulerDestruction(): void {
  if (destruction) {
    clearTimeout(destruction)
    destruction = null
  }
}
