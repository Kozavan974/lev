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
import { remplir } from '../partage/format'
import { dessinerCompte, type ThemeBarre } from './iconeCompte'
import { cheminRessource } from './ressources'

export type EtatIcone = 'calme' | 'bientot' | 'veille'

export interface ActionsZone {
  clicGauche: () => void
  pauseMaintenant: () => void
  demarrerReunion: () => void
  reprendreReunion: () => void
  veille30: () => void
  veilleDemain: () => void
  reprendre: () => void
  ouvrirRappels: () => void
  ouvrirAPropos: () => void
  demarrerSequence: () => void
  arreterSequences: () => void
}

export interface EtatMenuContextuel {
  enVeille: boolean
  enReunion: boolean
  reunionHeure: string | null
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
let signatureIcone: string | null = null
let infobulleCourante: string | null = null
let menuCourant: EtatMenuContextuel | null = null
const images = new Map<EtatIcone, NativeImage>()
const comptes = new Map<string, NativeImage>()

const MENU_DEPART: EtatMenuContextuel = {
  enVeille: false,
  enReunion: false,
  reunionHeure: null,
  sequencesActives: false,
  sequenceEnCours: false
}

export function creerZoneNotification(actions: ActionsZone): void {
  actionsZone = actions
  const barre = new Tray(imageDe('calme'))
  signatureIcone = 'calme'
  infobulleCourante = textes.tray.infobulle
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
  if (!zone || zone.isDestroyed() || infobulleCourante === texte) {
    return
  }
  infobulleCourante = texte
  zone.setToolTip(texte)
}

export function definirEtatIcone(etat: EtatIcone): void {
  afficherIcone(etat, () => imageDe(etat))
}

/** Chiffre du décompte. Le dessin n'est envoyé que s'il a changé. */
export function definirIconeCompte(libelle: string, theme: ThemeBarre): void {
  afficherIcone(`compte:${theme}:${libelle}`, () => imageCompte(libelle, theme))
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
  signatureIcone = null
  infobulleCourante = null
  menuCourant = null
}

function afficherIcone(signature: string, fournir: () => NativeImage): void {
  if (!zone || zone.isDestroyed() || signatureIcone === signature) {
    return
  }
  signatureIcone = signature
  zone.setImage(fournir())
}

function imageCompte(libelle: string, theme: ThemeBarre): NativeImage {
  const cle = `${theme}:${libelle}`
  const existante = comptes.get(cle)
  if (existante) {
    return existante
  }
  const dessin = dessinerCompte(libelle, theme)
  const image = nativeImage.createFromBitmap(dessin.petit, { width: 16, height: 16 })
  image.addRepresentation({
    scaleFactor: 2,
    width: 32,
    height: 32,
    buffer: dessin.grand
  })
  comptes.set(cle, image)
  return image
}

export type ActionMenuContextuel =
  | 'sequence'
  | 'arreterSequences'
  | 'pause'
  | 'reunion'
  | 'reprendreReunion'
  | 'reprendre'
  | 'rappels'
  | 'apropos'
  | 'quitter'

export interface EntreeMenuContextuel {
  label: string
  action: ActionMenuContextuel | null
  sousMenu: readonly { label: string; action: 'veille30' | 'veilleDemain' }[] | null
}

/** Libellés du clic droit, sans Electron, pour les tests. */
export function entreesMenuContextuel(etat: EtatMenuContextuel): EntreeMenuContextuel[] {
  const lignes: EntreeMenuContextuel[] = []
  if (etat.sequencesActives) {
    lignes.push({
      label: etat.sequenceEnCours ? textes.tray.arreterSequences : textes.tray.sequence,
      action: etat.sequenceEnCours ? 'arreterSequences' : 'sequence',
      sousMenu: null
    })
  }
  lignes.push(
    { label: textes.tray.pause, action: 'pause', sousMenu: null },
    {
      label: etat.enReunion
        ? remplir(textes.tray.reunionEnCours, { heure: etat.reunionHeure ?? '' })
        : textes.tray.reunion,
      action: etat.enReunion ? 'reprendreReunion' : 'reunion',
      sousMenu: null
    }
  )
  if (etat.enVeille) {
    lignes.push({ label: textes.tray.reprendre, action: 'reprendre', sousMenu: null })
  } else {
    lignes.push({
      label: textes.tray.veilleMenu,
      action: null,
      sousMenu: [
        { label: textes.tray.veille30, action: 'veille30' },
        { label: textes.tray.veilleDemain, action: 'veilleDemain' }
      ]
    })
  }
  lignes.push(
    { label: textes.tray.mesRappels, action: 'rappels', sousMenu: null },
    { label: textes.tray.aPropos, action: 'apropos', sousMenu: null },
    { label: textes.tray.quitter, action: 'quitter', sousMenu: null }
  )
  return lignes
}

function menuContextuel(etat: EtatMenuContextuel): Menu {
  const actions = actionsZone
  const lignes = entreesMenuContextuel(etat).map((entree) => ligneExecutable(entree, actions))
  const avecSeparateurs: MenuItemConstructorOptions[] = []
  for (const ligne of lignes) {
    if (ligne.label === textes.tray.mesRappels || ligne.label === textes.tray.quitter) {
      avecSeparateurs.push({ type: 'separator' })
    }
    avecSeparateurs.push(ligne)
  }
  return Menu.buildFromTemplate(avecSeparateurs)
}

function ligneExecutable(
  entree: EntreeMenuContextuel,
  actions: ActionsZone | null
): MenuItemConstructorOptions {
  if (entree.sousMenu) {
    return {
      label: entree.label,
      submenu: entree.sousMenu.map((ligne) => ({
        label: ligne.label,
        click: () => executerAction(ligne.action, actions)
      }))
    }
  }
  return {
    label: entree.label,
    click: () => {
      if (entree.action) {
        executerAction(entree.action, actions)
      }
    }
  }
}

function executerAction(
  action: ActionMenuContextuel | 'veille30' | 'veilleDemain',
  actions: ActionsZone | null
): void {
  if (!actions) {
    return
  }
  switch (action) {
    case 'sequence':
      actions.demarrerSequence()
      return
    case 'arreterSequences':
      actions.arreterSequences()
      return
    case 'pause':
      actions.pauseMaintenant()
      return
    case 'reunion':
      actions.demarrerReunion()
      return
    case 'reprendreReunion':
      actions.reprendreReunion()
      return
    case 'veille30':
      actions.veille30()
      return
    case 'veilleDemain':
      actions.veilleDemain()
      return
    case 'reprendre':
      actions.reprendre()
      return
    case 'rappels':
      actions.ouvrirRappels()
      return
    case 'apropos':
      actions.ouvrirAPropos()
      return
    case 'quitter':
      app.quit()
      return
  }
}

function memeMenu(gauche: EtatMenuContextuel, droite: EtatMenuContextuel): boolean {
  return (
    gauche.enVeille === droite.enVeille &&
    gauche.enReunion === droite.enReunion &&
    gauche.reunionHeure === droite.reunionHeure &&
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
