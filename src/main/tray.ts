import { app, Menu, nativeImage, Tray, type NativeImage, type Rectangle } from 'electron'
import textes from '../content/fr.json'
import { cheminRessource } from './ressources'

export type EtatIcone = 'calme' | 'bientot' | 'veille'

export interface ActionsZone {
  clicGauche: () => void
  pauseMaintenant: () => void
  veilleUneHeure: () => void
  reprendre: () => void
  ouvrirRappels: () => void
  ouvrirAPropos: () => void
}

const FICHIERS: Record<EtatIcone, string> = {
  calme: 'tray-calme.ico',
  bientot: 'tray-bientot.ico',
  veille: 'tray-veille.ico'
}

let zone: Tray | null = null
let actionsZone: ActionsZone | null = null
let iconeCourante: EtatIcone | null = null
let veilleDuMenu: boolean | null = null
const images = new Map<EtatIcone, NativeImage>()

export function creerZoneNotification(actions: ActionsZone): void {
  actionsZone = actions
  const barre = new Tray(imageDe('calme'))
  iconeCourante = 'calme'
  barre.setToolTip(textes.tray.infobulle)
  barre.setIgnoreDoubleClickEvents(true)
  let ignoreClicJusqua = 0
  barre.on('right-click', () => {
    ignoreClicJusqua = Date.now() + 300
  })
  barre.on('click', () => {
    if (Date.now() < ignoreClicJusqua) {
      return
    }
    actions.clicGauche()
  })
  veilleDuMenu = false
  barre.setContextMenu(menuContextuel(false))
  zone = barre
}

export function lireBoundsZone(): Rectangle | null {
  if (!zone || zone.isDestroyed()) {
    return null
  }
  return zone.getBounds()
}

export function definirInfobulle(texte: string): void {
  if (!zone || zone.isDestroyed()) {
    return
  }
  zone.setToolTip(texte)
}

export function definirEtatIcone(etat: EtatIcone): void {
  if (!zone || zone.isDestroyed() || iconeCourante === etat) {
    return
  }
  iconeCourante = etat
  zone.setImage(imageDe(etat))
}

export function definirMenuContextuel(enVeille: boolean): void {
  if (!zone || zone.isDestroyed() || veilleDuMenu === enVeille) {
    return
  }
  veilleDuMenu = enVeille
  zone.setContextMenu(menuContextuel(enVeille))
}

export function detruireZoneNotification(): void {
  zone?.destroy()
  zone = null
  iconeCourante = null
  veilleDuMenu = null
}

function menuContextuel(enVeille: boolean): Menu {
  const actions = actionsZone
  return Menu.buildFromTemplate([
    { label: textes.tray.pause, click: () => actions?.pauseMaintenant() },
    {
      label: enVeille ? textes.tray.reprendre : textes.tray.veille1h,
      click: () => (enVeille ? actions?.reprendre() : actions?.veilleUneHeure())
    },
    { type: 'separator' },
    { label: textes.tray.mesRappels, click: () => actions?.ouvrirRappels() },
    { label: textes.tray.aPropos, click: () => actions?.ouvrirAPropos() },
    { type: 'separator' },
    { label: textes.tray.quitter, click: () => app.quit() }
  ])
}

function imageDe(etat: EtatIcone): NativeImage {
  const existante = images.get(etat)
  if (existante) {
    return existante
  }
  const chemin = cheminRessource('icons', FICHIERS[etat])
  const image = nativeImage.createFromPath(chemin)
  if (image.isEmpty()) {
    throw new Error(`Icône de la zone de notification illisible : ${chemin}`)
  }
  images.set(etat, image)
  return image
}
