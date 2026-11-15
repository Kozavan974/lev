import {
  app,
  Menu,
  nativeImage,
  Tray,
  type MenuItemConstructorOptions,
  type NativeImage,
  type Rectangle
} from 'electron'
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
  demarrerSequence: () => void
  arreterSequences: () => void
}

export interface EtatMenuContextuel {
  enVeille: boolean
  sequencesActives: boolean
  sequenceEnCours: boolean
}

const FICHIERS: Record<EtatIcone, string> = {
  calme: 'tray-calme.ico',
  bientot: 'tray-bientot.ico',
  veille: 'tray-veille.ico'
}

let zone: Tray | null = null
let actionsZone: ActionsZone | null = null
let iconeCourante: EtatIcone | null = null
let menuCourant: EtatMenuContextuel | null = null
const images = new Map<EtatIcone, NativeImage>()

const MENU_DEPART: EtatMenuContextuel = {
  enVeille: false,
  sequencesActives: false,
  sequenceEnCours: false
}

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
  menuCourant = MENU_DEPART
  barre.setContextMenu(menuContextuel(MENU_DEPART))
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

export function definirMenuContextuel(etat: EtatMenuContextuel): void {
  if (!zone || zone.isDestroyed() || (menuCourant !== null && memeMenu(menuCourant, etat))) {
    return
  }
  menuCourant = etat
  zone.setContextMenu(menuContextuel(etat))
}

export function detruireZoneNotification(): void {
  zone?.destroy()
  zone = null
  iconeCourante = null
  menuCourant = null
}

function menuContextuel(etat: EtatMenuContextuel): Menu {
  const actions = actionsZone
  const lignes: MenuItemConstructorOptions[] = []
  if (etat.sequencesActives) {
    lignes.push({
      label: etat.sequenceEnCours ? textes.tray.arreterSequences : textes.tray.sequence,
      click: () => {
        if (etat.sequenceEnCours) {
          actions?.arreterSequences()
        } else {
          actions?.demarrerSequence()
        }
      }
    })
  }
  lignes.push(
    { label: textes.tray.pause, click: () => actions?.pauseMaintenant() },
    {
      label: etat.enVeille ? textes.tray.reprendre : textes.tray.veille1h,
      click: () => (etat.enVeille ? actions?.reprendre() : actions?.veilleUneHeure())
    },
    { type: 'separator' },
    { label: textes.tray.mesRappels, click: () => actions?.ouvrirRappels() },
    { label: textes.tray.aPropos, click: () => actions?.ouvrirAPropos() },
    { type: 'separator' },
    { label: textes.tray.quitter, click: () => app.quit() }
  )
  return Menu.buildFromTemplate(lignes)
}

function memeMenu(gauche: EtatMenuContextuel, droite: EtatMenuContextuel): boolean {
  return (
    gauche.enVeille === droite.enVeille &&
    gauche.sequencesActives === droite.sequencesActives &&
    gauche.sequenceEnCours === droite.sequenceEnCours
  )
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
