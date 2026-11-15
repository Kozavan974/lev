import { BrowserWindow } from 'electron'
import textes from '../content/fr.json'
import { chargerPage, creerFenetre } from './windows'

const LARGEUR_PX = 520
const HAUTEUR_PX = 580
const LARGEUR_MIN_PX = 440
const HAUTEUR_MIN_PX = 460

let fenetre: BrowserWindow | null = null

export function ouvrirApplication(): void {
  if (fenetre && !fenetre.isDestroyed()) {
    if (fenetre.isMinimized()) {
      fenetre.restore()
    }
    fenetre.show()
    fenetre.focus()
    return
  }
  const creee = creerFenetre({
    show: false,
    width: LARGEUR_PX,
    height: HAUTEUR_PX,
    minWidth: LARGEUR_MIN_PX,
    minHeight: HAUTEUR_MIN_PX,
    useContentSize: true,
    center: true,
    title: textes.application.nom,
    backgroundColor: '#fdf1e7'
  })
  creee.once('ready-to-show', () => {
    if (!creee.isDestroyed()) {
      creee.show()
    }
  })
  creee.on('closed', () => {
    if (fenetre === creee) {
      fenetre = null
    }
  })
  fenetre = creee
  chargerPage(creee, 'app')
}

export function fermerApplication(): void {
  if (!fenetre || fenetre.isDestroyed()) {
    return
  }
  fenetre.close()
}

export function fenetreApplication(): BrowserWindow | null {
  if (!fenetre || fenetre.isDestroyed()) {
    return null
  }
  return fenetre
}

export function detruireApplication(): void {
  if (fenetre && !fenetre.isDestroyed()) {
    fenetre.destroy()
  }
  fenetre = null
}
